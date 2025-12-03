import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    // Primary user id from Privy - used across the app
    privyUserId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    polygonWalletAddress: {
        type: String,
        unique: true,
        sparse: true
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
    },
    selectedCategories: [String],
    isOnboarded: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Useful indexes
userSchema.index({ privyUserId: 1 });
userSchema.index({ polygonWalletAddress: 1 });

const User = mongoose.model('User', userSchema);

export default User;
