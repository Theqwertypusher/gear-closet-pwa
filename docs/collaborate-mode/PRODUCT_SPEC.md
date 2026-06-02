# Product Spec: Collaborate Mode

## Overview

Collaborate Mode enables real-time, peer-to-peer collaboration on a packing list between a host and up to 4 guests. Guests can check off their assigned items and contribute gear from their own closet. No backend, no accounts, no app install required for guests.

---

## Problem

Packing for a group trip requires coordinating gear across multiple people. Currently there is no way to divide a packing list, assign items to individuals, or collaborate in real time. Users resort to screenshots, shared notes, or verbal coordination.

---

## Goals

- Allow a host to invite guests into a live packing session via a link
- Allow items to be assigned to specific people
- Allow guests to check off their items on their own device
- Allow guests to contribute their own gear to the shared list
- Maintain clear ownership of gear items across sessions
- Require zero backend infrastructure beyond a free signaling server

---

## Non-Goals (v1)

- Guests editing or deleting existing items
- Guests assigning items to packers
- Persistent multi-device sync beyond an active session
- Real-time sync outside of an active session
- Accounts or authentication
- More than 4 guests per session

---

## Scope

### What collaboration touches
- A single packing list (Detail View only)
- Gear items a guest brings into the session (stored in host's closet, owner-tagged)

### What collaboration does not touch
- Kits
- Gear Closet (except receiving partner gear)
- Settings
- Other packing lists

---

## Feature Areas

### 1. Display Name
Users set their name at onboarding. Used as `ownerName` on all gear items they create. Editable in Settings. If skipped, defaults to "Me."

### 2. Gear Ownership
Every gear item carries `ownerName` and `ownerId`. Primary user's items are tagged with their display name. Partner gear is tagged with the guest's name and peer ID. Partner gear is visible to the host permanently after a session ends but is never editable by the host.

### 3. Packers
A packing list can have named packers (people going on the trip). Each packer has a name and an auto-assigned color. Items can be assigned to a packer. Packers are per-list.

### 4. Item Assignment
In Draft mode, each item row has a color dot tap target. Tapping cycles through packers → unassigned. Assignment is visible in all modes.

### 5. Packing Mode Filter
When packers exist, Packing mode shows filter tabs: All · [Packer 1] · [Packer 2]. Each person sees only their items when filtered. Unassigned items appear in All only.

### 6. Weight Breakdown by Owner
An accordion row under the weight summary bar shows per-owner weight totals. Only visible when the list contains items with multiple owners.

### 7. Collaborate Session
Host taps the people icon in the header. A bottom sheet explains the feature and provides a shareable link. Guest opens the link, connects peer-to-peer, and receives the full list state. Host relays all changes to all guests (star topology). Session ends when host taps End Session or closes the app.

### 8. Guest Permissions
Guests can check off their assigned items and add gear from their own closet. Guests cannot edit existing items, assign items, add/remove packers, or end the session.

### 9. Collaboration Banner
A persistent banner below the header indicates session status, role (Host/Guest), and provides session controls (End Session for host, Leave for guest).

---

## Success Metrics

- Session start rate (collaborate modal opened → link shared)
- Guest join rate (links opened → connection established)
- Items checked off per session
- Guest gear items added per session
- Session duration

---

## Open Questions

- Should unassigned items be checkable by anyone in packing mode, or locked?
- Should the host be notified when a guest checks off an item?
- Maximum session duration before auto-expiry?
