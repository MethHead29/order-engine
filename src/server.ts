import Fastify from 'fastify';
import websocket from '@fastify/websocket';
import { randomUUID } from 'crypto';
import {Redis} from 'ioredis';
import { orderQueue } from './queue.js';
import { db, initDB } from './db.js';
import { OrderRequest } from './types.js';
import { CONFIG } from './config.js';

const fastify = Fastify({ logger: true });
fastify.register(websocket);

// Redis Subscriber
const isCloudRedis = CONFIG.REDIS_URL.includes('upstash');
const redisSub = new Redis(CONFIG.REDIS_URL, {
  tls: isCloudRedis ? { rejectUnauthorized: false } : undefined
});

fastify.post<{ Body: OrderRequest }>('/api/orders/execute', async (req, reply) => {
  const { type, tokenIn, tokenOut, amount } = req.body;
  const orderId = randomUUID();

  await db.query(
    'INSERT INTO orders (id, type, token_in, token_out, amount, status) VALUES ($1, $2, $3, $4, $5, $6)',
    [orderId, type, tokenIn, tokenOut, amount, 'pending']
  );

  await orderQueue.add('execute-order', { orderId, type, amount });

  return { orderId, status: 'pending', message: 'Order queued' };
});

fastify.register(async (f) => {
  f.get('/ws/orders/:orderId', { websocket: true }, (connection, req) => {
    // @ts-ignore
    const { orderId } = req.params;
    const channel = `updates:${orderId}`;
    
    const subClient = redisSub.duplicate(); // Create distinct client for sub
    subClient.subscribe(channel);

    subClient.on('message', (chn, msg) => {
      if (chn === channel) connection.send(msg);
    });

    connection.on('close', () => subClient.disconnect());
  });
});

const start = async () => {
  await initDB();
  try {
    await fastify.listen({ port: Number(CONFIG.PORT), host: '0.0.0.0' });
    console.log(`Server running on port ${CONFIG.PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();