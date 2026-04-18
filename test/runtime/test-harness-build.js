/**
 * Unit tests for HarnessBuild
 * Run with: node --test test/runtime/test-harness-build.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const HarnessBuild = require('../../plugins/runtime/harness-build');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to create a test plugin
function createTestPlugin(tmpDir, name, type, options = {}) {
  const pluginsDir = path.join(tmpDir, 'plugins', 'core');
  if (!fs.existsSync(pluginsDir)) {
    fs.mkdirSync(pluginsDir, { recursive: true });
  }

  const pluginDir = path.join(pluginsDir, name);
  if (!fs.existsSync(pluginDir)) {
    fs.mkdirSync(pluginDir, { recursive: true });
  }

  // Create plugin.json
  const pluginJson = {
    name,
    version: options.version || '0.0.1',
    type,
    description: options.description || 'Test plugin',
    triggers: options.triggers || [],
    metadata: options.metadata || {}
  };

  if (options.provides) {
    pluginJson.provides = options.provides;
  }

  fs.writeFileSync(
    path.join(pluginDir, 'plugin.json'),
    JSON.stringify(pluginJson, null, 2),
    'utf-8'
  );

  // Create skill.md for skill plugins
  if (type === 'skill') {
    const skillContent = options.skillContent || `# ${name}\n\nTest skill content.`;
    fs.writeFileSync(path.join(pluginDir, 'skill.md'), skillContent, 'utf-8');
  }

  // Create index.js for hook/validator/provider plugins
  if (type === 'hook' || type === 'validator' || type === 'provider') {
    const indexContent = options.indexContent || `
'use strict';
module.exports = { name: '${name}', version: '0.0.1' };
`;
    fs.writeFileSync(path.join(pluginDir, 'index.js'), indexContent, 'utf-8');
  }

  return pluginDir;
}

// Helper to create a test registry
function createTestRegistry(tmpDir, plugins) {
  const registryPath = path.join(tmpDir, 'plugins', 'plugin-registry.json');
  const registryDir = path.dirname(registryPath);
  if (!fs.existsSync(registryDir)) {
    fs.mkdirSync(registryDir, { recursive: true });
  }

  const registry = {
    version: '1.0.0',
    plugins: plugins.map(p => ({
      name: p.name,
      source: p.source || p.name,
      enabled: p.enabled !== false
    }))
  };

  fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

  // Create minimal config to avoid validation errors
  const configDir = path.join(tmpDir, '.claude', 'config');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  fs.writeFileSync(
    path.join(configDir, 'harness-config.yaml'),
    '# Minimal test config\ncontext_window:\n  enabled: true\n',
    'utf-8'
  );

  return registryPath;
}

test.describe('HarnessBuild - Construction', () => {
  test('should construct with default options', () => {
    const builder = new HarnessBuild();

    assert.ok(builder, 'builder created');
    assert.strictEqual(typeof builder.build, 'function', 'has build method');
    assert.strictEqual(typeof builder.validate, 'function', 'has validate method');
  });

  test('should construct with custom rootDir', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    const builder = new HarnessBuild({ rootDir: tmpDir });

    assert.ok(builder, 'builder created with custom root');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('HarnessBuild - Validate', () => {
  test('validate() should pass for empty registry', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, []);

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.validate();

    assert.strictEqual(result.valid, true, 'empty registry is valid');
    assert.strictEqual(result.errors.length, 0, 'no errors');
    assert.ok(result.summary.includes('nothing to validate'), 'summary mentions empty registry');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('validate() should detect missing plugin directory', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'missing-plugin', source: 'does-not-exist' }]);

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.validate();

    assert.strictEqual(result.valid, false, 'validation fails for missing directory');
    assert.ok(result.errors.length > 0, 'has errors');
    assert.ok(result.errors.some(e => e.message.includes('not found')), 'error mentions directory not found');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('validate() should check required fields', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-plugin' }]);

    // Create plugin with invalid plugin.json
    const pluginsDir = path.join(tmpDir, 'plugins', 'core');
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.mkdirSync(path.join(pluginsDir, 'test-plugin'), { recursive: true });

    // Missing required fields
    fs.writeFileSync(
      path.join(pluginsDir, 'test-plugin', 'plugin.json'),
      JSON.stringify({ name: 'test-plugin' }), // missing type, version, description
      'utf-8'
    );

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.validate();

    assert.strictEqual(result.valid, false, 'validation fails for missing fields');
    assert.ok(result.errors.some(e => e.field === 'type'), 'missing type error');
    assert.ok(result.errors.some(e => e.field === 'version'), 'missing version error');
    assert.ok(result.errors.some(e => e.field === 'description'), 'missing description error');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('validate() should check skill.md for skill plugins', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-skill' }]);

    createTestPlugin(tmpDir, 'test-skill', 'skill');
    // Remove skill.md
    const skillMdPath = path.join(tmpDir, 'plugins', 'core', 'test-skill', 'skill.md');
    if (fs.existsSync(skillMdPath)) {
      fs.unlinkSync(skillMdPath);
    }

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.validate();

    assert.strictEqual(result.valid, false, 'validation fails for missing skill.md');
    assert.ok(result.errors.some(e => e.field === 'skill.md'), 'error mentions skill.md');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('validate() should validate plugin type', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-plugin' }]);

    createTestPlugin(tmpDir, 'test-plugin', 'invalid-type');

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.validate();

    assert.strictEqual(result.valid, false, 'validation fails for invalid type');
    assert.ok(result.errors.some(e => e.field === 'type'), 'error mentions type field');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('HarnessBuild - Build', () => {
  test('build() should build skill plugins', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-skill' }]);

    createTestPlugin(tmpDir, 'test-skill', 'skill', {
      skillContent: '# Test Skill\n\nThis is a test skill.'
    });

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds');
    assert.strictEqual(result.built.length, 1, 'one plugin built');
    assert.strictEqual(result.built[0].name, 'test-skill', 'correct plugin name');
    assert.strictEqual(result.built[0].type, 'skill', 'correct type');

    const outputPath = path.join(tmpDir, '.claude', 'skills', 'test-skill', 'skill.md');
    assert.ok(fs.existsSync(outputPath), 'skill.md file created');
    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.includes('# Test Skill'), 'content preserved');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('build() should build hook plugins', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-hook' }]);

    const indexContent = `
'use strict';
module.exports = {
  name: 'test-hook',
  version: '0.0.1',
  async handle(context) { return { allowed: true }; }
};
`;
    createTestPlugin(tmpDir, 'test-hook', 'hook', { indexContent });

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds');
    assert.strictEqual(result.built.length, 1, 'one plugin built');
    assert.strictEqual(result.built[0].type, 'hook', 'correct type');

    const outputPath = path.join(tmpDir, '.claude', 'hooks', 'test-hook', 'index.js');
    assert.ok(fs.existsSync(outputPath), 'index.js file created');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('build() should skip disabled plugins', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [
      { name: 'enabled-skill' },
      { name: 'disabled-skill', enabled: false }
    ]);

    createTestPlugin(tmpDir, 'enabled-skill', 'skill');
    createTestPlugin(tmpDir, 'disabled-skill', 'skill');

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds');
    assert.strictEqual(result.built.length, 1, 'only enabled plugin built');
    assert.strictEqual(result.built[0].name, 'enabled-skill', 'correct plugin built');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('build() should handle empty registry', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, []);

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds with empty registry');
    assert.strictEqual(result.built.length, 0, 'no plugins built');
    assert.ok(result.summary.includes('empty'), 'summary mentions empty registry');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('HarnessBuild - Validator and Provider', () => {
  test('build() should handle validator plugins', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-validator' }]);

    createTestPlugin(tmpDir, 'test-validator', 'validator');

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds');
    assert.strictEqual(result.built.length, 1, 'one plugin built');
    assert.strictEqual(result.built[0].type, 'validator', 'correct type');
    assert.strictEqual(result.built[0].outputPath, '(internal)', 'validator has no file output');
    assert.strictEqual(result.built[0].files.length, 0, 'no files written');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('build() should handle provider plugins', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-provider' }]);

    createTestPlugin(tmpDir, 'test-provider', 'provider', {
      provides: ['provider:test']
    });

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds');
    assert.strictEqual(result.built.length, 1, 'one plugin built');
    assert.strictEqual(result.built[0].type, 'provider', 'correct type');
    assert.strictEqual(result.built[0].outputPath, '(internal)', 'provider has no file output by default');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('HarnessBuild - Front Matter Injection', () => {
  test('build() should add front matter to skill.md without it', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-skill' }]);

    // Create skill.md without front matter
    createTestPlugin(tmpDir, 'test-skill', 'skill', {
      skillContent: '# Test Skill\n\nContent without front matter.'
    });

    const builder = new HarnessBuild({ rootDir: tmpDir });
    builder.build();

    const outputPath = path.join(tmpDir, '.claude', 'skills', 'test-skill', 'skill.md');
    const content = fs.readFileSync(outputPath, 'utf-8');

    assert.ok(content.startsWith('---'), 'starts with front matter delimiter');
    assert.ok(content.includes('name: test-skill'), 'includes name in front matter');
    assert.ok(content.includes('description:'), 'includes description in front matter');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  test('build() should preserve existing front matter', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'test-skill' }]);

    // Create skill.md with front matter
    const existingFrontMatter = `---
name: test-skill
description: Existing description
---
# Test Skill

Content here.
`;
    createTestPlugin(tmpDir, 'test-skill', 'skill', {
      skillContent: existingFrontMatter
    });

    const builder = new HarnessBuild({ rootDir: tmpDir });
    builder.build();

    const outputPath = path.join(tmpDir, '.claude', 'skills', 'test-skill', 'skill.md');
    const content = fs.readFileSync(outputPath, 'utf-8');

    assert.ok(content.includes('description: Existing description'), 'preserves existing description');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});

test.describe('HarnessBuild - Error Handling', () => {
  test('build() should handle missing plugin.json gracefully', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'harness-build-test-'));
    createTestRegistry(tmpDir, [{ name: 'broken-plugin' }]);

    // Create plugin directory but no plugin.json
    const pluginsDir = path.join(tmpDir, 'plugins', 'core');
    fs.mkdirSync(pluginsDir, { recursive: true });
    fs.mkdirSync(path.join(pluginsDir, 'broken-plugin'), { recursive: true });

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, false, 'build fails for missing plugin.json');
    assert.ok(result.errors.length > 0, 'has errors');

    // Cleanup
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });
});
