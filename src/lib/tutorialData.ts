import type { GearItem, Kit, PackingList, PackingListCategory } from './types'

// ---------------------------------------------------------------------------
// Gear Items — stable UUIDs so kits & packing lists can reference them
// ---------------------------------------------------------------------------

export const TUTORIAL_GEAR_ITEMS: GearItem[] = [
  // ── Base items ──────────────────────────────────────────────────────────
  {
    id: 'tgi-0001-0000-0000-000000000001',
    name: 'Wapta 30',
    brand: 'Osprey',
    itemType: 'pack',
    weight: 381,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '30L pack',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000002',
    name: 'Nylofume Liner',
    brand: 'Generic',
    itemType: 'pack',
    weight: 20,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Pack liner',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000003',
    name: 'Enigma Quilt 20F',
    brand: 'Enlightened Equipment',
    itemType: 'sleep',
    weight: 540,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '950fp, 20°F quilt',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000004',
    name: 'Helix Insulated Air Sleeping Pad',
    brand: 'Nemo',
    itemType: 'sleep',
    weight: 700,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Insulated inflatable pad',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000005',
    name: 'Dream Sleeper Pillow',
    brand: 'Nemo',
    itemType: 'sleep',
    weight: 50,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000006',
    name: 'X-Dome 1+',
    brand: 'MSR',
    itemType: 'shelter',
    weight: 985,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '1-person tent',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000007',
    name: 'MSR Carbon Core Stakes',
    brand: 'MSR',
    itemType: 'shelter',
    weight: 6,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Pack of 4',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000008',
    name: 'MSR Groundhog Stakes',
    brand: 'MSR',
    itemType: 'shelter',
    weight: 16,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'qty 4',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000009',
    name: 'Guylines',
    brand: 'Generic',
    itemType: 'shelter',
    weight: 6,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000010',
    name: 'Exposure Food Bag',
    brand: 'Generic',
    itemType: 'cooking',
    weight: 39,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000011',
    name: 'Pink Ti Spoon',
    brand: 'Generic',
    itemType: 'cooking',
    weight: 17,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000012',
    name: 'Katadyn BeFree 1L',
    brand: 'Katadyn',
    itemType: 'hydration',
    weight: 63,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Water filter',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000013',
    name: 'Smartwater 1L Bottle',
    brand: 'Smartwater',
    itemType: 'hydration',
    weight: 40,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000014',
    name: 'Toaks 550 Light',
    brand: 'Toaks',
    itemType: 'cooking',
    weight: 72,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Titanium pot',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000015',
    name: 'The Pika Lid',
    brand: 'Generic',
    itemType: 'cooking',
    weight: 28,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000016',
    name: 'BRS 3000t',
    brand: 'BRS',
    itemType: 'cooking',
    weight: 25,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Ultralight canister stove',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000017',
    name: 'Fuel Canister',
    brand: 'Generic',
    itemType: 'cooking',
    weight: 100,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000018',
    name: 'NU20 Classic',
    brand: 'Nitecore',
    itemType: 'electronics',
    weight: 34,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Headlamp',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000019',
    name: 'inReach Messenger Plus',
    brand: 'Garmin',
    itemType: 'electronics',
    weight: 116,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Satellite communicator',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000020',
    name: 'NB10000 v3',
    brand: 'Nitecore',
    itemType: 'electronics',
    weight: 152,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Power bank',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000021',
    name: 'Bogler Trowel',
    brand: 'Generic',
    itemType: 'safety',
    weight: 13,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: 'Cat hole trowel',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000022',
    name: 'First Aid Kit',
    brand: 'Generic',
    itemType: 'safety',
    weight: 90,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0001-0000-0000-000000000023',
    name: 'Trekking Poles',
    brand: 'Black Diamond',
    itemType: 'accessories',
    weight: 482,
    weightUnit: 'g',
    weightCategory: 'base',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  // ── Wearable items ───────────────────────────────────────────────────────
  {
    id: 'tgi-0002-0000-0000-000000000001',
    name: 'Ombraz Sunglasses',
    brand: 'Ombraz',
    itemType: 'accessories',
    weight: 21,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000002',
    name: 'MEC Mica 2 Pants',
    brand: 'MEC',
    itemType: 'clothing',
    weight: 200,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: 'Lightweight hiking pants',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000003',
    name: 'Outdoor Research Astroman Hoodie',
    brand: 'Outdoor Research',
    itemType: 'clothing',
    weight: 197,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: 'Sun hoodie',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000004',
    name: 'XOSKINS Toe Socks',
    brand: 'Xoskins',
    itemType: 'clothing',
    weight: 25,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000005',
    name: 'Torrid Apex Jacket',
    brand: "Arc'teryx",
    itemType: 'clothing',
    weight: 251,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: 'Insulated jacket',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000006',
    name: 'Alpha 90 Fleece Sweater',
    brand: "Arc'teryx",
    itemType: 'clothing',
    weight: 100,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000007',
    name: 'Alpha 90 Fleece Pants',
    brand: "Arc'teryx",
    itemType: 'clothing',
    weight: 96,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000008',
    name: 'Merino Wool Toque',
    brand: 'Generic',
    itemType: 'clothing',
    weight: 40,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: 'Beanie',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000009',
    name: 'Buff',
    brand: 'Buff',
    itemType: 'clothing',
    weight: 34,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000010',
    name: 'Zpacks Camp Shoes',
    brand: 'Zpacks',
    itemType: 'footwear',
    weight: 60,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000011',
    name: 'Rock Front Rain Hoody',
    brand: 'Norrona',
    itemType: 'clothing',
    weight: 160,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: 'Ultralight rain jacket',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0002-0000-0000-000000000012',
    name: 'Montbell Versalite Pants',
    brand: 'Montbell',
    itemType: 'clothing',
    weight: 95,
    weightUnit: 'g',
    weightCategory: 'wearable',
    notes: 'Rain pants',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  // ── Consumable items ─────────────────────────────────────────────────────
  {
    id: 'tgi-0003-0000-0000-000000000001',
    name: '1 Day Food',
    brand: 'Generic',
    itemType: 'nutrition',
    weight: 601,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: 'Per day food supply',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000002',
    name: 'Water',
    brand: 'Generic',
    itemType: 'hydration',
    weight: 1000,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '1L water',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000003',
    name: 'Fuel',
    brand: 'Generic',
    itemType: 'cooking',
    weight: 60,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: 'Isobutane canister fuel',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000004',
    name: 'Mini Bic',
    brand: 'Bic',
    itemType: 'cooking',
    weight: 10,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: 'Lighter',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000005',
    name: 'Poop-moji Pouch',
    brand: 'Generic',
    itemType: 'hygiene',
    weight: 11,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: 'Hygiene kit',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000006',
    name: 'Holey Hiker Bidet',
    brand: 'Holey Hiker',
    itemType: 'hygiene',
    weight: 4.5,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000007',
    name: 'Toothbrush',
    brand: 'Generic',
    itemType: 'hygiene',
    weight: 10,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000008',
    name: 'Unpaste Tooth Tabs',
    brand: 'Unpaste',
    itemType: 'hygiene',
    weight: 0.1,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000009',
    name: 'Summit Suds Powdered Soap',
    brand: 'Generic',
    itemType: 'hygiene',
    weight: 39,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000010',
    name: 'Sunscreen',
    brand: 'Generic',
    itemType: 'hygiene',
    weight: 20,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000011',
    name: 'Ear Plugs',
    brand: 'Generic',
    itemType: 'accessories',
    weight: 2,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tgi-0003-0000-0000-000000000012',
    name: 'Lip Balm',
    brand: 'Generic',
    itemType: 'hygiene',
    weight: 5,
    weightUnit: 'g',
    weightCategory: 'consumable',
    notes: '',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

// ---------------------------------------------------------------------------
// Kits
// ---------------------------------------------------------------------------

export const TUTORIAL_KITS: Kit[] = [
  {
    id: 'tkt-0001-0000-0000-000000000001',
    name: 'Sleep System',
    description: 'Everything you need for a comfortable night — quilt, pad, pillow, and shelter.',
    itemIds: [
      'tgi-0001-0000-0000-000000000003', // Enigma Quilt 20F
      'tgi-0001-0000-0000-000000000004', // Helix Insulated Air Sleeping Pad
      'tgi-0001-0000-0000-000000000005', // Dream Sleeper Pillow
      'tgi-0001-0000-0000-000000000006', // X-Dome 1+
      'tgi-0001-0000-0000-000000000007', // MSR Carbon Core Stakes
      'tgi-0001-0000-0000-000000000008', // MSR Groundhog Stakes
      'tgi-0001-0000-0000-000000000009', // Guylines
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tkt-0001-0000-0000-000000000002',
    name: 'Cook System',
    description: 'A lightweight boil-only setup with pot, stove, fuel, and eating essentials.',
    itemIds: [
      'tgi-0001-0000-0000-000000000014', // Toaks 550 Light
      'tgi-0001-0000-0000-000000000015', // The Pika Lid
      'tgi-0001-0000-0000-000000000016', // BRS 3000t
      'tgi-0001-0000-0000-000000000017', // Fuel Canister
      'tgi-0001-0000-0000-000000000011', // Pink Ti Spoon
      'tgi-0001-0000-0000-000000000010', // Exposure Food Bag
      'tgi-0003-0000-0000-000000000004', // Mini Bic
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tkt-0001-0000-0000-000000000003',
    name: 'Clothing',
    description: 'A layered three-season system covering insulation, rain protection, and camp comfort.',
    itemIds: [
      'tgi-0002-0000-0000-000000000005', // Torrid Apex Jacket
      'tgi-0002-0000-0000-000000000006', // Alpha 90 Fleece Sweater
      'tgi-0002-0000-0000-000000000007', // Alpha 90 Fleece Pants
      'tgi-0002-0000-0000-000000000008', // Merino Wool Toque
      'tgi-0002-0000-0000-000000000009', // Buff
      'tgi-0002-0000-0000-000000000011', // Rock Front Rain Hoody
      'tgi-0002-0000-0000-000000000012', // Montbell Versalite Pants
      'tgi-0002-0000-0000-000000000004', // XOSKINS Toe Socks
      'tgi-0002-0000-0000-000000000010', // Zpacks Camp Shoes
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'tkt-0001-0000-0000-000000000004',
    name: 'Navigation & Safety',
    description: 'Emergency communication, power, first aid, and Leave No Trace essentials.',
    itemIds: [
      'tgi-0001-0000-0000-000000000019', // inReach Messenger Plus
      'tgi-0001-0000-0000-000000000020', // NB10000 v3
      'tgi-0001-0000-0000-000000000022', // First Aid Kit
      'tgi-0001-0000-0000-000000000021', // Bogler Trowel
    ],
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
  },
]

// ---------------------------------------------------------------------------
// Helper to build a PackingListCategory row
// ---------------------------------------------------------------------------
function cat(
  id: string,
  name: string,
  items: { gearItemId: string; quantity?: number }[],
): PackingListCategory {
  return {
    id,
    name,
    items: items.map((i, idx) => ({
      id: `${id}-item-${String(idx).padStart(3, '0')}`,
      gearItemId: i.gearItemId,
      quantity: i.quantity ?? 1,
      checked: false,
    })),
  }
}

// ---------------------------------------------------------------------------
// Packing Lists
// ---------------------------------------------------------------------------

export const TUTORIAL_PACKING_LISTS: PackingList[] = [
  // 1. 3-Season Backpacking Trip
  {
    id: 'tpl-0001-0000-0000-000000000001',
    name: '3-Season Backpacking Trip',
    tripNotes: '',
    isPackingMode: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    categories: [
      cat('tpl-0001-cat-bigthree', 'Big Three', [
        { gearItemId: 'tgi-0001-0000-0000-000000000006' }, // X-Dome 1+
        { gearItemId: 'tgi-0001-0000-0000-000000000003' }, // Enigma Quilt 20F
        { gearItemId: 'tgi-0001-0000-0000-000000000004' }, // Helix Insulated Air Sleeping Pad
      ]),
      cat('tpl-0001-cat-cook', 'Cook System', [
        { gearItemId: 'tgi-0001-0000-0000-000000000016' }, // BRS 3000t
        { gearItemId: 'tgi-0001-0000-0000-000000000014' }, // Toaks 550 Light
        { gearItemId: 'tgi-0001-0000-0000-000000000015' }, // The Pika Lid
        { gearItemId: 'tgi-0001-0000-0000-000000000011' }, // Pink Ti Spoon
        { gearItemId: 'tgi-0001-0000-0000-000000000017' }, // Fuel Canister
        { gearItemId: 'tgi-0001-0000-0000-000000000010' }, // Exposure Food Bag
        { gearItemId: 'tgi-0003-0000-0000-000000000004' }, // Mini Bic
      ]),
      cat('tpl-0001-cat-clothing', 'Clothing', [
        { gearItemId: 'tgi-0002-0000-0000-000000000005' }, // Torrid Apex Jacket
        { gearItemId: 'tgi-0002-0000-0000-000000000002' }, // MEC Mica 2 Pants
        { gearItemId: 'tgi-0002-0000-0000-000000000003' }, // OR Astroman Hoodie
        { gearItemId: 'tgi-0002-0000-0000-000000000004' }, // XOSKINS Toe Socks
        { gearItemId: 'tgi-0002-0000-0000-000000000011' }, // Rock Front Rain Hoody
        { gearItemId: 'tgi-0002-0000-0000-000000000012' }, // Montbell Versalite Pants
        { gearItemId: 'tgi-0002-0000-0000-000000000010' }, // Zpacks Camp Shoes
        { gearItemId: 'tgi-0002-0000-0000-000000000006' }, // Alpha 90 Fleece Sweater
        { gearItemId: 'tgi-0002-0000-0000-000000000007' }, // Alpha 90 Fleece Pants
        { gearItemId: 'tgi-0002-0000-0000-000000000008' }, // Merino Wool Toque
        { gearItemId: 'tgi-0002-0000-0000-000000000009' }, // Buff
      ]),
      cat('tpl-0001-cat-electronics', 'Electronics', [
        { gearItemId: 'tgi-0001-0000-0000-000000000019' }, // inReach Messenger Plus
        { gearItemId: 'tgi-0001-0000-0000-000000000020' }, // NB10000 v3
        { gearItemId: 'tgi-0001-0000-0000-000000000018' }, // NU20 Classic
      ]),
      cat('tpl-0001-cat-ditty', 'Ditty Bag', [
        { gearItemId: 'tgi-0001-0000-0000-000000000022' }, // First Aid Kit
        { gearItemId: 'tgi-0003-0000-0000-000000000005' }, // Poop-moji Pouch
        { gearItemId: 'tgi-0001-0000-0000-000000000021' }, // Bogler Trowel
        { gearItemId: 'tgi-0003-0000-0000-000000000006' }, // Holey Hiker Bidet
        { gearItemId: 'tgi-0003-0000-0000-000000000007' }, // Toothbrush
        { gearItemId: 'tgi-0003-0000-0000-000000000008' }, // Unpaste Tooth Tabs
        { gearItemId: 'tgi-0003-0000-0000-000000000009' }, // Summit Suds Powdered Soap
        { gearItemId: 'tgi-0003-0000-0000-000000000010' }, // Sunscreen
        { gearItemId: 'tgi-0003-0000-0000-000000000011' }, // Ear Plugs
        { gearItemId: 'tgi-0003-0000-0000-000000000012' }, // Lip Balm
      ]),
      cat('tpl-0001-cat-food', 'Food & Water', [
        { gearItemId: 'tgi-0003-0000-0000-000000000001', quantity: 4 }, // 1 Day Food x4
        { gearItemId: 'tgi-0003-0000-0000-000000000002' }, // Water
        { gearItemId: 'tgi-0003-0000-0000-000000000003', quantity: 2 }, // Fuel x2
      ]),
      cat('tpl-0001-cat-misc', 'Miscellaneous', [
        { gearItemId: 'tgi-0001-0000-0000-000000000023' }, // Trekking Poles
        { gearItemId: 'tgi-0002-0000-0000-000000000001' }, // Ombraz Sunglasses
        { gearItemId: 'tgi-0001-0000-0000-000000000008' }, // MSR Groundhog Stakes
        { gearItemId: 'tgi-0001-0000-0000-000000000009' }, // Guylines
        { gearItemId: 'tgi-0001-0000-0000-000000000002' }, // Nylofume Liner
        { gearItemId: 'tgi-0001-0000-0000-000000000005' }, // Dream Sleeper Pillow
      ]),
    ],
  },

  // 2. Day Hike
  {
    id: 'tpl-0001-0000-0000-000000000002',
    name: 'Day Hike',
    tripNotes: '',
    isPackingMode: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    categories: [
      cat('tpl-0002-cat-bigthree', 'Big Three', []),
      cat('tpl-0002-cat-clothing', 'Clothing', [
        { gearItemId: 'tgi-0002-0000-0000-000000000003' }, // OR Astroman Hoodie
        { gearItemId: 'tgi-0002-0000-0000-000000000002' }, // MEC Mica 2 Pants
        { gearItemId: 'tgi-0002-0000-0000-000000000004' }, // XOSKINS Toe Socks
        { gearItemId: 'tgi-0002-0000-0000-000000000011' }, // Rock Front Rain Hoody
        { gearItemId: 'tgi-0002-0000-0000-000000000001' }, // Ombraz Sunglasses
        { gearItemId: 'tgi-0002-0000-0000-000000000009' }, // Buff
      ]),
      cat('tpl-0002-cat-electronics', 'Electronics', [
        { gearItemId: 'tgi-0001-0000-0000-000000000018' }, // NU20 Classic
        { gearItemId: 'tgi-0001-0000-0000-000000000019' }, // inReach Messenger Plus
      ]),
      cat('tpl-0002-cat-ditty', 'Ditty Bag', [
        { gearItemId: 'tgi-0001-0000-0000-000000000022' }, // First Aid Kit
        { gearItemId: 'tgi-0003-0000-0000-000000000010' }, // Sunscreen
        { gearItemId: 'tgi-0003-0000-0000-000000000012' }, // Lip Balm
        { gearItemId: 'tgi-0003-0000-0000-000000000007' }, // Toothbrush
      ]),
      cat('tpl-0002-cat-food', 'Food & Water', [
        { gearItemId: 'tgi-0003-0000-0000-000000000001', quantity: 1 }, // 1 Day Food
        { gearItemId: 'tgi-0003-0000-0000-000000000002', quantity: 2 }, // Water x2
      ]),
      cat('tpl-0002-cat-misc', 'Miscellaneous', [
        { gearItemId: 'tgi-0001-0000-0000-000000000023' }, // Trekking Poles
        { gearItemId: 'tgi-0001-0000-0000-000000000012' }, // Katadyn BeFree 1L
        { gearItemId: 'tgi-0001-0000-0000-000000000013' }, // Smartwater 1L Bottle
      ]),
    ],
  },

  // 3. Summer Backpacking Weekend
  {
    id: 'tpl-0001-0000-0000-000000000003',
    name: 'Summer Backpacking Weekend',
    tripNotes: '',
    isPackingMode: false,
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    categories: [
      cat('tpl-0003-cat-bigthree', 'Big Three', [
        { gearItemId: 'tgi-0001-0000-0000-000000000006' }, // X-Dome 1+
        { gearItemId: 'tgi-0001-0000-0000-000000000003' }, // Enigma Quilt 20F
        { gearItemId: 'tgi-0001-0000-0000-000000000004' }, // Helix Insulated Air Sleeping Pad
      ]),
      cat('tpl-0003-cat-cook', 'Cook System', [
        { gearItemId: 'tgi-0001-0000-0000-000000000016' }, // BRS 3000t
        { gearItemId: 'tgi-0001-0000-0000-000000000014' }, // Toaks 550 Light
        { gearItemId: 'tgi-0001-0000-0000-000000000015' }, // The Pika Lid
        { gearItemId: 'tgi-0001-0000-0000-000000000011' }, // Pink Ti Spoon
        { gearItemId: 'tgi-0001-0000-0000-000000000017' }, // Fuel Canister
        { gearItemId: 'tgi-0001-0000-0000-000000000010' }, // Exposure Food Bag
        { gearItemId: 'tgi-0003-0000-0000-000000000004' }, // Mini Bic
      ]),
      cat('tpl-0003-cat-clothing', 'Clothing', [
        { gearItemId: 'tgi-0002-0000-0000-000000000002' }, // MEC Mica 2 Pants
        { gearItemId: 'tgi-0002-0000-0000-000000000003' }, // OR Astroman Hoodie
        { gearItemId: 'tgi-0002-0000-0000-000000000004' }, // XOSKINS Toe Socks
        { gearItemId: 'tgi-0002-0000-0000-000000000011' }, // Rock Front Rain Hoody
        { gearItemId: 'tgi-0002-0000-0000-000000000008' }, // Merino Wool Toque
        { gearItemId: 'tgi-0002-0000-0000-000000000009' }, // Buff
        { gearItemId: 'tgi-0002-0000-0000-000000000010' }, // Zpacks Camp Shoes
      ]),
      cat('tpl-0003-cat-electronics', 'Electronics', [
        { gearItemId: 'tgi-0001-0000-0000-000000000019' }, // inReach Messenger Plus
        { gearItemId: 'tgi-0001-0000-0000-000000000020' }, // NB10000 v3
        { gearItemId: 'tgi-0001-0000-0000-000000000018' }, // NU20 Classic
      ]),
      cat('tpl-0003-cat-ditty', 'Ditty Bag', [
        { gearItemId: 'tgi-0001-0000-0000-000000000022' }, // First Aid Kit
        { gearItemId: 'tgi-0001-0000-0000-000000000021' }, // Bogler Trowel
        { gearItemId: 'tgi-0003-0000-0000-000000000006' }, // Holey Hiker Bidet
        { gearItemId: 'tgi-0003-0000-0000-000000000007' }, // Toothbrush
        { gearItemId: 'tgi-0003-0000-0000-000000000010' }, // Sunscreen
        { gearItemId: 'tgi-0003-0000-0000-000000000012' }, // Lip Balm
      ]),
      cat('tpl-0003-cat-food', 'Food & Water', [
        { gearItemId: 'tgi-0003-0000-0000-000000000001', quantity: 2 }, // 1 Day Food x2
        { gearItemId: 'tgi-0003-0000-0000-000000000002', quantity: 2 }, // Water x2
        { gearItemId: 'tgi-0003-0000-0000-000000000003' }, // Fuel
      ]),
      cat('tpl-0003-cat-misc', 'Miscellaneous', [
        { gearItemId: 'tgi-0001-0000-0000-000000000023' }, // Trekking Poles
        { gearItemId: 'tgi-0001-0000-0000-000000000012' }, // Katadyn BeFree 1L
        { gearItemId: 'tgi-0001-0000-0000-000000000002' }, // Nylofume Liner
      ]),
    ],
  },
]
