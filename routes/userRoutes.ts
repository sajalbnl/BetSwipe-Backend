import express, { Request, Response, Router } from 'express';
import userService from '../services/user.service.js';
import { RegisterUserRequestBody, UpdateUserRequestBody } from '../types/requests.js';

const userRouter: Router = express.Router();

// POST /api/user/register - Register new user or get existing (called after Privy login)
userRouter.post('/register', async (req: Request<{}, {}, RegisterUserRequestBody>, res: Response): Promise<void> => {
    try {
        const { privyUserId, polygonWalletAddress, smartWalletAddress } = req.body;

        if (!privyUserId) {
            res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
            return;
        }

        const result = await userService.registerUser(privyUserId, polygonWalletAddress, smartWalletAddress);

        res.status(200).json({
            success: true,
            message: result.isNew ? 'User registered successfully' : 'User already exists',
            isNew: result.isNew,
            data: result.user
        });
    } catch (error: any) {
        console.error('Error in user register:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to register user',
            error: error.message
        });
    }
});

// GET /api/user/:privyUserId - Get user details
userRouter.get('/:privyUserId', async (req: Request<{ privyUserId: string }>, res: Response): Promise<void> => {
    try {
        const { privyUserId } = req.params;

        if (!privyUserId) {
            res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
            return;
        }

        const result = await userService.getUser(privyUserId);

        if (!result.success) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.user
        });
    } catch (error: any) {
        console.error('Error getting user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
});

// PUT /api/user/:privyUserId - Update user details
userRouter.put('/:privyUserId', async (req: Request<{ privyUserId: string }, {}, UpdateUserRequestBody>, res: Response): Promise<void> => {
    try {
        const { privyUserId } = req.params;
        const updateData = req.body;

        if (!privyUserId) {
            res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
            return;
        }

        const result = await userService.updateUser(privyUserId, updateData);

        if (!result.success) {
            res.status(404).json({
                success: false,
                message: result.message || 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: result.user
        });
    } catch (error: any) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update user',
            error: error.message
        });
    }
});

// GET /api/user/wallet/:smartWalletAddress - Get user by smart wallet address
userRouter.get('/wallet/:smartWalletAddress', async (req: Request<{ smartWalletAddress: string }>, res: Response): Promise<void> => {
    try {
        const { smartWalletAddress } = req.params;

        if (!smartWalletAddress) {
            res.status(400).json({
                success: false,
                message: 'smartWalletAddress is required'
            });
            return;
        }

        const result = await userService.getUserBySmartWallet(smartWalletAddress);

        if (!result.success) {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: result.user
        });
    } catch (error: any) {
        console.error('Error getting user by smart wallet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user',
            error: error.message
        });
    }
});

export default userRouter;
