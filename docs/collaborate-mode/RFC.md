# RFC: Collaborate Mode — Technical Design

## Summary

Add real-time peer-to-peer collaboration to packing lists using WebRTC via PeerJS. No backend required beyond the free PeerJS signaling server. Star topology with host as relay. Guest permissions are read-and-check-off only, plus gear contribution.

---

## Package

```
peerjs ^1.x
```

No other new dependencies. Yjs (CRDT) explicitly excluded from v1 — last-write-wins conflict resolution is sufficient for the low-stakes packing use case.

---

## Data Model Changes

### GearItem (existing)
```typescript
// Add to existing GearItem type
ownerName: string    // display name of owner, set at creation, immutable
ownerId: string      // 'primary' | peer session ID from PeerJS
```

### PackingList (existing)
```typescript
// Add to existing PackingList type
packers: Packer[]
```

### New Types
```typescript
interface Packer {
  id: string
  name: string
  color: string   // one of 5 preset colors
}

interface PackingListItem {
  // existing fields...
  assigneeId?: string   // Packer.id | undefined
}

type SessionStatus = 'idle' | 'hosting' | 'joined' | 'disconnected' | 'ended'

interface SessionState {
  status: SessionStatus
  role: 'host' | 'guest' | null
  peerId: string | null           // this device's PeerJS ID
  hostName: string | null         // for guests: host's display name
  guests: { id: string; name: string }[]  // for host only
}

type MessageType =
  | 'SYNC_STATE'        // host → new guest: full list state
  | 'MUTATION'          // any → host → all: a single state change
  | 'GUEST_JOIN'        // host → all: new guest joined
  | 'GUEST_LEAVE'       // host → all: guest left
  | 'SESSION_END'       // host → all: session ending
  | 'HELLO'             // guest → host: introduce self with display name

interface Message {
  type: MessageType
  payload: unknown
  senderId: string
  timestamp: number
}
```

### Settings (existing)
```typescript
// Add to existing Settings type
displayName: string   // set at onboarding, defaults to 'Me'
```

---

## Architecture

### Session Topology: Star

Host maintains connections to all guests. Guests connect only to host. Host relays mutations to all other connected guests.

```
Guest B ──→ Host A ──→ Guest C
                  └──→ Guest D
```

### Connection Lifecycle

```
1. Host calls new Peer() → receives peerId from 0.peerjs.com
2. Host generates invite URL: /join?session={peerId}
3. Guest opens URL → app reads ?session param
4. Guest calls new Peer() → connects to host via peer.connect(hostPeerId)
5. Guest sends HELLO message with displayName
6. Host receives connection, stores in connections Map
7. Host sends SYNC_STATE to new guest (full current list)
8. Host broadcasts GUEST_JOIN to all existing guests
9. Collaboration active
```

### Mutation Sync Protocol

Every state change during a session is broadcast as a MUTATION message:

```typescript
// Guest checks off item
{
  type: 'MUTATION',
  payload: {
    kind: 'CHECK_ITEM',
    catId: string,
    itemId: string,
    checked: boolean
  }
}

// Guest adds gear
{
  type: 'MUTATION', 
  payload: {
    kind: 'ADD_GEAR',
    gearItem: GearItem,
    catId: string,
    packingItem: PackingListItem
  }
}
```

Host applies mutation locally, then relays to all other connections. Conflict resolution: last-write-wins (timestamp on Message).

### Deduplication on Gear Import

When host receives ADD_GEAR mutation:
```typescript
function isDuplicate(incoming: GearItem, existing: GearItem[]): boolean {
  return existing.some(g =>
    g.name.toLowerCase() === incoming.name.toLowerCase() &&
    g.brand?.toLowerCase() === incoming.brand?.toLowerCase() &&
    g.ownerId === incoming.ownerId
  )
}
```
If duplicate found: reuse existing item ID in the packing list. Do not create a new gear closet entry.

---

## New Store: sessionStore.svelte.ts

```typescript
interface SessionStore {
  // State
  status: SessionStatus
  role: 'host' | 'guest' | null
  guests: { id: string; name: string }[]
  hostName: string | null

  // Host actions
  startSession(): Promise<string>   // returns invite URL
  endSession(): void

  // Guest actions
  joinSession(hostPeerId: string): Promise<void>
  leaveSession(): void

  // Internal
  broadcastMutation(mutation: Mutation): void
  applyMutation(mutation: Mutation): void
}
```

---

## URL Handling

### Invite link format
```
https://gearcloset.app/join?session={hostPeerId}
```

### Detection in App.svelte
```typescript
const sessionParam = new URLSearchParams(window.location.search).get('session')
if (sessionParam) {
  // Clear param from URL immediately (avoid re-joining on refresh)
  window.history.replaceState({}, '', window.location.pathname)
  sessionStore.joinSession(sessionParam)
}
```

Existing `?data=` share link detection is separate and unaffected.

---

## Reconnect Strategy

```typescript
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    if (sessionStore.status === 'disconnected') {
      sessionStore.reconnect()
    }
  }
})

// Reconnect logic
async function reconnect() {
  // Guest: reconnect to same hostPeerId
  // Host: re-open PeerJS with same peerId (not guaranteed, PeerJS may assign new)
  // Timeout: 30s → set status to 'idle', show toast
}
```

Note: PeerJS does not guarantee the same peer ID on reconnect for hosts. Host reconnect may require guests to re-join via a new link. This is acceptable for v1.

---

## Guest Permission Enforcement

Enforced client-side. Guests only have access to:
```typescript
const GUEST_ALLOWED_MUTATIONS = ['CHECK_ITEM', 'ADD_GEAR']

function sendMutation(mutation: Mutation) {
  if (sessionStore.role === 'guest') {
    if (!GUEST_ALLOWED_MUTATIONS.includes(mutation.kind)) return
  }
  // proceed
}
```

Host validates incoming mutation type before applying and relaying. Malformed or disallowed mutations are silently dropped.

---

## Build Order

```
1.  displayName in Settings type + onboarding UI
2.  ownerName/ownerId on GearItem — auto-tag on creation
3.  Owner filter in gear closet
4.  Packer type + packers[] on PackingList
5.  Add/remove packer UI in Draft mode header
6.  assigneeId on PackingListItem
7.  Item assignment UI (tap dot to cycle)
8.  Packing mode filter tabs by packer
9.  Weight breakdown accordion by owner
10. sessionStore.svelte.ts — PeerJS integration
11. Host: startSession, endSession, relay logic
12. Guest: joinSession, leaveSession, ?session URL param
13. SYNC_STATE on guest join
14. MUTATION sync: CHECK_ITEM
15. MUTATION sync: ADD_GEAR + deduplication
16. Reconnect on visibilitychange
17. Collaboration banner (all states)
18. Collaborate modal (bottom sheet, copy link, share)
19. People icon in PackingListDetail header
20. Owner filter in kit builder
```

---

## Risks & Mitigations

| Risk | Likelihood | Mitigation |
|---|---|---|
| iOS suspends PWA, drops WebRTC | High | Auto-reconnect on visibilitychange |
| PeerJS hosted server downtime | Low | Self-host signaling on Cloudflare Workers |
| NAT traversal failure | Medium (15-20%) | Cloudflare TURN fallback |
| Guest re-joins after host reconnect | Medium | Issue new link, toast guidance |
| Duplicate gear on repeated sessions | Medium | Deduplication by name + brand + ownerId |
| Data loss on simultaneous edit | Low | Last-write-wins acceptable for packing use case |
