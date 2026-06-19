const Stripe = require('stripe');

// For Phase 5, we use a generic mock stripe key if none is provided.
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'sk_test_mock424242424242424242424242';
const stripe = new Stripe(stripeSecretKey);

exports.processCharge = async (amount, currency, source) => {
    try {
        // Since we don't have a real front-end token, if the source starts with 'tok_4000' we fail it.
        // Otherwise, if it starts with 'tok_4242' or anything else, we mock a successful charge.
        
        // Normally:
        // const charge = await stripe.charges.create({ amount: Math.round(amount * 100), currency, source });
        
        // Mock Stripe Behavior based on source
        if (source && source.startsWith('4000')) {
            throw new Error('Your card was declined.');
        }

        return {
            id: 'ch_' + Math.random().toString(36).substr(2, 9),
            amount: amount * 100,
            status: 'succeeded'
        };

    } catch (error) {
        throw new Error(error.message);
    }
};
