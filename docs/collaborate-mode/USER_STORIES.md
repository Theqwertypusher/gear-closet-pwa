# User Stories: Collaborate Mode

## Epic 1: Identity & Ownership

**US-01: Set display name at onboarding**
As a new user, I want to enter my name when I first open the app so that my gear items are correctly attributed to me when I collaborate with others.
- Acceptance: Name field on welcome screen, optional, defaults to "Me" if skipped
- Acceptance: Name saved to settings, used as ownerName on all new gear items

**US-02: Edit display name in Settings**
As a user, I want to update my display name in Settings so that future gear items reflect my preferred name.
- Acceptance: Name field in Settings, changes apply to future items only
- Acceptance: Existing gear items retain their original ownerName

**US-03: View gear by owner**
As a user, I want to filter my gear closet by owner so that I can distinguish my gear from gear contributed by partners in past sessions.
- Acceptance: Owner filter available in gear closet
- Acceptance: Filter options: All, [My name], [Partner names]

---

## Epic 2: Packers & Assignment

**US-04: Add a packer to a packing list**
As a host, I want to add named packers to my packing list so that I can assign items to specific people.
- Acceptance: "+ Add Packer" in Draft mode header
- Acceptance: Each packer gets a name and auto-assigned color
- Acceptance: Up to 4 packers per list

**US-05: Remove a packer**
As a host, I want to remove a packer from the list so that I can correct mistakes.
- Acceptance: Tap × on packer chip removes them
- Acceptance: Their assigned items revert to unassigned

**US-06: Assign an item to a packer**
As a host, I want to tap an item to assign it to a packer so that everyone knows what they're responsible for.
- Acceptance: Colored dot on each item row in Draft mode
- Acceptance: Tapping cycles through packers → unassigned
- Acceptance: Dot color matches packer color

**US-07: Filter packing list by packer**
As a packer, I want to view only my items in Packing mode so that I can focus on what I need to pack.
- Acceptance: Filter tabs appear in Packing mode when packers exist
- Acceptance: All · [Packer names] tabs
- Acceptance: Unassigned items only visible in All tab

---

## Epic 3: Weight Breakdown

**US-08: View weight by owner**
As a user, I want to see how much weight each person is carrying so that I can balance loads across the group.
- Acceptance: Accordion row under weight summary bar
- Acceptance: Shows per-owner weight totals
- Acceptance: Only visible when list has multiple owners

---

## Epic 4: Host — Session Management

**US-09: Start a collaboration session**
As a host, I want to start a collaboration session from a packing list so that I can invite others to pack with me.
- Acceptance: People icon in header top right of Detail View
- Acceptance: Tapping opens collaborate bottom sheet
- Acceptance: Sheet explains the feature and confirms host role
- Acceptance: Copy Link and Share buttons generate session invite link

**US-10: Share session invite link**
As a host, I want to share a session link so that guests can join on their own device.
- Acceptance: Copy Link copies link to clipboard, shows "Copied ✓" for 2s
- Acceptance: Share button opens native share sheet (navigator.share) if available
- Acceptance: Link format: app.com/join?session=[peerID]

**US-11: See who is connected**
As a host, I want to see how many guests are connected so that I know who is in the session.
- Acceptance: Collaboration banner shows guest count: "Host · 2 guests"
- Acceptance: Toast notification when a guest joins: "[Name] joined"
- Acceptance: Toast notification when a guest leaves: "[Name] left"

**US-12: End a session**
As a host, I want to end the collaboration session so that guests are disconnected when we're done.
- Acceptance: "End Session" button in collaboration banner
- Acceptance: All guests receive disconnection notification
- Acceptance: All gear added during session persists in host's closet
- Acceptance: Banner removed, list returns to normal

---

## Epic 5: Guest — Session Participation

**US-13: Join a collaboration session**
As a guest, I want to open a session link and immediately join the host's packing list so that I can start collaborating.
- Acceptance: Link opens app (or PWA install prompt if not installed)
- Acceptance: Guest connects to host's session
- Acceptance: Guest sees the full packing list in current mode
- Acceptance: Collaboration banner shows: "Guest · [Host name]'s session"
- Acceptance: If session full (4 guests), show error message

**US-14: Check off my assigned items**
As a guest, I want to check off items assigned to me so that the host can see my packing progress in real time.
- Acceptance: Guest can tap checkbox on items assigned to them
- Acceptance: Check state syncs to host and all other guests immediately
- Acceptance: Guest cannot check off items assigned to other packers

**US-15: Add gear from my closet to the list**
As a guest, I want to add items from my gear closet to the shared list so that the host has a complete picture of what I'm bringing.
- Acceptance: Guest can open item picker and add their gear
- Acceptance: Item is added to the packing list on all devices
- Acceptance: Item is added to host's gear closet tagged with guest's ownerName
- Acceptance: Duplicate check: same name + brand + ownerId = reuse existing
- Acceptance: Item displays owner badge "[Guest name]'s" on the list

**US-16: Leave a session**
As a guest, I want to leave a session when I'm done so that I can exit without ending it for everyone.
- Acceptance: "Leave" button in collaboration banner
- Acceptance: Guest disconnects, host session continues
- Acceptance: Host receives toast: "[Name] left"
- Acceptance: Remaining guests notified same

---

## Epic 6: Connection Resilience

**US-17: Reconnect after backgrounding the app**
As a user, I want the session to reconnect automatically when I return to the app so that brief interruptions don't end my session.
- Acceptance: App detects foreground return via visibilitychange event
- Acceptance: Reconnect attempt begins automatically
- Acceptance: Banner shows "Reconnecting..." with yellow indicator
- Acceptance: On success: banner returns to green "Live" state
- Acceptance: On failure after 30s: session ends, banner removed, toast shown

---

## Epic 7: Gear Ownership in Closet & Kits

**US-18: See owner label on partner gear**
As a user, I want to see who owns each gear item in my closet so that I know which items belong to partners.
- Acceptance: Owner badge visible on gear items in closet
- Acceptance: Primary user's items labeled with their display name
- Acceptance: Partner items labeled with partner's name

**US-19: Filter gear closet by owner**
As a user, I want to filter my gear closet by owner when building kits so that I can keep kits ownership-appropriate.
- Acceptance: Owner filter in gear closet and kit builder
- Acceptance: Options: All, [My name], [Partner names]
