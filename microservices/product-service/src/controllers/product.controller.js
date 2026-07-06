const Product = require('../models/Product');
const InventoryLog = require('../models/InventoryLog');
const slugify = require('slugify');
const { redisClient } = require('../config/db');
const { publishEvent } = require('../config/rabbitmq');

exports.createProduct = async (req, res, next) => {
    try {
        const baseSlug = slugify(req.body.title, { lower: true, strict: true });
        let slug = baseSlug;
        
        // Ensure slug uniqueness
        let counter = 1;
        while (await Product.findOne({ slug })) {
            slug = `${baseSlug}-${counter}`;
            counter++;
        }

        console.log("req.body:", req.body);
        const variants = req.body.variants || [];
        // Auto-generate SKUs if not provided
        variants.forEach((v, index) => {
            if (!v.sku) {
                v.sku = `${slug.toUpperCase().substring(0, 8)}-V${index+1}`;
            }
        });

        // Calculate total inventory
        const total_inventory_count = variants.reduce((sum, v) => sum + (v.inventory_count || 0), 0);

        // Calculate final_price
        const base_price = req.body.base_price || 0;
        const discount_percentage = req.body.discount_percentage || 0;
        const final_price = req.body.final_price || (base_price * (1 - (discount_percentage / 100)));

        const product = new Product({
            ...req.body,
            slug,
            variants,
            total_inventory_count,
            final_price,
            status: req.body.status || 'DRAFT', // Allow override for testing
            seller_id: req.user ? req.user.id : (req.body.seller_id || 'mock_seller_id')
        });
        
        await product.save();

        res.status(201).json({ success: true, product });
    } catch (error) {
        next(error);
    }
};

exports.submitForApproval = async (req, res, next) => {
    try {
        const product = await Product.findOne({ _id: req.params.id, seller_id: req.user.id });
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

        if (product.status !== 'DRAFT' && product.status !== 'REJECTED') {
            return res.status(400).json({ success: false, message: 'Can only submit DRAFT or REJECTED products' });
        }

        product.status = 'PENDING_APPROVAL';
        await product.save();

        res.status(200).json({ success: true, message: 'Submitted for approval', product });
    } catch (error) {
        next(error);
    }
}

exports.getProducts = async (req, res, next) => {
    try {
        const { page = 1, limit = 12, search, category, brand, sort, min_price, max_price, min_rating, seller_id, status } = req.query;
        
        const cacheKey = `products:page=${page}:limit=${limit}:search=${search}:cat=${category}:brand=${brand}:sort=${sort}:minp=${min_price}:maxp=${max_price}:minr=${min_rating}`;
        
        if (!seller_id && !status) {
            const cachedProducts = await redisClient.get(cacheKey);
            if (cachedProducts) {
                return res.status(200).json(JSON.parse(cachedProducts));
            }
        }

        const query = {};
        if (seller_id) {
            query.seller_id = seller_id;
        } else {
            query.status = 'ACTIVE';
        }
        if (status) {
            query.status = status;
        }
        if (search) query.$text = { $search: search };
        // Support category by ObjectId or by name string
        if (category) {
            const Category = require('../models/Category');
            if (category.match(/^[0-9a-fA-F]{24}$/)) {
                query.$or = [
                    { category_id: category },
                    { subcategory_id: category }
                ];
            } else {
                const catDoc = await Category.findOne({ name: { $regex: new RegExp(`^${category}$`, 'i') } });
                if (catDoc) {
                    query.$or = [
                        { category_id: catDoc._id },
                        { subcategory_id: catDoc._id }
                    ];
                } else {
                    return res.json({ success: true, count: 0, products: [] });
                }
            }
        }
        if (brand) {
            if (brand.match(/^[0-9a-fA-F]{24}$/)) {
                query.brand_id = brand;
            } else {
                const Brand = require('../models/Brand');
                const brandDoc = await Brand.findOne({ name: { $regex: new RegExp(`^${brand}$`, 'i') } });
                if (brandDoc) {
                    query.brand_id = brandDoc._id;
                } else {
                    query.brand_id = null;
                }
            }
        }
        // Price range filtering
        if (min_price || max_price) {
            query.base_price = {};
            if (min_price) query.base_price.$gte = Number(min_price);
            if (max_price) query.base_price.$lte = Number(max_price);
        }
        // Rating filtering
        if (min_rating) {
            query.average_rating = { $gte: Number(min_rating) };
        }

        let sortOption = { createdAt: -1 };
        if (sort === 'price_asc') sortOption = { base_price: 1 };
        if (sort === 'price_desc') sortOption = { base_price: -1 };
        if (sort === 'rating_desc') sortOption = { average_rating: -1 };
        if (sort === 'name_asc') sortOption = { title: 1 };

        const products = await Product.find(query)
            .populate('category_id', 'name slug')
            .populate('brand_id', 'name slug')
            .skip((page - 1) * Number(limit))
            .limit(Number(limit))
            .sort(sortOption);

        const total = await Product.countDocuments(query);

        const response = { 
            success: true, 
            count: products.length, 
            total, 
            page: Number(page),
            totalPages: Math.ceil(total / Number(limit)),
            products 
        };
        
        await redisClient.setEx(cacheKey, 30, JSON.stringify(response));

        res.status(200).json(response);
    } catch (error) {
        next(error);
    }
};

