import { Queue, Worker } from 'bullmq';
import { Redis } from 'ioredis';
import { db } from './db.js';
import { MockDexRouter } from './dexRouter.js';
import { CONFIG } from './config.js';

// Redis Config
const isCloudRedis = CONFIG.REDIS_URL.includes('upstash');

const redisOptions = {
  maxRetriesPerRequest: null, // Required by BullMQ
  family: 4, // <--- THIS IS THE FIX (Forces IPv4)
  tls: isCloudRedis ? { rejectUnauthorized: false } : undefined,
  retryStrategy: (times: number) => Math.min(times * 50, 2000),
};

// 1. Create Connection for Queue (Producer)
// We pass the URL *and* the options object merged
const connection = new Redis(CONFIG.REDIS_URL, redisOptions);

connection.on('connect', () => console.log('✅ Redis Queue Connected!'));
connection.on('error', (err) => console.error('❌ Redis Error:', err.message));

// 2. PubSub for WebSocket updates
const pubSub = new Redis(CONFIG.REDIS_URL, redisOptions);

export const orderQueue = new Queue('order-execution', {
  connection: connection as any,
});

const dexRouter = new MockDexRouter();

const updateStatus = async (orderId: string, status: string, data: any = {}) => {
  console.log(`[Order ${orderId}] ${status}`);
  
  // Update DB
  await db.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
  
  // Publish to Redis
  await pubSub.publish(`updates:${orderId}`, JSON.stringify({ orderId, status, ...data }));
};

// 3. Worker
new Worker('order-execution', async (job) => {
  const { orderId, amount } = job.data;

  try {
    await updateStatus(orderId, 'routing');
    
    const [raydium, meteora] = await Promise.all([
      dexRouter.getRaydiumQuote(amount),
      dexRouter.getMeteoraQuote(amount)
    ]);
    const bestRoute = raydium.price < meteora.price ? raydium : meteora;
    
    await updateStatus(orderId, 'building', { route: bestRoute.dex, price: bestRoute.price });
    await new Promise(r => setTimeout(r, 500)); 

    await updateStatus(orderId, 'submitted');
    
    const txHash = await dexRouter.executeSwap(bestRoute.dex);
    
    await updateStatus(orderId, 'confirmed', { txHash });
    await db.query('UPDATE orders SET tx_hash = $1 WHERE id = $2', [txHash, orderId]);

  } catch (error: any) {
    await updateStatus(orderId, 'failed', { error: error.message });
  }
}, { 
  connection: connection as any, 
  concurrency: 10 
});