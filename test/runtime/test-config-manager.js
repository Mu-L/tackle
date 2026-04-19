/**
 * Unit tests for ConfigManager
 * Run with: node --test test/runtime/test-config-manager.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const ConfigManager = require('../../plugins/runtime/config-manager');
const fs = require('fs');
const path = require('path');
const os = require('os');

test.describe('ConfigManager - Basic Operations', () => {
  test('constructor should set default options', () => {
    const manager = new ConfigManager();

    assert.ok(manager, 'manager instance created');
    assert.strictEqual(typeof manager.get, 'function', 'has get method');
    assert.strictEqual(typeof manager.setOverride, 'function', 'has setOverride method');
  });

  test('get() should return default value for missing key', () => {
    const manager = new ConfigManager();
    const value = manager.get('nonexistent.key', 'default');

    assert.strictEqual(value, 'default', 'default value returned');
  });

  test('get() should return undefined for missing key without default', () => {
    const manager = new ConfigManager();
    const value = manager.get('nonexistent.key');

    assert.strictEqual(value, undefined, 'undefined for missing key');
  });
});

test.describe('ConfigManager - Runtime Overrides', () => {
  test('setOverride() should set runtime override', () => {
    const manager = new ConfigManager();

    manager.setOverride('test.key', 'override-value');
    const value = manager.get('test.key');

    assert.strictEqual(value, 'override-value', 'override value returned');
  });

  test('setOverride() should take priority over defaults', () => {
    const manager = new ConfigManager({
      defaults: { plugin: { key: 'default-value' } }
    });

    manager.setOverride('plugin.key', 'override-value');
    const value = manager.get('plugin.key');

    assert.strictEqual(value, 'override-value', 'override takes priority');
  });

  test('clearOverride() should remove runtime override', () => {
    const manager = new ConfigManager();

    manager.setOverride('test.key', 'value');
    assert.strictEqual(manager.get('test.key'), 'value');

    manager.clearOverride('test.key');
    assert.strictEqual(manager.get('test.key'), undefined, 'override cleared');
  });

  test('setOverride() with nested keys should create intermediate objects', () => {
    const manager = new ConfigManager();

    manager.setOverride('a.b.c.d', 'deep-value');
    const value = manager.get('a.b.c.d');

    assert.strictEqual(value, 'deep-value');
  });
});

test.describe('ConfigManager - Plugin Defaults', () => {
  test('should use plugin defaults when no override', () => {
    const manager = new ConfigManager({
      defaults: {
        'plugin-a': { key1: 'value1', key2: 'value2' },
        'plugin-b': { key1: 'other-value' }
      }
    });

    // get() doesn't check defaults; use getForPlugin() for plugin defaults
    assert.strictEqual(manager.getForPlugin('plugin-a', 'key1'), 'value1');
    assert.strictEqual(manager.getForPlugin('plugin-a', 'key2'), 'value2');
    assert.strictEqual(manager.getForPlugin('plugin-b', 'key1'), 'other-value');
  });

  test('getForPlugin() should resolve with plugin-specific logic', () => {
    const manager = new ConfigManager({
      defaults: {
        'my-plugin': { timeout: 5000, retries: 3 }
      }
    });

    const timeout = manager.getForPlugin('my-plugin', 'timeout');
    assert.strictEqual(timeout, 5000);
  });

  test('getForPlugin() should use overrides section when present', () => {
    const manager = new ConfigManager({
      defaults: {
        'my-plugin': { timeout: 5000 }
      }
    });

    manager.setOverride('overrides.my-plugin.timeout', 10000);
    const timeout = manager.getForPlugin('my-plugin', 'timeout');

    assert.strictEqual(timeout, 10000, 'plugin-specific override used');
  });

  test('getForPlugin() should fallback to general get()', () => {
    const manager = new ConfigManager({
      defaults: { 'my-plugin': {} }
    });

    manager.setOverride('global-setting', 'global-value');
    const value = manager.getForPlugin('my-plugin', 'global-setting');

    assert.strictEqual(value, 'global-value');
  });

  test('getForPlugin() should use plugin defaults last', () => {
    const manager = new ConfigManager({
      defaults: {
        'my-plugin': { setting: 'from-default' }
      }
    });

    const value = manager.getForPlugin('my-plugin', 'setting');
    assert.strictEqual(value, 'from-default');
  });

  test('getForPlugin() should return default value when not found', () => {
    const manager = new ConfigManager();
    const value = manager.getForPlugin('any-plugin', 'missing-key', 'fallback');

    assert.strictEqual(value, 'fallback');
  });

  test('forPlugin() should create scoped getter', () => {
    const manager = new ConfigManager({
      defaults: {
        'my-plugin': { key1: 'value1', key2: 'value2' }
      }
    });

    const scoped = manager.forPlugin('my-plugin');
    assert.strictEqual(scoped.get('key1'), 'value1');
    assert.strictEqual(scoped.get('key2'), 'value2');
  });
});

test.describe('ConfigManager - Environment Variables', () => {
  test('should read from HARNESS_ prefixed env vars', () => {
    // Env var for key 'test.key' is HARNESS_TEST__KEY (double underscore for dots)
    const originalValue = process.env.HARNESS_TEST__KEY;
    process.env.HARNESS_TEST__KEY = 'env-value';

    try {
      const manager = new ConfigManager();
      const value = manager.get('test.key');

      assert.strictEqual(value, 'env-value', 'env var value used');
    } finally {
      if (originalValue === undefined) {
        delete process.env.HARNESS_TEST__KEY;
      } else {
        process.env.HARNESS_TEST__KEY = originalValue;
      }
    }
  });

  test('env vars should use double underscore for nesting', () => {
    const originalValue = process.env.HARNESS_A__B__C;
    process.env.HARNESS_A__B__C = 'nested-env-value';

    try {
      const manager = new ConfigManager();
      const value = manager.get('a.b.c');

      assert.strictEqual(value, 'nested-env-value');
    } finally {
      if (originalValue === undefined) {
        delete process.env.HARNESS_A__B__C;
      } else {
        process.env.HARNESS_A__B__C = originalValue;
      }
    }
  });

  test('env vars should take priority over defaults', () => {
    // Env var for key 'priority.key' is HARNESS_PRIORITY__KEY
    const originalValue = process.env.HARNESS_PRIORITY__KEY;
    process.env.HARNESS_PRIORITY__KEY = 'env-priority';

    try {
      const manager = new ConfigManager();
      const value = manager.get('priority.key');

      assert.strictEqual(value, 'env-priority', 'env var has priority');
    } finally {
      if (originalValue === undefined) {
        delete process.env.HARNESS_PRIORITY__KEY;
      } else {
        process.env.HARNESS_PRIORITY__KEY = originalValue;
      }
    }
  });

  test('runtime overrides should take priority over env vars', () => {
    const originalValue = process.env.HARNESS_OVERRIDE_TEST;
    process.env.HARNESS_OVERRIDE_TEST = 'env-value';

    try {
      const manager = new ConfigManager();
      manager.setOverride('override.test', 'runtime-value');
      const value = manager.get('override.test');

      assert.strictEqual(value, 'runtime-value', 'runtime override has highest priority');
    } finally {
      if (originalValue === undefined) {
        delete process.env.HARNESS_OVERRIDE_TEST;
      } else {
        process.env.HARNESS_OVERRIDE_TEST = originalValue;
      }
    }
  });

  test('should parse boolean env vars correctly', () => {
    const originalValue = process.env.HARNESS_BOOL__TEST;
    process.env.HARNESS_BOOL__TEST = 'true';

    try {
      const manager = new ConfigManager();
      const value = manager.get('bool.test');

      assert.strictEqual(value, true, 'boolean "true" parsed');
    } finally {
      if (originalValue === undefined) {
        delete process.env.HARNESS_BOOL__TEST;
      } else {
        process.env.HARNESS_BOOL__TEST = originalValue;
      }
    }
  });

  test('should parse number env vars correctly', () => {
    const originalValue = process.env.HARNESS_NUM__TEST;
    process.env.HARNESS_NUM__TEST = '42';

    try {
      const manager = new ConfigManager();
      const value = manager.get('num.test');

      assert.strictEqual(value, 42, 'number parsed');
    } finally {
      if (originalValue === undefined) {
        delete process.env.HARNESS_NUM__TEST;
      } else {
        process.env.HARNESS_NUM__TEST = originalValue;
      }
    }
  });

  test('should parse quoted string env vars correctly', () => {
    const originalValue = process.env.HARNESS_QUOTED__TEST;
    process.env.HARNESS_QUOTED__TEST = '"quoted string"';

    try {
      const manager = new ConfigManager();
      const value = manager.get('quoted.test');

      assert.strictEqual(value, 'quoted string', 'quotes stripped');
    } finally {
      if (originalValue === undefined) {
        delete process.env.HARNESS_QUOTED__TEST;
      } else {
        process.env.HARNESS_QUOTED__TEST = originalValue;
      }
    }
  });
});

test.describe('ConfigManager - getAll()', () => {
  test('getAll() should return full YAML config', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    const configPath = path.join(tmpDir, 'harness-config.yaml');

    fs.writeFileSync(configPath, `
key1: value1
key2: 42
nested:
  key3: true
`, 'utf-8');

    const manager = new ConfigManager({ configPath: configPath });
    const all = manager.getAll();

    assert.strictEqual(all.key1, 'value1');
    assert.strictEqual(all.key2, 42);
    assert.strictEqual(all.nested.key3, true);

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getAll() should return empty object when file missing', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'config-test-'));
    const configPath = path.join(tmpDir, 'non-existent.yaml');

    const manager = new ConfigManager({ configPath: configPath });
    const all = manager.getAll();

    assert.deepStrictEqual(all, {}, 'empty object for missing file');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('ConfigManager - Nested Key Resolution', () => {
  test('get() should resolve nested keys correctly', () => {
    // get() checks overrides > env > yaml, NOT defaults.
    // Use setOverride to create nested values accessible via get().
    const manager = new ConfigManager();

    manager.setOverride('level1.level2.level3', 'deep-value');
    const value = manager.get('level1.level2.level3');
    assert.strictEqual(value, 'deep-value');
  });

  test('get() should return undefined for partial path', () => {
    const manager = new ConfigManager({
      defaults: { level1: { level2: 'value' } }
    });

    const value = manager.get('level1.level2.level3');
    assert.strictEqual(value, undefined, 'partial path returns undefined');
  });

  test('get() should handle intermediate primitives gracefully', () => {
    const manager = new ConfigManager({
      defaults: { level1: 'primitive-value' }
    });

    const value = manager.get('level1.level2');
    assert.strictEqual(value, undefined, 'cannot access property of primitive');
  });
});

test.describe('ConfigManager - Edge Cases', () => {
  test('should handle empty string key', () => {
    const manager = new ConfigManager();
    manager.setOverride('', 'empty-key-value');

    assert.strictEqual(manager.get(''), 'empty-key-value');
  });

  test('should handle very deeply nested keys', () => {
    const manager = new ConfigManager();
    manager.setOverride('a.b.c.d.e.f.g.h.i.j', 'very-deep');

    assert.strictEqual(manager.get('a.b.c.d.e.f.g.h.i.j'), 'very-deep');
  });

  test('clearOverride() on non-existent key should be safe', () => {
    const manager = new ConfigManager();

    assert.doesNotThrow(() => manager.clearOverride('nonexistent.key'));
  });

  test('getForPlugin() with non-existent plugin should work', () => {
    const manager = new ConfigManager();
    const value = manager.getForPlugin('nonexistent-plugin', 'key', 'default');

    assert.strictEqual(value, 'default');
  });

  test('forPlugin() scoped getter should work for any plugin', () => {
    const manager = new ConfigManager();
    const scoped = manager.forPlugin('any-plugin');

    assert.strictEqual(typeof scoped.get, 'function');
  });
});
