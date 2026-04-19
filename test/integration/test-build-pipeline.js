/**
 * Integration tests for Build Pipeline
 * Tests the complete flow: registry -> build -> skill.md/hook output
 * Run with: node --test test/integration/test-build-pipeline.js
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const HarnessBuild = require('../../plugins/runtime/harness-build');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to create a complete test setup
function createTestProject(tmpDir) {
  // Create directory structure
  const dirs = [
    path.join(tmpDir, 'plugins', 'core'),
    path.join(tmpDir, '.claude'),
    path.join(tmpDir, '.claude', 'config'),
    path.join(tmpDir, '.claude', 'skills'),
    path.join(tmpDir, '.claude', 'hooks'),
  ];
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });

  // Create minimal harness-config.yaml
  fs.writeFileSync(
    path.join(tmpDir, '.claude', 'config', 'harness-config.yaml'),
    '# Minimal test config\ncontext_window:\n  enabled: true\n',
    'utf-8'
  );

  // Create registry
  const registry = {
    version: '1.0.0',
    plugins: [
      { name: 'test-skill-1', source: 'skill1', enabled: true },
      { name: 'test-skill-2', source: 'skill2', enabled: true },
      { name: 'test-hook', source: 'hook1', enabled: true },
    ]
  };
  fs.writeFileSync(
    path.join(tmpDir, 'plugins', 'plugin-registry.json'),
    JSON.stringify(registry, null, 2),
    'utf-8'
  );

  // Create skill plugins
  const skill1Dir = path.join(tmpDir, 'plugins', 'core', 'skill1');
  fs.mkdirSync(skill1Dir, { recursive: true });
  fs.writeFileSync(
    path.join(skill1Dir, 'plugin.json'),
    JSON.stringify({
      name: 'test-skill-1',
      version: '1.0.0',
      type: 'skill',
      description: 'First test skill',
      triggers: ['test1', 'first'],
      metadata: { stage: 'planning' }
    }, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(skill1Dir, 'skill.md'),
    '# Test Skill 1\n\nThis is the first test skill.',
    'utf-8'
  );

  const skill2Dir = path.join(tmpDir, 'plugins', 'core', 'skill2');
  fs.mkdirSync(skill2Dir, { recursive: true });
  fs.writeFileSync(
    path.join(skill2Dir, 'plugin.json'),
    JSON.stringify({
      name: 'test-skill-2',
      version: '2.0.0',
      type: 'skill',
      description: 'Second test skill',
      triggers: ['test2', 'second'],
      config: { plan_mode_required: true }
    }, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(skill2Dir, 'skill.md'),
    '# Test Skill 2\n\nThis is the second test skill.',
    'utf-8'
  );

  // Create hook plugin
  const hookDir = path.join(tmpDir, 'plugins', 'core', 'hook1');
  fs.mkdirSync(hookDir, { recursive: true });
  fs.writeFileSync(
    path.join(hookDir, 'plugin.json'),
    JSON.stringify({
      name: 'test-hook',
      version: '1.0.0',
      type: 'hook',
      description: 'Test hook plugin',
    }, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(hookDir, 'index.js'),
    `
'use strict';
module.exports = {
  name: 'test-hook',
  version: '1.0.0',
  async handle(context) {
    return { allowed: true };
  }
};
`,
    'utf-8'
  );

  return tmpDir;
}

// Helper to cleanup test project
function cleanupTestProject(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

test.describe('Build Pipeline Integration', () => {
  test('complete build pipeline: registry -> build -> output', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    // Verify build result
    assert.strictEqual(result.success, true, 'build succeeds');
    assert.strictEqual(result.built.length, 3, 'all plugins built');

    // Verify skill outputs
    const skill1Path = path.join(tmpDir, '.claude', 'skills', 'test-skill-1', 'skill.md');
    const skill2Path = path.join(tmpDir, '.claude', 'skills', 'test-skill-2', 'skill.md');
    const hookPath = path.join(tmpDir, '.claude', 'hooks', 'test-hook', 'index.js');

    assert.ok(fs.existsSync(skill1Path), 'skill1 output exists');
    assert.ok(fs.existsSync(skill2Path), 'skill2 output exists');
    assert.ok(fs.existsSync(hookPath), 'hook output exists');

    // Verify skill content
    const skill1Content = fs.readFileSync(skill1Path, 'utf-8');
    assert.ok(skill1Content.includes('# Test Skill 1'), 'skill content preserved');
    assert.ok(skill1Content.includes('---'), 'front matter added');
    assert.ok(skill1Content.includes('name: test-skill-1'), 'name in front matter');

    const skill2Content = fs.readFileSync(skill2Path, 'utf-8');
    assert.ok(skill2Content.includes('plan_mode_required: true'), 'plan mode config preserved');

    // Verify hook content
    const hookContent = fs.readFileSync(hookPath, 'utf-8');
    assert.ok(hookContent.includes('async handle'), 'hook implementation preserved');

    cleanupTestProject(tmpDir);
  });

  test('build with validation pass before build', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    const builder = new HarnessBuild({ rootDir: tmpDir });

    // First validate
    const validationResult = builder.validate();
    assert.strictEqual(validationResult.valid, true, 'validation passes');

    // Then build
    const buildResult = builder.build();
    assert.strictEqual(buildResult.success, true, 'build succeeds after validation');

    cleanupTestProject(tmpDir);
  });

  test('build handles disabled plugins correctly', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    // Modify registry to disable skill2
    const registryPath = path.join(tmpDir, 'plugins', 'plugin-registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    registry.plugins[1].enabled = false; // Disable test-skill-2
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.built.length, 2, 'only enabled plugins built');

    const skill2Path = path.join(tmpDir, '.claude', 'skills', 'test-skill-2', 'skill.md');
    assert.ok(!fs.existsSync(skill2Path), 'disabled plugin not built');

    cleanupTestProject(tmpDir);
  });

  test('build is idempotent - can run multiple times', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    const builder = new HarnessBuild({ rootDir: tmpDir });

    // First build
    const result1 = builder.build();
    assert.strictEqual(result1.success, true);

    // Get file modification times
    const skill1Path = path.join(tmpDir, '.claude', 'skills', 'test-skill-1', 'skill.md');
    const mtime1 = fs.statSync(skill1Path).mtimeMs;

    // Wait a bit and build again
    const start = Date.now();
    while (Date.now() - start < 10) { /* wait */ }

    const result2 = builder.build();
    assert.strictEqual(result2.success, true);

    const mtime2 = fs.statSync(skill1Path).mtimeMs;

    // File should be overwritten (mtime changed)
    assert.ok(mtime2 >= mtime1, 'file overwritten on second build');

    cleanupTestProject(tmpDir);
  });

  test('build generates skill.md from metadata when skill.md missing', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    // Remove skill.md from skill1
    const skill1MdPath = path.join(tmpDir, 'plugins', 'core', 'skill1', 'skill.md');
    if (fs.existsSync(skill1MdPath)) {
      fs.unlinkSync(skill1MdPath);
    }

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds despite missing skill.md');

    const outputPath = path.join(tmpDir, '.claude', 'skills', 'test-skill-1', 'skill.md');
    assert.ok(fs.existsSync(outputPath), 'skill.md generated');

    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.includes('# test-skill-1'), 'title generated from metadata');
    assert.ok(content.includes('First test skill'), 'description from metadata');
    assert.ok(content.includes('Auto-generated'), 'includes auto-generated marker');

    cleanupTestProject(tmpDir);
  });

  test('build generates stub hook when index.js missing', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    // Remove index.js from hook
    const hookIndexPath = path.join(tmpDir, 'plugins', 'core', 'hook1', 'index.js');
    if (fs.existsSync(hookIndexPath)) {
      fs.unlinkSync(hookIndexPath);
    }

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, true, 'build succeeds despite missing index.js');

    const outputPath = path.join(tmpDir, '.claude', 'hooks', 'test-hook', 'index.js');
    assert.ok(fs.existsSync(outputPath), 'index.js stub generated');

    const content = fs.readFileSync(outputPath, 'utf-8');
    assert.ok(content.includes('Auto-generated stub'), 'includes stub marker');
    assert.ok(content.includes('test-hook'), 'includes hook name');

    cleanupTestProject(tmpDir);
  });

  test('build summary includes correct counts', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.ok(result.summary.includes('Plugins built: 3'), 'summary shows 3 plugins');
    assert.ok(result.summary.includes('Skills:'), 'summary shows skill count');
    assert.ok(result.summary.includes('Hooks:'), 'summary shows hook count');
    assert.ok(result.summary.includes('SUCCEEDED'), 'summary shows success');

    cleanupTestProject(tmpDir);
  });
});

