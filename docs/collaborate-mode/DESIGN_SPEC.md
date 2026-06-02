# Design Spec: Collaborate Mode

## Overview

This document covers the visual design, component states, interaction contracts, and color system for Collaborate Mode and its supporting features (gear ownership, packer assignment, weight breakdown).

---

## Color System

### Packer Colors (5 presets)

| Token | Hex | Usage |
|---|---|---|
| packer-indigo | `#6366f1` | Dot, chip, tab highlight |
| packer-rose | `#f43f5e` | Dot, chip, tab highlight |
| packer-amber | `#f59e0b` | Dot, chip, tab highlight |
| packer-teal | `#14b8a6` | Dot, chip, tab highlight |
| packer-violet | `#8b5cf6` | Dot, chip, tab highlight |

Colors are auto-assigned in order when a packer is added. No manual color selection in v1.

### Session Status Colors

| State | Color | Hex |
|---|---|---|
| Live / connected | Green | `#22c55e` |
| Reconnecting | Amber | `#f59e0b` |
| Disconnected | Red | `#ef4444` |

---

## Component: People Icon Button

**Location**: PackingListDetail header, top-right, alongside existing icons.

**Appearance**:
- Icon: `Users` (Lucide), 22px
- No label
- Tap target: 44×44px minimum
- Idle state: `text-zinc-700`
- Active session state: icon turns green (`text-green-500`) with a pulsing dot indicator (6px, `bg-green-500`) positioned top-right of the icon

**Interaction Contract**:
- TRIGGER: Tap people icon
- STATE CHANGE: Opens Collaborate bottom sheet
- REVERSE: Sheet dismisses on swipe-down or tap-outside

---

## Component: Collaborate Bottom Sheet

Implemented with `vaul-svelte`. Full-height sheet on mobile.

### Pre-Session State (Host)

```
┌─────────────────────────────┐
│  ━━━  (drag handle)         │
│                             │
│  Collaborate                │
│  [subtitle text]            │
│                             │
│  You are the host.          │
│  Share this link to invite  │
│  others to pack with you.   │
│                             │
│  ┌─────────────────────┐    │
│  │  Copy Link          │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  Share…             │    │
│  └─────────────────────┘    │
│                             │
│  [Cancel]                   │
└─────────────────────────────┘
```

- Title: "Collaborate" (`text-lg font-semibold`)
- Subtitle: "Invite people to join your packing session in real time."
- Copy Link: primary button (zinc-900 bg), full width
  - On tap: copies URL, label changes to "Copied ✓" for 2s, then resets
- Share…: secondary button (bordered), full width
  - On tap: calls `navigator.share()` if available; hidden if not
- Cancel: text button, closes sheet without starting session

### Active Session State (Host)

```
┌─────────────────────────────┐
│  ━━━                        │
│                             │
│  Live Session               │
│  ● 2 guests connected       │
│                             │
│  Guests                     │
│  ● Alex                     │
│  ● Sam                      │
│                             │
│  ┌─────────────────────┐    │
│  │  Invite More        │    │
│  └─────────────────────┘    │
│  ┌─────────────────────┐    │
│  │  End Session        │    │  ← destructive/outlined
│  └─────────────────────┘    │
└─────────────────────────────┘
```

- Guest list: name + green dot per connected guest
- End Session: outlined red button (`border-red-500 text-red-500`)
  - Confirmation: not required in v1 (immediate)

---

## Component: Collaboration Banner

Reuses the existing demo/shared mode banner slot (below header, above content).

### Host — Active

```
┌──────────────────────────────────────────────┐
│ ● Live  ·  Host  ·  2 guests    [End Session]│
└──────────────────────────────────────────────┘
```

- Left: green pulsing dot + "Live" + separator + "Host" + separator + "{n} guests"
- Right: "End Session" text button (`text-red-500 text-sm`)
- Background: `bg-green-50 border-b border-green-200`
- Height: 40px, `px-4`

### Guest — Active

```
┌──────────────────────────────────────────────┐
│ ● Live  ·  Guest  ·  Alex's session   [Leave]│
└──────────────────────────────────────────────┘
```

