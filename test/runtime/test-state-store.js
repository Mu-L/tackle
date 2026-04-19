/**
 * Unit tests for StateStore
 * Run with: node --test test/runtime/test-state-store.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const { StateStore, MemoryAdapter } = require('../../plugins/runtime/state-store');
const fs = require('fs');
const path = require('path');
const os = require('os');

test.describe('StateStore - Basic Operations', () => {
  test('constructor should accept options', () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    assert.ok(store, 'store instance created');
    assert.strictEqual(typeof store.get, 'function', 'has get method');
    assert.strictEqual(typeof store.set, 'function', 'has set method');
    assert.strictEqual(typeof store.delete, 'function', 'has delete method');
    assert.strictEqual(typeof store.keys, 'function', 'has keys method');
  });

  test('set() and get() with simple keys', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('simpleKey', 'simpleValue');
    const value = await store.get('simpleKey');

    assert.strictEqual(value, 'simpleValue', 'value retrieved correctly');
  });

  test('set() and get() with dot-notation keys', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('harness.state', 'active');
    const value = await store.get('harness.state');

    assert.strictEqual(value, 'active', 'nested value retrieved correctly');
  });

  test('set() should create intermediate objects', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('a.b.c.d', 'deepValue');
    const value = await store.get('a.b.c.d');

    assert.strictEqual(value, 'deepValue', 'deep nested value works');
  });

  test('get() should return undefined for non-existent keys', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    const value = await store.get('nonexistent.key');

    assert.strictEqual(value, undefined, 'undefined for missing key');
  });

  test('delete() should remove keys', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('toDelete', 'value');
    assert.strictEqual(await store.get('toDelete'), 'value');

    await store.delete('toDelete');
    assert.strictEqual(await store.get('toDelete'), undefined, 'key deleted');
  });

  test('delete() should work with nested keys', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('a.b.c', 'value');
    await store.delete('a.b.c');

    assert.strictEqual(await store.get('a.b.c'), undefined, 'nested key deleted');
  });

  test('delete() on non-existent key should be safe', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await assert.doesNotReject(() => store.delete('nonexistent'));
  });

  test('keys() should return all keys in dot-notation', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('a.b', '1');
    await store.set('a.c', '2');
    await store.set('x', '3');

    const keys = await store.keys();
    keys.sort();

    assert.deepStrictEqual(keys, ['a.b', 'a.c', 'x'], 'all keys returned');
  });

  test('keys() should return empty array for empty store', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    const keys = await store.keys();

    assert.deepStrictEqual(keys, [], 'no keys in empty store');
  });
});

test.describe('StateStore - Value Types', () => {
  test('should store strings', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('str', 'hello');
    assert.strictEqual(await store.get('str'), 'hello');
  });

  test('should store numbers', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('num', 42);
    assert.strictEqual(await store.get('num'), 42);
  });

  test('should store booleans', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('bool', true);
    assert.strictEqual(await store.get('bool'), true);
  });

  test('should store null', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('nil', null);
    assert.strictEqual(await store.get('nil'), null);
  });

  test('should store objects', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    const obj = { foo: 'bar', nested: { x: 1 } };
    await store.set('obj', obj);

    assert.deepStrictEqual(await store.get('obj'), obj);
  });

  test('should store arrays', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    const arr = [1, 2, 3];
    await store.set('arr', arr);

    assert.deepStrictEqual(await store.get('arr'), arr);
  });
});

test.describe('StateStore - Subscription', () => {
  test('subscribe() should register callback for key changes', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    let callCount = 0;
    let receivedKey = '';
    let receivedOldValue = undefined;
    let receivedNewValue = undefined;

    const sub = store.subscribe('test.key', (key, oldValue, newValue) => {
      callCount++;
      receivedKey = key;
      receivedOldValue = oldValue;
      receivedNewValue = newValue;
    });

    await store.set('test.key', 'value1');

    assert.strictEqual(callCount, 1, 'callback called once');
    assert.strictEqual(receivedKey, 'test.key', 'correct key');
    assert.strictEqual(receivedOldValue, undefined, 'old value was undefined');
    assert.strictEqual(receivedNewValue, 'value1', 'new value correct');

    sub.unsubscribe();
  });

  test('subscribe() should report old value on update', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('key', 'old');

    let receivedOldValue;
    store.subscribe('key', (key, oldValue) => {
      receivedOldValue = oldValue;
    });

    await store.set('key', 'new');

    assert.strictEqual(receivedOldValue, 'old', 'old value reported');
  });

  test('unsubscribe() should stop callbacks', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    let callCount = 0;
    const sub = store.subscribe('key', () => { callCount++; });

    await store.set('key', 'v1');
    assert.strictEqual(callCount, 1);

    sub.unsubscribe();
    await store.set('key', 'v2');
    assert.strictEqual(callCount, 1, 'callback not called after unsubscribe');
  });

  test('multiple subscribers should all be notified', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    const results = [];
    store.subscribe('key', () => results.push('sub1'));
    store.subscribe('key', () => results.push('sub2'));
    store.subscribe('key', () => results.push('sub3'));

    await store.set('key', 'value');

    assert.deepStrictEqual(results, ['sub1', 'sub2', 'sub3'], 'all subscribers notified');
  });

  test('subscriber errors should be caught and logged', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    let secondCalled = false;
    store.subscribe('key', () => { throw new Error('Subscriber error'); });
    store.subscribe('key', () => { secondCalled = true; });

    // Should not throw
    await assert.doesNotReject(() => store.set('key', 'value'));
    assert.strictEqual(secondCalled, true, 'second subscriber called despite first error');
  });

  test('unsubscribe should remove only that subscriber', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    let callCount = 0;
    const sub1 = store.subscribe('key', () => { callCount++; });
    const sub2 = store.subscribe('key', () => { callCount++; });

    await store.set('key', 'v1');
    assert.strictEqual(callCount, 2, 'both called');

    sub1.unsubscribe();
    await store.set('key', 'v2');
    assert.strictEqual(callCount, 3, 'only sub2 called after sub1 unsubscribe');

    sub2.unsubscribe();
  });
});

test.describe('StateStore - Cache', () => {
  test('should cache state to minimize disk reads', async () => {
    const adapter = new MemoryAdapter();
    let readCount = 0;
    const originalRead = adapter.read.bind(adapter);
    adapter.read = () => { readCount++; return originalRead(); };

    const store = new StateStore({ adapter: adapter });

    await store.set('key', 'value');
    const v1 = await store.get('key');
    const v2 = await store.get('key');
    const v3 = await store.get('key');

    assert.strictEqual(v1, 'value');
    assert.strictEqual(v2, 'value');
    assert.strictEqual(v3, 'value');

    // First get loads from adapter, subsequent reads from cache
    // But note: set() also loads from cache
    assert.ok(readCount <= 2, 'cache reduces reads: ' + readCount);
  });

  test('invalidate() should force reload on next access', async () => {
    // Use a custom adapter that returns different data on each read
    // (MemoryAdapter shares references so modifying _data also changes cache)
    let readCount = 0;
    const adapter = {
      read() {
        readCount++;
        return readCount === 1 ? { key: 'value1' } : { key: 'value2' };
      },
      write(data) {}
    };
    const store = new StateStore({ adapter: adapter });

    assert.strictEqual(await store.get('key'), 'value1');
    // Cache is now populated, next get should not call adapter.read()
    assert.strictEqual(await store.get('key'), 'value1');
    assert.strictEqual(readCount, 1, 'only one adapter read due to cache');

    // Invalidate clears cache, next get reloads from adapter
    store.invalidate();
    assert.strictEqual(await store.get('key'), 'value2', 'reloaded after invalidate');
    assert.strictEqual(readCount, 2, 'adapter read again after invalidate');
  });
});

test.describe('StateStore - FileSystemAdapter', () => {
  test('MemoryAdapter should work independently', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('test', 'value');
    assert.strictEqual(await store.get('test'), 'value');
  });

  test('FileSystemAdapter should create file if not exists', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-store-test-'));
    const filePath = path.join(tmpDir, 'test-state.json');
    const { FileSystemAdapter } = require('../../plugins/runtime/state-store');

    const adapter = new FileSystemAdapter(filePath);
    const store = new StateStore({ adapter: adapter });

    await store.set('key', 'value');
    assert.strictEqual(await store.get('key'), 'value');

    // Verify file was created
    assert.ok(fs.existsSync(filePath), 'state file created');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('FileSystemAdapter should persist data across instances', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-store-test-'));
    const filePath = path.join(tmpDir, 'test-state.json');
    const { FileSystemAdapter } = require('../../plugins/runtime/state-store');

    // First instance writes
    const adapter1 = new FileSystemAdapter(filePath);
    const store1 = new StateStore({ adapter: adapter1 });
    await store1.set('persistent', 'data');

    // Second instance reads
    const adapter2 = new FileSystemAdapter(filePath);
    const store2 = new StateStore({ adapter: adapter2 });
    const value = await store2.get('persistent');

    assert.strictEqual(value, 'data', 'data persisted across instances');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('FileSystemAdapter should handle missing file gracefully', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'state-store-test-'));
    const filePath = path.join(tmpDir, 'non-existent.json');
    const { FileSystemAdapter } = require('../../plugins/runtime/state-store');

    const adapter = new FileSystemAdapter(filePath);
    const store = new StateStore({ adapter: adapter });

    // Should not throw, should return empty state
    const value = await store.get('any.key');
    assert.strictEqual(value, undefined, 'returns undefined for missing file');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('StateStore - Edge Cases', () => {
  test('should handle setting value that overwrites object with primitive', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('a.b', 'value');
    await store.set('a', 'primitive');

    assert.strictEqual(await store.get('a'), 'primitive', 'overwrites nested structure');
  });

  test('should handle keys with special characters in values', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    const specialString = 'value with "quotes" and \'apostrophes\'';
    await store.set('special', specialString);

    assert.strictEqual(await store.get('special'), specialString);
  });

  test('should handle empty string key', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('', 'empty-key-value');
    assert.strictEqual(await store.get(''), 'empty-key-value');
  });

  test('should handle very deeply nested keys', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    const deepKey = 'a.b.c.d.e.f.g.h.i.j';
    await store.set(deepKey, 'very-deep');

    assert.strictEqual(await store.get(deepKey), 'very-deep');
  });

  test('keys() should not include nested object keys as separate entries', async () => {
    const adapter = new MemoryAdapter();
    const store = new StateStore({ adapter: adapter });

    await store.set('a.b', '1');
    await store.set('a.c.d', '2');

    const keys = await store.keys();
    keys.sort();

    assert.deepStrictEqual(keys, ['a.b', 'a.c.d'], 'only leaf values included');
  });
});
