import Peer from 'peerjs'
import type { DataConnection } from 'peerjs'
import type { GearItem, PackingListItem } from '../types'
import { gearStore } from './gearStore.svelte'
import { packingListStore } from './packingListStore.svelte'

// ── Session-only types ────────────────────────────────────────────────────────

type SessionStatus = 'idle' | 'hosting' | 'joined' | 'disconnected' | 'ended'

type MessageType =
  | 'SYNC_STATE'
  | 'MUTATION'
  | 'GUEST_JOIN'
  | 'GUEST_LEAVE'
  | 'SESSION_END'
  | 'HELLO'

interface Message {
  type: MessageType
  payload: unknown
  senderId: string
  timestamp: number
}

type MutationKind = 'CHECK_ITEM' | 'ADD_GEAR' | 'DELETE_ITEM' | 'DELETE_CATEGORY'

interface CheckItemMutation {
  kind: 'CHECK_ITEM'
  catId: string
  itemId: string
  checked: boolean
}

interface AddGearMutation {
  kind: 'ADD_GEAR'
  gearItem: GearItem
  catId: string
  packingItem: PackingListItem
}

interface DeleteItemMutation {
  kind: 'DELETE_ITEM'
  catId: string
  itemId: string
}

interface DeleteCategoryMutation {
  kind: 'DELETE_CATEGORY'
  catId: string
}

type Mutation = CheckItemMutation | AddGearMutation | DeleteItemMutation | DeleteCategoryMutation

