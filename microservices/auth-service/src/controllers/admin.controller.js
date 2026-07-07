const User = require('../models/User');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: ['id', 'email', 'full_name', 'role', 'is_verified', 'lock_until', 'createdAt']
        });
        res.status(200).json({ success: true, users });
    } catch (err) {
        console.error('Error fetching users:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { role } = req.body;
        
        if (!['CUSTOMER', 'SELLER', 'ADMIN', 'SUPER_ADMIN'].includes(role)) {
            return res.status(400).json({ success: false, message: 'Invalid role' });
        }

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.role = role;
        await user.save();

        res.status(200).json({ success: true, message: 'User role updated', user });
    } catch (err) {
        console.error('Error updating user role:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { lock } = req.body; // boolean

        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (lock) {
            // Lock indefinitely (e.g. 100 years)
            user.lock_until = new Date(Date.now() + 100 * 365 * 24 * 60 * 60 * 1000);
        } else {
            // Unlock
            user.lock_until = null;
            user.failed_login_attempts = 0;
        }
        
        await user.save();
        res.status(200).json({ success: true, message: lock ? 'User locked' : 'User unlocked', user });
    } catch (err) {
        console.error('Error updating user status:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};

exports.getUserStats = async (req, res) => {
    try {
        const activeUsersCount = await User.count();
        res.status(200).json({ success: true, count: activeUsersCount });
    } catch (err) {
        console.error('Error fetching user stats:', err);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
};