- Right: "Leave" text button (`text-zinc-500 text-sm`)

### Reconnecting State

```
┌──────────────────────────────────────────────┐
│ ◌ Reconnecting…                              │
└──────────────────────────────────────────────┘
```

- Amber pulsing dot, animated spinner or pulse class
- Background: `bg-amber-50 border-b border-amber-200`
- No action button while reconnecting

### Disconnected / Error

Banner removed. Toast shown: "Session ended" or "Could not reconnect."

---

## Component: Packer Chips (Draft Mode Header)

**Location**: Below the packing list title in Draft mode, above the category list.

```
┌─────────────────────────────────────────────┐
│  [● Alex] [● Sam] [● Jordan] [+ Add Packer] │
└─────────────────────────────────────────────┘
```

### Packer Chip

- Colored dot (8px, `rounded-full`) + name + `×` dismiss button
- Background: `bg-zinc-100`, `rounded-full`, `px-3 py-1`
- Dot color: packer color
- × button: `text-zinc-400`, only visible to host
- Max 4 chips

### Add Packer Button

- Appearance: dashed border chip, `border-dashed border-zinc-300 text-zinc-500`
- Tap: inline text input appears in place of button
  - Input placeholder: "Name"
  - Confirm on Return key or blur
  - Cancel on Escape

**Interaction Contract — Add Packer**:
- TRIGGER: Tap "+ Add Packer"
- STATE CHANGE: Input field appears, keyboard opens
- SIDE EFFECTS: On confirm → packer created, chip appears, color auto-assigned
- REVERSE: Escape or tap-outside → input dismissed, no packer added

**Interaction Contract — Remove Packer**:
- TRIGGER: Tap × on packer chip
- STATE CHANGE: Packer removed from list
- SIDE EFFECTS: All items assigned to that packer → `assigneeId: undefined`
- REVERSE: None (no undo in v1)

---

## Component: Item Assignment Dot

**Location**: Left of each item row in Draft mode when packers exist.

```
  [●] Tent · MSR · 2.1 kg
```

- Dot: 14px circle, `rounded-full`, `cursor-pointer`
- Unassigned: `bg-zinc-200`
- Assigned: packer's color
- Tap cycles: unassigned → packer 1 → packer 2 → … → unassigned
- Only visible/interactive when packers exist on the list
- Only interactive for host; guests see dot but cannot tap

**Interaction Contract**:
- TRIGGER: Tap dot
- STATE CHANGE: `assigneeId` advances to next packer (wraps to undefined)
- SIDE EFFECTS: Dot color updates immediately; if in session, MUTATION broadcast
- REVERSE: Continue tapping to cycle back to unassigned

---

## Component: Packing Mode Filter Tabs

**Location**: Below collaboration banner (or below header if no session), above category list, in Packing mode only.

```
┌──────────────────────────────────────────────┐
│  [All]  [Alex]  [Sam]  [Jordan]              │
└──────────────────────────────────────────────┘
```

- Visible only when `packers.length > 0`
- Tab style: pill shape, `rounded-full px-4 py-1 text-sm`
- Active tab: packer color background + white text; "All" tab: `bg-zinc-900 text-white`
- Inactive tab: `bg-zinc-100 text-zinc-600`
- Unassigned items: only visible in "All" tab

---

## Component: Weight Breakdown Accordion

**Location**: Below weight summary bar, collapsible row.

```
┌──────────────────────────────────────────────┐
│  Total: 14.3 kg  (weight bar)                │
├──────────────────────────────────────────────┤
│  ▸ By owner                                  │  ← collapsed
└──────────────────────────────────────────────┘
```

Expanded:

```
┌──────────────────────────────────────────────┐
│  Total: 14.3 kg  (weight bar)                │
├──────────────────────────────────────────────┤
│  ▾ By owner                                  │
│    Alex       8.2 kg  ████████░░             │
│    Sam        6.1 kg  ██████░░░░             │
└──────────────────────────────────────────────┘
```