interface GuestInfo {
  peerId: string
  displayName: string
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function dispatch(eventName: string, detail?: Record<string, unknown>) {
  if (typeof document !== 'undefined') {
    document.dispatchEvent(new CustomEvent(eventName, { detail }))
  }
}

function makeMessage(type: MessageType, payload: unknown, senderId: string): Message {
  return { type, payload, senderId, timestamp: Date.now() }
}

// ── Store factory ─────────────────────────────────────────────────────────────

function createSessionStore() {
  let status = $state<SessionStatus>('idle')
  let role = $state<'host' | 'guest' | null>(null)
  let peerId = $state<string | null>(null)
  let hostName = $state<string | null>(null)
  let guests = $state<GuestInfo[]>([])
  let listId = $state<string | null>(null)

  let peer: Peer | null = null
  let hostConn: DataConnection | null = null         // guest → host
  const guestConns = new Map<string, DataConnection>() // host → guests

  // ── Internal helpers ────────────────────────────────────────────────────────

  function applyMutation(mutation: Mutation) {
    if (mutation.kind === 'CHECK_ITEM') {
      const list = packingListStore.lists.find((l) => l.id === listId)
      if (!list) return
      const cat = list.categories.find((c) => c.id === mutation.catId)
      if (!cat) return
      const item = cat.items.find((i) => i.id === mutation.itemId)
      if (!item) return
      const updatedCats = list.categories.map((c) =>
        c.id !== mutation.catId
          ? c
          : {
              ...c,
              items: c.items.map((i) =>
                i.id !== mutation.itemId ? i : { ...i, checked: mutation.checked },
              ),
            },
      )
      packingListStore.updateList(list.id, { categories: updatedCats })
    } else if (mutation.kind === 'DELETE_ITEM') {
      const list = packingListStore.lists.find((l) => l.id === listId)
      if (!list) return
      const updatedCats = list.categories.map((c) =>
        c.id !== mutation.catId ? c : { ...c, items: c.items.filter((i) => i.id !== mutation.itemId) }
      )
      packingListStore.updateList(list.id, { categories: updatedCats })
    } else if (mutation.kind === 'DELETE_CATEGORY') {
      const list = packingListStore.lists.find((l) => l.id === listId)
      if (!list) return
      packingListStore.updateList(list.id, { categories: list.categories.filter((c) => c.id !== mutation.catId) })
    } else if (mutation.kind === 'ADD_GEAR') {
      // Dedup check: name + brand + ownerId
      const key = (
        mutation.gearItem.name.toLowerCase() +
        mutation.gearItem.brand.toLowerCase() +
        (mutation.gearItem.ownerId ?? '')
      )
      const exists = gearStore.items.some(
        (g) =>
          g.name.toLowerCase() + g.brand.toLowerCase() + (g.ownerId ?? '') === key,
      )
      if (!exists) {
        const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = mutation.gearItem
        gearStore.addItem(rest)
      }
      // Add PackingListItem to category
      const list = packingListStore.lists.find((l) => l.id === listId)
      if (!list) return
      const updatedCats = list.categories.map((c) =>
        c.id !== mutation.catId
          ? c
          : { ...c, items: [...c.items, mutation.packingItem] },
      )
      packingListStore.updateList(list.id, { categories: updatedCats })
    }
  }

  function broadcastToGuests(msg: Message, excludePeerId?: string) {
    for (const [pid, conn] of guestConns) {
      if (pid !== excludePeerId && conn.open) {
        conn.send(msg)
      }
    }
  }

  function handleHostMessage(conn: DataConnection, msg: Message) {
    if (msg.type === 'HELLO') {
      const displayName = (msg.payload as { displayName: string }).displayName ?? 'Guest'
      // Inform existing guests
      broadcastToGuests(
        makeMessage('GUEST_JOIN', { name: displayName }, peerId!),
      )
      // Send full sync to new guest
      const list = packingListStore.lists.find((l) => l.id === listId)
      if (list && conn.open) {
        conn.send(makeMessage('SYNC_STATE', { list }, peerId!))
      }
      // Track guest
      guests = [...guests, { peerId: conn.peer, displayName }]
      dispatch('session:guest-joined', { name: displayName })
    } else if (msg.type === 'MUTATION') {
      const mutation = msg.payload as Mutation
      applyMutation(mutation)
      // Relay to all OTHER guests
      broadcastToGuests(msg, conn.peer)
    }
  }

  function handleGuestMessage(msg: Message) {
    if (msg.type === 'SYNC_STATE') {
      const { list } = msg.payload as { list: import('../types').PackingList }
      packingListStore.updateList(list.id, list)
    } else if (msg.type === 'MUTATION') {
      applyMutation(msg.payload as Mutation)
    } else if (msg.type === 'GUEST_JOIN') {
      const { name } = msg.payload as { name: string }
      guests = [...guests, { peerId: '', displayName: name }]
    } else if (msg.type === 'GUEST_LEAVE') {
      const { name } = msg.payload as { name: string }
      guests = guests.filter((g) => g.displayName !== name)
    } else if (msg.type === 'SESSION_END') {
      status = 'ended'
      dispatch('session:ended')
      _reset()
    }
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  async function startSession(targetListId: string): Promise<string> {
    listId = targetListId
    role = 'host'
    peer = new Peer()

    return new Promise((resolve) => {
      peer!.on('open', (id) => {
        peerId = id
        status = 'hosting'
        const url = `${window.location.origin}/?session=${id}`
        resolve(url)
      })

      peer!.on('connection', (conn) => {
        guestConns.set(conn.peer, conn)

        conn.on('data', (data) => {
          handleHostMessage(conn, data as Message)
        })

        conn.on('close', () => {
          const guest = guests.find((g) => g.peerId === conn.peer)
          if (guest) {
            guests = guests.filter((g) => g.peerId !== conn.peer)
            broadcastToGuests(
              makeMessage('GUEST_LEAVE', { name: guest.displayName }, peerId!),
            )
            dispatch('session:guest-left', { name: guest.displayName })
          }
          guestConns.delete(conn.peer)
        })
      })

      peer!.on('error', () => {
        status = 'disconnected'
      })
    })
  }

  function endSession() {
    broadcastToGuests(makeMessage('SESSION_END', {}, peerId ?? ''))
    peer?.destroy()
    dispatch('session:ended')
    _reset()
  }

  async function joinSession(hostPeerId: string, displayName: string): Promise<void> {
    role = 'guest'
    peer = new Peer()

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'))
        status = 'disconnected'
      }, 15000)

      peer!.on('open', (id) => {
        peerId = id
        const conn = peer!.connect(hostPeerId)
        hostConn = conn

        conn.on('open', () => {
          clearTimeout(timeout)
          status = 'joined'
          conn.send(makeMessage('HELLO', { displayName }, id))
          resolve()
        })

        conn.on('data', (data) => {
          handleGuestMessage(data as Message)
        })

        conn.on('close', () => {
          if (status === 'joined') {
            status = 'disconnected'
          }
        })

        conn.on('error', () => {
          status = 'disconnected'
        })
      })

      peer!.on('error', (err) => {
        clearTimeout(timeout)
        reject(err)
        status = 'disconnected'
      })
    })
  }

  function leaveSession() {
    hostConn?.close()
    peer?.destroy()
    _reset()
  }

  function sendMutation(mutation: Mutation) {
    const allowed: MutationKind[] = ['CHECK_ITEM', 'ADD_GEAR', 'DELETE_ITEM']

    if (role === 'guest') {
      if (!allowed.includes(mutation.kind)) return // silently drop
      if (hostConn?.open) {
        hostConn.send(makeMessage('MUTATION', mutation, peerId ?? ''))
      }
    } else if (role === 'host') {
      applyMutation(mutation)
      broadcastToGuests(makeMessage('MUTATION', mutation, peerId ?? ''))
    }
  }

  async function reconnect() {
    if (status !== 'disconnected') return
    const savedRole = role
    const savedHostConnPeer = hostConn?.peer
    const savedDisplayName = guests[0]?.displayName ?? 'Me'

    const timeout = setTimeout(() => {
      status = 'idle'
      dispatch('session:reconnect-failed')
    }, 30000)

    try {
      if (savedRole === 'guest' && savedHostConnPeer) {
        await joinSession(savedHostConnPeer, savedDisplayName)
        clearTimeout(timeout)
      } else if (savedRole === 'host' && listId) {
        await startSession(listId)
        clearTimeout(timeout)
      } else {
        clearTimeout(timeout)
        status = 'idle'
      }
    } catch {
      clearTimeout(timeout)
      status = 'idle'
      dispatch('session:reconnect-failed')
    }
  }

  function _reset() {
    peer = null
    hostConn = null
    guestConns.clear()
    status = 'idle'
    role = null
    peerId = null
    hostName = null
    guests = []
    listId = null
  }

  // ── Visibility reconnect ────────────────────────────────────────────────────

  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible' && sessionStore.status === 'disconnected') {
        sessionStore.reconnect()
      }
    })
  }

  const sessionStore = {
    get status() { return status },
    get role() { return role },
    get peerId() { return peerId },
    get hostName() { return hostName },
    get guests() { return guests },
    get listId() { return listId },
    startSession,
    endSession,
    joinSession,
    leaveSession,
    sendMutation,
    reconnect,
  }

  return sessionStore
}

export const sessionStore = createSessionStore()
