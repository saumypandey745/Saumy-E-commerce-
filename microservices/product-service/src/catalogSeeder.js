const mongoose = require('mongoose');
const Product = require('./models/Product');
const Category = require('./models/Category');
const Brand = require('./models/Brand');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/product_db';

const CATEGORIES = [
    { name: 'Electronics', subcategories: ['Audio', 'Accessories', 'Gaming', 'Wearables'] },
    { name: 'Mobiles', subcategories: ['Smartphones', 'Feature Phones', 'Refurbished'] },
    { name: 'Laptops', subcategories: ['Gaming Laptops', 'Ultrabooks', 'Business Laptops'] },
    { name: 'Cameras', subcategories: ['DSLR', 'Mirrorless', 'Action Cameras', 'Lenses'] },
    { name: 'Fashion', subcategories: ['Menswear', 'Womenswear', 'Kids Wear'] },
    { name: 'Shoes', subcategories: ['Running Shoes', 'Sneakers', 'Formal Shoes'] },
    { name: 'Watches', subcategories: ['Smartwatches', 'Analog Watches', 'Luxury Watches'] },
    { name: 'Beauty', subcategories: ['Skincare', 'Makeup', 'Fragrances'] },
    { name: 'Home & Kitchen', subcategories: ['Cookware', 'Appliances', 'Decor'] },
    { name: 'Furniture', subcategories: ['Office Furniture', 'Living Room', 'Bedroom'] },
    { name: 'Books', subcategories: ['Fiction', 'Non-Fiction', 'Academic'] },
    { name: 'Toys', subcategories: ['Action Figures', 'Board Games', 'Puzzles'] },
    { name: 'Sports', subcategories: ['Fitness Equipment', 'Outdoor Sports', 'Team Sports'] },
    { name: 'Grocery', subcategories: ['Snacks', 'Beverages', 'Pantry Staples'] },
    { name: 'Automotive', subcategories: ['Car Accessories', 'Car Care', 'Tools'] },
    { name: 'Health Products', subcategories: ['Supplements', 'Personal Care', 'Devices'] }
];

const BRANDS = {
    Electronics: ['Sony', 'Bose', 'Logitech', 'Sennheiser', 'JBL', 'Razer', 'Anker'],
    Mobiles: ['Apple', 'Samsung', 'OnePlus', 'Google', 'Xiaomi', 'Motorola'],
    Laptops: ['Dell', 'HP', 'Lenovo', 'Apple', 'ASUS', 'Acer', 'MSI'],
    Cameras: ['Canon', 'Nikon', 'Sony', 'Fujifilm', 'GoPro', 'Panasonic'],
    Fashion: ['Nike', 'Adidas', 'Levi\'s', 'Zara', 'H&M', 'Tommy Hilfiger', 'Calvin Klein'],
    Shoes: ['Nike', 'Adidas', 'Puma', 'Reebok', 'Asics', 'New Balance', 'Clarks'],
    Watches: ['Seiko', 'Casio', 'Fossil', 'Rolex', 'Tag Heuer', 'Apple', 'Garmin'],
    Beauty: ['L\'Oreal', 'Estee Lauder', 'Clinique', 'MAC', 'Maybelline', 'Nivea'],
    'Home & Kitchen': ['Philips', 'Instant Pot', 'T-fal', 'Cuisinart', 'Keurig', 'Dyson'],
    Furniture: ['IKEA', 'Ashley Furniture', 'Wayfair', 'Steelcase', 'Herman Miller'],
    Books: ['Penguin', 'HarperCollins', 'Random House', 'O\'Reilly', 'Pearson'],
    Toys: ['Lego', 'Hasbro', 'Mattel', 'Funko', 'Ravensburger', 'Bandai'],
    Sports: ['Decathlon', 'Wilson', 'Spalding', 'Under Armour', 'Garmin', 'Everlast'],
    Grocery: ['Nestle', 'PepsiCo', 'Kellogg\'s', 'Kraft', 'Coca-Cola', 'Heinz'],
    Automotive: ['Bosch', 'Meguiar\'s', 'Michelin', 'Castrol', 'Garmin', 'Pioneer'],
    'Health Products': ['Optimum Nutrition', 'Centrum', 'Dettol', 'Colgate', 'Philips Sonicare']
};