exports.getProductById = async (req, res, next) => {
    try {
        // ID could be MongoID or Slug
        const isMongoId = req.params.id.match(/^[0-9a-fA-F]{24}$/);
        const query = isMongoId ? { _id: req.params.id } : { slug: req.params.id };

                // Bypass cache if requested via query param
        if (req.query.bypassCache) {
            const product = await Product.findOne(query)
                .populate('category_id', 'name slug')
                .populate('brand_id', 'name slug');
            if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
            // Optionally refresh cache
            const cacheKey = `product:read:${req.params.id}`;
            await redisClient.set(cacheKey, JSON.stringify(product));
            return res.status(200).json({ success: true, product });
        }

        const cacheKey = `product:read:${req.params.id}`;
        const cachedProduct = await redisClient.get(cacheKey);

        if (cachedProduct) {
            return res.status(200).json({ success: true, product: JSON.parse(cachedProduct) });
        }

        const product = await Product.findOne(query)
            .populate('category_id', 'name slug')
            .populate('brand_id', 'name slug');
            
        if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
        
        await redisClient.set(cacheKey, JSON.stringify(product));

        res.status(200).json({ success: true, product });
    } catch (error) {
        next(error);
    }
};

exports.reserveStock = async (req, res, next) => {
    try {
        const { items } = req.body; // items = [{ product_id, sku, quantity }]

        for (const item of items) {
            const product = await Product.findById(item.product_id);
            if (!product) return res.status(404).json({ success: false, message: `Product not found: ${item.product_id}` });

            const variant = product.variants.find(v => v.sku === item.sku);
            if (!variant) return res.status(404).json({ success: false, message: `Variant SKU not found: ${item.sku}` });

            if (variant.inventory_count < item.quantity) {
                return res.status(400).json({ success: false, message: `Insufficient stock for SKU ${item.sku}` });
            }

            variant.inventory_count -= item.quantity;
            product.total_inventory_count -= item.quantity;

            if (product.total_inventory_count === 0) {
                product.status = 'OUT_OF_STOCK';
            }

            // Log Inventory Change
            await InventoryLog.create({
                product_id: product._id,
                sku: item.sku,
                warehouse_id: 'SYSTEM',
                quantity_change: -item.quantity,
                previous_stock: variant.inventory_count + item.quantity,
                new_stock: variant.inventory_count,
                reason: 'PURCHASE',
                reference_id: req.body.order_id || 'UNKNOWN'
            });

            await product.save();
            await redisClient.set(`product:read:${product._id}`, JSON.stringify(product));
            await redisClient.set(`product:read:${product.slug}`, JSON.stringify(product));
            
            if (product.status === 'ACTIVE' || product.status === 'OUT_OF_STOCK') {
                publishEvent('event.product.updated', product.toObject());
            }
        }

        res.status(200).json({ success: true, message: 'Stock reserved successfully' });
    } catch (error) {
        next(error);
    }
};

exports.releaseStock = async (req, res, next) => {
    try {
        const { items } = req.body; 

        for (const item of items) {
            const product = await Product.findById(item.product_id);
            if (!product) continue;

            const variant = product.variants.find(v => v.sku === item.sku);
            if (!variant) continue;

            variant.inventory_count += item.quantity;
            product.total_inventory_count += item.quantity;

            if (product.status === 'OUT_OF_STOCK') {
                product.status = 'ACTIVE';
            }

            await InventoryLog.create({
                product_id: product._id,
                sku: item.sku,
                warehouse_id: 'SYSTEM',
                quantity_change: item.quantity,
                previous_stock: variant.inventory_count - item.quantity,
                new_stock: variant.inventory_count,
                reason: 'REFUND',
                reference_id: req.body.order_id || 'UNKNOWN'
            });

            await product.save();
            await redisClient.set(`product:read:${product._id}`, JSON.stringify(product));
            await redisClient.set(`product:read:${product.slug}`, JSON.stringify(product));
            
            if (product.status === 'ACTIVE') {
                publishEvent('event.product.updated', product.toObject());
            }
        }

        res.status(200).json({ success: true, message: 'Stock released successfully' });
    } catch (error) {
        next(error);
    }
};
