/**
 * Smoke test for Tackle Harness test framework
 * Run with: node test/smoke-test.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');

console.log('Running Tackle Harness smoke tests...\n');

test('smoke: framework can run tests', () => {
  assert.strictEqual(1 + 1, 2, 'basic arithmetic works');
});

test('smoke: node:test is available', () => {
  assert.ok(test, 'node:test module is available');
  assert.ok(assert, 'node:assert module is available');
});

test('smoke: can import runtime modules', () => {
  const EventBus = require('../plugins/runtime/event-bus');
  const Logger = require('../plugins/runtime/logger');
  const StateStore = require('../plugins/runtime/state-store');
  const ConfigManager = require('../plugins/runtime/config-manager');

  assert.ok(EventBus, 'EventBus module loaded');
  assert.ok(Logger, 'Logger module loaded');
  assert.ok(StateStore, 'StateStore module loaded');
  assert.ok(ConfigManager, 'ConfigManager module loaded');
});

test('smoke: EventBus can be instantiated', () => {
  const EventBus = require('../plugins/runtime/event-bus');
  const bus = new EventBus();
  assert.ok(bus, 'EventBus instance created');
  assert.strictEqual(typeof bus.on, 'function', 'has on method');
  assert.strictEqual(typeof bus.emit, 'function', 'has emit method');
});

test('smoke: Logger can be instantiated', () => {
  const Logger = require('../plugins/runtime/logger');
  const logger = new Logger();
  assert.ok(logger, 'Logger instance created');
  assert.strictEqual(typeof logger.info, 'function', 'has info method');
});

test('smoke: StateStore can be instantiated with memory adapter', () => {
  const { StateStore, MemoryAdapter } = require('../plugins/runtime/state-store');
  const store = new StateStore({ adapter: new MemoryAdapter() });
  assert.ok(store, 'StateStore instance created');
  assert.strictEqual(typeof store.get, 'function', 'has get method');
  assert.strictEqual(typeof store.set, 'function', 'has set method');
});

console.log('\nAll smoke tests passed!');