- Only visible when list has items with ≥ 2 distinct `ownerName` values
- Mini bar: proportional fill, color matches packer color if owner is a packer; else `bg-zinc-400`
- Text: `text-sm text-zinc-600`

---

## Component: Owner Badge on Gear Items

**Location**: Gear closet item card, gear picker rows.

```
  MSR Tent   2.1 kg   [Sam's]
```

- Badge: `text-xs bg-zinc-100 text-zinc-500 rounded px-1.5 py-0.5`
- Text: `{ownerName}'s`
- Primary user's gear: shows their display name badge
- Only visible in gear closet and picker; not shown on packing list item rows (dot handles identity there)

---

## Component: Owner Filter (Gear Closet & Kit Builder)

**Location**: Filter row in Gear Closet and Kit Builder item picker.

```
  [All]  [Me]  [Alex]  [Sam]
```

- Same pill tab style as Packing Mode Filter
- Options: All · [Primary display name as "Me" or actual name] · [each partner name]
- Default: All

---

## Screen States Summary

| Screen | No Session | Hosting | Guest |
|---|---|---|---|
| Header people icon | default zinc | green + pulse dot | green + pulse dot |
| Banner | none | green host banner | green guest banner |
| Draft mode packer chips | visible (host only) | visible | hidden |
| Item assignment dot | visible (if packers exist) | visible | read-only |
| Packing mode filter tabs | visible (if packers) | visible | visible |
| Add Item button | visible | visible | visible |
| Edit/Delete item | visible | visible | hidden |

---

## Toast Notifications

All toasts: bottom of screen, `rounded-xl`, auto-dismiss 3s.

| Event | Message |
|---|---|
| Guest joins | "Alex joined the session" |
| Guest leaves | "Alex left the session" |
| Link copied | "Link copied" |
| Session ended by host | "Session ended" |
| Reconnect failed | "Could not reconnect. Session ended." |
| Reconnecting | (banner state, no toast) |
| Session full | "Session is full (4 guests max)" |

---

## Onboarding: Display Name

**Location**: Welcome screen, first launch only.

```
┌─────────────────────────────┐
│                             │
│  Welcome to Gear Closet     │
│                             │
│  What's your name?          │
│  ┌─────────────────────┐    │
│  │ Name                │    │
│  └─────────────────────┘    │
│  Used when collaborating    │
│  with others.               │
│                             │
│  [Get Started]              │
│  [Skip]                     │
│                             │
└─────────────────────────────┘
```

- Input: optional, placeholder "Your name"
- Skip: saves "Me" as default
- Get Started: saves entered name (or "Me" if blank) and proceeds

---

## Interaction Contracts Summary

| Action | Trigger | State Change | Side Effects |
|---|---|---|---|
| Start session | Tap people icon → Copy/Share link | `status: hosting`, peer ID assigned | PeerJS peer opened, invite URL generated |
| Guest joins | Opens invite URL | `status: joined`, list received | SYNC_STATE sent to guest, GUEST_JOIN broadcast |
| Check off item | Tap checkbox (guest, own item) | `checked: true` | MUTATION broadcast → all devices |
| Add gear (guest) | Item picker → confirm | Item added to list | ADD_GEAR mutation → host applies → relay; item stored in host closet with ownerName |
| End session (host) | Tap "End Session" | `status: idle`, banner removed | SESSION_END broadcast to all guests |
| Leave session (guest) | Tap "Leave" | `status: idle`, banner removed | Guest disconnects, host receives GUEST_LEAVE |
| Reconnect | App returns to foreground, `status: disconnected` | `status: hosting/joined` (if success) | PeerJS reconnect attempt, 30s timeout |
| Add packer | Tap "+ Add Packer" → enter name → confirm | Packer added to `packers[]` | Color auto-assigned, chip appears |
| Remove packer | Tap × on chip | Packer removed | Assigned items revert to unassigned |
| Assign item | Tap dot | `assigneeId` cycles | Dot color updates; MUTATION if in session |
| Filter by packer | Tap packer tab | Active filter updates | List filtered to that packer's items |
