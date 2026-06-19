const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { User } = require('../models');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

exports.generate2FA = async (req, res, next) => {
    try {
        const user = await User.findByPk(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: 'User not found' });

        const secret = speakeasy.generateSecret({ name: `EcommerceEnterprise (${user.email})` });
        
        user.two_factor_secret = secret.base32;
        await user.save();

        const qrCodeDataUrl = await QRCode.toDataURL(secret.otpauth_url);

        res.status(200).json({
            success: true,
            secret: secret.base32,
            qrCode: qrCodeDataUrl
        });
    } catch (error) {
        next(error);
    }
};

exports.enable2FA = async (req, res, next) => {
    try {
        const { token } = req.body;
        const user = await User.findByPk(req.user.id);
        
        if (!user || !user.two_factor_secret) {
            return res.status(400).json({ success: false, message: '2FA not initialized' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token
        });

        if (!verified) {
            return res.status(400).json({ success: false, message: 'Invalid 2FA token' });
        }

        user.is_two_factor_enabled = true;
        await user.save();
        
        await authService.logAudit(user.id, 'ENABLE_2FA', req);

        res.status(200).json({ success: true, message: '2FA enabled successfully' });
    } catch (error) {
        next(error);
    }
};

exports.verify2FA = async (req, res, next) => {
    try {
        // Expected to be called with temp token (role: '2FA_PENDING')
        if (req.user.role !== '2FA_PENDING') {
            return res.status(400).json({ success: false, message: 'Invalid authentication state' });
        }

        const { token } = req.body;
        const user = await User.findByPk(req.user.id);

        if (!user || !user.is_two_factor_enabled) {
            return res.status(400).json({ success: false, message: '2FA is not enabled for this account' });
        }

        const verified = speakeasy.totp.verify({
            secret: user.two_factor_secret,
            encoding: 'base32',
            token
        });

        if (!verified) {
             await authService.logAudit(user.id, '2FA_FAILED', req);
             return res.status(401).json({ success: false, message: 'Invalid 2FA token' });
        }

        await authService.logAudit(user.id, '2FA_SUCCESS', req);

        const accessToken = tokenService.generateAccessToken(user);
        const refreshToken = await tokenService.generateRefreshToken(user, req);

        res.cookie('accessToken', accessToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 15 * 60 * 1000 });
        res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'Strict', maxAge: 7 * 24 * 60 * 60 * 1000 });

        res.status(200).json({
            success: true,
            accessToken,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        next(error);
    }
};