const UNSPLASH_PHOTO_IDS = {
    Electronics: ['1505740420928-5e560c06d30e', '1595225476474-87563907a212', '1527443224154-c4a3942d3acf', '1608043152269-423dbba4e7e1', '1586816879360-004f5b0c51e5', '1546435770-a3e426bf472b', '1524289286702-f07229da36f5'],
    Mobiles: ['1511707171634-5f897ff02aa9', '1598327105666-5b89351aff97', '1565849963162-85010429b6e7', '1580910051074-3eb694886505', '1601784551148-7092fa7576b9', '1605236453806-6ff36851218e'],
    Laptops: ['1496181130204-755291240007', '1588872657578-7efd1f1555ed', '1603302576837-37561b2e2302', '1531297484001-80022131f5a1', '1488590528505-98d2b5aba04b', '1618424181497-157f25b6ddd5'],
    Cameras: ['1516035069371-29a1b244cc32', '1617575521317-d2974f3b56d2', '1502920917128-1fc500dc215e', '1519741497674-611481863552', '1564466809058-6411db97143c', '1452784444945-3f422708fe5e'],
    Fashion: ['1483985988355-763728e1935b', '1490481651871-ab68de25d43d', '1525507119028-ed4c629a60a3', '1509319117193-57bab727e09d', '1540221652346-e5dd6b50f3e7', '1479064555552-3ef4979f8908'],
    Shoes: ['1542291026-7eec264c27ff', '1606107557195-0e29a4b5b4aa', '1595950653106-6c9ebd614d3a', '1608231387042-66d1773070a5', '1539185441755-769473a23570', '1600185365483-26d7a4cc7519'],
    Watches: ['1523275335684-37898b6baf30', '1524592094714-0f0654e20314', '1547996160-81dfa63595aa', '1619134778706-7015533a6150', '1508685096489-7aacd43bd3b1'],
    Beauty: ['1522335789203-aabd1fc54bc9', '1612817288484-6f916006741a', '1608248597279-f99d160b2109', '1596462502278-27bfdc403348', '1570172619644-dfd03ed5d881'],
    'Home & Kitchen': ['1584269600464-37b1b58a9fe7', '1556911220-e15b29be8c8f', '1599619351262-b2ee5ff493d6', '1583847268964-b28dc8f51f92', '1578894381163-e72c17f2d45f'],
    Furniture: ['1505843490538-5133c6c7d0e1', '1518455027359-f3f8164ba6bd', '1594620302200-9a762244a156', '1586023492125-27b2c045efd7', '1555041469-a586c61ea9bc'],
    Books: ['1544947950-fa07a98d237f', '1512820790803-83ca734da794', '1495640388908-05fa85288e61', '1506880018603-83d5b814b5a6', '1532012197267-da84d127e765'],
    Toys: ['1558060370-d644479cb6f7', '1566577134-75e54611c339', '1608447714197-a8fd047b0681', '1596461404969-9ae70026e476', '1587654780291-39c9404d746b'],
    Sports: ['1461896836934-ffe607ba8211', '1517838277536-f5f99be501cd', '1571008887538-b36bb32f4571', '1517649763962-0c623066013b', '1530541930197-df16d457b77e'],
    Grocery: ['1542838132-92c53300491e', '1506368249639-73a05d6f6488', '1534723452142-3179263f0452', '1543168253-af629a8a70f5', '1615485290382-441e4d049cb5'],
    Automotive: ['1486006920555-c77dce18193b', '1617788138017-80ad40651399', '1507136566006-cfc505b114fc', '1552519507-da3b142c6e3d', '1533473359331-0135ef1b58bf'],
    'Health Products': ['1584017911252-443cd4a0e98a', '1584308666706-e78d6e32bc50', '1607619056574-7cfc938c5b6e', '1576091160550-2173dba999ef', '1629909613654-e84000b211ab']
};

