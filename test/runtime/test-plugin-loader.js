/**
 * Unit tests for PluginLoader
 * Run with: node --test test/runtime/test-plugin-loader.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const path = require('path');
const fs = require('fs');
const os = require('os');

// Mock runtime components for testing
class MockEventBus {
  constructor() {
    this.events = [];
  }
  emit(event, data) {
    this.events.push({ event, data });
  }
}

class MockLogger {
  constructor() {
    this.logs = [];
  }
  debug(plugin, msg) { this.logs.push({ level: 'debug', plugin, msg }); }
  info(plugin, msg) { this.logs.push({ level: 'info', plugin, msg }); }
  warn(plugin, msg) { this.logs.push({ level: 'warn', plugin, msg }); }
  error(plugin, msg) { this.logs.push({ level: 'error', plugin, msg }); }
  createChild(name) {
    const child = { logs: [] };
    ['debug', 'info', 'warn', 'error'].forEach(level => {
      child[level] = (msg) => this.logs.push({ level, plugin: name, msg });
    });
    return child;
  }
}

class MockStateStore {
  constructor() {
    this.data = {};
  }
  async get(key) { return this.data[key]; }
  async set(key, value) { this.data[key] = value; }
}

class MockConfigManager {
  constructor() {
    this.data = {};
  }
  get(key, defaultValue) { return this.data[key] !== undefined ? this.data[key] : defaultValue; }
  setOverride(key, value) { this.data[key] = value; }
}

// Helper to create a test registry
function createTestRegistry(tmpDir, plugins) {
  const registryPath = path.join(tmpDir, 'plugin-registry.json');
  const registry = {
    version: '1.0.0',
    plugins: plugins.map(p => ({
      name: p.name,
      source: p.source || p.name,
      enabled: p.enabled !== false,
      config: p.config || {}
    }))
  };
  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

  // Get absolute path to plugin-interface for dynamic requires
  const pluginInterfacePath = path.resolve(__dirname, '../../plugins/contracts/plugin-interface.js').replace(/\\/g, '/');

  // Create plugin directories and plugin.json files
  const coreDir = path.join(tmpDir, 'core');
  if (!fs.existsSync(coreDir)) {
    fs.mkdirSync(coreDir, { recursive: true });
  }

  plugins.forEach(p => {
    const pluginDir = path.join(coreDir, p.source || p.name);
    if (!fs.existsSync(pluginDir)) {
      fs.mkdirSync(pluginDir, { recursive: true });
    }

    const pluginJson = {
      name: p.name,
      version: p.version || '0.0.1',
      type: p.type || 'skill',
      description: p.description || 'Test plugin',
      triggers: p.triggers || [],
      metadata: p.metadata || {}
    };

    if (p.provides) {
      pluginJson.provides = p.provides;
    }

    fs.writeFileSync(
      path.join(pluginDir, 'plugin.json'),
      JSON.stringify(pluginJson, null, 2),
      'utf-8'
    );

    // Create index.js for non-skill plugins
    if (p.type !== 'skill') {
      const PluginInterface = require('../../plugins/contracts/plugin-interface');
      const content = `
'use strict';
const { ${p.type === 'hook' ? 'HookPlugin' : p.type === 'validator' ? 'ValidatorPlugin' : 'ProviderPlugin'} } = require('${pluginInterfacePath}');

class Test${p.type.charAt(0).toUpperCase() + p.type.slice(1)} extends ${p.type === 'hook' ? 'HookPlugin' : p.type === 'validator' ? 'ValidatorPlugin' : 'ProviderPlugin'} {
  constructor() {
    super();
    this.name = '${p.name}';
    this.version = '${p.version || '0.0.1'}';
  }

  ${p.type === 'provider' ? 'async factory(context) { return { test: true }; }' : ''}
  ${p.type === 'hook' ? 'async handle(context) { return { allowed: true }; }' : ''}
  ${p.type === 'validator' ? 'async validate(context) { return { passed: true, errors: [], warnings: [] }; }' : ''}
}

module.exports = Test${p.type.charAt(0).toUpperCase() + p.type.slice(1)};
`;
      fs.writeFileSync(path.join(pluginDir, 'index.js'), content, 'utf-8');
    }
  });

  return registryPath;
}

test.describe('PluginLoader - Construction', () => {
  test('should construct with required dependencies', () => {
    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const eventBus = new MockEventBus();
    const stateStore = new MockStateStore();
    const configManager = new MockConfigManager();
    const logger = new MockLogger();

    const loader = new PluginLoader({
      eventBus, stateStore, configManager, logger
    });

    assert.ok(loader, 'loader created');
    assert.strictEqual(loader.isLoaded('anything'), false, 'no plugins loaded initially');
  });

  test('should construct with minimal options', () => {
    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({});

    assert.ok(loader, 'loader created with minimal options');
  });
});

test.describe('PluginLoader - Load All', () => {
  test('should load plugins from empty registry', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, []);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    const loaded = await loader.loadAll();

    assert.deepStrictEqual(loaded, [], 'no plugins loaded from empty registry');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should load skill plugins', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'test-skill', type: 'skill', triggers: ['test'] }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const eventBus = new MockEventBus();
    const logger = new MockLogger();
    const loader = new PluginLoader({
      registryPath,
      eventBus,
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger
    });

    const loaded = await loader.loadAll();

    assert.deepStrictEqual(loaded, ['test-skill'], 'skill plugin loaded');
    assert.strictEqual(loader.isLoaded('test-skill'), true, 'plugin is loaded');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should skip disabled plugins', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'enabled-plugin', type: 'skill' },
      { name: 'disabled-plugin', type: 'skill', enabled: false }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    const loaded = await loader.loadAll();

    assert.deepStrictEqual(loaded, ['enabled-plugin'], 'only enabled plugin loaded');
    assert.strictEqual(loader.isLoaded('disabled-plugin'), false, 'disabled plugin not loaded');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should emit plugin:loaded events', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'test-plugin', type: 'skill' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const eventBus = new MockEventBus();
    const loader = new PluginLoader({
      registryPath,
      eventBus,
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();

    // Both plugin:loaded and plugin:activated events are emitted
    assert.strictEqual(eventBus.events.length, 2, 'two events emitted (loaded and activated)');
    assert.strictEqual(eventBus.events[0].event, 'plugin:loaded');
    assert.strictEqual(eventBus.events[1].event, 'plugin:activated');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('PluginLoader - Topological Sort', () => {
  test('should load plugins in dependency order', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'plugin-c', type: 'skill', config: { dependencies: { plugins: ['plugin-b'] } } },
      { name: 'plugin-a', type: 'skill' },
      { name: 'plugin-b', type: 'skill', config: { dependencies: { plugins: ['plugin-a'] } } }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const logger = new MockLogger();
    const loadOrder = [];
    const originalLog = logger.info.bind(logger);
    logger.info = (plugin, msg) => {
      if (msg.includes('Load order resolved')) {
        const match = msg.match(/Load order resolved: (.+)/);
        if (match) loadOrder.push(...match[1].split(', '));
      }
      originalLog(plugin, msg);
    };

    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger
    });

    await loader.loadAll();

    assert.deepStrictEqual(loadOrder, ['plugin-a', 'plugin-b', 'plugin-c'], 'plugins loaded in dependency order');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should detect circular dependencies', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'plugin-a', type: 'skill', config: { dependencies: { plugins: ['plugin-b'] } } },
      { name: 'plugin-b', type: 'skill', config: { dependencies: { plugins: ['plugin-a'] } } }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await assert.rejects(
      () => loader.loadAll(),
      (err) => err.message.includes('Circular dependency')
    );

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('PluginLoader - Activation', () => {
  test('should activate loaded plugin', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'test-plugin', type: 'skill' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const eventBus = new MockEventBus();
    const loader = new PluginLoader({
      registryPath,
      eventBus,
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();

    const plugin = loader.getPlugin('test-plugin');
    assert.ok(plugin, 'plugin loaded');
    assert.strictEqual(plugin.state, 'activated', 'plugin activated');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('should emit plugin:activated event', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'test-plugin', type: 'skill' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const eventBus = new MockEventBus();
    const loader = new PluginLoader({
      registryPath,
      eventBus,
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();

    const activatedEvents = eventBus.events.filter(e => e.event === 'plugin:activated');
    assert.strictEqual(activatedEvents.length, 1, 'plugin:activated event emitted');
    assert.strictEqual(activatedEvents[0].data.pluginName, 'test-plugin');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('PluginLoader - Provider Plugins', () => {
  test('should register provider factory output', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'test-provider', type: 'provider', provides: ['provider:test'], version: '1.0.0' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();

    const provider = loader.getProvider('test');
    assert.ok(provider, 'provider registered');
    assert.strictEqual(provider.test, true, 'factory output registered');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('PluginLoader - Query Methods', () => {
  test('getPlugin() should return loaded plugin', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'test-plugin', type: 'skill' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();

    const plugin = loader.getPlugin('test-plugin');
    assert.ok(plugin, 'plugin returned');
    assert.strictEqual(plugin.name, 'test-plugin');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getPlugin() should return undefined for non-existent plugin', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, []);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();

    const plugin = loader.getPlugin('non-existent');
    assert.strictEqual(plugin, undefined, 'undefined for non-existent plugin');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('getLoadedNames() should return all loaded plugin names', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'plugin-a', type: 'skill' },
      { name: 'plugin-b', type: 'skill' },
      { name: 'plugin-c', type: 'skill' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();

    const names = loader.getLoadedNames();
    names.sort();
    assert.deepStrictEqual(names, ['plugin-a', 'plugin-b', 'plugin-c'], 'all loaded names returned');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('PluginLoader - Deactivation', () => {
  test('should deactivate loaded plugin', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'test-plugin', type: 'skill' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();
    assert.strictEqual(loader.getPlugin('test-plugin').state, 'activated');

    await loader.deactivate('test-plugin');
    assert.strictEqual(loader.getPlugin('test-plugin').state, 'deactivated', 'plugin deactivated');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('deactivateAll() should deactivate all plugins in reverse order', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'plugin-loader-test-'));
    const registryPath = createTestRegistry(tmpDir, [
      { name: 'plugin-a', type: 'skill' },
      { name: 'plugin-b', type: 'skill' },
      { name: 'plugin-c', type: 'skill' }
    ]);

    const PluginLoader = require('../../plugins/runtime/plugin-loader');
    const loader = new PluginLoader({
      registryPath,
      eventBus: new MockEventBus(),
      stateStore: new MockStateStore(),
      configManager: new MockConfigManager(),
      logger: new MockLogger()
    });

    await loader.loadAll();
    await loader.deactivateAll();

    assert.strictEqual(loader.getPlugin('plugin-a').state, 'deactivated');
    assert.strictEqual(loader.getPlugin('plugin-b').state, 'deactivated');
    assert.strictEqual(loader.getPlugin('plugin-c').state, 'deactivated');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
