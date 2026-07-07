const { Coupon, CouponRule, CouponUsage } = require('../models');

exports.createCoupon = async (req, res, next) => {
    try {
        const { code, type, value, min_order_amount, max_discount_amount, usage_limit_total, usage_limit_user, valid_from, valid_until, rules } = req.body;
        
        const existing = await Coupon.findOne({ where: { code: code.toUpperCase() } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Coupon code already exists' });
        }

        const coupon = await Coupon.create({
            code: code.toUpperCase(),
            type,
            value,
            min_order_amount,
            max_discount_amount,
            usage_limit_total,
            usage_limit_user,
            valid_from: valid_from || new Date(),
            valid_until
        });

        if (rules && Array.isArray(rules)) {
            const rulePromises = rules.map(rule => CouponRule.create({
                coupon_id: coupon.id,
                rule_type: rule.rule_type,
                target_id: rule.target_id
            }));
            await Promise.all(rulePromises);
        }

        res.status(201).json({ success: true, coupon });
    } catch (err) {
        next(err);
    }
};

exports.getCoupons = async (req, res, next) => {
    try {
        const coupons = await Coupon.findAll({ include: [{ model: CouponRule, as: 'rules' }] });
        res.status(200).json({ success: true, coupons });
    } catch (err) {
        next(err);
    }
};

exports.getCouponByCode = async (req, res, next) => {
    try {
        const coupon = await Coupon.findOne({
            where: { code: req.params.code.toUpperCase() },
            include: [{ model: CouponRule, as: 'rules' }]
        });
        if (!coupon) return res.status(404).json({ success: false, message: 'Coupon not found' });
        res.status(200).json({ success: true, coupon });
    } catch (err) {
        next(err);
    }
};

exports.validateCoupon = async (req, res, next) => {
    try {
        const { code, cart_subtotal, user_id, cart_items } = req.body;
        if (!code || !cart_subtotal) {
            return res.status(400).json({ success: false, message: 'Code and cart_subtotal are required' });
        }

        const coupon = await Coupon.findOne({
            where: { code: code.toUpperCase() },
            include: [{ model: CouponRule, as: 'rules' }]
        });
        
        if (!coupon || !coupon.is_active) {
            return res.status(400).json({ success: false, message: 'Invalid or inactive coupon' });
        }

        const now = new Date();
        if (new Date(coupon.valid_from) > now) {
            return res.status(400).json({ success: false, message: 'Coupon is not yet active' });
        }
        if (coupon.valid_until && new Date(coupon.valid_until) < now) {
            return res.status(400).json({ success: false, message: 'Coupon has expired' });
        }

        if (parseFloat(cart_subtotal) < parseFloat(coupon.min_order_amount)) {
            return res.status(400).json({ success: false, message: `Minimum order amount of $${coupon.min_order_amount} required` });
        }

        // Usage limits
        if (coupon.usage_limit_total !== null) {
            const totalUsed = await CouponUsage.count({ where: { coupon_id: coupon.id } });
            if (totalUsed >= coupon.usage_limit_total) {
                return res.status(400).json({ success: false, message: 'Coupon global usage limit reached' });
            }
        }

        if (coupon.usage_limit_user !== null && user_id) {
            const userUsed = await CouponUsage.count({ where: { coupon_id: coupon.id, user_id } });
            if (userUsed >= coupon.usage_limit_user) {
                return res.status(400).json({ success: false, message: 'Your personal usage limit for this coupon has been reached' });
            }
        }

        // Calculate discount
        let discount = 0;
        const sub = parseFloat(cart_subtotal);
        const val = parseFloat(coupon.value || 0);

        if (coupon.type === 'PERCENTAGE') {
            discount = (sub * val) / 100;
        } else if (coupon.type === 'FIXED') {
            discount = val;
        } else if (coupon.type === 'FREE_SHIPPING') {
            discount = 0; // Handled specially by checkout, just validates here
        } else if (coupon.type === 'BOGO') {
            // Complex BOGO logic could go here based on cart_items
            discount = val;
        }

        if (coupon.max_discount_amount !== null) {
            const max = parseFloat(coupon.max_discount_amount);
            if (discount > max) discount = max;
        }

        if (discount > sub) discount = sub;

        res.status(200).json({
            success: true,
            coupon: {
                id: coupon.id,
                code: coupon.code,
                type: coupon.type,
                discount_amount: parseFloat(discount.toFixed(2))
            }
        });

    } catch (err) {
        console.error('[PromotionController] Validate error:', err);
        next(err);
    }
};
