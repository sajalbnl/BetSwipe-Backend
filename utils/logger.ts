import winston from 'winston';
import { NODE_ENV } from '../config/env.js';

// Define log levels
const levels = {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4,
};

// Define log colors
const colors = {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'white',
};

winston.addColors(colors);

// Define log format
const format = winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.colorize({ all: NODE_ENV === 'development' }),
    winston.format.printf(
        (info) => `${info.timestamp} ${info.level}: ${info.message}`
    )
);

// Define transports
const transports: winston.transport[] = [
    // Console transport
    new winston.transports.Console({
        format: NODE_ENV === 'development'
            ? winston.format.combine(winston.format.colorize(), format)
            : format,
    }),

    // Error log file
    new winston.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: winston.format.combine(
            winston.format.uncolorize(),
            format
        ),
    }),

    // Combined log file
    new winston.transports.File({
        filename: 'logs/combined.log',
        format: winston.format.combine(
            winston.format.uncolorize(),
            format
        ),
    }),
];

// Create logger instance
const logger = winston.createLogger({
    level: NODE_ENV === 'development' ? 'debug' : 'info',
    levels,
    format,
    transports,
    exitOnError: false, // Don't exit on handled exceptions
});

// Create stream for Morgan HTTP logger
interface LoggerStream {
    write: (message: string) => void;
}

(logger as any).stream = {
    write: (message: string) => logger.http(message.trim()),
} as LoggerStream;

export default logger;
