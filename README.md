# Order Execution Engine (Mock DEX Router)

This project is a backend engine that routes cryptocurrency orders to the best decentralized exchange (DEX). It uses a mock routing system to simulate real trading. It is built with **Node.js, Fastify, BullMQ (Redis), and PostgreSQL**.

---

## How It Works

### Design Choice: Market Orders
I chose Market Orders for this project because they show the main function of a DEX router: finding the best price immediately. The system compares quotes from two sources (Raydium and Meteora) and picks the best one.

### System Flow
1.  **API:** The server receives the order and saves it to the database with a "pending" status.
2.  **Queue:** The order is added to a Redis queue. This prevents the server from crashing if too many orders come in at once.
3.  **Worker:** A background worker takes the order, checks prices on the mock DEXs, and executes the trade.
4.  **Updates:** As the worker processes the order, it sends status updates (routing, submitted, confirmed) to the client in real-time using WebSockets.

---

## Tech Stack

* **Language:** Node.js (TypeScript)
* **Server:** Fastify
* **Queue:** BullMQ and Redis
* **Database:** PostgreSQL

---

## Setup Instructions

### 1. Prerequisites
You need Node.js installed. You also need access to Redis and PostgreSQL (either running locally or in the cloud).

### 2. Installation
Run these commands in your terminal:

```bash
git clone https://github.com/MethHead29/order-engine.git
cd order-engine
npm install
