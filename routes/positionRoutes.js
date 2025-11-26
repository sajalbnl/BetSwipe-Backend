import express from 'express';
import positionService from '../services/position.service.js';
import Position from '../models/Position.js';

const positionRouter = express.Router();

// GET /api/positions/:privyUserId/open
positionRouter.get('/:privyUserId/open', async (req, res) => {
    try {
        const { privyUserId } = req.params;

        const result = await positionService.getOpenPositions(privyUserId);

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting open positions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get open positions',
            error: error.message
        });
    }
});

// GET /api/positions/:privyUserId/closed
positionRouter.get('/:privyUserId/closed', async (req, res) => {
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
    } catch (error) {
        console.error('Error getting closed positions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get closed positions',
            error: error.message
        });
    }
});

// PUT /api/positions/:positionId/close
positionRouter.put('/:positionId/close', async (req, res) => {
    try {
        const { positionId } = req.params;
        const { closePrice, shares } = req.body;

        if (!closePrice) {
            return res.status(400).json({
                success: false,
                message: 'closePrice is required'
            });
        }

        const result = await positionService.closePosition(positionId, closePrice, shares);

        res.status(200).json({
            success: true,
            message: 'Position closed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error closing position:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close position',
            error: error.message
        });
    }
});

export default positionRouter;