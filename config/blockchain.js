import { ethers } from 'ethers';
import { 
    POLYGON_RPC_URL, 
    USDC_CONTRACT_ADDRESS,
    PRIVATE_KEY_OPERATOR 
} from './env.js';

// Polygon provider
export const provider = new ethers.JsonRpcProvider(POLYGON_RPC_URL);

// USDC ABI (minimal for balance checks)
const USDC_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
];

// USDC contract instance
export const usdcContract = new ethers.Contract(
    USDC_CONTRACT_ADDRESS,
    USDC_ABI,
    provider
);

// Operator wallet (for system operations if needed)
let operatorWallet = null;
if (PRIVATE_KEY_OPERATOR) {
    operatorWallet = new ethers.Wallet(PRIVATE_KEY_OPERATOR, provider);
}

export { operatorWallet };

// Helper functions
export const getBlockNumber = async () => {
    try {
        return await provider.getBlockNumber();
    } catch (error) {
        console.error('Error getting block number:', error);
        return null;
    }
};

export const getGasPrice = async () => {
    try {
        const gasPrice = await provider.getFeeData();
        return gasPrice.gasPrice;
    } catch (error) {
        console.error('Error getting gas price:', error);
        return null;
    }
};

// Format USDC amount (6 decimals)
export const formatUSDC = (amount) => {
    return ethers.formatUnits(amount, 6);
};

export const parseUSDC = (amount) => {
    return ethers.parseUnits(amount.toString(), 6);
};

// Format MATIC amount (18 decimals)
export const formatMATIC = (amount) => {
    return ethers.formatEther(amount);
};

export const parseMATIC = (amount) => {
    return ethers.parseEther(amount.toString());
};