test.describe('Build Pipeline Error Scenarios', () => {
  test('build fails with validation errors for invalid plugin', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    // Corrupt plugin.json for skill1
    const skill1JsonPath = path.join(tmpDir, 'plugins', 'core', 'skill1', 'plugin.json');
    fs.writeFileSync(skill1JsonPath, '{ invalid json', 'utf-8');

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    assert.strictEqual(result.success, false, 'build fails for invalid plugin');
    assert.ok(result.errors.length > 0, 'errors reported');

    cleanupTestProject(tmpDir);
  });

  test('build continues with partial success on individual plugin failure', () => {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'build-pipeline-test-'));
    createTestProject(tmpDir);

    // Remove skill2 directory completely
    const skill2Dir = path.join(tmpDir, 'plugins', 'core', 'skill2');
    fs.rmSync(skill2Dir, { recursive: true });

    // Update registry to reference the missing plugin
    const registryPath = path.join(tmpDir, 'plugins', 'plugin-registry.json');
    const registry = JSON.parse(fs.readFileSync(registryPath, 'utf-8'));
    fs.writeFileSync(registryPath, JSON.stringify(registry, null, 2), 'utf-8');

    const builder = new HarnessBuild({ rootDir: tmpDir });
    const result = builder.build();

    // Build should still succeed for other plugins
    assert.ok(result.built.length > 0, 'some plugins built despite errors');

    cleanupTestProject(tmpDir);
  });
});
