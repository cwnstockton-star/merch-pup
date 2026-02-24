/* ============================================
   MERCH PUP — Mock Data
   Swap these out for real API calls later.
   ============================================ */

export const mockUser = {
  id: 'user_1',
  name: 'Jordan Lee',
  phone: '+1 (813) 555-0182',
  email: 'jordan@example.com',
};

export const mockEvents = [
  {
    id: 'evt_1',
    artist: 'The Midnight',
    date: 'Mar 15, 2026',
    venue: 'Orpheum Theatre',
    city: 'Tampa, FL',
    address: '1811 N Ola Ave, Tampa, FL 33602',
    image: 'https://picsum.photos/seed/midnight1/600/400',
    heroImage: 'https://picsum.photos/seed/midnight-hero/800/500',
    code: 'MID-2026',
    pickupTime: '6:00 PM – 7:30 PM',
    pickupDirections: [
      'Enter through the main entrance on Ola Ave.',
      'Follow signs to the MERCH PUP pickup station.',
      'Look for the yellow banner at the merch table - that\'s your lane.',
      'Show your QR code to the crew. Easy.',
    ],
    description: 'The Midnight bring their critically acclaimed Monsters tour to Tampa for one night only. Synth-wave, big feelings, bigger riffs.',
    following: true,
  },
  {
    id: 'evt_2',
    artist: 'Wet Leg',
    date: 'Apr 2, 2026',
    venue: 'The Ritz Ybor',
    city: 'Tampa, FL',
    address: '1503 E 7th Ave, Tampa, FL 33605',
    image: 'https://picsum.photos/seed/wetleg2/600/400',
    heroImage: 'https://picsum.photos/seed/wetleg-hero/800/500',
    code: 'WL-0402',
    pickupTime: '7:00 PM – 8:30 PM',
    pickupDirections: [
      'Arrive at The Ritz Ybor main entrance on 7th Ave.',
      'Head left after the door - merch pickup is against the east wall.',
      'Flash your QR code. Done in 30 seconds.',
    ],
    description: 'Wet Leg bring their wry, angular indie to Ybor City. Don\'t sleep on this one.',
    following: false,
  },
  {
    id: 'evt_3',
    artist: 'Amyl and the Sniffers',
    date: 'Apr 18, 2026',
    venue: 'Crowbar',
    city: 'Tampa, FL',
    address: '1812 N 17th St, Tampa, FL 33605',
    image: 'https://picsum.photos/seed/amyl3/600/400',
    heroImage: 'https://picsum.photos/seed/amyl-hero/800/500',
    code: 'AMS-418',
    pickupTime: '5:30 PM – 7:00 PM',
    pickupDirections: [
      'Walk in through the Crowbar side entrance.',
      'P.U.P. pickup is immediately on your right.',
      'Scan your code, grab your gear, get in the pit.',
    ],
    description: 'Pub rock fury from Melbourne. Amyl and the Sniffers are the real deal, live and unfiltered.',
    following: false,
  },
  {
    id: 'evt_4',
    artist: 'boygenius',
    date: 'May 5, 2026',
    venue: 'Amalie Arena',
    city: 'Tampa, FL',
    address: '401 Channelside Dr, Tampa, FL 33602',
    image: 'https://picsum.photos/seed/boygenius4/600/400',
    heroImage: 'https://picsum.photos/seed/boygenius-hero/800/500',
    code: 'BG-0505',
    pickupTime: '4:00 PM – 6:00 PM',
    pickupDirections: [
      'Enter Amalie Arena through Gate A (Channelside Dr side).',
      'Take escalator to concourse level.',
      'Follow MERCH PUP signs to Section 101.',
      'Show your QR, pick up your order.',
    ],
    description: 'Phoebe Bridgers, Julien Baker, and Lucy Dacus. Need we say more?',
    following: true,
  },
];

