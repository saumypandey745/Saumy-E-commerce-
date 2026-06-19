// shared/eventBus.js
// Mock event bus for development and CI testing.
// It mimics a subset of the amqplib Channel API used by services.
// To support cross-process publish/subscribe (e.g. for e2e tests), it uses Redis under the hood.

const { createClient } = require('redis');

class MockBroker {
  constructor() {
    this.queues = new Map(); // queueName -> Set of handlers
    this.routingKeys = new Map(); // queueName -> routingKey bound
    this.redisPublisher = createClient({ url: process.env.REDIS_URL || 'redis://localhost:6379' });
    this.redisSubscriber = this.redisPublisher.duplicate();
    this.connected = false;
  }

  async connect() {
    if (this.connected) return;
    if (this.connectPromise) {
      return this.connectPromise;
    }
    this.connectPromise = (async () => {
      try {
        if (!this.redisPublisher.isOpen) await this.redisPublisher.connect();
        if (!this.redisSubscriber.isOpen) await this.redisSubscriber.connect();
        this.connected = true;
      } catch (e) {
        console.warn('[MockBroker] Failed to connect to Redis. Mock will only work in-process.', e.message);
      }
    })();
    return this.connectPromise;
  }

  async assertQueue(queue, options) {
    if (!this.queues.has(queue)) {
      this.queues.set(queue, new Set());
    }
    return { queue, ...options };
  }

  async bindQueue(queue, exchange, routingKey) {
    await this.connect();
    if (!this.routingKeys.has(queue)) {
      this.routingKeys.set(queue, new Set());
    }
    this.routingKeys.get(queue).add(routingKey);

    if (this.connected) {
      try {
        const redisPattern = routingKey === '#' ? '*' : routingKey;
        await this.redisSubscriber.pSubscribe(redisPattern, (message, channel) => {
          console.log(`[MockBroker] Redis Received on ${channel} (pattern: ${redisPattern})`);
          for (const [q, rKeys] of this.routingKeys.entries()) {
            if (rKeys.has(channel) || rKeys.has('#')) {
              const handlers = this.queues.get(q);
              if (handlers) {
                const fakeMsg = { 
                  content: Buffer.from(message),
                  fields: { routingKey: channel }
                };
                handlers.forEach(h => h(fakeMsg, channel));
              }
            }
          }
        });
        console.log(`[MockBroker] pSubscribed to ${redisPattern} for queue ${queue}`);
      } catch (e) {
        console.warn('[MockBroker] Failed to subscribe to Redis', e.message);
      }
    }
  }

  async consume(queue, onMessage) {
    if (!this.queues.has(queue)) {
      this.queues.set(queue, new Set());
    }
    this.queues.get(queue).add((msg, routingKey) => {
      onMessage(msg);
    });
    return { consumerTag: `mock-${queue}` };
  }

  publish(exchange, routingKey, buffer, options) {
    const payload = buffer.toString();
    console.log(`[MockBroker] Publishing to ${routingKey}`);
    
    const doPublish = async () => {
      await this.connect();
      if (this.connected) {
        this.redisPublisher.publish(routingKey, payload).catch((e) => {
            console.error('[MockBroker] Redis publish error', e);
        });
      } else {
        // In-process fallback
        for (const [queue, rKeys] of this.routingKeys.entries()) {
          if (rKeys.has(routingKey) || rKeys.has('#')) {
            const handlers = this.queues.get(queue);
            if (handlers) {
              const fakeMsg = { 
                content: Buffer.from(payload),
                fields: { routingKey: routingKey }
              };
              handlers.forEach(h => h(fakeMsg, routingKey));
            }
          }
        }
      }
    };
    doPublish();
    return true;
  }

  ack() {}
  nack() {}
}

const broker = new MockBroker();
// Connect asynchronously to not block require()
broker.connect().catch(() => {});

module.exports = broker;
