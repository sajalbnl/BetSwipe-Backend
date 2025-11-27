
/**
 * Validate trade parameters
 */
export const validateTrade = (req, res, next) => {
    const { marketId, amount, outcome } = req.body;
    const errors = [];

    // Check required fields
    if (!marketId) errors.push('marketId is required');
    if (!amount) errors.push('amount is required');
    if (!outcome) errors.push('outcome is required');

    // Validate amount
    if (amount && typeof amount !== 'number') {
        errors.push('amount must be a number');
    } else if (amount) {
        if (amount < 1) errors.push('Minimum bet amount is $1');
        if (amount > 1000) errors.push('Maximum bet amount is $1000');
        
        // Check decimal places (max 2)
        if (amount.toString().includes('.')) {
            const decimals = amount.toString().split('.')[1].length;
            if (decimals > 2) errors.push('Amount can have maximum 2 decimal places');
        }
    }

    // Validate outcome
    if (outcome && !['YES', 'NO'].includes(outcome)) {
        errors.push('outcome must be YES or NO');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors
        });
    }

    // Sanitize inputs
    req.body.amount = parseFloat(amount.toFixed(2));
    req.body.outcome = outcome.toUpperCase();
    req.body.marketId = marketId.trim();

    next();
};

/**
 * Validate wallet address
 */
export const validateWalletAddress = (req, res, next) => {
    const { address } = req.body;

    if (!address) {
        return res.status(400).json({
            success: false,
            message: 'address is required'
        });
    }

    // Check if valid Ethereum address
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(address)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid Ethereum address'
        });
    }

    req.body.address = address.toLowerCase();
    next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (req, res, next) => {
    let { limit = 50, offset = 0 } = req.query;

    // Convert to numbers
    limit = parseInt(limit);
    offset = parseInt(offset);

    // Validate
    if (isNaN(limit) || limit < 1) limit = 50;
    if (isNaN(offset) || offset < 0) offset = 0;
    if (limit > 100) limit = 100; // Max limit

    req.query.limit = limit;
    req.query.offset = offset;

    next();
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (req, res, next) => {
    // Recursively sanitize object
    const sanitize = (obj) => {
        if (typeof obj === 'string') {
            // Remove any HTML tags
            return obj.replace(/<[^>]*>/g, '').trim();
        } else if (Array.isArray(obj)) {
            return obj.map(sanitize);
        } else if (obj && typeof obj === 'object') {
            const sanitized = {};
            for (const key in obj) {
                sanitized[key] = sanitize(obj[key]);
            }
            return sanitized;
        }
        return obj;
    };

    req.body = sanitize(req.body);
    req.query = sanitize(req.query);
    req.params = sanitize(req.params);

    next();
};