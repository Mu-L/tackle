/**
 * Unit tests for Logger
 * Run with: node --test test/runtime/test-logger.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Logger = require('../../plugins/runtime/logger');

test.describe('Logger - Basic Operations', () => {
  test('constructor should set default options', () => {
    const logger = new Logger();

    assert.ok(logger, 'logger instance created');
    assert.strictEqual(typeof logger.info, 'function', 'has info method');
    assert.strictEqual(typeof logger.debug, 'function', 'has debug method');
    assert.strictEqual(typeof logger.warn, 'function', 'has warn method');
    assert.strictEqual(typeof logger.error, 'function', 'has error method');
  });

  test('info() should record log entries', () => {
    const logger = new Logger({ level: 'info' });
    logger.info('test-plugin', 'test message');

    const logs = logger.query();
    assert.strictEqual(logs.length, 1, 'one log entry recorded');
    assert.strictEqual(logs[0].level, 'info');
    assert.strictEqual(logs[0].plugin, 'test-plugin');
    assert.strictEqual(logs[0].message, 'test message');
  });

  test('debug() should record log entries', () => {
    const logger = new Logger({ level: 'debug' });
    logger.debug('test-plugin', 'debug message');

    const logs = logger.query();
    assert.strictEqual(logs.length, 1, 'one log entry recorded');
    assert.strictEqual(logs[0].level, 'debug');
  });

  test('warn() should record log entries', () => {
    const logger = new Logger({ level: 'warn' });
    logger.warn('test-plugin', 'warning message');

    const logs = logger.query();
    assert.strictEqual(logs.length, 1, 'one log entry recorded');
    assert.strictEqual(logs[0].level, 'warn');
  });

  test('error() should record log entries', () => {
    const logger = new Logger({ level: 'error' });
    logger.error('test-plugin', 'error message');

    const logs = logger.query();
    assert.strictEqual(logs.length, 1, 'one log entry recorded');
    assert.strictEqual(logs[0].level, 'error');
  });

  test('logs should include data when provided', () => {
    const logger = new Logger();
    const testData = { foo: 'bar', num: 42 };
    logger.info('test-plugin', 'message with data', testData);

    const logs = logger.query();
    assert.deepStrictEqual(logs[0].data, testData, 'data included');
  });
});

test.describe('Logger - Log Levels', () => {
  test('level option should filter logs', () => {
    const logger = new Logger({ level: 'warn' });

    logger.debug('p1', 'debug msg');
    logger.info('p2', 'info msg');
    logger.warn('p3', 'warn msg');
    logger.error('p4', 'error msg');

    const logs = logger.query();
    assert.strictEqual(logs.length, 2, 'only warn and error recorded');
    assert.strictEqual(logs[0].level, 'warn');
    assert.strictEqual(logs[1].level, 'error');
  });

  test('debug level should include all logs', () => {
    const logger = new Logger({ level: 'debug' });

    logger.debug('p1', 'debug');
    logger.info('p2', 'info');
    logger.warn('p3', 'warn');
    logger.error('p4', 'error');

    const logs = logger.query();
    assert.strictEqual(logs.length, 4, 'all levels recorded');
  });

  test('error level should only include error logs', () => {
    const logger = new Logger({ level: 'error' });

    logger.debug('p1', 'debug');
    logger.info('p2', 'info');
    logger.warn('p3', 'warn');
    logger.error('p4', 'error');

    const logs = logger.query();
    assert.strictEqual(logs.length, 1, 'only error recorded');
    assert.strictEqual(logs[0].level, 'error');
  });

  test('logs below minLevel should not be recorded', () => {
    const logger = new Logger({ level: 'info' });

    logger.debug('p1', 'should not appear');
    const logs = logger.query();

    assert.strictEqual(logs.length, 0, 'debug not recorded when level is info');
  });
});

test.describe('Logger - Query and Filtering', () => {
  test('query() should return all logs when no filter provided', () => {
    const logger = new Logger({ level: 'debug' });

    logger.info('p1', 'msg1');
    logger.warn('p2', 'msg2');
    logger.error('p3', 'msg3');

    const logs = logger.query();
    assert.strictEqual(logs.length, 3, 'all logs returned');
  });

  test('query() should filter by plugin name', () => {
    const logger = new Logger({ level: 'debug' });

    logger.info('plugin-a', 'msg1');
    logger.info('plugin-b', 'msg2');
    logger.info('plugin-a', 'msg3');

    const logs = logger.query({ plugin: 'plugin-a' });
    assert.strictEqual(logs.length, 2, 'only plugin-a logs returned');
  });

  test('query() should filter by log level', () => {
    const logger = new Logger({ level: 'debug' });

    logger.debug('p1', 'msg1');
    logger.info('p2', 'msg2');
    logger.warn('p3', 'msg3');
    logger.error('p4', 'msg4');

    const logs = logger.query({ level: 'warn' });
    assert.strictEqual(logs.length, 2, 'warn and error returned (>= warn)');
    assert.ok(logs.every(l => l.level === 'warn' || l.level === 'error'));
  });

  test('query() should filter by timestamp range', () => {
    const logger = new Logger({ level: 'debug' });

    // Use controlled timestamps to avoid Windows timer resolution issues
    const start = Date.now() + 100;
    const end = Date.now() + 200;
    logger._history.push({ level: 'info', message: 'msg2', plugin: 'p', timestamp: start });
    logger._history.push({ level: 'info', message: 'msg3', plugin: 'p', timestamp: end });

    const logs = logger.query({ since: start, until: end });
    assert.strictEqual(logs.length, 2, 'logs in time range');
    assert.ok(logs.every(l => l.timestamp >= start && l.timestamp <= end));
  });

  test('query() should respect limit parameter', () => {
    const logger = new Logger({ level: 'debug' });

    for (let i = 0; i < 10; i++) {
      logger.info('p', 'msg' + i);
    }

    const logs = logger.query({ limit: 3 });
    assert.strictEqual(logs.length, 3, 'limited to 3 entries');
  });

  test('clear() should remove all log entries', () => {
    const logger = new Logger();

    logger.info('p1', 'msg1');
    logger.info('p2', 'msg2');
    assert.strictEqual(logger.query().length, 2);

    logger.clear();
    assert.strictEqual(logger.query().length, 0, 'all logs cleared');
  });
});

test.describe('Logger - History Limits', () => {
  test('should respect maxHistory limit', () => {
    const logger = new Logger({ level: 'info', maxHistory: 5 });

    for (let i = 0; i < 10; i++) {
      logger.info('p', 'msg' + i);
    }

    const logs = logger.query();
    assert.strictEqual(logs.length, 5, 'limited to maxHistory');
  });

  test('should evict oldest entries when limit reached', () => {
    const logger = new Logger({ level: 'info', maxHistory: 3 });

    logger.info('p', 'msg1');
    logger.info('p', 'msg2');
    logger.info('p', 'msg3');
    logger.info('p', 'msg4');

    const logs = logger.query();
    assert.strictEqual(logs.length, 3, 'at maxHistory limit');
    assert.strictEqual(logs[0].message, 'msg2', 'oldest (msg1) evicted');
    assert.strictEqual(logs[2].message, 'msg4', 'newest included');
  });
});

test.describe('Logger - Child Logger', () => {
  test('createChild() should return logger bound to plugin name', () => {
    const logger = new Logger();
    const child = logger.createChild('my-plugin');

    assert.strictEqual(typeof child.debug, 'function', 'has debug method');
    assert.strictEqual(typeof child.info, 'function', 'has info method');
    assert.strictEqual(typeof child.warn, 'function', 'has warn method');
    assert.strictEqual(typeof child.error, 'function', 'has error method');
  });

  test('child logger should record with bound plugin name', () => {
    const logger = new Logger();
    const child = logger.createChild('child-plugin');

    child.info('message from child');

    const logs = logger.query();
    assert.strictEqual(logs.length, 1, 'log recorded');
    assert.strictEqual(logs[0].plugin, 'child-plugin', 'plugin name bound');
    assert.strictEqual(logs[0].message, 'message from child');
  });

  test('child logger methods should accept data parameter', () => {
    const logger = new Logger();
    const child = logger.createChild('test-plugin');

    child.info('message', { key: 'value' });

    const logs = logger.query();
    assert.deepStrictEqual(logs[0].data, { key: 'value' });
  });
});

test.describe('Logger - Default Plugin Name', () => {
  test('should use "system" when plugin is not provided', () => {
    // Access the internal _log method through the public API
    const logger = new Logger({ level: 'info' });

    // Call with undefined/empty plugin
    logger.info(undefined, 'message');

    const logs = logger.query();
    assert.strictEqual(logs[0].plugin, 'system', 'defaults to system');
  });

  test('should use "system" when plugin is null', () => {
    const logger = new Logger({ level: 'info' });

    logger.info(null, 'message');

    const logs = logger.query();
    assert.strictEqual(logs[0].plugin, 'system');
  });

  test('should use empty string when plugin is empty string', () => {
    const logger = new Logger({ level: 'info' });

    logger.info('', 'message');

    const logs = logger.query();
    assert.strictEqual(logs[0].plugin, 'system', 'empty string defaults to system');
  });
});

test.describe('Logger - Edge Cases', () => {
  test('query with empty filter should return all logs', () => {
    const logger = new Logger();
    logger.info('p', 'msg');

    const logs = logger.query({});
    assert.strictEqual(logs.length, 1);
  });

  test('query with non-existent plugin should return empty array', () => {
    const logger = new Logger();
    logger.info('p', 'msg');

    const logs = logger.query({ plugin: 'non-existent' });
    assert.strictEqual(logs.length, 0);
  });

  test('query with limit larger than history should return all logs', () => {
    const logger = new Logger();
    logger.info('p', 'msg');

    const logs = logger.query({ limit: 100 });
    assert.strictEqual(logs.length, 1);
  });
});