const PRODUCT_ADJECTIVES = ['Ultra', 'Smart', 'Pro', 'Classic', 'Premium', 'Eco', 'Advanced', 'Wireless', 'Ergonomic', 'Signature', 'Elite', 'Essential', 'Hyper', 'Flex', 'Sonic'];
const PRODUCT_NOUNS = {
    Electronics: ['Headphones', 'Speaker', 'Charging Pad', 'Power Bank', 'HDMI Adapter', 'Soundbar', 'Subwoofer', 'Microphone', 'Router'],
    Mobiles: ['Smartphone', 'Mobile Phone', 'Pro Phone', 'Pocket Phone', 'Dual-SIM Phone'],
    Laptops: ['Notebook', 'Gaming Laptop', 'Chromebook', 'Ultrabook', 'Workstation'],
    Cameras: ['Mirrorless Camera', 'DSLR Camera', 'Action Cam', 'Zoom Lens', 'Prime Lens', 'Handycam'],
    Fashion: ['T-Shirt', 'Denim Jacket', 'Summer Dress', 'Hoodie', 'Polo Shirt', 'Chino Pants', 'Windbreaker'],
    Shoes: ['Running Shoes', 'Sneakers', 'Formal Oxford', 'Leather Boots', 'Walking Shoes', 'Slip-on Shoes'],
    Watches: ['Smartwatch', 'Chronograph Watch', 'Minimalist Watch', 'Fitness Band', 'Luxury Watch'],
    Beauty: ['Face Serum', 'Hydrating Moisturizer', 'Matte Lipstick', 'Eau de Parfum', 'Shampoo Pro', 'Sunscreen SPF50'],
    'Home & Kitchen': ['Air Fryer', 'Pressure Cooker', 'Blender Pro', 'Coffee Maker', 'Knife Set', 'Toaster', 'Food Processor'],
    Furniture: ['Office Chair', 'Standing Desk', 'Walnut Bookshelf', 'Fabric Sofa', 'Coffee Table', 'Bed Frame'],
    Books: ['Mystery Novel', 'Sci-Fi Epic', 'Self-Help Guide', 'Python Handbook', 'History Hardcover', 'Cooking Recipes'],
    Toys: ['Building Blocks Set', 'Board Game Classic', 'Brain Puzzle', 'Remote Control Car', 'Action Figure Pack'],
    Sports: ['Yoga Mat', 'Dumbbells Set', 'Tennis Racket', 'Water Bottle', 'Running Backpack', 'Resistance Bands'],
    Grocery: ['Organic Coffee Beans', 'Green Tea Pack', 'Almond Milk', 'Energy Bars', 'Extra Virgin Olive Oil', 'Dark Chocolate'],
    Automotive: ['Phone Mount', 'Car Vacuum', 'Engine Oil 5W-30', 'LED Headlights', 'Leather Cleaner', 'Tire Inflator'],
    'Health Products': ['Whey Protein', 'Multivitamin Capsules', 'Hand Sanitizer', 'Sonic Toothbrush', 'Blood Pressure Monitor']
};

