import UserWallet from '../models/UserWallet.js';
import { provider, usdcContract, formatUSDC } from '../config/blockchain.js';
import logger from '../utils/logger.js';
import { ethers } from 'ethers';

class DepositDetector {
    constructor() {
        this.isRunning = false;
        this.lastBlockChecked = null;
        this.blockConfirmations = 3; // Wait for 3 block confirmations
    }

    /**
     * Initialize listener
     */
    async initialize() {
        try {
            // Get current block number
            this.lastBlockChecked = await provider.getBlockNumber();
            logger.info(`Deposit detector initialized at block ${this.lastBlockChecked}`);
        } catch (error) {
            logger.error('Failed to initialize deposit detector:', error);
            throw error;
        }
    }

    /**
     * Main job execution
     */
    async execute() {
        if (this.isRunning) {
            logger.debug('Deposit detector already running, skipping...');
            return;
        }

        if (!this.lastBlockChecked) {
            await this.initialize();
        }

        this.isRunning = true;

        try {
            const currentBlock = await provider.getBlockNumber();
            const fromBlock = this.lastBlockChecked + 1;
            const toBlock = currentBlock - this.blockConfirmations;

            if (fromBlock > toBlock) {
                logger.debug('No new blocks to check for deposits');
                return;
            }

            logger.debug(`Checking blocks ${fromBlock} to ${toBlock} for deposits`);

            // Get all wallet addresses
            const wallets = await UserWallet.find({ isActive: true })
                .select('polygonWalletAddress privyUserId')
                .lean();

            if (wallets.length === 0) {
                this.lastBlockChecked = toBlock;
                return;
            }

            // Create address to userId map
            const addressMap = {};
            wallets.forEach(w => {
                addressMap[w.polygonWalletAddress.toLowerCase()] = w.privyUserId;
            });

            // Check for USDC transfer events
            const deposits = await this.detectUSDCDeposits(
                fromBlock,
                toBlock,
                Object.keys(addressMap)
            );

            // Process deposits
            if (deposits.length > 0) {
                await this.processDeposits(deposits, addressMap);
            }

            // Update last checked block
            this.lastBlockChecked = toBlock;

            return {
                success: true,
                blocksChecked: toBlock - fromBlock + 1,
                depositsFound: deposits.length
            };
        } catch (error) {
            logger.error('Deposit detector error:', error);
            throw error;
        } finally {
            this.isRunning = false;
        }
    }

    /**
     * Detect USDC deposits
     */
    async detectUSDCDeposits(fromBlock, toBlock, addresses) {
        try {
            // USDC Transfer event signature
            const transferEventSignature = 'Transfer(address,address,uint256)';
            
            // Create filter for incoming transfers
            const filter = {
                address: usdcContract.address,
                topics: [
                    ethers.utils.id(transferEventSignature),
                    null, // from any address
                    addresses.map(addr => ethers.utils.hexZeroPad(addr, 32)) // to our addresses
                ],
                fromBlock,
                toBlock
            };

            // Get logs
            const logs = await provider.getLogs(filter);
            
            // Parse logs
            const deposits = logs.map(log => {
                const parsedLog = usdcContract.interface.parseLog(log);
                return {
                    from: parsedLog.args[0],
                    to: parsedLog.args[1].toLowerCase(),
                    amount: formatUSDC(parsedLog.args[2]),
                    txHash: log.transactionHash,
                    blockNumber: log.blockNumber
                };
            });

            logger.info(`Found ${deposits.length} USDC deposits`);
            return deposits;
        } catch (error) {
            logger.error('Error detecting USDC deposits:', error);
            return [];
        }
    }

    /**
     * Process detected deposits
     */
    async processDeposits(deposits, addressMap) {
        const updatePromises = deposits.map(async (deposit) => {
            try {
                const privyUserId = addressMap[deposit.to];
                if (!privyUserId) {
                    logger.warn(`No user found for address ${deposit.to}`);
                    return;
                }

                // Update wallet balance
                const wallet = await UserWallet.findOne({ privyUserId });
                if (wallet) {
                    const oldBalance = wallet.usdcBalance;
                    wallet.usdcBalance += parseFloat(deposit.amount);
                    wallet.lastBalanceUpdate = new Date();
                    await wallet.save();

                    logger.info(`Deposit detected for user ${privyUserId}:`, {
                        amount: deposit.amount,
                        txHash: deposit.txHash,
                        oldBalance,
                        newBalance: wallet.usdcBalance
                    });

                    // TODO: Send notification to user
                    // TODO: Emit websocket event for real-time update
                }
            } catch (error) {
                logger.error(`Error processing deposit for ${deposit.to}:`, error);
            }
        });

        await Promise.all(updatePromises);
    }

    /**
     * Setup real-time listener (alternative approach)
     */
    setupRealtimeListener() {
        // Listen for Transfer events in real-time
        usdcContract.on('Transfer', async (from, to, value, ) => {
            try {
                const wallet = await UserWallet.findOne({ 
                    polygonWalletAddress: to.toLowerCase() 
                });

                if (wallet) {
                    const amount = formatUSDC(value);
                    logger.info(`Real-time deposit detected for ${wallet.privyUserId}: ${amount} USDC`);
                    
                    // Update balance
                    wallet.usdcBalance += parseFloat(amount);
                    await wallet.save();

                    // TODO: Emit websocket event
                }
            } catch (error) {
                logger.error('Error processing real-time deposit:', error);
            }
        });

        logger.info('Real-time deposit listener setup complete');
    }
}

export default new DepositDetector();