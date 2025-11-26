import express from 'express';
import tradeService from '../services/trade.service.js';

const tradeRouter = express.Router();

// POST /api/trade/place
tradeRouter.post('/place', async (req, res) => {
    try {
        const { privyUserId, marketId, side, amount, outcome, marketData } = req.body;

        // Validation
        if (!privyUserId || !marketId || !amount || !outcome) {
            return res.status(400).json({
                success: false,
                message: 'Missing required parameters'
            });
        }

        if (amount < 1) {
            return res.status(400).json({
                success: false,
                message: 'Minimum bet amount is $1'
            });
        }

        if (amount > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Maximum bet amount is $1000'
            });
        }

        const result = await tradeService.executeTrade({
            privyUserId,
            marketId,
            side,
            amount,
            outcome,
            marketData
        });

        res.status(200).json({
            success: true,
            message: 'Trade placed successfully',
            data: result.trade
        });
    } catch (error) {
        console.error('Error placing trade:', error);
        
        const statusCode = error.message.includes('Insufficient') ? 400 : 500;
        
        res.status(statusCode).json({
            success: false,
            message: error.message || 'Failed to place trade',
            error: error.message
        });
    }
});

// GET /api/trade/history/:privyUserId
tradeRouter.get('/history/:privyUserId', async (req, res) => {
    try {
        const { privyUserId } = req.params;
        const { limit = 50, offset = 0 } = req.query;

        const result = await tradeService.getTradeHistory(
            privyUserId,
            parseInt(limit),
            parseInt(offset)
        );

        res.status(200).json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error getting trade history:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trade history',
            error: error.message
        });
    }
});

// GET /api/trade/:tradeId
tradeRouter.get('/:tradeId', async (req, res) => {
    try {
        const { tradeId } = req.params;

        const result = await tradeService.getTradeById(tradeId);

        res.status(200).json({
            success: true,
            data: result.trade
        });
    } catch (error) {
        console.error('Error getting trade:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get trade',
            error: error.message
        });
    }
});

export default tradeRouter;