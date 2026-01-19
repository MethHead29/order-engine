import type {DexQuote} from './types.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockDexRouter {
  async getRaydiumQuote(amount: number): Promise<DexQuote> {
    await sleep(200); 
    const price = 100 * (0.98 + Math.random() * 0.04);
    return { dex: 'Raydium', price, fee: 0.003 };
  }

  async getMeteoraQuote(amount: number): Promise<DexQuote> {
    await sleep(200);
    const price = 100 * (0.97 + Math.random() * 0.05);
    return { dex: 'Meteora', price, fee: 0.002 };
  }

  async executeSwap(dex: string): Promise<string> {
    await sleep(2000); 
    return Math.random().toString(36).substring(7);
  }
}