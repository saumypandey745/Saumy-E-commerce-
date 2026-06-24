const argon2 = require('argon2');
const { connectDB } = require('./config/db');
const { User } = require('./models');

const seed = async () => {
    try {
        console.log('[Auth Seeder] Connecting database...');
        await connectDB();
        console.log('[Auth Seeder] Database connected.');

        // Seed Admin Account
        const adminEmail = 'admin@enterprise.com';
        const adminExists = await User.findOne({ where: { email: adminEmail } });
        if (!adminExists) {
            console.log('[Auth Seeder] Seeding Admin Account...');
            await User.create({
                email: adminEmail,
                phone: '1234567890',
                full_name: 'Platform Super Admin',
                password_hash: await argon2.hash('adminpassword'),
                role: 'ADMIN',
                is_verified: true
            });
            console.log('[Auth Seeder] Admin seeded successfully.');
        } else {
            console.log('[Auth Seeder] Admin already exists.');
        }

        // Seed Seller Account
        const sellerEmail = 'seller@enterprise.com';
        const sellerExists = await User.findOne({ where: { email: sellerEmail } });
        if (!sellerExists) {
            console.log('[Auth Seeder] Seeding Seller Account...');
            await User.create({
                email: sellerEmail,
                phone: '2345678901',
                full_name: 'Apex Seller Store',
                password_hash: await argon2.hash('sellerpassword'),
                role: 'SELLER',
                is_verified: true
            });
            console.log('[Auth Seeder] Seller seeded successfully.');
        } else {
            console.log('[Auth Seeder] Seller already exists.');
        }

        // Seed Customer Account
        const customerEmail = 'customer@enterprise.com';
        const customerExists = await User.findOne({ where: { email: customerEmail } });
        if (!customerExists) {
            console.log('[Auth Seeder] Seeding Customer Account...');
            await User.create({
                email: customerEmail,
                phone: '3456789012',
                full_name: 'Jane Customer Doe',
                password_hash: await argon2.hash('customerpassword'),
                role: 'CUSTOMER',
                is_verified: true
            });
            console.log('[Auth Seeder] Customer seeded successfully.');
        } else {
            console.log('[Auth Seeder] Customer already exists.');
        }

        console.log('[Auth Seeder] Seeding complete.');
    } catch (err) {
        console.error('[Auth Seeder] Error during seeding:', err);
        throw err;
    }
};

module.exports = seed;

if (require.main === module) {
    const { connectDB } = require('./config/db');
    connectDB().then(() => seed().then(() => process.exit(0))).catch(err => {
        console.error(err);
        process.exit(1);
    });
}
