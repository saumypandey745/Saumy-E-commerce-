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
    phone: Joi.string().allow('', null).optional(),
    full_name: Joi.string().allow('', null).optional(),
    password: Joi.string().min(8).required(),
    role: Joi.string().valid('CUSTOMER', 'SELLER').optional()
});

exports.register = async (req, res, next) => {
    try {
        console.log(`[AuthController] Registration request received for email: ${req.body?.email}`);
        const { error } = registerSchema.validate(req.body);
        if (error) {
            console.warn(`[AuthController] Registration Joi validation failed: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const user = await authService.register(req.body, req);
        console.log(`[AuthController] Registration successful for user ID: ${user.id}, email: ${user.email}`);

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify using OTP or email link.',
            user: { id: user.id, email: user.email, role: user.role },
            otpCode: process.env.NODE_ENV !== 'production' ? user.otp_code : undefined
        });
    } catch (error) {
        console.error(`[AuthController] Registration error for email: ${req.body?.email}:`, error);
        if (error.message === 'Email already exists' || error.message === 'Phone number already exists') {
             return res.status(400).json({ success: false, message: error.message });
        }
        next(error);
    }
};

const loginSchema = Joi.object({
    email: Joi.string().required(),
    password: Joi.string().required()
});

exports.login = async (req, res, next) => {
    try {
        console.log(`[AuthController] Login request received for identifier: ${req.body?.email}`);
        const { error } = loginSchema.validate(req.body);
        if (error) {
            console.warn(`[AuthController] Login Joi validation failed: ${error.details[0].message}`);
            return res.status(400).json({ success: false, message: error.details[0].message });
        }

        const user = await authService.login(req.body.email, req.body.password, req);

        if (user.is_two_factor_enabled) {
            console.log(`[AuthController] 2FA required for user: ${user.email}`);
            // Give them a temporary token just for 2FA verification
            const tempToken = tokenService.generateAccessToken({ id: user.id, role: '2FA_PENDING' });
            return res.status(200).json({
                success: true,
                message: '2FA required',
                requires2FA: true,
                tempToken
            });
        }

        console.log(`[AuthController] Generating access and refresh tokens for user: ${user.email}`);
        const accessToken = tokenService.generateAccessToken(user);
        const refreshToken = await tokenService.generateRefreshToken(user, req);

        setCookies(res, accessToken, refreshToken);

        console.log(`[AuthController] Login completed successfully for user: ${user.email}`);
        res.status(200).json({
            success: true,
            accessToken,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(`[AuthController] Login error for identifier: ${req.body?.email}:`, error.message);
        if (error.message === 'Invalid credentials') {
            return res.status(401).json({ success: false, message: 'Invalid email/phone or password.' });
        }
        res.status(401).json({ success: false, message: error.message });
    }
};

exports.googleAuth = async (req, res, next) => {
    try {
        const { credential, role } = req.body;
        if (!credential) {
            return res.status(400).json({ success: false, message: 'Google credential is required' });
        }

        const user = await authService.googleLogin(credential, role, req);

        console.log(`[AuthController] Generating access and refresh tokens for Google user: ${user.email}`);
        const accessToken = tokenService.generateAccessToken(user);
        const refreshToken = await tokenService.generateRefreshToken(user, req);

        setCookies(res, accessToken, refreshToken);

        res.status(200).json({
            success: true,
            accessToken,
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        console.error(`[AuthController] Google auth error:`, error.message);
        res.status(401).json({ success: false, message: error.message });
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
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        };
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);
        res.status(401).json({ success: false, message: 'Invalid or expired refresh token' });
    }
};

exports.logout = async (req, res, next) => {
    try {
        const refreshTokenString = req.cookies.refreshToken;
        if (refreshTokenString) {
            await tokenService.revokeRefreshToken(refreshTokenString);
        }

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        };
        res.clearCookie('accessToken', cookieOptions);
        res.clearCookie('refreshToken', cookieOptions);

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

exports.verifyOTP = async (req, res, next) => {
    try {
        const { emailOrPhone, otp } = req.body;
        if (!emailOrPhone || !otp) return res.status(400).json({ success: false, message: 'Email/Phone and OTP are required' });

        await authService.verifyOTP(emailOrPhone, otp);
        res.status(200).json({ success: true, message: 'OTP verified successfully' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

exports.getProfile = async (req, res, next) => {
    try {
        const { User, Profile } = require('../models');
        
        // Find or create the profile to guarantee one exists for the customer
        const [profile, created] = await Profile.findOrCreate({
            where: { user_id: req.user.id },
            defaults: {
                first_name: req.user.full_name ? req.user.full_name.split(' ')[0] : '',
                last_name: req.user.full_name ? req.user.full_name.split(' ').slice(1).join(' ') : '',
                phone_number: req.user.phone || '',
                addresses: []
            }
        });

        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash', 'two_factor_secret'] },
            include: [{ model: Profile }]
        });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, user });
    } catch (error) {
        next(error);
    }
};

exports.updateProfile = async (req, res, next) => {
    try {
        const { Profile, User } = require('../models');
        const { first_name, last_name, phone_number, addresses, profile_image_url, currency, language } = req.body;
        
        let profile = await Profile.findOne({ where: { user_id: req.user.id } });
        if (!profile) {
            profile = await Profile.create({ user_id: req.user.id, addresses: [] });
        }
        
        if (first_name !== undefined) profile.first_name = first_name;
        if (last_name !== undefined) profile.last_name = last_name;
        if (phone_number !== undefined) profile.phone_number = phone_number;
        if (profile_image_url !== undefined) profile.profile_image_url = profile_image_url;
        if (addresses !== undefined) profile.addresses = addresses;
        if (currency !== undefined) profile.currency = currency;
        if (language !== undefined) profile.language = language;
        
        await profile.save();
        
        // Also update full_name on User model if first_name/last_name changed
        if (first_name || last_name) {
            const user = await User.findByPk(req.user.id);
            if (user) {
                user.full_name = `${first_name || ''} ${last_name || ''}`.trim();
                await user.save();
            }
        }
        
        const user = await User.findByPk(req.user.id, {
            attributes: { exclude: ['password_hash', 'two_factor_secret'] },
            include: [{ model: Profile }]
        });
        
        res.status(200).json({ success: true, message: 'Profile updated successfully', user });
    } catch (error) {
        next(error);
    }
};

exports.updateUserRole = async (req, res, next) => {
    try {
        const { User } = require('../models');
        const { role } = req.body;
        const { id } = req.params;
        
        const user = await User.findByPk(id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        
        user.role = role;
        await user.save();
        
        res.status(200).json({
            success: true,
            message: 'User role updated successfully',
            user: { id: user.id, email: user.email, role: user.role }
        });
    } catch (error) {
        next(error);
    }
};