const generateProduct = (category, subcategory, brand, index, sellerId, catId, subcatId) => {
    const adj1 = PRODUCT_ADJECTIVES[index % PRODUCT_ADJECTIVES.length];
    const adj2 = PRODUCT_ADJECTIVES[(index + 3) % PRODUCT_ADJECTIVES.length];
    const noun = PRODUCT_NOUNS[category][index % PRODUCT_NOUNS[category].length];
    
    // Unique Title
    const title = `${brand} ${adj1} ${noun} ${index + 100}`;
    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + `-${index}`;

    // Dynamic Price & Rating
    const base_price = parseFloat((49.99 + (index * 7.77) % 800).toFixed(2));
    const discount_percentage = (index % 5 === 0) ? 10 + (index % 4) * 5 : 0;
    const final_price = parseFloat((base_price * (1 - discount_percentage / 100)).toFixed(2));

    const average_rating = parseFloat((3.8 + (index * 0.13) % 1.2).toFixed(1));
    const review_count = 10 + (index * 23) % 450;
    
    // Unsplash unique images setup
    const unsplashPool = UNSPLASH_PHOTO_IDS[category] || ['1505740420928-5e560c06d30e'];
    const imageCount = 3 + (index % 4); // 3 to 6 images
    const images = [];
    for (let i = 0; i < imageCount; i++) {
        const photoId = unsplashPool[(index + i) % unsplashPool.length];
        images.push(`https://images.unsplash.com/photo-${photoId}?sig=${index}-${i}&auto=format&fit=crop&q=80&w=600`);
    }

    // Specifications
    const specifications = new Map([
        ['Model', `${adj1}-${index}`],
        ['Brand', brand],
        ['Origin', 'Made in USA'],
        ['Warranty', index % 2 === 0 ? '1 Year' : '2 Years'],
        ['Weight', `${((index * 150) % 800 + 100)}g`]
    ]);

    // Features
    const features = [
        `${adj1} design engineered for performance.`,
        `Includes ${adj2} technology integration.`,
        `Eco-friendly packaging and materials.`,
        `Highly rated by global customers.`
    ];

    // Variants
    const catCode = category.substring(0, 3).replace(/[^a-zA-Z]/g, '').toUpperCase();
    const variants = [
        {
            sku: `${catCode}-${brand.substring(0, 3).toUpperCase()}-${index}-1`,
            color: 'Black',
            inventory_count: 50 + (index % 10) * 10
        },
        {
            sku: `${catCode}-${brand.substring(0, 3).toUpperCase()}-${index}-2`,
            color: 'Silver',
            inventory_count: 20 + (index % 5) * 5
        }
    ];

    return {
        title,
        slug,
        short_description: `This is a short description for ${title}. Featuring top-tier technology and styling.`,
        description: `This is a highly detailed product description for ${title}. It outlines all premium parameters, material guidelines, usage blueprints, and user experience enhancements. Built by ${brand} as part of the ${adj1} series.`,
        features,
        specifications,
        base_price,
        discount_percentage,
        final_price,
        seller_id: sellerId,
        brand,
        category_id: catId,
        subcategory_id: subcatId,
        tags: [category.toLowerCase(), subcategory.toLowerCase(), brand.toLowerCase()],
        search_keywords: [category, subcategory, brand, adj1, adj2, noun],
        variants,
        images,
        status: 'ACTIVE',
        total_inventory_count: variants.reduce((sum, v) => sum + v.inventory_count, 0),
        average_rating,
        review_count
    };
};

const run = async () => {
    try {
        console.log('[Catalog Seeder] Connecting to database...');
        await mongoose.connect(MONGO_URI);
        console.log('[Catalog Seeder] Connected to MongoDB.');

        // Wipe old categories, brands, products
        console.log('[Catalog Seeder] Wiping old catalogs...');
        await Product.deleteMany({});
        await Category.deleteMany({});
        await Brand.deleteMany({});
        console.log('[Catalog Seeder] Database cleaned.');

        const sellerId = 'seller-mock-id'; // Default mock seller ID

        const countPerCategory = 100; // 16 categories * 100 = 1600 products!
        console.log(`[Catalog Seeder] Seeding ${CATEGORIES.length} categories, 100 products per category (Total: 1600)...`);

        for (const catInfo of CATEGORIES) {
            console.log(`Seeding Category: ${catInfo.name}...`);
            
            // Create Parent Category
            const categoryObj = await Category.create({
                name: catInfo.name,
                slug: catInfo.name.toLowerCase().replace(/[^a-z]+/g, '-')
            });

            // Create Subcategories
            const subcatObjs = [];
            for (const subName of catInfo.subcategories) {
                const subObj = await Category.create({
                    name: subName,
                    slug: subName.toLowerCase().replace(/[^a-z]+/g, '-'),
                    parent_id: categoryObj._id
                });
                subcatObjs.push(subObj);
            }

            // Create Brands for this Category
            const brandNames = BRANDS[catInfo.name] || ['Generic'];
            const brandObjs = [];
            for (const bName of brandNames) {
                const slug = bName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
                let bObj = await Brand.findOne({ slug });
                if (!bObj) {
                    bObj = await Brand.create({
                        name: bName,
                        slug
                    });
                }
                brandObjs.push(bObj);
            }

            // Generate Products
            const productsList = [];
            for (let i = 0; i < countPerCategory; i++) {
                const subcat = subcatObjs[i % subcatObjs.length];
                const brand = brandNames[i % brandNames.length];
                const productData = generateProduct(
                    catInfo.name,
                    subcat.name,
                    brand,
                    i,
                    sellerId,
                    categoryObj._id,
                    subcat._id
                );
                productsList.push(productData);
            }

            // Bulk Insert Products for high performance
            await Product.insertMany(productsList);
            console.log(`Seeded ${productsList.length} products for Category: ${catInfo.name}.`);
        }

        console.log('[Catalog Seeder] Seeding process completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('[Catalog Seeder] Critical Error during seeding:', err);
        process.exit(1);
    }
};

run();
