const broker = require('../eventBus');

describe('InMemoryBroker', () => {
  beforeEach(() => {
    // Clear listeners before each test
    broker.removeAllListeners();
    broker.queues.clear();
  });

  it('should assert a queue', async () => {
    const q = await broker.assertQueue('test_queue', { durable: true });
    expect(q.queue).toBe('test_queue');
    expect(q.durable).toBe(true);
    expect(broker.queues.has('test_queue')).toBe(true);
  });

  it('should bind a queue to a routing key and consume messages', async () => {
    await broker.assertQueue('test_queue', {});
    await broker.bindQueue('test_queue', 'test_exchange', 'test.event');

    let receivedMsg = null;
    await broker.consume('test_queue', (msg) => {
      receivedMsg = JSON.parse(msg.content.toString());
      broker.ack(msg);
    });

    const payload = { data: 'hello' };
    broker.publish('test_exchange', 'test.event', Buffer.from(JSON.stringify(payload)));

    expect(receivedMsg).not.toBeNull();
    expect(receivedMsg.data).toBe('hello');
  });

  it('should broadcast message to multiple consumers on different queues if bound to same routing key', async () => {
    await broker.assertQueue('q1', {});
    await broker.assertQueue('q2', {});

    await broker.bindQueue('q1', 'test_exchange', 'test.broadcast');
    await broker.bindQueue('q2', 'test_exchange', 'test.broadcast');

    let count1 = 0;
    let count2 = 0;

    await broker.consume('q1', () => { count1++; });
    await broker.consume('q2', () => { count2++; });

    broker.publish('test_exchange', 'test.broadcast', Buffer.from(JSON.stringify({ ok: 1 })));

    expect(count1).toBe(1);
    expect(count2).toBe(1);
  });
});
