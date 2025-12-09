import { Document, Types } from 'mongoose';

// User Model Types
export interface IUser extends Document {
  _id: Types.ObjectId;
  privyUserId: string;
  polygonWalletAddress?: string;
  smartWalletAddress?: string;
  sessionSignerAddress?: string | null;
  sessionSignerEncrypted?: string | null;
  sessionSignerExpiry?: Date | null;
  usdcBalance: number;
  maticBalance: number;
  totalTrades: number;
  totalVolume: number;
  lastBalanceUpdate: Date;
  depositAddress?: string;
  isActive: boolean;
  selectedCategories: string[];
  isOnboarded: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Trade Model Types
export type TradeOrderType = 'MARKET' | 'LIMIT';
export type TradeAction = 'BUY' | 'SELL';
export type TradeOutcome = 'YES' | 'NO';
export type TradeStatus = 'PENDING' | 'CONFIRMED' | 'FILLED' | 'PARTIALLY_FILLED' | 'FAILED' | 'CANCELLED';

export interface ITrade extends Document {
  _id: Types.ObjectId;
  privyUserId: string;
  positionId?: Types.ObjectId | null;
  marketId: string;
  marketQuestion: string;
  orderType: TradeOrderType;
  action: TradeAction;
  outcome: TradeOutcome;
  amount: number;
  shares: number;
  price: number;
  orderId?: string;
  txHash?: string | null;
  nonce?: string;
  status: TradeStatus;
  filledAmount: number;
  filledShares: number;
  fees: number;
  errorMessage?: string | null;
  executedAt?: Date | null;
  requestPayload?: any;
  responsePayload?: any;
  createdAt: Date;
  updatedAt: Date;
}

// Position Model Types
export type PositionSide = 'YES' | 'NO';
export type PositionStatus = 'OPEN' | 'CLOSED';

export interface IPosition extends Document {
  _id: Types.ObjectId;
  privyUserId: string;
  marketId: string;
  conditionId: string;
  tokenId: string;
  side: PositionSide;
  shares: number;
  avgEntryPrice: number;
  currentPrice: number;
  unrealizedPnL: number;
  realizedPnL: number;
  status: PositionStatus;
  marketTitle: string;
  marketQuestion: string;
  marketEndDate?: Date;
  marketImageUrl?: string;
  openedAt: Date;
  closedAt?: Date | null;
  totalCost: number;
  fees: number;
  lastPriceUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}
