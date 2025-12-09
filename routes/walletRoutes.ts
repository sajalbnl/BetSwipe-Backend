import express, { Request, Response, Router } from 'express';
import walletService from '../services/wallet.service.js';
import signerService from '../services/signer.service.js';
import { CreateWalletRequestBody, CreateSessionSignerRequestBody } from '../types/requests.js';

const walletRouter: Router = express.Router();

// POST /api/wallet/create
walletRouter.post('/create', async (req: Request<{}, {}, CreateWalletRequestBody>, res: Response): Promise<void> => {
    try {
        const { privyUserId } = req.body;

        if (!privyUserId) {
            res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
            return;
        }

        const result = await walletService.getOrCreateWallet(privyUserId);

        res.status(200).json({
            success: true,
            message: result.isNew ? 'Wallet created successfully' : 'Wallet already exists',
            data: result.wallet
        });
    } catch (error: any) {
        console.error('Error in wallet create:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create wallet',
            error: error.message
        });
    }
});

// GET /api/wallet/:privyUserId
walletRouter.get('/:privyUserId', async (req: Request<{ privyUserId: string }>, res: Response) => {
    try {
        const { privyUserId } = req.params;

        const result = await walletService.getWalletBalance(privyUserId);

        res.status(200).json({
            success: true,
            data: result.balances
        });
    } catch (error: any) {
        console.error('Error getting wallet:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get wallet',
            error: error.message
        });
    }
});

// POST /api/wallet/session/create
walletRouter.post('/session/create', async (req: Request<{}, {}, CreateSessionSignerRequestBody>, res: Response): Promise<void> => {
    try {
        const { privyUserId, expiryDays } = req.body;

        if (!privyUserId) {
            res.status(400).json({
                success: false,
                message: 'privyUserId is required'
            });
            return;
        }

        const result = await signerService.createSessionSigner(privyUserId, expiryDays);

        res.status(200).json({
            success: true,
            message: 'Session signer created successfully',
            data: result.sessionSigner
        });
    } catch (error: any) {
        console.error('Error creating session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create session',
            error: error.message
        });
    }
});

// GET /api/wallet/session/status/:privyUserId
walletRouter.get('/session/status/:privyUserId', async (req: Request<{ privyUserId: string }>, res: Response): Promise<void> => {
    try {
        const { privyUserId } = req.params;

        const sessionInfo = await signerService.getSessionInfo(privyUserId);

        if (!sessionInfo) {
            res.status(404).json({
                success: false,
                message: 'No active session found'
            });
            return;
        }

        res.status(200).json({
            success: true,
            data: sessionInfo
        });
    } catch (error: any) {
        console.error('Error getting session status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get session status',
            error: error.message
        });
    }
});

// DELETE /api/wallet/session/:privyUserId
walletRouter.delete('/session/:privyUserId', async (req: Request<{ privyUserId: string }>, res: Response) => {
    try {
        const { privyUserId } = req.params;

        const result = await signerService.revokeSession(privyUserId);

        res.status(200).json(result);
    } catch (error: any) {
        console.error('Error revoking session:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to revoke session',
            error: error.message
        });
    }
});

export default walletRouter;
