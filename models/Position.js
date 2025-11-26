import mongoose from 'mongoose';

const positionSchema = new mongoose.Schema({
    privyUserId: {
        type: String,
        required: true,
        index: true
    },
    marketId: {
        type: String,
        required: true,
        index: true
    },
    conditionId: {
        type: String,
        required: true
    },
    tokenId: {
        type: String,
        required: true
    },
    side: {
        type: String,
        enum: ['YES', 'NO'],
        required: true
    },
    shares: {
        type: Number,
        required: true
    },
    avgEntryPrice: {
        type: Number,
        required: true
    },
    currentPrice: {
        type: Number,
        default: 0
    },
    unrealizedPnL: {
        type: Number,
        default: 0
    },
    realizedPnL: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED'],
        default: 'OPEN',
        index: true
    },
    
    // Market metadata for display
    marketTitle: {
        type: String,
        required: true
    },
    marketQuestion: {
        type: String,
        required: true
    },
    marketEndDate: {
        type: Date
    },
    marketImageUrl: {
        type: String
    },
    
    openedAt: {
        type: Date,
        default: Date.now
    },
    closedAt: {
        type: Date,
        default: null
    },
    
    // Additional tracking
    totalCost: {
        type: Number,
        required: true
    },
    fees: {
        type: Number,
        default: 0
    },
    lastPriceUpdate: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

// Compound indexes for efficient queries
positionSchema.index({ privyUserId: 1, status: 1 });
positionSchema.index({ marketId: 1, side: 1 });
positionSchema.index({ status: 1, lastPriceUpdate: 1 });

const Position = mongoose.model('Position', positionSchema);

export default Position;