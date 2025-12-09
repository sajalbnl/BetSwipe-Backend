import { Request, Response, NextFunction } from 'express';

/**
 * Validate trade parameters
 */
export const validateTrade = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { marketId, amount, outcome } = req.body;
  const errors: string[] = [];

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
    res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors
    });
    return;
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
export const validateWalletAddress = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { address } = req.body;

  if (!address) {
    res.status(400).json({
      success: false,
      message: 'address is required'
    });
    return;
  }

  // Check if valid Ethereum address
  const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
  if (!ethAddressRegex.test(address)) {
    res.status(400).json({
      success: false,
      message: 'Invalid Ethereum address'
    });
    return;
  }

  req.body.address = address.toLowerCase();
  next();
};

/**
 * Validate pagination parameters
 */
export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let { limit = '50', offset = '0' } = req.query;

  // Convert to numbers
  let limitNum = parseInt(limit as string);
  let offsetNum = parseInt(offset as string);

  // Validate
  if (isNaN(limitNum) || limitNum < 1) limitNum = 50;
  if (isNaN(offsetNum) || offsetNum < 0) offsetNum = 0;
  if (limitNum > 100) limitNum = 100; // Max limit

  req.query.limit = limitNum.toString();
  req.query.offset = offsetNum.toString();

  next();
};

/**
 * Sanitize user input
 */
export const sanitizeInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Recursively sanitize object
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      // Remove any HTML tags
      return obj.replace(/<[^>]*>/g, '').trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === 'object') {
      const sanitized: Record<string, any> = {};
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
