// src/app/api/products/route.ts
import { NextResponse } from 'next/server';

// A to Z Brands to ensure we have products starting with every letter
const A_TO_Z_BRANDS = [
  'Aero', 'Aura', 'Alpha', 'Apex', 'Axis', 'Astro',
  'Bravo', 'Bolt', 'Beam', 'Breeze', 'Blitz',
  'Cyber', 'Core', 'Crest', 'Cosmic', 'Cloud',
  'Delta', 'Dash', 'Dawn', 'Dive', 'Dynamic',
  'Echo', 'Elite', 'Edge', 'Eon', 'Evo',
  'Falcon', 'Forge', 'Flare', 'Flux', 'Fusion',
  'Gamma', 'Glide', 'Gear', 'Gravity', 'Grid',
  'Hyper', 'Halo', 'Horizon', 'Hex', 'Hive',
  'Ignite', 'Iron', 'Ion', 'Iris', 'Instinct',
  'Joule', 'Jet', 'Jolt', 'Jade', 'Joy',
  'Kinetix', 'Kyro', 'Knot', 'Karma', 'Kore',
  'Lumina', 'Logic', 'Lunar', 'Link', 'Lush',
  'Matrix', 'Moto', 'Mute', 'Macro', 'Mesh',
  'Nexus', 'Nova', 'Neon', 'Nitro', 'Node',
  'Omega', 'Optic', 'Orbit', 'Onyx', 'Omni',
  'Pulse', 'Prime', 'Peak', 'Pola', 'Pure',
  'Quantum', 'Quest', 'Quill', 'Quad', 'Quark',
  'Raptor', 'Raze', 'Rift', 'Rush', 'Roam',
  'Synergy', 'Swift', 'Sonic', 'Spike', 'Stream',
  'Titan', 'Terra', 'Tide', 'Tech', 'Trek',
  'Ultra', 'Unity', 'Uplift', 'Urbane', 'Umbra',
  'Vertex', 'Vibe', 'Vortex', 'Volt', 'Vivid',
  'Wave', 'Wire', 'Warp', 'Wind', 'Wisp',
  'Xenon', 'X-Treme', 'Xcel', 'Xero', 'Xyle',
  'Yield', 'Yeti', 'Yonder', 'Yoke', 'Yarn',
  'Zenith', 'Zero', 'Zone', 'Zeal', 'Zest'
];

const ADJECTIVES = ['Pro', 'Max', 'Ultra', 'Elite', 'Premium', 'Essential', 'Advanced', 'Signature', 'Supreme', 'Core', 'Plus', 'Lite'];

const CATEGORIES = ['Audio', 'Peripherals', 'Wearables', 'Workspace', 'Gaming', 'Photography', 'Computers', 'Accessories', 'Electronics', 'Furniture'];

const CATEGORY_NOUNS: Record<string, string[]> = {
  'Audio': ['Headphones', 'Earbuds', 'Speaker', 'Microphone', 'Soundbar', 'Studio Monitors', 'DAC', 'Amplifier'],
  'Peripherals': ['Keyboard', 'Mouse', 'Webcam', 'USB Hub', 'Dock', 'Trackpad', 'Keypad', 'Stream Deck'],
  'Wearables': ['Smartwatch', 'Fitness Tracker', 'VR Headset', 'Smart Glasses', 'Heart Monitor', 'Smart Ring'],
  'Workspace': ['Standing Desk', 'Ergonomic Chair', 'LED Lamp', 'Monitor Stand', 'Desk Mat', 'Organizer'],
  'Gaming': ['Console', 'Controller', 'Gaming Headset', 'Gaming Chair', 'Mousepad', 'Fight Stick', 'Capture Card'],
  'Photography': ['DSLR Camera', 'Mirrorless', 'Action Cam', 'Lens', 'Tripod', 'Gimbal', 'Ring Light', 'Drone'],
  'Computers': ['Laptop', 'Desktop PC', 'Mini PC', 'Server', 'Tablet', '4K Monitor', 'Display'],
  'Accessories': ['Power Bank', 'Charger', 'Cable', 'Case', 'Tech Bag', 'Dongle'],
  'Electronics': ['Router', 'Smart Display', 'Projector', 'Security Camera', 'Thermostat', 'E-Reader'],
  'Furniture': ['Office Chair', 'Motorized Desk', 'Bookshelf', 'Filing Cabinet', 'Lounge Sofa', 'TV Stand']
};

const BADGES = ['New Arrival', 'Best Seller', 'Top Rated', 'Trending', 'Limited Edition', 'Clearance'];

// Random seed generator (Mulberry32) for consistency
function mulberry32(a: number) {
  return function() {
    var t = a += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  }
}

