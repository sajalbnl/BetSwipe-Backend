import cron, { ScheduledTask } from 'node-cron';
import balanceSync from './balanceSync.js';
import positionUpdater from './positionUpdater.js';
import tradeMonitor from './tradeMonitor.js';
import depositDetector from './depositDetector.js';
import logger from '../utils/logger.js';
import { JobResult } from '../types/services.js';

interface JobConfig {
    name: string;
    schedule: string;
    handler: () => Promise<JobResult | void>;
    instance: ScheduledTask | null;
}

interface JobStatus {
    name: string;
    schedule: string;
    running: boolean;
}

class JobScheduler {
    private jobs: Map<string, JobConfig>;
    private isRunning: boolean;

    constructor() {
        this.jobs = new Map();
        this.isRunning = false;
    }

    /**
     * Initialize all jobs
     */
    initialize(): void {
        logger.info('Initializing background jobs...');

        // Balance sync - every 60 seconds
        this.jobs.set('balanceSync', {
            name: 'Balance Sync',
            schedule: '*/60 * * * * *',
            handler: () => balanceSync.execute(),
            instance: null
        });

        // Position updater - every 30 seconds
        this.jobs.set('positionUpdater', {
            name: 'Position Updater',
            schedule: '*/30 * * * * *',
            handler: () => positionUpdater.execute(),
            instance: null
        });

        // Trade monitor - every 15 seconds
        this.jobs.set('tradeMonitor', {
            name: 'Trade Monitor',
            schedule: '*/15 * * * * *',
            handler: () => tradeMonitor.execute(),
            instance: null
        });

        // Deposit detector - every 30 seconds
        this.jobs.set('depositDetector', {
            name: 'Deposit Detector',
            schedule: '*/30 * * * * *',
            handler: () => depositDetector.execute(),
            instance: null
        });

        // Create cron instances
        this.jobs.forEach((job) => {
            job.instance = cron.schedule(job.schedule, async () => {
                try {
                    logger.debug(`Running job: ${job.name}`);
                    await job.handler();
                } catch (error) {
                    logger.error(`Job ${job.name} failed:`, error);
                }
            });
        });

        logger.info(`${this.jobs.size} jobs initialized`);
    }

    /**
     * Start all jobs
     */
    start(): void {
        if (this.isRunning) {
            logger.warn('Jobs are already running');
            return;
        }

        this.jobs.forEach((job) => {
            if (job.instance) {
                job.instance.start();
                logger.info(`Started job: ${job.name}`);
            }
        });

        this.isRunning = true;
        logger.info('All background jobs started');
    }

    /**
     * Stop all jobs
     */
    stop(): void {
        this.jobs.forEach((job) => {
            if (job.instance) {
                job.instance.stop();
                logger.info(`Stopped job: ${job.name}`);
            }
        });

        this.isRunning = false;
        logger.info('All background jobs stopped');
    }

    /**
     * Run a specific job manually
     */
    async runJob(jobName: string): Promise<JobResult | void> {
        const job = this.jobs.get(jobName);
        if (!job) {
            throw new Error(`Job ${jobName} not found`);
        }

        logger.info(`Manually running job: ${job.name}`);
        return await job.handler();
    }

    /**
     * Get job status
     */
    getStatus(): Record<string, JobStatus> {
        const status: Record<string, JobStatus> = {};
        this.jobs.forEach((job, key) => {
            status[key] = {
                name: job.name,
                schedule: job.schedule,
                running: this.isRunning
            };
        });
        return status;
    }
}

export default new JobScheduler();
