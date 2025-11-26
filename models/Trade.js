import mongoose from 'mongoose';

const tradeSchema = new mongoose.Schema({
    privyUserId: {
        type: String,
        required: true,
        index: true
    },
    positionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Position',
        default: null
    },
    marketId: {
        type: String,
        required: true,
        index: true
    },
    marketQuestion: {
        type: String,
        required: true
    },
    orderType: {
        type: String,
        enum: ['MARKET', 'LIMIT'],
        default: 'MARKET'
    },
    action: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    outcome: {
        type: String,
        enum: ['YES', 'NO'],
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    shares: {
        type: Number,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    
    // Polymarket specific
    orderId: {
        type: String,
        index: true
    },
    txHash: {
        type: String,
        default: null
    },
    nonce: {
        type: String
    },
    
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'FILLED', 'PARTIALLY_FILLED', 'FAILED', 'CANCELLED'],
        default: 'PENDING',
        index: true
    },
    
    filledAmount: {
        type: Number,
        default: 0
    },
    filledShares: {
        type: Number,
        default: 0
    },
    
    fees: {
        type: Number,
        default: 0
    },
    
    errorMessage: {
        type: String,
        default: null
    },
    
    executedAt: {
        type: Date,
        default: null
    },
    
    // For debugging
    requestPayload: {
        type: mongoose.Schema.Types.Mixed
    },
    responsePayload: {
        type: mongoose.Schema.Types.Mixed
    }
}, { timestamps: true });

// Indexes for efficient queries
tradeSchema.index({ privyUserId: 1, createdAt: -1 });
tradeSchema.index({ status: 1, createdAt: 1 });
tradeSchema.index({ orderId: 1 });
tradeSchema.index({ marketId: 1, outcome: 1 });

const Trade = mongoose.model('Trade', tradeSchema);

export default Trade;