const random = mulberry32(12345);

const generateProducts = (count: number) => {
  return Array.from({ length: count }).map((_, i) => {
    // 1. Determine Category & Noun
    const category = CATEGORIES[i % CATEGORIES.length];
    const nounList = CATEGORY_NOUNS[category];
    const noun = nounList[Math.floor(random() * nounList.length)];
    
    // 2. Determine Brand (A to Z rotation)
    const brand = A_TO_Z_BRANDS[i % A_TO_Z_BRANDS.length];
    
    // 3. Determine Adjective & Model
    const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
    const modelNumber = Math.floor(random() * 9000) + 1000; // 1000 to 9999
    
    // Assemble Unique Title: e.g. "Alpha Headphones Pro 8492"
    const title = `${brand} ${noun} ${adjective} ${modelNumber}`;
    
    const price = parseFloat((random() * 2950 + 49.99).toFixed(2));
    const rating = parseFloat((random() * 2 + 3.0).toFixed(1)); // 3.0 to 5.0
    const review_count = Math.floor(random() * 5000) + 12;
    
    const badgeRand = random();
    const badge = badgeRand > 0.85 ? BADGES[Math.floor(random() * BADGES.length)] : undefined;
    const status = badgeRand > 0.9 ? 'NEW' : 'ACTIVE';

    // 4. Guaranteed 100% Unique Images via LoremFlickr seeded by keyword and ID
    const imageId = 10000 + i;
    const keyword = noun.toLowerCase().replace(/[^a-z0-9]+/g, '');
    const image = `https://loremflickr.com/800/800/${keyword}?lock=${imageId}`;

    return {
      _id: (i + 1).toString(),
      id: (i + 1).toString(),
      title,
      price,
      base_price: price,
      image,
      images: [image],
      category,
      status,
      badge,
      rating,
      review_count
    };
  });
};

// Generate exactly 5000 massive, highly-varied products
const mockProducts = generateProducts(5000);

// We need to sort them alphabetically initially so 'Name: A to Z' feels natural on load, 
// though the client can re-sort. By default, they are ordered by ID which scatters them.
mockProducts.sort((a, b) => a.title.localeCompare(b.title));

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const backendUrl = process.env.INTERNAL_API_URL || 'http://api-gateway:8000';
    // Filtering logic for mock data
    const cat = searchParams.get('cat') || searchParams.get('category');
    let filteredProducts = [...mockProducts];

    if (cat && cat.toLowerCase() !== 'trending' && cat.toLowerCase() !== 'all') {
      filteredProducts = mockProducts.filter(p => p.category.toLowerCase() === cat.toLowerCase());
    } else if (cat && cat.toLowerCase() === 'trending') {
      filteredProducts = mockProducts.filter(p => p.badge === 'Best Seller' || p.badge === 'Trending' || p.badge === 'Top Rated');
    }

    const minPrice = searchParams.get('min_price');
    const maxPrice = searchParams.get('max_price');
    const minRating = searchParams.get('min_rating');
    const searchParam = searchParams.get('search');

    if (minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseInt(minPrice));
    }
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseInt(maxPrice));
    }
    if (minRating) {
      filteredProducts = filteredProducts.filter(p => ((p as any).rating || 4.5) >= parseInt(minRating));
    }
    if (searchParam) {
      filteredProducts = filteredProducts.filter(p => p.title.toLowerCase().includes(searchParam.toLowerCase()));
    }

    const sort = searchParams.get('sort');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');

    if (sort === 'price_asc') {
      filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sort === 'price_desc') {
      filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sort === 'rating_desc') {
      filteredProducts.sort((a, b) => ((b as any).rating || 4.5) - ((a as any).rating || 4.5));
    } else if (sort === 'name_asc') {
      filteredProducts.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sort === 'featured') {
      // Keep alphabetical or default
    }

    const total = filteredProducts.length;
    const totalPages = Math.ceil(total / limit);

    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedProducts = filteredProducts.slice(startIndex, endIndex);

    try {
      // Route queries through the API Gateway to the Elasticsearch Search Service
      const response = await fetch(`${backendUrl}/api/search/products?${searchParams.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.products && data.products.length > 0) {
           return NextResponse.json(data);
        }
      }
    } catch (e) {
      // Backend is not running, fallback
    }

    return NextResponse.json({ success: true, products: paginatedProducts, total, totalPages, currentPage: page });
  } catch (e) {
    console.error('[API Proxy] Error fetching products:', e);
    return NextResponse.json({ success: false, error: 'Failed to fetch products' }, { status: 500 });
  }
}
