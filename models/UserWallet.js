import mongoose from 'mongoose';

const userWalletSchema = new mongoose.Schema({
    privyUserId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    polygonWalletAddress: {
        type: String,
        required: true,
        unique: true
    },
    sessionSignerAddress: {
        type: String,
        default: null
    },
    sessionSignerEncrypted: {
        type: String,
        default: null
    },
    sessionSignerExpiry: {
        type: Date,
        default: null
    },
    usdcBalance: {
        type: Number,
        default: 0
    },
    maticBalance: {
        type: Number,
        default: 0
    },
    totalTrades: {
        type: Number,
        default: 0
    },
    totalVolume: {
        type: Number,
        default: 0
    },
    lastBalanceUpdate: {
        type: Date,
        default: Date.now
    },
    depositAddress: {
        type: String
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Indexes for efficient queries
userWalletSchema.index({ privyUserId: 1 });
userWalletSchema.index({ polygonWalletAddress: 1 });
userWalletSchema.index({ lastBalanceUpdate: 1 });

const UserWallet = mongoose.model('UserWallet', userWalletSchema);

export default UserWallet;