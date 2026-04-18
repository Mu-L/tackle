/**
 * Unit tests for EventBus
 * Run with: node --test test/runtime/test-event-bus.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const EventBus = require('../../plugins/runtime/event-bus');

test.describe('EventBus - Basic Operations', () => {
  test('on() should register event handlers', () => {
    const bus = new EventBus();
    let called = false;
    const handler = () => { called = true; };

    bus.on('test', handler);
    bus.emit('test');

    assert.strictEqual(called, true, 'handler was called');
  });

  test('on() should return subscription with unsubscribe()', () => {
    const bus = new EventBus();
    let callCount = 0;
    const handler = () => { callCount++; };

    const sub = bus.on('test', handler);
    bus.emit('test');
    assert.strictEqual(callCount, 1, 'handler called once');

    sub.unsubscribe();
    bus.emit('test');
    assert.strictEqual(callCount, 1, 'handler not called after unsubscribe');
  });

  test('off() should unregister specific handlers', () => {
    const bus = new EventBus();
    let callCount = 0;
    const handler = () => { callCount++; };

    bus.on('test', handler);
    bus.emit('test');
    assert.strictEqual(callCount, 1, 'handler called first time');

    bus.off('test', handler);
    bus.emit('test');
    assert.strictEqual(callCount, 1, 'handler not called after off');
  });

  test('once() should register one-time handlers', () => {
    const bus = new EventBus();
    let callCount = 0;
    const handler = () => { callCount++; };

    bus.once('test', handler);
    bus.emit('test');
    bus.emit('test');

    assert.strictEqual(callCount, 1, 'handler called only once');
  });

  test('emit() should pass data to handlers', () => {
    const bus = new EventBus();
    let receivedData = null;
    const handler = (data) => { receivedData = data; };

    bus.on('test', handler);
    const testData = { foo: 'bar', num: 42 };
    bus.emit('test', testData);

    assert.deepStrictEqual(receivedData, testData, 'data passed correctly');
  });

  test('emit() should call all handlers for an event', () => {
    const bus = new EventBus();
    const results = [];

    bus.on('test', () => results.push('handler1'));
    bus.on('test', () => results.push('handler2'));
    bus.on('test', () => results.push('handler3'));

    bus.emit('test');

    assert.deepStrictEqual(results, ['handler1', 'handler2', 'handler3'], 'all handlers called');
  });
});

test.describe('EventBus - Error Handling', () => {
  test('on() should throw TypeError for non-function handler', () => {
    const bus = new EventBus();
    assert.throws(
      () => bus.on('test', 'not-a-function'),
      (err) => err instanceof TypeError && err.message.includes('handler must be a function')
    );
  });

  test('once() should throw TypeError for non-function handler', () => {
    const bus = new EventBus();
    assert.throws(
      () => bus.once('test', 'not-a-function'),
      (err) => err instanceof TypeError && err.message.includes('handler must be a function')
    );
  });

  test('handler errors should be caught and logged, not propagated', () => {
    const bus = new EventBus();
    let secondHandlerCalled = false;

    bus.on('test', () => { throw new Error('Handler error'); });
    bus.on('test', () => { secondHandlerCalled = true; });

    // Should not throw, second handler should still be called
    bus.emit('test');

    assert.strictEqual(secondHandlerCalled, true, 'second handler called despite first error');
  });
});

test.describe('EventBus - History', () => {
  test('getHistory() should record events', () => {
    const bus = new EventBus({ maxHistory: 10 });

    bus.emit('event1', { data: 'a' });
    bus.emit('event2', { data: 'b' });

    const history = bus.getHistory();
    assert.strictEqual(history.length, 2, 'history has 2 entries');
    assert.strictEqual(history[0].event, 'event1');
    assert.strictEqual(history[1].event, 'event2');
  });

  test('getHistory() should respect maxHistory limit', () => {
    const bus = new EventBus({ maxHistory: 3 });

    for (let i = 0; i < 10; i++) {
      bus.emit('event' + i);
    }

    const history = bus.getHistory();
    assert.strictEqual(history.length, 3, 'history limited to maxHistory');
  });

  test('getHistory() should filter by event name', () => {
    const bus = new EventBus();

    bus.emit('foo', 1);
    bus.emit('bar', 2);
    bus.emit('foobar', 3);
    bus.emit('baz', 4);

    const filtered = bus.getHistory({ event: 'foo' });
    assert.strictEqual(filtered.length, 2, 'filtered to foo and foobar');
  });

  test('getHistory() should filter by timestamp', () => {
    const bus = new EventBus();

    bus.emit('old', 1);
    // Use a large enough gap to overcome Windows timer resolution
    const start = Date.now() + 100;
    const end = Date.now() + 200;
    // Manually inject history entries with controlled timestamps
    bus._history.push({ event: 'new', data: 2, timestamp: start });
    bus._history.push({ event: 'newer', data: 3, timestamp: end });

    const filtered = bus.getHistory({ since: start, until: end });
    assert.strictEqual(filtered.length, 2, 'filtered by time range');
    assert.ok(filtered.every(r => r.timestamp >= start && r.timestamp <= end));
  });

  test('getHistory() should respect limit parameter', () => {
    const bus = new EventBus();

    for (let i = 0; i < 10; i++) {
      bus.emit('event' + i);
    }

    const limited = bus.getHistory({ limit: 3 });
    assert.strictEqual(limited.length, 3, 'limited to 3 entries');
  });

  test('clearHistory() should remove all history', () => {
    const bus = new EventBus();

    bus.emit('event1', 1);
    bus.emit('event2', 2);
    assert.strictEqual(bus.getHistory().length, 2);

    bus.clearHistory();
    assert.strictEqual(bus.getHistory().length, 0, 'history cleared');
  });
});

test.describe('EventBus - Utility Methods', () => {
  test('listenerCount() should return correct count', () => {
    const bus = new EventBus();

    assert.strictEqual(bus.listenerCount('test'), 0, 'no listeners initially');

    bus.on('test', () => {});
    assert.strictEqual(bus.listenerCount('test'), 1, 'one listener');

    bus.on('test', () => {});
    assert.strictEqual(bus.listenerCount('test'), 2, 'two listeners');

    bus.on('other', () => {});
    assert.strictEqual(bus.listenerCount('other'), 1, 'different event listener');
  });

  test('removeAllListeners() should remove all handlers for specific event', () => {
    const bus = new EventBus();
    let callCount = 0;

    bus.on('test', () => { callCount++; });
    bus.on('test', () => { callCount++; });
    bus.on('other', () => { callCount++; });

    bus.removeAllListeners('test');

    bus.emit('test');
    bus.emit('other');

    assert.strictEqual(callCount, 1, 'only other handler called');
  });

  test('removeAllListeners() without argument should remove all handlers', () => {
    const bus = new EventBus();
    let callCount = 0;

    bus.on('test', () => { callCount++; });
    bus.on('other', () => { callCount++; });

    bus.removeAllListeners();

    bus.emit('test');
    bus.emit('other');

    assert.strictEqual(callCount, 0, 'no handlers called');
  });
});

test.describe('EventBus - Edge Cases', () => {
  test('emit() on event with no handlers should not throw', () => {
    const bus = new EventBus();
    assert.doesNotThrow(() => bus.emit('nonexistent'));
  });

  test('off() on non-existent handler should be safe', () => {
    const bus = new EventBus();
    const handler = () => {};
    assert.doesNotThrow(() => bus.off('test', handler));
  });

  test('unsubscribe() called multiple times should be safe', () => {
    const bus = new EventBus();
    const sub = bus.on('test', () => {});

    assert.doesNotThrow(() => {
      sub.unsubscribe();
      sub.unsubscribe();
      sub.unsubscribe();
    });
  });

  test('once() subscription should be immediately removed after execution', () => {
    const bus = new EventBus();
    let callCount = 0;
    const handler = () => { callCount++; };

    bus.once('test', handler);
    bus.emit('test');

    assert.strictEqual(bus.listenerCount('test'), 0, 'handler removed after execution');
  });
});
