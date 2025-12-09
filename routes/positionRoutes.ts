import express, { Request, Response, Router } from 'express';
import positionService from '../services/position.service.js';
import Position from '../models/Position.js';
import { ClosePositionRequestBody } from '../types/requests.js';

const positionRouter: Router = express.Router();

// Extended request body to match actual implementation
interface ClosePositionBody {
    closePrice: number;
    shares?: number;
}

// GET /api/positions/:privyUserId/open
positionRouter.get('/:privyUserId/open', async (req: Request<{ privyUserId: string }>, res: Response) => {
    try {
        const { privyUserId } = req.params;

        const result = await positionService.getOpenPositions(privyUserId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error: any) {
        console.error('Error getting open positions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get open positions',
            error: error.message
        });
    }
});

// GET /api/positions/:privyUserId/closed
positionRouter.get('/:privyUserId/closed', async (req: Request<{ privyUserId: string }>, res: Response) => {
    try {
        const { privyUserId } = req.params;

        const positions = await Position.find({
            privyUserId,
            status: 'CLOSED'
        }).sort({ closedAt: -1 }).lean();

        res.status(200).json({
            success: true,
            data: {
                positions,
                total: positions.length
            }
        });
    } catch (error: any) {
        console.error('Error getting closed positions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get closed positions',
            error: error.message
        });
    }
});

// PUT /api/positions/:positionId/close
positionRouter.put('/:positionId/close', async (req: Request<{ positionId: string }, {}, ClosePositionBody>, res: Response): Promise<void> => {
    try {
        const { positionId } = req.params;
        const { closePrice, shares } = req.body;

        if (!closePrice) {
            res.status(400).json({
                success: false,
                message: 'closePrice is required'
            });
            return;
        }

        const result = await positionService.closePosition(positionId, closePrice, shares);

        res.status(200).json({
            success: true,
            message: 'Position closed successfully',
            data: result
        });
    } catch (error: any) {
        console.error('Error closing position:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close position',
            error: error.message
        });
    }
});

export default positionRouter;
