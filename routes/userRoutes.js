import express from 'express';
import userService from '../services/user.service.js';

const userRouter = express.Router();

// POST /api/user/register - Register new user or get existing (called after Privy login)
userRouter.post('/register', async (req, res) => {
    try {
        const { privyUserId, polygonWalletAddress, smartWalletAddress } = req.body;

        if (!privyUserId) {
            return res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
        }

        const result = await userService.registerUser(privyUserId, polygonWalletAddress, smartWalletAddress);

        res.status(200).json({
            success: true,
            message: result.isNew ? 'User registered successfully' : 'User already exists',
            isNew: result.isNew,
            data: result.user
        });
    } catch (error) {
        console.error('Error in user register:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: error.message
        });
    }
});

// GET /api/user/:privyUserId - Get user details
userRouter.get('/:privyUserId', async (req, res) => {
    try {
        const { privyUserId } = req.params;

        if (!privyUserId) {
            return res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
        }

        const result = await userService.getUser(privyUserId);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result.user
        });
    } catch (error) {
        console.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
});

// PUT /api/user/:privyUserId - Update user details
userRouter.put('/:privyUserId', async (req, res) => {
    try {
        const { privyUserId } = req.params;
        const updateData = req.body;

        if (!privyUserId) {
            return res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
        }

        const result = await userService.updateUser(privyUserId, updateData);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: result.message || 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: result.user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// GET /api/user/wallet/:smartWalletAddress - Get user by smart wallet address
userRouter.get('/wallet/:smartWalletAddress', async (req, res) => {
    try {
        const { smartWalletAddress } = req.params;

        if (!smartWalletAddress) {
            return res.status(400).json({
                success: false,
                message: 'smartWalletAddress is required'
            });
        }

        const result = await userService.getUserBySmartWallet(smartWalletAddress);

        if (!result.success) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(200).json({
            success: true,
            data: result.user
        });
    } catch (error) {
        console.error('Error getting user by smart wallet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
});

export default userRouter;
