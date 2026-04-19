/**
 * Integration tests for Plugin Lifecycle
 * Tests: init -> load -> activate -> Provider injection -> Hook dispatch -> Validator execution
 * Run with: node --test test/integration/test-plugin-lifecycle.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const PluginLoader = require('../../plugins/runtime/plugin-loader');
const EventBus = require('../../plugins/runtime/event-bus');
const Logger = require('../../plugins/runtime/logger');
const { StateStore } = require('../../plugins/runtime/state-store');
const ConfigManager = require('../../plugins/runtime/config-manager');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Mock Provider for testing
class TestProvider {
  constructor() {
    this.name = 'test-provider';
    this.data = { test: true };
  }
}

// Helper to create test registry with various plugin types
function createLifecycleTestRegistry(tmpDir) {
  const registryPath = path.join(tmpDir, 'plugin-registry.json');
  const coreDir = path.join(tmpDir, 'core');
  if (!fs.existsSync(coreDir)) {
    fs.mkdirSync(coreDir, { recursive: true });
  }

  // Get absolute path to plugin-interface for dynamic requires
  // Convert backslashes to forward slashes for require() in generated code
  const pluginInterfacePath = path.resolve(__dirname, '../../plugins/contracts/plugin-interface.js').replace(/\\/g, '/');

  // Create a simple skill plugin
  const skillDir = path.join(coreDir, 'test-skill');
  fs.mkdirSync(skillDir, { recursive: true });
  fs.writeFileSync(
    path.join(skillDir, 'plugin.json'),
    JSON.stringify({
      name: 'test-skill',
      version: '1.0.0',
      type: 'skill',
      description: 'Test skill for lifecycle',
      triggers: ['test']
    }, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(skillDir, 'skill.md'),
    '# Test Skill\n\nTest skill content.',
    'utf-8'
  );

  // Create a provider plugin
  const providerDir = path.join(coreDir, 'test-provider');
  fs.mkdirSync(providerDir, { recursive: true });
  fs.writeFileSync(
    path.join(providerDir, 'plugin.json'),
    JSON.stringify({
      name: 'test-provider',
      version: '1.0.0',
      type: 'provider',
      description: 'Test provider',
      provides: ['provider:custom']
    }, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(providerDir, 'index.js'),
    `
'use strict';
const { ProviderPlugin } = require('${pluginInterfacePath}');

class TestProviderImpl extends ProviderPlugin {
  constructor() {
    super();
    this.name = 'test-provider';
    this.version = '1.0.0';
    this.provides = ['provider:custom'];
  }

  async factory(context) {
    return { customData: 'from-provider', timestamp: Date.now() };
  }
}

module.exports = TestProviderImpl;
`,
    'utf-8'
  );

  // Create a hook plugin
  const hookDir = path.join(coreDir, 'test-hook');
  fs.mkdirSync(hookDir, { recursive: true });
  fs.writeFileSync(
    path.join(hookDir, 'plugin.json'),
    JSON.stringify({
      name: 'test-hook',
      version: '1.0.0',
      type: 'hook',
      description: 'Test hook',
    }, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(hookDir, 'index.js'),
    `
'use strict';
const { HookPlugin } = require('${pluginInterfacePath}');

class TestHookImpl extends HookPlugin {
  constructor() {
    super();
    this.name = 'test-hook';
    this.version = '1.0.0';
    this.trigger = { event: 'PreToolUse', tools: ['Edit'] };
  }

  async handle(context) {
    return { allowed: true, reason: 'test-hook-allowed' };
  }
}

module.exports = TestHookImpl;
`,
    'utf-8'
  );

  // Create a validator plugin
  const validatorDir = path.join(coreDir, 'test-validator');
  fs.mkdirSync(validatorDir, { recursive: true });
  fs.writeFileSync(
    path.join(validatorDir, 'plugin.json'),
    JSON.stringify({
      name: 'test-validator',
      version: '1.0.0',
      type: 'validator',
      description: 'Test validator',
      targets: ['*']
    }, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(validatorDir, 'index.js'),
    `
'use strict';
const { ValidatorPlugin } = require('${pluginInterfacePath}');

class TestValidatorImpl extends ValidatorPlugin {
  constructor() {
    super();
    this.name = 'test-validator';
    this.version = '1.0.0';
    this.targets = ['*'];
    this.blocking = true;
  }

  async validate(context) {
    return { passed: true, errors: [], warnings: [] };
  }
}

module.exports = TestValidatorImpl;
`,
    'utf-8'
  );

  // Create registry
  const registry = {
    version: '1.0.0',
    plugins: [
      { name: 'test-provider', source: 'test-provider', enabled: true },
      { name: 'test-skill', source: 'test-skill', enabled: true },
      { name: 'test-hook', source: 'test-hook', enabled: true },
      { name: 'test-validator', source: 'test-validator', enabled: true },
    ]
  };

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');
  return registryPath;
}

// Helper to cleanup test registry
function cleanupLifecycleTest(tmpDir) {
  const paths = [
    path.join(tmpDir, 'plugin-registry.json'),
    path.join(tmpDir, 'core', 'test-skill', 'plugin.json'),
    path.join(tmpDir, 'core', 'test-skill', 'skill.md'),
    path.join(tmpDir, 'core', 'test-provider', 'plugin.json'),
    path.join(tmpDir, 'core', 'test-provider', 'index.js'),
    path.join(tmpDir, 'core', 'test-hook', 'plugin.json'),
    path.join(tmpDir, 'core', 'test-hook', 'index.js'),
    path.join(tmpDir, 'core', 'test-validator', 'plugin.json'),
    path.join(tmpDir, 'core', 'test-validator', 'index.js'),
  ];

  paths.forEach(p => {
    if (fs.existsSync(p)) fs.unlinkSync(p);
  });

  fs.rmSync(tmpDir, { recursive: true, force: true });
}

test.describe('Plugin Lifecycle Integration', () => {
  test('complete lifecycle: load -> activate with all services injected', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifecycle-test-'));
    const registryPath = createLifecycleTestRegistry(tmpDir);

    // Create runtime components
    const eventBus = new EventBus();
    const logger = new Logger({ level: 'info' });
    const stateStore = new StateStore({
      adapter: new StateStore.MemoryAdapter()
    });
    const configManager = new ConfigManager();

    // Create loader with all dependencies
    const loader = new PluginLoader({
      registryPath,
      eventBus,
      stateStore,
      configManager,
      logger
    });

    // Load all plugins
    const loaded = await loader.loadAll();

    assert.ok(loaded.includes('test-provider'), 'provider loaded');
    assert.ok(loaded.includes('test-skill'), 'skill loaded');
    assert.ok(loaded.includes('test-hook'), 'hook loaded');
    assert.ok(loaded.includes('test-validator'), 'validator loaded');

    // Verify all plugins are activated
    const provider = loader.getPlugin('test-provider');
    const skill = loader.getPlugin('test-skill');
    const hook = loader.getPlugin('test-hook');
    const validator = loader.getPlugin('test-validator');

    assert.strictEqual(provider.state, 'activated', 'provider activated');
    assert.strictEqual(skill.state, 'activated', 'skill activated');
    assert.strictEqual(hook.state, 'activated', 'hook activated');
    assert.strictEqual(validator.state, 'activated', 'validator activated');

    // Verify lifecycle events
    const loadedEvents = eventBus.events.filter(e => e.event === 'plugin:loaded');
    const activatedEvents = eventBus.events.filter(e => e.event === 'plugin:activated');

    assert.strictEqual(loadedEvents.length, 4, 'all plugins emitted loaded event');
    assert.strictEqual(activatedEvents.length, 4, 'all plugins emitted activated event');

    cleanupLifecycleTest(tmpDir);
  });

  test('Provider factory is called and output registered', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifecycle-test-'));
    const registryPath = createLifecycleTestRegistry(tmpDir);

    const loader = new PluginLoader({
      registryPath,
      eventBus: new EventBus(),
      stateStore: new StateStore({
        adapter: new (require('../../plugins/runtime/state-store')).MemoryAdapter()
      }),
      configManager: new ConfigManager(),
      logger: new Logger({ level: 'info' })
    });

    await loader.loadAll();

    // Get registered provider
    const customProvider = loader.getProvider('custom');
    assert.ok(customProvider, 'provider registered under "custom"');
    assert.strictEqual(customProvider.customData, 'from-provider', 'factory output registered');

    // Also available under full plugin name
    const byName = loader.getProvider('test-provider');
    assert.ok(byName, 'provider available by plugin name');

    cleanupLifecycleTest(tmpDir);
  });

  test('PluginContext is injected with all services', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifecycle-test-'));
    const registryPath = createLifecycleTestRegistry(tmpDir);

    // Get absolute path to plugin-interface for dynamic requires
    const pluginInterfacePath = path.resolve(__dirname, '../../plugins/contracts/plugin-interface.js').replace(/\\/g, '/');

    // Track if onActivate was called with correct context
    let receivedContext = null;

    // Create a custom plugin that captures context
    const testPluginDir = path.join(tmpDir, 'core', 'context-test-plugin');
    fs.mkdirSync(testPluginDir, { recursive: true });
    fs.writeFileSync(
      path.join(testPluginDir, 'plugin.json'),
      JSON.stringify({
        name: 'context-test-plugin',
        version: '1.0.0',
        type: 'provider',
        description: 'Context test plugin',
        provides: ['provider:context-test']
      }, null, 2),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(testPluginDir, 'index.js'),
      `
'use strict';
const { ProviderPlugin } = require('${pluginInterfacePath}');

class ContextTestPlugin extends ProviderPlugin {
  constructor() {
    super();
    this.name = 'context-test-plugin';
    this.version = '1.0.0';
    this.capturedContext = null;
  }

  async factory(context) {
    this.capturedContext = context;
    return { contextCaptured: true };
  }
}

module.exports = ContextTestPlugin;
`,
      'utf-8'
    );

    // Add to registry
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    registry.plugins.push({ name: 'context-test-plugin', source: 'context-test-plugin', enabled: true });
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

    const eventBus = new EventBus();
    const stateStore = new StateStore({
      adapter: new StateStore.MemoryAdapter()
    });
    const configManager = new ConfigManager();
    const logger = new Logger({ level: 'info' });

    const loader = new PluginLoader({
      registryPath,
      eventBus,
      stateStore,
      configManager,
      logger
    });

    await loader.loadAll();

    const plugin = loader.getPlugin('context-test-plugin');
    assert.ok(plugin.capturedContext, 'context was captured');

    const ctx = plugin.capturedContext;
    assert.strictEqual(ctx.pluginName, 'context-test-plugin', 'plugin name correct');
    assert.strictEqual(ctx.eventBus, eventBus, 'eventBus injected');
    assert.strictEqual(ctx.stateStore, stateStore, 'stateStore injected');
    assert.strictEqual(ctx.config, configManager, 'configManager injected');
    assert.ok(ctx.logger, 'logger injected');
    assert.strictEqual(typeof ctx.getProvider, 'function', 'getProvider method available');
    assert.strictEqual(typeof ctx.getPlugin, 'function', 'getPlugin method available');

    cleanupLifecycleTest(tmpDir);
  });

  test('deactivate lifecycle works correctly', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifecycle-test-'));
    const registryPath = createLifecycleTestRegistry(tmpDir);

    const eventBus = new EventBus();
    const loader = new PluginLoader({
      registryPath,
      eventBus,
      stateStore: new StateStore({
        adapter: new StateStore.MemoryAdapter()
      }),
      configManager: new ConfigManager(),
      logger: new Logger({ level: 'info' })
    });

    await loader.loadAll();

    // Deactivate single plugin
    await loader.deactivate('test-skill');
    assert.strictEqual(loader.getPlugin('test-skill').state, 'deactivated', 'plugin deactivated');

    // Verify deactivated event
    const deactivatedEvents = eventBus.events.filter(e => e.event === 'plugin:deactivated');
    assert.ok(deactivatedEvents.some(e => e.data.pluginName === 'test-skill'), 'deactivated event emitted');

    // Deactivate all
    await loader.deactivateAll();
    assert.strictEqual(loader.getPlugin('test-provider').state, 'deactivated');
    assert.strictEqual(loader.getPlugin('test-hook').state, 'deactivated');
    assert.strictEqual(loader.getPlugin('test-validator').state, 'deactivated');

    cleanupLifecycleTest(tmpDir);
  });
});

test.describe('Plugin Lifecycle Error Handling', () => {
  test('handles missing registry gracefully', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifecycle-test-'));
    const nonExistentPath = path.join(tmpDir, 'non-existent-registry.json');

    const loader = new PluginLoader({
      registryPath: nonExistentPath,
      eventBus: new EventBus(),
      stateStore: new StateStore({
        adapter: new (require('../../plugins/runtime/state-store')).MemoryAdapter()
      }),
      configManager: new ConfigManager(),
      logger: new Logger({ level: 'info' })
    });

    const loaded = await loader.loadAll();
    assert.deepStrictEqual(loaded, [], 'empty registry returns empty array');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('handles plugin load failure gracefully', async () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lifecycle-test-'));

    // Create registry with non-existent plugin
    const registryPath = path.join(tmpDir, 'plugin-registry.json');
    fs.writeFileSync(registryPath, JSON.stringify({
      version: '1.0.0',
      plugins: [
        { name: 'good-plugin', source: 'good', enabled: true },
        { name: 'bad-plugin', source: 'does-not-exist', enabled: true },
      ]
    }, null, 2), 'utf-8');

    // Create good plugin
    const goodDir = path.join(tmpDir, 'core');
    fs.mkdirSync(goodDir, { recursive: true });
    const goodPluginDir = path.join(goodDir, 'good');
    fs.mkdirSync(goodPluginDir, { recursive: true });
    fs.writeFileSync(
      path.join(goodPluginDir, 'plugin.json'),
      JSON.stringify({ name: 'good-plugin', version: '1.0.0', type: 'skill', description: 'Good' }),
      'utf-8'
    );
    fs.writeFileSync(
      path.join(goodPluginDir, 'skill.md'),
      '# Good',
      'utf-8'
    );

    const logger = new Logger({ level: 'info' });
    const loader = new PluginLoader({
      registryPath,
      eventBus: new EventBus(),
      stateStore: new StateStore({
        adapter: new (require('../../plugins/runtime/state-store')).MemoryAdapter()
      }),
      configManager: new ConfigManager(),
      logger
    });

    const loaded = await loader.loadAll();

    // Good plugin should still load
    assert.ok(loaded.includes('good-plugin'), 'good plugin loaded despite bad plugin');

    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
