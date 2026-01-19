export type OrderType = 'MARKET' | 'LIMIT' | 'SNIPER';
export type OrderStatus =  'pending' | 'routing' | 'building' | 'submitted' | 'confirmed' | 'failed';

export interface OrderRequest{
  type: OrderType;
  tokenIn: string;
  tokenOut: string;
  amount: number;
}

export interface DexQuote{
  dex: 'Raydium'|'Meteora';
  price: number;
  fee: number;
}