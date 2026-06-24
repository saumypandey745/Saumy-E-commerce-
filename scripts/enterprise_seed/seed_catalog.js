const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const Category = require('../microservices/product-service/src/models/Category');
const Product = require('../microservices/product-service/src/models/Product');
const Brand = require('../microservices/product-service/src/models/Brand');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/ecommerce_products';
const BATCH_SIZE = 1000; // Smaller batches for massive documents

const imageMapping = JSON.parse(fs.readFileSync(path.join(__dirname, 'image_mapping.json'), 'utf-8'));

const BRANDS = ['Apple', 'Samsung', 'Sony', 'Nike', 'Adidas', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Microsoft', 'Bose', 'Canon', 'Nikon'];
const ADJECTIVES = ['Premium', 'Advanced', 'Ultra', 'Pro', 'Max', 'Elite', 'Essential', 'Classic', 'Signature', 'Dynamic', 'Smart', 'Eco', 'Quantum', 'Nexus'];

function mulberry32(a) {
    return function() {
      var t = a += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}
const random = mulberry32(123456);

async function seedCategoriesAndBrands() {
    console.log('Seeding categories and brands...');
    await Category.deleteMany({});
    await Brand.deleteMany({});
    
    const categoryMap = {}; // { 'Electronics': ObjectId, 'Smartphones': ObjectId }

    for (const [parentName, subCategories] of Object.entries(imageMapping)) {
        const parentCat = await Category.create({
            name: parentName,
            slug: parentName.toLowerCase().replace(/ & /g, '-').replace(/ /g, '-'),
            parent_id: null,
            status: 'ACTIVE',
            seo_title: `Shop ${parentName} Online`,
            seo_description: `Browse the best selection of ${parentName}.`
        });
        categoryMap[parentName] = parentCat._id;

        for (const [subName, images] of Object.entries(subCategories)) {
            const subCat = await Category.create({
                name: subName,
                slug: subName.toLowerCase().replace(/ /g, '-'),
                parent_id: parentCat._id,
                image_url: images.length > 0 ? images[0] : '',
                status: 'ACTIVE',
                seo_title: `Buy ${subName} Online at Best Prices`,
                seo_description: `Find top rated ${subName} with fast delivery and great discounts.`
            });
            categoryMap[subName] = subCat._id;
        }
    }

    const brandMap = {};
    for (const brandName of BRANDS) {
        const b = await Brand.create({
            name: brandName,
            slug: brandName.toLowerCase(),
            description: `${brandName} is a global leader in innovative products.`
        });
        brandMap[brandName] = b._id;
    }
    
    return { categoryMap, brandMap };
}

function generateProductBatch(size, startIndex, categoryMap, brandMap) {
    const products = [];
    const parentCats = Object.keys(imageMapping);
    
    for (let i = 0; i < size; i++) {
        const index = startIndex + i;
        
        // Pick random hierarchy
        const parentName = parentCats[Math.floor(random() * parentCats.length)];
        const subNames = Object.keys(imageMapping[parentName]);
        const subName = subNames[Math.floor(random() * subNames.length)];
        
        const brand = BRANDS[Math.floor(random() * BRANDS.length)];
        const adjective = ADJECTIVES[Math.floor(random() * ADJECTIVES.length)];
        const modelNumber = Math.floor(random() * 9000) + 1000;
        
        const title = `${brand} ${adjective} ${subName} ${modelNumber}`;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-') + '-' + index;
        
        const basePrice = parseFloat((random() * 1950 + 19.99).toFixed(2));
        const hasDiscount = random() > 0.6;
        const discount_percentage = hasDiscount ? Math.floor(random() * 40) + 10 : 0;
        const final_price = parseFloat((basePrice * (1 - discount_percentage / 100)).toFixed(2));
        
        const rating = parseFloat((random() * 2 + 3.0).toFixed(1));
        const review_count = Math.floor(random() * 10000);
        
        // Generate unique category-specific images for EVERY product
        const keyword = subName.toLowerCase().replace(/ /g, ',');
        const categoryImages = imageMapping[parentName][subName] || [];
        
        let images = [];
        if (categoryImages.length > 0) {
            images = [
                categoryImages[index % categoryImages.length],
                categoryImages[(index + 1) % categoryImages.length],
                categoryImages[(index + 2) % categoryImages.length]
            ];
        } else {
            images = [
                `https://placehold.co/800x800/png?text=${keyword}1`,
                `https://placehold.co/800x800/png?text=${keyword}2`,
                `https://placehold.co/800x800/png?text=${keyword}3`
            ];
        }

        // Generate Variants based on Category
        let variants = [];
        let total_inventory_count = 0;

        if (['Smartphones', 'Tablets'].includes(subName)) {
            const storages = ['128GB', '256GB', '512GB'];
            const colors = ['Midnight Black', 'Silver', 'Ocean Blue'];
            
            storages.forEach((st, sidx) => {
                colors.forEach((col, cidx) => {
                    const inv = Math.floor(random() * 200);
                    total_inventory_count += inv;
                    variants.push({
                        sku: `SKU-${index}-${st}-${col.substring(0,3).toUpperCase()}`,
                        color: col,
                        storage: st,
                        price_modifier: sidx * 100, // higher storage costs more
                        inventory_count: inv,
                        images: [images[(cidx) % images.length] || images[0]]
                    });
                });
            });
        } else if (parentName === 'Fashion') {
            const sizes = ['S', 'M', 'L', 'XL', 'XXL'];
            const colors = ['Red', 'Black', 'White'];
            sizes.forEach((sz, sidx) => {
                colors.forEach((col, cidx) => {
                    const inv = Math.floor(random() * 100);
                    total_inventory_count += inv;
                    variants.push({
                        sku: `SKU-${index}-${sz}-${col.substring(0,3).toUpperCase()}`,
                        color: col,
                        size: sz,
                        price_modifier: sz === 'XXL' ? 10 : 0,
                        inventory_count: inv,
                        images: [images[(cidx) % images.length] || images[0]]
                    });
                });
            });
        } else {
            // Generic variants
            const colors = ['Standard', 'Pro Edition'];
            colors.forEach((col, cidx) => {
                const inv = Math.floor(random() * 300);
                total_inventory_count += inv;
                variants.push({
                    sku: `SKU-${index}-V${cidx}`,
                    color: col,
                    price_modifier: cidx * 50,
                    inventory_count: inv,
                    images: [images[(cidx) % images.length] || images[0]]
                });
            });
        }
        
        const barcode = Math.floor(random() * 899999999999 + 100000000000).toString();

        const product = {
            title,
            slug,
            barcode,
            short_description: `High quality ${subName.toLowerCase()} designed for professional use.`,
            description: `Experience the pinnacle of performance with the ${title}. Engineered with precision and crafted from premium materials. This ${subName.toLowerCase()} features advanced technology tailored for your daily needs.`,
            features: ['Durable Build', 'High Performance', 'Eco-friendly Packaging', 'Premium Materials'],
            specifications: {
                'Brand': brand,
                'Model': modelNumber.toString(),
                'Material': 'Composite'
            },
            
            weight: parseFloat((random() * 3 + 0.1).toFixed(2)),
            dimensions: {
                length: Math.floor(random() * 30 + 10),
                width: Math.floor(random() * 20 + 5),
                height: Math.floor(random() * 10 + 2)
            },
            delivery_estimate: "2-4 Business Days",
            return_policy: "30-Day Free Returns",
            warranty: "1 Year Manufacturer Warranty",
            tax_percentage: 18,

            meta_title: `Buy ${title} Online | Best Price`,
            meta_description: `Shop the new ${title} with ${discount_percentage}% discount. Fast delivery and free returns.`,

            base_price: basePrice,
            discount_percentage,
            final_price,
            seller_id: 'mock_seller_' + Math.floor(random() * 50),
            brand,
            brand_id: brandMap[brand],
            category_id: categoryMap[parentName],
            subcategory_id: categoryMap[subName],
            tags: [subName.toLowerCase(), parentName.toLowerCase(), brand.toLowerCase(), 'premium'],
            search_keywords: [subName, brand, adjective, 'buy online', 'best'],
            images: images,
            status: 'ACTIVE',
            average_rating: rating,
            review_count: review_count,
            total_inventory_count,
            variants
        };
        products.push(product);
    }
    return products;
}

async function run() {
    const targetSize = parseInt(process.argv[2]) || 5000;
    
    console.log(`Starting Enterprise Seed: Target ${targetSize} products...`);
    
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');
        
        const { categoryMap, brandMap } = await seedCategoriesAndBrands();
        console.log(`Seeded Categories: ${Object.keys(categoryMap).length}`);
        console.log(`Seeded Brands: ${Object.keys(brandMap).length}`);
        
        console.log('Clearing old products...');
        await Product.deleteMany({});
        
        let inserted = 0;
        while (inserted < targetSize) {
            const batchSize = Math.min(BATCH_SIZE, targetSize - inserted);
            const batch = generateProductBatch(batchSize, inserted, categoryMap, brandMap);
            
            await Product.insertMany(batch);
            inserted += batchSize;
            
            console.log(`Inserted ${inserted} / ${targetSize} products...`);
        }
        
        console.log('✅ Enterprise seed completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seed Failed:', err);
        process.exit(1);
    }
}

run();
