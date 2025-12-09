import { Request } from 'express';
import { TradeAction, TradeOutcome, TradeOrderType } from './models.js';

// Extended Request with user data
export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    [key: string]: any;
  };
}

// User Request Bodies
export interface RegisterUserRequestBody {
  privyUserId: string;
  polygonWalletAddress?: string;
  smartWalletAddress?: string;
}

export interface UpdateUserRequestBody {
  polygonWalletAddress?: string;
  smartWalletAddress?: string;
  selectedCategories?: string[];
  isOnboarded?: boolean;
}

// Wallet Request Bodies
export interface CreateWalletRequestBody {
  privyUserId: string;
}

export interface CreateSessionSignerRequestBody {
  privyUserId: string;
  expiryDays?: number;
}

// Trade Request Bodies
export interface PlaceTradeRequestBody {
  privyUserId: string;
  marketId: string;
  marketQuestion: string;
  action: TradeAction;
  outcome: TradeOutcome;
  amount: number;
  orderType?: TradeOrderType;
  price?: number;
}

// Position Request Bodies
export interface ClosePositionRequestBody {
  shares?: number;
}

// Category Request Bodies
export interface SaveCategoriesRequestBody {
  categories: string[];
}

// Query Parameters
export interface PaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface TradeHistoryQuery extends PaginationQuery {
  status?: string;
  marketId?: string;
  action?: string;
  outcome?: string;
}
