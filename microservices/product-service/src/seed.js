const mongoose = require('mongoose');
const Product = require('./models/Product');

mongoose.connect('mongodb://localhost:27017/product_db')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    await Product.deleteMany({});
    
    const catId = () => new mongoose.Types.ObjectId();
    
    const products = [
      // Electronics
      { title: 'Wireless Noise-Cancelling Headphones', slug: 'wireless-headphones', seller_id: 'admin', category_id: catId(), description: 'Premium over-ear headphones with active noise cancellation, 30-hour battery life, and ultra-soft ear cushions.', base_price: 299.99, category: 'Electronics', brand: 'AudioTech', status: 'ACTIVE', average_rating: 4.7, review_count: 234, variants: [{ sku: 'WH-001', inventory_count: 50 }], images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Mechanical Gaming Keyboard', slug: 'mechanical-keyboard', seller_id: 'admin', category_id: catId(), description: 'RGB mechanical keyboard with Cherry MX switches and programmable macros.', base_price: 149.99, category: 'Electronics', brand: 'TypeMaster', status: 'ACTIVE', average_rating: 4.5, review_count: 189, variants: [{ sku: 'MK-001', inventory_count: 75 }], images: ['https://images.unsplash.com/photo-1595225476474-87563907a212?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Ultra-Wide Curved Monitor 34"', slug: 'ultrawide-monitor', seller_id: 'admin', category_id: catId(), description: '34-inch QHD ultrawide curved monitor with 144Hz refresh rate and HDR400.', base_price: 549.00, category: 'Electronics', brand: 'ViewPro', status: 'ACTIVE', average_rating: 4.8, review_count: 312, variants: [{ sku: 'UM-001', inventory_count: 25 }], images: ['https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Portable Bluetooth Speaker', slug: 'bluetooth-speaker', seller_id: 'admin', category_id: catId(), description: 'Waterproof portable speaker with 360° sound and 20-hour playtime.', base_price: 79.99, category: 'Electronics', brand: 'AudioTech', status: 'ACTIVE', average_rating: 4.3, review_count: 567, variants: [{ sku: 'BS-001', inventory_count: 200 }], images: ['https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Wireless Charging Pad', slug: 'wireless-charger', seller_id: 'admin', category_id: catId(), description: 'Fast 15W Qi wireless charging pad with LED indicator and anti-slip design.', base_price: 29.99, category: 'Electronics', brand: 'ChargeTech', status: 'ACTIVE', average_rating: 4.1, review_count: 891, variants: [{ sku: 'WC-001', inventory_count: 500 }], images: ['https://images.unsplash.com/photo-1586816879360-004f5b0c51e5?auto=format&fit=crop&q=80&w=600'] },

      // Wearables
      { title: 'Minimalist Smartwatch Pro', slug: 'smartwatch-pro', seller_id: 'admin', category_id: catId(), description: 'AMOLED display smartwatch with heart rate, SpO2, GPS, and 7-day battery.', base_price: 249.50, category: 'Wearables', brand: 'TimeSync', status: 'ACTIVE', average_rating: 4.6, review_count: 445, variants: [{ sku: 'SW-001', inventory_count: 120 }], images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Fitness Tracker Band', slug: 'fitness-tracker', seller_id: 'admin', category_id: catId(), description: 'Slim fitness band with sleep tracking, step counter, and swim-proof design.', base_price: 49.99, category: 'Wearables', brand: 'FitLife', status: 'ACTIVE', average_rating: 4.0, review_count: 1203, variants: [{ sku: 'FT-001', inventory_count: 300 }], images: ['https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Titanium Smart Ring', slug: 'smart-ring', seller_id: 'admin', category_id: catId(), description: 'Discreet health tracking ring with sleep analysis and readiness score.', base_price: 349.00, category: 'Wearables', brand: 'RingTech', status: 'ACTIVE', average_rating: 4.4, review_count: 89, variants: [{ sku: 'SR-001', inventory_count: 45 }], images: ['https://images.unsplash.com/photo-1611591437281-460bfbe1220a?auto=format&fit=crop&q=80&w=600'] },

      // Furniture
      { title: 'Ergonomic Office Chair', slug: 'office-chair', seller_id: 'admin', category_id: catId(), description: 'Fully adjustable mesh chair with lumbar support for all-day comfort.', base_price: 429.00, category: 'Furniture', brand: 'ComfortPlus', status: 'ACTIVE', average_rating: 4.9, review_count: 678, variants: [{ sku: 'OC-001', inventory_count: 30 }], images: ['https://images.unsplash.com/photo-1505843490538-5133c6c7d0e1?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Standing Desk Electric', slug: 'standing-desk', seller_id: 'admin', category_id: catId(), description: 'Electric height-adjustable standing desk with memory presets and cable management.', base_price: 599.00, category: 'Furniture', brand: 'DeskCraft', status: 'ACTIVE', average_rating: 4.7, review_count: 234, variants: [{ sku: 'SD-001', inventory_count: 18 }], images: ['https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Minimalist Bookshelf', slug: 'bookshelf', seller_id: 'admin', category_id: catId(), description: 'Modern 5-tier open bookshelf in solid walnut with steel frame.', base_price: 189.00, category: 'Furniture', brand: 'WoodWorks', status: 'ACTIVE', average_rating: 4.2, review_count: 112, variants: [{ sku: 'BK-001', inventory_count: 40 }], images: ['https://images.unsplash.com/photo-1594620302200-9a762244a156?auto=format&fit=crop&q=80&w=600'] },

      // Gaming
      { title: 'Pro Gaming Mouse', slug: 'gaming-mouse', seller_id: 'admin', category_id: catId(), description: 'Lightweight 63g gaming mouse with 25,600 DPI optical sensor.', base_price: 69.99, category: 'Gaming', brand: 'GameForce', status: 'ACTIVE', average_rating: 4.6, review_count: 789, variants: [{ sku: 'GM-001', inventory_count: 150 }], images: ['https://images.unsplash.com/photo-1527814050087-3793815479db?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Gaming Headset 7.1 Surround', slug: 'gaming-headset', seller_id: 'admin', category_id: catId(), description: 'Virtual 7.1 surround sound headset with retractable mic and RGB lighting.', base_price: 129.99, category: 'Gaming', brand: 'GameForce', status: 'ACTIVE', average_rating: 4.3, review_count: 456, variants: [{ sku: 'GH-001', inventory_count: 90 }], images: ['https://images.unsplash.com/photo-1599669454699-248893623440?auto=format&fit=crop&q=80&w=600'] },
      { title: 'RGB Gaming Desk Pad XXL', slug: 'gaming-desk-pad', seller_id: 'admin', category_id: catId(), description: 'Extended RGB mouse pad with 14 lighting modes and USB passthrough.', base_price: 39.99, category: 'Gaming', brand: 'GameForce', status: 'ACTIVE', average_rating: 4.1, review_count: 334, variants: [{ sku: 'GP-001', inventory_count: 250 }], images: ['https://images.unsplash.com/photo-1616588589676-62b3d4ff6e04?auto=format&fit=crop&q=80&w=600'] },

      // Photography
      { title: 'Mirrorless Camera Body', slug: 'mirrorless-camera', seller_id: 'admin', category_id: catId(), description: 'Full-frame 45MP mirrorless camera with 8K video and IBIS stabilization.', base_price: 2499.00, category: 'Photography', brand: 'LensKing', status: 'ACTIVE', average_rating: 4.9, review_count: 156, variants: [{ sku: 'MC-001', inventory_count: 10 }], images: ['https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Carbon Fiber Tripod', slug: 'carbon-tripod', seller_id: 'admin', category_id: catId(), description: 'Lightweight carbon fiber travel tripod with ball head and quick-release plate.', base_price: 179.00, category: 'Photography', brand: 'StudioPro', status: 'ACTIVE', average_rating: 4.5, review_count: 203, variants: [{ sku: 'CT-001', inventory_count: 60 }], images: ['https://images.unsplash.com/photo-1617575521317-d2974f3b56d2?auto=format&fit=crop&q=80&w=600'] },

      // Accessories
      { title: 'Premium Leather Laptop Sleeve', slug: 'laptop-sleeve', seller_id: 'admin', category_id: catId(), description: 'Handcrafted Italian leather sleeve for 14" laptops with magnetic closure.', base_price: 89.00, category: 'Accessories', brand: 'LeatherCo', status: 'ACTIVE', average_rating: 4.7, review_count: 345, variants: [{ sku: 'LS-001', inventory_count: 100 }], images: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=600'] },
      { title: 'USB-C Hub 10-in-1', slug: 'usb-c-hub', seller_id: 'admin', category_id: catId(), description: 'Aluminum USB-C hub with HDMI 4K, SD card, ethernet, and 100W PD charging.', base_price: 59.99, category: 'Accessories', brand: 'ConnectPro', status: 'ACTIVE', average_rating: 4.4, review_count: 678, variants: [{ sku: 'UH-001', inventory_count: 180 }], images: ['https://images.unsplash.com/photo-1625842268584-8f3296236761?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Noise-Cancelling Earbuds', slug: 'nc-earbuds', seller_id: 'admin', category_id: catId(), description: 'True wireless earbuds with adaptive ANC, spatial audio, and 8-hour battery.', base_price: 199.99, category: 'Accessories', brand: 'AudioTech', status: 'ACTIVE', average_rating: 4.5, review_count: 1567, variants: [{ sku: 'NE-001', inventory_count: 220 }], images: ['https://images.unsplash.com/photo-1590658268037-6bf12f032f55?auto=format&fit=crop&q=80&w=600'] },
      { title: 'Webcam 4K HDR', slug: 'webcam-4k', seller_id: 'admin', category_id: catId(), description: 'Ultra HD 4K webcam with auto-framing, noise-reducing mics, and privacy shutter.', base_price: 119.99, category: 'Accessories', brand: 'ViewPro', status: 'ACTIVE', average_rating: 4.2, review_count: 423, variants: [{ sku: 'WB-001', inventory_count: 95 }], images: ['https://images.unsplash.com/photo-1587826080692-f439cd0b70da?auto=format&fit=crop&q=80&w=600'] },
    ];

    for (const p of products) {
      await Product.create(p);
      console.log('Created:', p.title);
    }
    
    console.log(`Done. Created ${products.length} products.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
