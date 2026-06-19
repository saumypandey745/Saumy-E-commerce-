const Joi = require('joi');
const authService = require('../services/auth.service');
const tokenService = require('../services/token.service');

const setCookies = (res, accessToken, refreshToken) => {
    // Access token optional cookie, primarily send via body, but nice for SSR
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000 // 15 mins
    });

    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });
};

const registerSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('CUSTOMER', 'SELLER').optional()
});

exports.register = async (req, res, next) => {
    try {
        const { error } = registerSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const user = await authService.register(req.body, req);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email.',
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        if (error.message === 'Email already exists') {
             return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

exports.login = async (req, res, next) => {
    try {
        const { error } = loginSchema.validate(req.body);
        if (error) return res.status(400).json({ success: false, message: error.details[0].message });

        const user = await authService.login(req.body.email, req.body.password, req);

        if (user.is_two_factor_enabled) {
            // Give them a temporary token just for 2FA verification
            const tempToken = tokenService.generateAccessToken({ id: user.id, role: '2FA_PENDING' });
            return res.status(200).json({
                success: true,
                message: '2FA required',
                requires2FA: true,
                tempToken
            });
        }

        const accessToken = tokenService.generateAccessToken(user);
        const refreshToken = await tokenService.generateRefreshToken(user, req);

        setCookies(res, accessToken, refreshToken);

        res.status(200).json({
            success: true,
            accessToken,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ success: false, message: error.message });
        }
        next(error);
    }
};

exports.refresh = async (req, res, next) => {
    try {
        const refreshTokenString = req.cookies.refreshToken;
        if (!refreshTokenString) {
            return res.status(401).json({ success: false, message: 'No refresh token provided' });
        }

        const { newAccessToken, newRefreshToken, user } = await authService.refreshAuthToken(refreshTokenString, req);

        setCookies(res, newAccessToken, newRefreshToken);

        res.status(200).json({
            success: true,
            accessToken: newAccessToken,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

exports.logout = async (req, res, next) => {
    try {
        const refreshTokenString = req.cookies.refreshToken;
        if (refreshTokenString) {
            await tokenService.revokeRefreshToken(refreshTokenString);
        }

        res.clearCookie('accessToken');
        res.clearCookie('refreshToken');

        res.status(200).json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
        next(error);
    }
};

exports.verifyEmail = async (req, res, next) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ success: false, message: 'Token required' });

        await authService.verifyEmail(token);
        res.status(200).json({ success: true, message: 'Email verified successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const { User } = require('../models');
        const user = await User.findByPk(req.user.id, { attributes: { exclude: ['password_hash', 'two_factor_secret'] }});
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};
