const Coupon = require('../models/Coupon');

exports.createCoupon = async (req, res) => {
    try {
        const { code, discount_type, discount_value, min_order_value, valid_until, usage_limit } = req.body;
        
        const existing = await Coupon.findOne({ where: { code } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            discount_type,
            discount_value,
            min_order_value,
            valid_until,
            usage_limit
        });

        res.status(201).json({ success: true, coupon });
    } catch (err) {
        console.error('[CouponController] Create error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getAllCoupons = async (req, res) => {
    try {
        const coupons = await Coupon.findAll();
        res.status(200).json({ success: true, coupons });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.validateCoupon = async (req, res) => {
    try {
        const { code, subtotal } = req.body;
        if (!code || !subtotal) {
            return res.status(400).json({ success: false, message: 'Code and subtotal are required' });
        }

        const coupon = await Coupon.findOne({ where: { code: code.toUpperCase() } });
        
        if (!coupon || !coupon.is_active) {
            return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
        }

        if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit) {
            return res.status(400).json({ success: false, message: 'Coupon usage limit reached' });
        }

        if (parseFloat(subtotal) < parseFloat(coupon.min_order_value)) {
            return res.status(400).json({ success: false, message: `Minimum order value of $${coupon.min_order_value} required` });
        }

        // Calculate discount
        let discount = 0;
        const sTotal = parseFloat(subtotal);
        const dValue = parseFloat(coupon.discount_value);
        
        if (coupon.discount_type === 'PERCENTAGE') {
            discount = (sTotal * dValue) / 100;
        } else {
            discount = dValue;
        }

        // Discount cannot exceed subtotal
        if (discount > sTotal) discount = sTotal;

        res.status(200).json({
            success: true,
            coupon: {
                code: coupon.code,
                discount_amount: parseFloat(discount.toFixed(2))
            }
        });

    } catch (err) {
        console.error('[CouponController] Validate error:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
