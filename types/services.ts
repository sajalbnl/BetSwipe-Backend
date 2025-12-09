import { IUser, ITrade, IPosition } from './models.js';
import { Contract, Wallet, JsonRpcProvider } from 'ethers';

// Blockchain Types
export interface BlockchainConfig {
  provider: JsonRpcProvider;
  usdcContract: Contract;
  chainId: number;
}


// Polymarket Types
export interface PolymarketOrder {
  marketId: string;
  side: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  amount: number;
  price?: number;
  orderType: 'MARKET' | 'LIMIT';
}

export interface PolymarketOrderResponse {
  orderId: string;
  status: string;
  transactionHash?: string;
  nonce?: string;
  errorCode?: string;
  errorMsg?: string;
}

export interface MarketPrice {
  bid: number;
  ask: number;
  mid: number;
}

// Service Response Types
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// User Service Types
export interface CreateUserData {
  privyUserId: string;
  eoaAddress?: string;
  smartWalletAddress?: string;
}

export interface UpdateUserData {
  eoaAddress?: string;
  smartWalletAddress?: string;
  selectedCategories?: string[];
  isOnboarded?: boolean;
  totalTrades?: number;
  totalVolume?: number;
}

// Wallet Service Types
export interface CreateWalletResult {
  user: IUser;
  walletAddress: string;
  privateKey?: string;
}

export interface SessionSignerResult {
  sessionSignerAddress: string;
  sessionSignerPrivateKey: string;
  sessionSignerExpiry: Date;
}

// Trade Service Types
export interface PlaceTradeData {
  privyUserId: string;
  marketId: string;
  marketQuestion: string;
  action: 'BUY' | 'SELL';
  outcome: 'YES' | 'NO';
  amount: number;
  orderType?: 'MARKET' | 'LIMIT';
  price?: number;
}

export interface TradeResult {
  trade: ITrade;
  orderId: string;
  status: string;
}

// Position Service Types
export interface CreatePositionData {
  privyUserId: string;
  marketId: string;
  conditionId: string;
  tokenId: string;
  side: 'YES' | 'NO';
  shares: number;
  avgEntryPrice: number;
  totalCost: number;
  fees: number;
  marketTitle: string;
  marketQuestion: string;
  marketEndDate?: Date;
  marketImageUrl?: string;
}

export interface UpdatePositionData {
  shares?: number;
  avgEntryPrice?: number;
  currentPrice?: number;
  unrealizedPnL?: number;
  realizedPnL?: number;
  fees?: number;
  status?: 'OPEN' | 'CLOSED';
  closedAt?: Date;
}

// Job Types
export interface JobResult {
  success: boolean;
  message: string;
  processed?: number;
  failed?: number;
  errors?: string[];
}

export interface BalanceSyncResult extends JobResult {
  updatedUsers: number;
}

export interface TradeMonitorResult extends JobResult {
  checkedTrades: number;
  updatedTrades: number;
}

export interface PositionUpdateResult extends JobResult {
  updatedPositions: number;
}

export interface DepositDetectionResult extends JobResult {
  depositsDetected: number;
  usersUpdated: number;
}
