/**
 * Test script for ValidatorPipeline
 *
 * Tests:
 *   - VAL-001-T1: Build后运行 validator-doc-sync
 *   - VAL-001-T2: 阻塞模式下触发失败的验证
 *   - VAL-001-T3: 非阻塞模式下触发失败的验证
 */

'use strict';

var path = require('path');
var PluginLoader = require('./plugins/runtime/plugin-loader');
var EventBus = require('./plugins/runtime/event-bus');
var Logger = require('./plugins/runtime/logger');
var { ValidatorPipeline, ExecutionMode, WorkflowPhase } = require('./plugins/runtime/validator-pipeline');

async function runTests() {
  console.log('=== ValidatorPipeline Test Suite ===\n');

  // Initialize runtime components
  var eventBus = new EventBus();
  var logger = new Logger({ level: 'info' });
  var pluginLoader = new PluginLoader({
    registryPath: path.join(__dirname, 'plugins', 'plugin-registry.json'),
    eventBus: eventBus,
    logger: logger,
  });

  // Load and activate all plugins
  console.log('Loading plugins...');
  await pluginLoader.loadAll();
  var loaded = pluginLoader.getLoadedNames();
  console.log('Loaded ' + loaded.length + ' plugins: ' + loaded.join(', ') + '\n');

  // Get ValidatorPipeline instance
  var validatorPipeline = pluginLoader.getValidatorPipeline();
  if (!validatorPipeline) {
    console.error('ValidatorPipeline not initialized! Make sure validator plugins are registered.');
    process.exit(1);
  }

  var testsPassed = 0;
  var testsFailed = 0;

  // Test VAL-001-T1: Build后运行 validator-doc-sync
  console.log('--- VAL-001-T1: Build后运行 validator-doc-sync ---');
  try {
    var result = await validatorPipeline.runValidator('validator-doc-sync', {
      mode: ExecutionMode.NON_BLOCKING,
    });
    console.log('Result: passed=' + result.passed + ', errors=' + result.errors.length + ', warnings=' + result.warnings.length);
    if (result.warnings.length > 0) {
      console.log('Warnings: ' + result.warnings.map(function (w) { return w.message || String(w); }).join(', '));
    }
    if (result.errors.length > 0) {
      console.log('Errors: ' + result.errors.map(function (e) { return e.message || String(e); }).join(', '));
    }
    console.log('✓ VAL-001-T1 PASSED\n');
    testsPassed++;
  } catch (err) {
    console.log('✗ VAL-001-T1 FAILED: ' + err.message + '\n');
    testsFailed++;
  }

  // Test VAL-001-T2: 阻塞模式下触发失败的验证
  console.log('--- VAL-001-T2: 阻塞模式下触发失败的验证 ---');
  try {
    // First, create a temporary invalid WP for testing
    var fs = require('fs');
    var testWpPath = path.join(__dirname, 'docs', 'wp', 'WP-TEST.md');

    // Write an invalid WP (missing required sections)
    fs.writeFileSync(testWpPath, '# WP-TEST\n\nThis is a test WP without required sections.\n');

    var wpValidator = pluginLoader.getPlugin('validator-work-package');
    if (wpValidator) {
      // This should fail in blocking mode
      await validatorPipeline.runValidator('validator-work-package', {
        mode: ExecutionMode.BLOCKING,
        context: { wpPath: testWpPath },
      });
      console.log('✗ VAL-001-T2 FAILED: Expected validation error but none thrown\n');
      testsFailed++;
    } else {
      console.log('⊘ VAL-001-T2 SKIPPED: validator-work-package not found\n');
    }
  } catch (err) {
    // Expected to throw in blocking mode
    console.log('Caught expected error: ' + err.message.substring(0, 100) + '...');
    console.log('✓ VAL-001-T2 PASSED\n');
    testsPassed++;
  } finally {
    // Clean up test file
    try {
      var fs = require('fs');
      var testWpPath = path.join(__dirname, 'docs', 'wp', 'WP-TEST.md');
      if (fs.existsSync(testWpPath)) {
        fs.unlinkSync(testWpPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Test VAL-001-T3: 非阻塞模式下触发失败的验证
  console.log('--- VAL-001-T3: 非阻塞模式下触发失败的验证 ---');
  try {
    var fs = require('fs');
    var testWpPath = path.join(__dirname, 'docs', 'wp', 'WP-TEST2.md');

    // Write an invalid WP
    fs.writeFileSync(testWpPath, '# WP-TEST2\n\nAnother invalid test WP.\n');

    var wpValidator = pluginLoader.getPlugin('validator-work-package');
    if (wpValidator) {
      // This should NOT throw in non-blocking mode
      var result3 = await validatorPipeline.runValidator('validator-work-package', {
        mode: ExecutionMode.NON_BLOCKING,
        context: { wpPath: testWpPath },
      });
      console.log('Result: passed=' + result3.passed + ', errors=' + result3.errors.length + ', warnings=' + result3.warnings.length);
      if (!result3.passed && result3.errors.length > 0) {
        console.log('✓ VAL-001-T3 PASSED: Validation failed but continued in non-blocking mode\n');
        testsPassed++;
      } else {
        console.log('✗ VAL-001-T3 FAILED: Expected validation to fail but passed=true\n');
        testsFailed++;
      }
    } else {
      console.log('⊘ VAL-001-T3 SKIPPED: validator-work-package not found\n');
    }
  } catch (err) {
    console.log('✗ VAL-001-T3 FAILED: Unexpected error in non-blocking mode: ' + err.message + '\n');
    testsFailed++;
  } finally {
    // Clean up test file
    try {
      var fs = require('fs');
      var testWpPath = path.join(__dirname, 'docs', 'wp', 'WP-TEST2.md');
      if (fs.existsSync(testWpPath)) {
        fs.unlinkSync(testWpPath);
      }
    } catch (e) {
      // Ignore cleanup errors
    }
  }

  // Test runPostBuildValidators
  console.log('--- Test runPostBuildValidators (Post-Build Phase) ---');
  try {
    var buildResult = await validatorPipeline.runPostBuildValidators();
    console.log('Build validators: overallPassed=' + buildResult.overallPassed + ', totalErrors=' + buildResult.totalErrors + ', totalWarnings=' + buildResult.totalWarnings);
    console.log('✓ Post-build validators completed\n');
    testsPassed++;
  } catch (err) {
    console.log('✗ Post-build validators failed: ' + err.message + '\n');
    testsFailed++;
  }

  // Test runAllValidators with phase filtering
  console.log('--- Test runAllValidators (Manual Phase) ---');
  try {
    var allResult = await validatorPipeline.runAllValidators({
      phase: WorkflowPhase.MANUAL,
      mode: ExecutionMode.NON_BLOCKING,
    });
    console.log('All validators: overallPassed=' + allResult.overallPassed + ', totalErrors=' + allResult.totalErrors + ', totalWarnings=' + allResult.totalWarnings);
    console.log('Validators executed: ' + allResult.results.length);
    console.log('✓ Manual phase validators completed\n');
    testsPassed++;
  } catch (err) {
    console.log('✗ Manual phase validators failed: ' + err.message + '\n');
    testsFailed++;
  }

  // Summary
  console.log('=== Test Summary ===');
  console.log('Passed: ' + testsPassed);
  console.log('Failed: ' + testsFailed);
  console.log('Total:  ' + (testsPassed + testsFailed));

  if (testsFailed === 0) {
    console.log('\n✓ All tests PASSED!');
    process.exit(0);
  } else {
    console.log('\n✗ Some tests FAILED!');
    process.exit(1);
  }
}

// Run tests
runTests().catch(function (err) {
  console.error('Fatal error: ' + err.message);
  console.error(err.stack);
  process.exit(1);
});
