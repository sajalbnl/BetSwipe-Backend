import { IUser, ITrade, IPosition } from './models.js';

// Standard API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Paginated Response
export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// User Responses
export interface UserResponse {
  user: IUser;
}

export interface UserBalanceResponse {
  privyUserId: string;
  usdcBalance: number;
  maticBalance: number;
  lastBalanceUpdate: Date;
}

// Wallet Responses
export interface WalletResponse {
  privyUserId: string;
  polygonWalletAddress: string;
  smartWalletAddress?: string;
  usdcBalance: number;
  maticBalance: number;
}

export interface SessionSignerResponse {
  sessionSignerAddress: string;
  sessionSignerExpiry: Date;
  privateKey?: string;
}

export interface SessionStatusResponse {
  hasActiveSigner: boolean;
  sessionSignerAddress?: string;
  sessionSignerExpiry?: Date;
  isExpired?: boolean;
}

// Trade Responses
export interface PlaceTradeResponse {
  trade: ITrade;
  orderId: string;
  status: string;
  message: string;
}

export interface TradeHistoryResponse extends PaginatedResponse<ITrade> {
  summary?: {
    totalTrades: number;
    totalVolume: number;
    pendingTrades: number;
  };
}

// Position Responses
export interface PositionResponse {
  position: IPosition;
}

export interface PositionsResponse {
  positions: IPosition[];
  summary?: {
    totalPositions: number;
    totalValue: number;
    totalUnrealizedPnL: number;
  };
}

// Category Responses
export interface CategoriesResponse {
  categories: string[];
}