export const mockMerch = [
  // The Midnight merch
  {
    id: 'merch_1',
    eventId: 'evt_1',
    name: 'Monsters Tour Tee',
    price: 38,
    images: [
      'https://picsum.photos/seed/tee1-front/600/600',
      'https://picsum.photos/seed/tee1-back/600/600',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Heavyweight 100% cotton. Screen-printed front and back with the Monsters tour art. Built to survive a thousand washes.',
    category: 'Tops',
  },
  {
    id: 'merch_2',
    eventId: 'evt_1',
    name: 'Synthwave Hoodie',
    price: 68,
    images: [
      'https://picsum.photos/seed/hoodie1-front/600/600',
      'https://picsum.photos/seed/hoodie1-back/600/600',
    ],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    description: 'Premium 80/20 fleece. Kangaroo pocket. Over-size embroidered logo. This is the one.',
    category: 'Tops',
  },
  {
    id: 'merch_3',
    eventId: 'evt_1',
    name: 'Tour Poster - Tampa Only',
    price: 25,
    images: [
      'https://picsum.photos/seed/poster1/600/600',
      'https://picsum.photos/seed/poster1b/600/600',
    ],
    sizes: ['One Size'],
    description: '18"x24" risograph print. Limited to 200 copies. Numbered and signed.',
    category: 'Art',
  },
  {
    id: 'merch_4',
    eventId: 'evt_1',
    name: 'Enamel Pin Set',
    price: 18,
    images: [
      'https://picsum.photos/seed/pin1/600/600',
      'https://picsum.photos/seed/pin1b/600/600',
    ],
    sizes: ['One Size'],
    description: 'Set of 3 hard enamel pins. The good kind - weighty, satisfying, not cheap.',
    category: 'Accessories',
  },
  {
    id: 'merch_5',
    eventId: 'evt_1',
    name: 'Dad Hat - Tour Edition',
    price: 32,
    images: [
      'https://picsum.photos/seed/hat1/600/600',
      'https://picsum.photos/seed/hat1b/600/600',
    ],
    sizes: ['One Size'],
    description: 'Unstructured, adjustable. Embroidered MP logo on the front. Black on black.',
    category: 'Accessories',
  },
  {
    id: 'merch_6',
    eventId: 'evt_1',
    name: 'Vinyl - Double LP',
    price: 45,
    images: [
      'https://picsum.photos/seed/vinyl1/600/600',
      'https://picsum.photos/seed/vinyl1b/600/600',
    ],
    sizes: ['One Size'],
    description: 'Tour-exclusive translucent yellow pressing. 180g. Sounds exactly as good as you think.',
    category: 'Music',
  },
  // Wet Leg merch
  {
    id: 'merch_7',
    eventId: 'evt_2',
    name: 'Chaise Longue Tee',
    price: 35,
    images: [
      'https://picsum.photos/seed/tee7-front/600/600',
      'https://picsum.photos/seed/tee7-back/600/600',
    ],
    sizes: ['S', 'M', 'L', 'XL'],
    description: 'On the chaise longue again? Yes. And looking great about it.',
    category: 'Tops',
  },
  {
    id: 'merch_8',
    eventId: 'evt_2',
    name: 'Wet Leg Tote',
    price: 20,
    images: [
      'https://picsum.photos/seed/tote8/600/600',
      'https://picsum.photos/seed/tote8b/600/600',
    ],
    sizes: ['One Size'],
    description: 'Heavy canvas. Screenprinted graphic. Holds records, groceries, all your feelings.',
    category: 'Accessories',
  },
];

export const mockCart = [
  {
    id: 'cart_1',
    merch: mockMerch[0],
    size: 'L',
    quantity: 1,
    eventId: 'evt_1',
  },
  {
    id: 'cart_2',
    merch: mockMerch[1],
    size: 'M',
    quantity: 1,
    eventId: 'evt_1',
  },
];

export const mockOrder = {
  id: 'ORD-2026-08471',
  items: mockCart,
  total: 106,
  event: mockEvents[0],
  qrCodePlaceholder: 'https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=MERCH-PUP-ORD-2026-08471',
  placedAt: 'Feb 17, 2026 at 4:32 PM',
};
