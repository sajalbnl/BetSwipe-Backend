import cron from 'node-cron';
import walletService from '../services/wallet.service.js';
import positionService from '../services/position.service.js';
import tradeService from '../services/trade.service.js';

class JobScheduler {
    constructor() {
        this.jobs = [];
    }

    /**
     * Initialize all jobs
     */
    initialize() {
        console.log('Initializing background jobs...');

        // Update balances every 60 seconds
        this.jobs.push(
            cron.schedule('*/60 * * * * *', async () => {
                try {
                    await walletService.updateAllBalances();
                } catch (error) {
                    console.error('Balance sync job error:', error);
                }
            }, {
                scheduled: false
            })
        );

        // Update position prices every 30 seconds
        this.jobs.push(
            cron.schedule('*/30 * * * * *', async () => {
                try {
                    await positionService.updatePositionPrices();
                } catch (error) {
                    console.error('Position update job error:', error);
                }
            }, {
                scheduled: false
            })
        );

        // Sync pending trades every 15 seconds
        this.jobs.push(
            cron.schedule('*/15 * * * * *', async () => {
                try {
                    await tradeService.syncPendingTrades();
                } catch (error) {
                    console.error('Trade sync job error:', error);
                }
            }, {
                scheduled: false
            })
        );

        console.log(`${this.jobs.length} jobs initialized`);
    }

    /**
     * Start all jobs
     */
    start() {
        this.jobs.forEach(job => job.start());
        console.log('Background jobs started');
    }

    /**
     * Stop all jobs
     */
    stop() {
        this.jobs.forEach(job => job.stop());
        console.log('Background jobs stopped');
    }
}

export default new JobScheduler();