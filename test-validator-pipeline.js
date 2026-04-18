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

  // WP-029-T1: 验证 runPostBuildValidators 至少执行 1 个 validator
  console.log('--- WP-029-T1: runPostBuildValidators 应执行 validator-doc-sync ---');
  try {
    var postBuildResult = await validatorPipeline.runPostBuildValidators({
      mode: ExecutionMode.NON_BLOCKING,
    });
    var executedCount = postBuildResult.results.length;
    console.log('Validators executed: ' + executedCount);
    if (executedCount >= 1) {
      // Check if validator-doc-sync is in results
      var hasDocSync = postBuildResult.results.some(function (r) {
        return r.validator === 'validator-doc-sync';
      });
      if (hasDocSync) {
        console.log('✓ WP-029-T1 PASSED: validator-doc-sync executed\n');
        testsPassed++;
      } else {
        console.log('✗ WP-029-T1 FAILED: validator-doc-sync not found in results\n');
        testsFailed++;
      }
    } else {
      console.log('✗ WP-029-T1 FAILED: No validators executed for build phase\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('✗ WP-029-T1 FAILED: ' + err.message + '\n');
    testsFailed++;
  }

  // WP-029-T2: runAllValidators({ phase: 'manual' }) 应执行所有 validators
  console.log('--- WP-029-T2: Manual phase should execute all validators ---');
  try {
    var manualResult = await validatorPipeline.runAllValidators({
      phase: WorkflowPhase.MANUAL,
      mode: ExecutionMode.NON_BLOCKING,
    });
    var manualCount = manualResult.results.length;
    console.log('Validators executed for manual phase: ' + manualCount);
    if (manualCount >= 2) {
      // Both validator-doc-sync and validator-work-package should run
      var hasDocSync = manualResult.results.some(function (r) {
        return r.validator === 'validator-doc-sync';
      });
      var hasWpValidator = manualResult.results.some(function (r) {
        return r.validator === 'validator-work-package';
      });
      if (hasDocSync && hasWpValidator) {
        console.log('✓ WP-029-T2 PASSED: Both validators executed for manual phase\n');
        testsPassed++;
      } else {
        console.log('✗ WP-029-T2 FAILED: Missing validators (doc-sync: ' + hasDocSync + ', wp-validator: ' + hasWpValidator + ')\n');
        testsFailed++;
      }
    } else {
      console.log('✗ WP-029-T2 FAILED: Expected at least 2 validators, got ' + manualCount + '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('✗ WP-029-T2 FAILED: ' + err.message + '\n');
    testsFailed++;
  }

  // WP-029-T3: runAllValidators({ phase: 'wp-create' }) 应仅执行 validator-work-package
  console.log('--- WP-029-T3: WP-Create phase should only execute validator-work-package ---');
  try {
    var wpCreateResult = await validatorPipeline.runAllValidators({
      phase: WorkflowPhase.WP_CREATE,
      mode: ExecutionMode.NON_BLOCKING,
    });
    var wpCreateCount = wpCreateResult.results.length;
    console.log('Validators executed for wp-create phase: ' + wpCreateCount);
    if (wpCreateCount === 1) {
      var result = wpCreateResult.results[0];
      if (result.validator === 'validator-work-package') {
        console.log('✓ WP-029-T3 PASSED: Only validator-work-package executed for wp-create phase\n');
        testsPassed++;
      } else {
        console.log('✗ WP-029-T3 FAILED: Expected validator-work-package, got ' + result.validator + '\n');
        testsFailed++;
      }
    } else {
      console.log('✗ WP-029-T3 FAILED: Expected exactly 1 validator for wp-create phase, got ' + wpCreateCount + '\n');
      testsFailed++;
    }
  } catch (err) {
    console.log('✗ WP-029-T3 FAILED: ' + err.message + '\n');
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
