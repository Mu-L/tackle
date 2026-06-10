/**
 * Unit tests for Watchdog Multi-Window Extension
 * Run with: node --test test/runtime/test-watchdog-multi-window.js
 */

'use strict';

var test = require('node:test');
var assert = require('node:assert');
var fs = require('fs');
var path = require('path');
var os = require('os');

var mwc = require('../../plugins/core/provider-watchdog/assets/lib/watchdog-multi-window');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'wmw-test-'));
}

function writeJson(filePath, obj) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(obj, null, 2), 'utf-8');
}

function cleanupTmpDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (_e) { /* ignore */ }
}

function makeSession(opts) {
  opts = opts || {};
  return {
    session_id: opts.session_id || 'mws-test-001',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    status: opts.status || 'active',
    total_windows: opts.total_windows || 2,
    total_tasks: opts.total_tasks || 4,
    completed_tasks: opts.completed_tasks || 0,
    failed_tasks: opts.failed_tasks || 0,
    stages: opts.stages || [
      {
        stage_id: 1,
        name: 'impl',
        status: 'active',
        windows: ['win-1', 'win-2'],
        work_packages: ['WP-172', 'WP-173']
      }
    ],
    windows: opts.windows || {},
    global_concurrency: { max_total: 8, current_active: 0 },
    stage_transitions: []
  };
}

function makeWindowEntry(opts) {
  opts = opts || {};
  return {
    window_id: opts.window_id || 'win-1',
    pid: opts.pid || 12345,
    status: opts.status || 'active',
    current_stage: opts.current_stage || 1,
    assigned_wps: opts.assigned_wps || ['WP-172'],
    heartbeat: opts.heartbeat !== undefined ? opts.heartbeat : {
      last_update: new Date().toISOString(),
      loop_iteration: 10,
      completed: 1,
      in_progress: 1,
      pending: 0
    },
    error: opts.error || null
  };
}

// ─────────────────────────────────────────────
// Section 1: Multi-Window Mode Detection
// ─────────────────────────────────────────────

test.describe('isMultiWindowMode', function () {
  test('should return true when session file exists', function () {
    var tmpDir = makeTmpDir();
    try {
      writeJson(path.join(tmpDir, 'multi-window-session.json'), { session_id: 'test' });
      assert.strictEqual(mwc.isMultiWindowMode(tmpDir), true);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should return false when session file does not exist', function () {
    var tmpDir = makeTmpDir();
    try {
      assert.strictEqual(mwc.isMultiWindowMode(tmpDir), false);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});

test.describe('readSession', function () {
  test('should read valid session file', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({ session_id: 'mws-read-test' });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var result = mwc.readSession(tmpDir);
      assert.strictEqual(result.session_id, 'mws-read-test');
      assert.strictEqual(result.status, 'active');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should return null when file does not exist', function () {
    var result = mwc.readSession('/non/existent/path');
    assert.strictEqual(result, null);
  });
});

test.describe('loadMultiWindowConfig', function () {
  test('should return defaults when no multi_window section', function () {
    var config = mwc.loadMultiWindowConfig({});
    assert.strictEqual(config.heartbeat_timeout_sec, 120);
    assert.strictEqual(config.stage_stall_timeout_sec, 600);
    assert.strictEqual(config.circuit_breaker.consecutive_failures_threshold, 3);
    assert.strictEqual(config.circuit_breaker.cooldown_after_break_sec, 900);
  });

  test('should merge custom values', function () {
    var daemonConfig = {
      multi_window: {
        heartbeat_timeout_sec: 60,
        stage_stall_timeout_sec: 300,
        circuit_breaker: {
          consecutive_failures_threshold: 5
        }
      }
    };
    var config = mwc.loadMultiWindowConfig(daemonConfig);
    assert.strictEqual(config.heartbeat_timeout_sec, 60);
    assert.strictEqual(config.stage_stall_timeout_sec, 300);
    assert.strictEqual(config.circuit_breaker.consecutive_failures_threshold, 5);
    // cooldown should use default
    assert.strictEqual(config.circuit_breaker.cooldown_after_break_sec, 900);
  });

  test('should handle null config', function () {
    var config = mwc.loadMultiWindowConfig(null);
    assert.strictEqual(config.heartbeat_timeout_sec, 120);
  });
});

// ─────────────────────────────────────────────
// Section 2: L4 Cross-Window Detection
// ─────────────────────────────────────────────

test.describe('detectCrossWindowIssues', function () {
  test('should report no alerts for healthy windows', function () {
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' }),
        'win-2': makeWindowEntry({ window_id: 'win-2', status: 'active' })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 0);
    assert.strictEqual(result.summary.total, 2);
    assert.strictEqual(result.summary.active, 2);
    assert.strictEqual(result.summary.disconnected, 0);
    assert.strictEqual(result.summary.failed, 0);
  });

  test('should detect failed window', function () {
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' }),
        'win-2': makeWindowEntry({ window_id: 'win-2', status: 'failed' })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 1);
    assert.strictEqual(result.alerts[0].type, 'window_failed');
    assert.strictEqual(result.alerts[0].window_id, 'win-2');
    assert.strictEqual(result.summary.failed, 1);
    assert.strictEqual(result.summary.active, 1);
  });

  test('should detect disconnected window (session status)', function () {
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' }),
        'win-2': makeWindowEntry({ window_id: 'win-2', status: 'disconnected' })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 1);
    assert.strictEqual(result.alerts[0].type, 'window_disconnected');
    assert.strictEqual(result.summary.disconnected, 1);
  });

  test('should detect stale heartbeat', function () {
    var staleTime = new Date(Date.now() - 300000).toISOString(); // 5 minutes ago
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' }),
        'win-2': makeWindowEntry({
          window_id: 'win-2',
          status: 'active',
          heartbeat: {
            last_update: staleTime,
            loop_iteration: 5,
            completed: 0,
            in_progress: 1,
            pending: 1
          }
        })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 1);
    assert.strictEqual(result.alerts[0].type, 'heartbeat_stale');
    assert.strictEqual(result.alerts[0].window_id, 'win-2');
    assert.strictEqual(result.summary.disconnected, 1);
  });

  test('should detect missing heartbeat', function () {
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' }),
        'win-2': makeWindowEntry({ window_id: 'win-2', status: 'active', heartbeat: null })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 1);
    assert.strictEqual(result.alerts[0].type, 'no_heartbeat');
  });

  test('should handle empty session', function () {
    var result = mwc.detectCrossWindowIssues(null, {});
    assert.strictEqual(result.alerts.length, 0);
    assert.strictEqual(result.summary.total, 0);
  });

  test('should handle session with no windows', function () {
    var session = makeSession({ windows: {} });
    var result = mwc.detectCrossWindowIssues(session, {});
    assert.strictEqual(result.alerts.length, 0);
    assert.strictEqual(result.summary.total, 0);
  });
});

// ─────────────────────────────────────────────
// Section 3: L5 Stage-Level Detection
// ─────────────────────────────────────────────

test.describe('detectStageStall', function () {
  test('should not stall when windows have active work', function () {
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({
          window_id: 'win-1',
          heartbeat: {
            last_update: new Date().toISOString(),
            loop_iteration: 10,
            completed: 1,
            in_progress: 1,
            pending: 0
          }
        }),
        'win-2': makeWindowEntry({
          window_id: 'win-2',
          heartbeat: {
            last_update: new Date().toISOString(),
            loop_iteration: 8,
            completed: 0,
            in_progress: 1,
            pending: 1
          }
        })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, false);
  });

  test('should detect stage stall when all windows idle too long', function () {
    var staleTime = new Date(Date.now() - 900000).toISOString(); // 15 minutes ago
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({
          window_id: 'win-1',
          status: 'active',
          heartbeat: {
            last_update: staleTime,
            loop_iteration: 10,
            completed: 2,
            in_progress: 0,
            pending: 0
          }
        }),
        'win-2': makeWindowEntry({
          window_id: 'win-2',
          status: 'active',
          heartbeat: {
            last_update: staleTime,
            loop_iteration: 8,
            completed: 1,
            in_progress: 0,
            pending: 0
          }
        })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, true);
    assert.strictEqual(result.stage_id, 1);
    assert.strictEqual(result.stalled_windows.length, 2);
    assert.ok(result.duration_sec > 0);
  });

  test('should not stall when only some windows are idle', function () {
    var now = new Date().toISOString();
    var staleTime = new Date(Date.now() - 900000).toISOString();

    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({
          window_id: 'win-1',
          status: 'active',
          heartbeat: {
            last_update: staleTime,
            loop_iteration: 10,
            completed: 2,
            in_progress: 0,
            pending: 0
          }
        }),
        'win-2': makeWindowEntry({
          window_id: 'win-2',
          status: 'active',
          heartbeat: {
            last_update: now,
            loop_iteration: 8,
            completed: 1,
            in_progress: 1,
            pending: 0
          }
        })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, false);
  });

  test('should detect stall when window is disconnected', function () {
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'disconnected', heartbeat: null }),
        'win-2': makeWindowEntry({ window_id: 'win-2', status: 'disconnected', heartbeat: null })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, true);
    assert.strictEqual(result.stalled_windows.length, 2);
  });

  test('should return not stalled when no active stage', function () {
    var session = makeSession({
      stages: [
        { stage_id: 1, status: 'completed', windows: ['win-1'] }
      ],
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1' })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, false);
    assert.strictEqual(result.stage_id, null);
  });

  test('should handle null session', function () {
    var result = mwc.detectStageStall(null, {});
    assert.strictEqual(result.stalled, false);
  });

  test('should handle stage with empty windows list', function () {
    var session = makeSession({
      stages: [
        { stage_id: 1, status: 'active', windows: [] }
      ],
      windows: {}
    });
    var result = mwc.detectStageStall(session, {});
    assert.strictEqual(result.stalled, false);
  });
});

// ─────────────────────────────────────────────
// Section 4: Global Circuit Breaker
// ─────────────────────────────────────────────

test.describe('createCircuitBreakerState', function () {
  test('should create initial state', function () {
    var state = mwc.createCircuitBreakerState();
    assert.strictEqual(state.tripped, false);
    assert.strictEqual(state.consecutive_failures, 0);
    assert.strictEqual(state.total_failures, 0);
    assert.strictEqual(state.tripped_at, null);
    assert.deepStrictEqual(state.history, []);
  });
});

test.describe('recordFailure', function () {
  test('should increment consecutive failures', function () {
    var state = mwc.createCircuitBreakerState();
    var config = mwc.loadMultiWindowConfig({});

    mwc.recordFailure(state, 'test failure', config);

    assert.strictEqual(state.consecutive_failures, 1);
    assert.strictEqual(state.total_failures, 1);
    assert.ok(state.last_failure_at);
    assert.strictEqual(state.tripped, false);
    assert.strictEqual(state.history.length, 1);
    assert.strictEqual(state.history[0].type, 'failure');
  });

  test('should trip circuit breaker after threshold', function () {
    var state = mwc.createCircuitBreakerState();
    var config = mwc.loadMultiWindowConfig({});

    // Threshold is 3 by default
    mwc.recordFailure(state, 'fail 1', config);
    mwc.recordFailure(state, 'fail 2', config);
    assert.strictEqual(state.tripped, false);

    mwc.recordFailure(state, 'fail 3', config);
    assert.strictEqual(state.tripped, true);
    assert.ok(state.tripped_at);
    assert.ok(state.cooldown_until);
    // history: 3 failures + 1 tripped event
    assert.strictEqual(state.history.length, 4);
    assert.strictEqual(state.history[3].type, 'tripped');
  });

  test('should use custom threshold', function () {
    var state = mwc.createCircuitBreakerState();
    var config = {
      circuit_breaker: { consecutive_failures_threshold: 2, cooldown_after_break_sec: 60 }
    };

    mwc.recordFailure(state, 'fail 1', config);
    assert.strictEqual(state.tripped, false);

    mwc.recordFailure(state, 'fail 2', config);
    assert.strictEqual(state.tripped, true);
  });

  test('should keep history bounded to 50 entries', function () {
    var state = mwc.createCircuitBreakerState();
    var config = mwc.loadMultiWindowConfig({});

    for (var i = 0; i < 60; i++) {
      // Reset tripped to keep recording failures
      state.tripped = false;
      state.consecutive_failures = 0;
      mwc.recordFailure(state, 'fail ' + i, config);
    }

    assert.ok(state.history.length <= 50);
  });
});

test.describe('recordSuccess', function () {
  test('should reset consecutive failures', function () {
    var state = mwc.createCircuitBreakerState();
    state.consecutive_failures = 2;

    mwc.recordSuccess(state);

    assert.strictEqual(state.consecutive_failures, 0);
  });

  test('should reset tripped state after cooldown', function () {
    var state = mwc.createCircuitBreakerState();
    state.tripped = true;
    state.tripped_at = new Date(Date.now() - 1000000).toISOString();
    state.cooldown_until = new Date(Date.now() - 1000).toISOString(); // cooldown passed

    mwc.recordSuccess(state);

    assert.strictEqual(state.tripped, false);
    assert.strictEqual(state.cooldown_until, null);
  });

  test('should not reset tripped if cooldown not passed', function () {
    var state = mwc.createCircuitBreakerState();
    state.tripped = true;
    state.cooldown_until = new Date(Date.now() + 600000).toISOString(); // 10 min from now

    mwc.recordSuccess(state);

    assert.strictEqual(state.tripped, true);
  });

  test('should record recovery in history', function () {
    var state = mwc.createCircuitBreakerState();
    state.consecutive_failures = 3;

    mwc.recordSuccess(state);

    var recovery = state.history.find(function (h) { return h.type === 'recovered'; });
    assert.ok(recovery, 'should have recovery entry');
  });
});

test.describe('shouldAbortAll', function () {
  test('should return false when not tripped', function () {
    var state = mwc.createCircuitBreakerState();
    assert.strictEqual(mwc.shouldAbortAll(state), false);
  });

  test('should return true when tripped', function () {
    var state = mwc.createCircuitBreakerState();
    state.tripped = true;
    assert.strictEqual(mwc.shouldAbortAll(state), true);
  });
});

// ─────────────────────────────────────────────
// Section 5: Cross-Window Command Dispatch
// ─────────────────────────────────────────────

test.describe('dispatchCommand', function () {
  test('should write command to target window daemon-actions.json', function () {
    var tmpDir = makeTmpDir();
    try {
      var result = mwc.dispatchCommand(tmpDir, 'win-1', {
        action: 'restart',
        reason: 'test restart',
        target_task: '3'
      });

      assert.strictEqual(result.success, true);
      assert.ok(result.action_id);

      var actionsPath = path.join(tmpDir, 'windows', 'win-1', 'daemon-actions.json');
      var data = JSON.parse(fs.readFileSync(actionsPath, 'utf-8'));
      assert.strictEqual(data.actions.length, 1);
      assert.strictEqual(data.actions[0].action, 'restart');
      assert.strictEqual(data.actions[0].target_task, '3');
      assert.strictEqual(data.actions[0].source, 'watchdog-multi-window');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should append to existing actions', function () {
    var tmpDir = makeTmpDir();
    try {
      var actionsPath = path.join(tmpDir, 'windows', 'win-2', 'daemon-actions.json');
      writeJson(actionsPath, {
        actions: [{ id: 'existing-001', action: 'pause' }],
        last_updated: '2026-06-06T10:00:00Z'
      });

      var result = mwc.dispatchCommand(tmpDir, 'win-2', {
        action: 'abort',
        reason: 'test abort'
      });

      assert.strictEqual(result.success, true);

      var data = JSON.parse(fs.readFileSync(actionsPath, 'utf-8'));
      assert.strictEqual(data.actions.length, 2);
      assert.strictEqual(data.actions[0].id, 'existing-001');
      assert.strictEqual(data.actions[1].action, 'abort');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should create directory if not exists', function () {
    var tmpDir = makeTmpDir();
    try {
      var result = mwc.dispatchCommand(tmpDir, 'win-new', {
        action: 'restart',
        reason: 'new window'
      });

      assert.strictEqual(result.success, true);
      assert.ok(fs.existsSync(path.join(tmpDir, 'windows', 'win-new', 'daemon-actions.json')));
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});

test.describe('dispatchAbortAll', function () {
  test('should dispatch abort_all to all windows', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1' }),
          'win-2': makeWindowEntry({ window_id: 'win-2' }),
          'win-3': makeWindowEntry({ window_id: 'win-3' })
        }
      });

      var result = mwc.dispatchAbortAll(tmpDir, session, 'global circuit breaker');

      assert.strictEqual(result.results.length, 3);
      for (var i = 0; i < result.results.length; i++) {
        assert.strictEqual(result.results[i].success, true);
      }

      // Verify files were written
      var a1 = JSON.parse(fs.readFileSync(path.join(tmpDir, 'windows', 'win-1', 'daemon-actions.json'), 'utf-8'));
      assert.strictEqual(a1.actions[0].action, 'abort_all');
      assert.strictEqual(a1.actions[0].context.global_abort, true);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should handle null session', function () {
    var result = mwc.dispatchAbortAll('/tmp', null, 'test');
    assert.strictEqual(result.results.length, 0);
  });
});

// ─────────────────────────────────────────────
// Section 6: runMultiWindowCheck (Integration)
// ─────────────────────────────────────────────

test.describe('runMultiWindowCheck', function () {
  test('should return empty results when no session file', function () {
    var tmpDir = makeTmpDir();
    try {
      var result = mwc.runMultiWindowCheck(tmpDir, {});

      assert.strictEqual(result.session, null);
      assert.strictEqual(result.crossWindow.alerts.length, 0);
      assert.strictEqual(result.stageStall.stalled, false);
      assert.strictEqual(result.breakerState.tripped, false);
      assert.strictEqual(result.actions.length, 0);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should detect healthy session without triggering breaker', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' }),
          'win-2': makeWindowEntry({ window_id: 'win-2', status: 'active' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var result = mwc.runMultiWindowCheck(tmpDir, {});

      assert.ok(result.session, 'session loaded');
      assert.strictEqual(result.crossWindow.alerts.length, 0);
      assert.strictEqual(result.stageStall.stalled, false);
      assert.strictEqual(result.breakerState.consecutive_failures, 0);
      assert.strictEqual(result.actions.length, 0);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should trigger circuit breaker after consecutive failures', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'failed' }),
          'win-2': makeWindowEntry({ window_id: 'win-2', status: 'failed' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var breakerState = mwc.createCircuitBreakerState();

      // Run 3 checks (threshold) — each should see failed windows
      for (var i = 0; i < 3; i++) {
        mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      }

      assert.strictEqual(breakerState.tripped, true);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should dispatch abort_all when breaker trips', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'failed' }),
          'win-2': makeWindowEntry({ window_id: 'win-2', status: 'failed' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var breakerState = mwc.createCircuitBreakerState();

      // Run checks to trip the breaker
      var result;
      for (var i = 0; i < 3; i++) {
        result = mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      }

      // Last result should have abort_all action
      assert.ok(result.actions.length > 0, 'should have actions');
      assert.strictEqual(result.actions[0].type, 'abort_all');

      // Verify abort commands were written to both windows
      var a1Path = path.join(tmpDir, 'windows', 'win-1', 'daemon-actions.json');
      var a2Path = path.join(tmpDir, 'windows', 'win-2', 'daemon-actions.json');
      assert.ok(fs.existsSync(a1Path), 'win-1 actions file exists');
      assert.ok(fs.existsSync(a2Path), 'win-2 actions file exists');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should reset breaker on recovery', function () {
    var tmpDir = makeTmpDir();
    try {
      // First: failed session
      var failedSession = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'failed' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), failedSession);

      var breakerState = mwc.createCircuitBreakerState();
      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      assert.strictEqual(breakerState.consecutive_failures, 1);

      // Then: healthy session
      var healthySession = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), healthySession);

      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      assert.strictEqual(breakerState.consecutive_failures, 0);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should pass breaker state across multiple checks', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'disconnected', heartbeat: null })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var breakerState = mwc.createCircuitBreakerState();

      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      assert.strictEqual(breakerState.consecutive_failures, 1);

      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      assert.strictEqual(breakerState.consecutive_failures, 2);

      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      assert.strictEqual(breakerState.consecutive_failures, 3);
      assert.strictEqual(breakerState.tripped, true);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});

// ─────────────────────────────────────────────
// Section 7: Utility Functions
// ─────────────────────────────────────────────

test.describe('readJsonSafe', function () {
  test('should read valid JSON', function () {
    var tmpDir = makeTmpDir();
    try {
      writeJson(path.join(tmpDir, 'test.json'), { key: 'value' });
      var result = mwc.readJsonSafe(path.join(tmpDir, 'test.json'));
      assert.deepStrictEqual(result, { key: 'value' });
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should return null for non-existent file', function () {
    assert.strictEqual(mwc.readJsonSafe('/non/existent/file.json'), null);
  });

  test('should return null for invalid JSON', function () {
    var tmpDir = makeTmpDir();
    try {
      fs.writeFileSync(path.join(tmpDir, 'bad.json'), 'not json');
      assert.strictEqual(mwc.readJsonSafe(path.join(tmpDir, 'bad.json')), null);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});

test.describe('writeJsonSafe', function () {
  test('should write JSON file', function () {
    var tmpDir = makeTmpDir();
    try {
      var filePath = path.join(tmpDir, 'out.json');
      mwc.writeJsonSafe(filePath, { test: true });

      var content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
      assert.deepStrictEqual(content, { test: true });
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should create directories as needed', function () {
    var tmpDir = makeTmpDir();
    try {
      var filePath = path.join(tmpDir, 'a', 'b', 'c', 'out.json');
      mwc.writeJsonSafe(filePath, { nested: true });

      assert.ok(fs.existsSync(filePath));
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});

// ─────────────────────────────────────────────
// Section 8: Additional L4 Cross-Window Detection Edge Cases
// ─────────────────────────────────────────────

test.describe('detectCrossWindowIssues — edge cases', function () {
  test('should handle single-window session without false alerts', function () {
    var session = makeSession({
      total_windows: 1,
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 0);
    assert.strictEqual(result.summary.total, 1);
    assert.strictEqual(result.summary.active, 1);
  });

  test('should produce mixed alert types in same check', function () {
    var staleTime = new Date(Date.now() - 300000).toISOString();
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' }),
        'win-2': makeWindowEntry({ window_id: 'win-2', status: 'failed' }),
        'win-3': makeWindowEntry({ window_id: 'win-3', status: 'disconnected' }),
        'win-4': makeWindowEntry({
          window_id: 'win-4',
          status: 'active',
          heartbeat: { last_update: staleTime, loop_iteration: 5, completed: 0, in_progress: 0, pending: 1 }
        })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 3);
    assert.strictEqual(result.summary.total, 4);
    assert.strictEqual(result.summary.active, 1);
    assert.strictEqual(result.summary.disconnected, 2);
    assert.strictEqual(result.summary.failed, 1);

    var types = result.alerts.map(function (a) { return a.type; });
    assert.ok(types.indexOf('window_failed') !== -1);
    assert.ok(types.indexOf('window_disconnected') !== -1);
    assert.ok(types.indexOf('heartbeat_stale') !== -1);
  });

  test('should use custom heartbeat_timeout_sec for staleness check', function () {
    // Heartbeat is 30 seconds old — would be fine with 120s default, but not with 10s custom
    var recentTime = new Date(Date.now() - 30000).toISOString();
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({
          window_id: 'win-1',
          status: 'active',
          heartbeat: { last_update: recentTime, loop_iteration: 5, completed: 1, in_progress: 0, pending: 0 }
        })
      }
    });
    var config = { heartbeat_timeout_sec: 10 };

    var result = mwc.detectCrossWindowIssues(session, config);

    assert.strictEqual(result.alerts.length, 1);
    assert.strictEqual(result.alerts[0].type, 'heartbeat_stale');
  });
});

// ─────────────────────────────────────────────
// Section 9: Additional L5 Stage-Level Detection Edge Cases
// ─────────────────────────────────────────────

test.describe('detectStageStall — edge cases', function () {
  test('should detect mixed stalled and active windows as not stalled', function () {
    var staleTime = new Date(Date.now() - 900000).toISOString();
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({
          window_id: 'win-1',
          status: 'active',
          heartbeat: { last_update: staleTime, loop_iteration: 10, completed: 2, in_progress: 0, pending: 0 }
        }),
        'win-2': makeWindowEntry({
          window_id: 'win-2',
          status: 'active',
          heartbeat: { last_update: new Date().toISOString(), loop_iteration: 8, completed: 1, in_progress: 1, pending: 0 }
        })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, false);
  });

  test('should detect stall when one window failed and other disconnected', function () {
    var session = makeSession({
      windows: {
        'win-1': makeWindowEntry({ window_id: 'win-1', status: 'failed', heartbeat: null }),
        'win-2': makeWindowEntry({ window_id: 'win-2', status: 'disconnected', heartbeat: null })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, true);
    assert.strictEqual(result.stalled_windows.length, 2);
  });

  test('should use custom stage_stall_timeout_sec', function () {
    // Idle for 20 seconds — would not stall with 600s default, but stalls with 10s custom
    var idleTime = new Date(Date.now() - 20000).toISOString();
    var session = makeSession({
      stages: [
        { stage_id: 1, name: 'impl', status: 'active', windows: ['win-1'], work_packages: ['WP-172'] }
      ],
      windows: {
        'win-1': makeWindowEntry({
          window_id: 'win-1',
          status: 'active',
          heartbeat: { last_update: idleTime, loop_iteration: 10, completed: 2, in_progress: 0, pending: 0 }
        })
      }
    });
    var config = { stage_stall_timeout_sec: 10, heartbeat_timeout_sec: 120 };

    var result = mwc.detectStageStall(session, config);

    assert.strictEqual(result.stalled, true);
    assert.strictEqual(result.stalled_windows.length, 1);
  });

  test('should handle multiple stages with only active stage checked', function () {
    var staleTime = new Date(Date.now() - 900000).toISOString();
    var session = makeSession({
      stages: [
        { stage_id: 1, status: 'completed', windows: ['win-1'] },
        { stage_id: 2, status: 'active', windows: ['win-2'] }
      ],
      windows: {
        'win-1': makeWindowEntry({
          window_id: 'win-1',
          status: 'completed',
          heartbeat: { last_update: staleTime, loop_iteration: 10, completed: 3, in_progress: 0, pending: 0 }
        }),
        'win-2': makeWindowEntry({
          window_id: 'win-2',
          status: 'active',
          heartbeat: { last_update: new Date().toISOString(), loop_iteration: 5, completed: 0, in_progress: 1, pending: 1 }
        })
      }
    });
    var config = mwc.loadMultiWindowConfig({});

    var result = mwc.detectStageStall(session, config);

    // win-1 is in completed stage, should not be checked; win-2 has active work
    assert.strictEqual(result.stalled, false);
    assert.strictEqual(result.stage_id, 2);
  });
});

// ─────────────────────────────────────────────
// Section 10: Additional Circuit Breaker Edge Cases
// ─────────────────────────────────────────────

test.describe('circuit breaker — edge cases', function () {
  test('should trip at exactly the threshold', function () {
    var state = mwc.createCircuitBreakerState();
    var config = { circuit_breaker: { consecutive_failures_threshold: 3, cooldown_after_break_sec: 60 } };

    mwc.recordFailure(state, 'f1', config);
    mwc.recordFailure(state, 'f2', config);
    assert.strictEqual(state.tripped, false);
    assert.strictEqual(state.consecutive_failures, 2);

    mwc.recordFailure(state, 'f3', config);
    assert.strictEqual(state.tripped, true);
    assert.strictEqual(state.consecutive_failures, 3);
  });

  test('should keep tripped state during active cooldown', function () {
    var state = mwc.createCircuitBreakerState();
    state.tripped = true;
    state.cooldown_until = new Date(Date.now() + 600000).toISOString(); // 10 min future

    mwc.recordSuccess(state);

    assert.strictEqual(state.tripped, true);
    assert.strictEqual(state.consecutive_failures, 0);
  });

  test('should keep history bounded with tripped events counted', function () {
    var state = mwc.createCircuitBreakerState();
    var config = mwc.loadMultiWindowConfig({});

    // Generate many failure + tripped cycles.
    // Each cycle adds 3 failures + 1 tripped = 4 entries.
    // The implementation trims to 50 BEFORE the tripped event is added,
    // so the effective maximum is 51 (50 + 1 tripped event).
    for (var i = 0; i < 40; i++) {
      state.tripped = false;
      state.consecutive_failures = 0;
      mwc.recordFailure(state, 'cycle-' + i, config);
      mwc.recordFailure(state, 'cycle-' + i + '-b', config);
      mwc.recordFailure(state, 'cycle-' + i + '-c', config);
    }

    // Implementation trims to last 50 entries when length > 50,
    // but a tripped event is added after the trim, so max is 51.
    assert.ok(state.history.length <= 51, 'history bounded to <= 51, got ' + state.history.length);
  });

  test('should increment total_failures even when already tripped', function () {
    var state = mwc.createCircuitBreakerState();
    state.tripped = true;
    state.consecutive_failures = 3;
    var config = mwc.loadMultiWindowConfig({});

    mwc.recordFailure(state, 'extra failure', config);

    assert.strictEqual(state.total_failures, 1);
    assert.strictEqual(state.consecutive_failures, 4);
  });

  test('should reset tripped state after cooldown passes on success', function () {
    var state = mwc.createCircuitBreakerState();
    state.tripped = true;
    state.tripped_at = new Date(Date.now() - 2000000).toISOString();
    state.cooldown_until = new Date(Date.now() - 1000).toISOString(); // cooldown just passed

    mwc.recordSuccess(state);

    assert.strictEqual(state.tripped, false);
    assert.strictEqual(state.tripped_at, null);
    assert.strictEqual(state.cooldown_until, null);
  });
});

// ─────────────────────────────────────────────
// Section 11: Additional dispatchCommand Edge Cases
// ─────────────────────────────────────────────

test.describe('dispatchCommand — edge cases', function () {
  test('should handle command with all optional fields', function () {
    var tmpDir = makeTmpDir();
    try {
      var result = mwc.dispatchCommand(tmpDir, 'win-1', {
        action: 'restart',
        reason: 'test full fields',
        target_task: '5',
        strategy: 'exponential-backoff',
        context: { source_check: 'L4' }
      });

      assert.strictEqual(result.success, true);

      var data = JSON.parse(fs.readFileSync(path.join(tmpDir, 'windows', 'win-1', 'daemon-actions.json'), 'utf-8'));
      assert.strictEqual(data.actions[0].action, 'restart');
      assert.strictEqual(data.actions[0].target_task, '5');
      assert.strictEqual(data.actions[0].strategy, 'exponential-backoff');
      assert.strictEqual(data.actions[0].source, 'watchdog-multi-window');
      assert.strictEqual(data.actions[0].context.source_check, 'L4');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should dispatch abort_all twice without losing previous actions', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1' })
        }
      });

      mwc.dispatchAbortAll(tmpDir, session, 'first abort');
      mwc.dispatchAbortAll(tmpDir, session, 'second abort');

      var data = JSON.parse(fs.readFileSync(path.join(tmpDir, 'windows', 'win-1', 'daemon-actions.json'), 'utf-8'));
      assert.strictEqual(data.actions.length, 2);
      assert.strictEqual(data.actions[0].reason, 'first abort');
      assert.strictEqual(data.actions[1].reason, 'second abort');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});

// ─────────────────────────────────────────────
// Section 12: Additional runMultiWindowCheck Edge Cases
// ─────────────────────────────────────────────

test.describe('runMultiWindowCheck — edge cases', function () {
  test('should produce mixed alert actions from single check', function () {
    var tmpDir = makeTmpDir();
    try {
      var staleTime = new Date(Date.now() - 300000).toISOString();
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'failed' }),
          'win-2': makeWindowEntry({
            window_id: 'win-2',
            status: 'active',
            heartbeat: { last_update: staleTime, loop_iteration: 3, completed: 0, in_progress: 0, pending: 0 }
          })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var breakerState = mwc.createCircuitBreakerState();

      // Run 3 checks to trip breaker
      var result;
      for (var i = 0; i < 3; i++) {
        result = mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      }

      assert.strictEqual(breakerState.tripped, true);
      assert.ok(result.actions.length > 0);
      assert.strictEqual(result.actions[0].type, 'abort_all');
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should handle stage stall detection triggering failure', function () {
    var tmpDir = makeTmpDir();
    try {
      // All windows idle for a long time
      var staleTime = new Date(Date.now() - 900000).toISOString();
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({
            window_id: 'win-1',
            status: 'active',
            heartbeat: { last_update: staleTime, loop_iteration: 10, completed: 2, in_progress: 0, pending: 0 }
          }),
          'win-2': makeWindowEntry({
            window_id: 'win-2',
            status: 'active',
            heartbeat: { last_update: staleTime, loop_iteration: 8, completed: 1, in_progress: 0, pending: 0 }
          })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var breakerState = mwc.createCircuitBreakerState();

      var result = mwc.runMultiWindowCheck(tmpDir, {}, breakerState);

      assert.strictEqual(result.stageStall.stalled, true);
      assert.strictEqual(breakerState.consecutive_failures, 1);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should create breaker state when none provided', function () {
    var tmpDir = makeTmpDir();
    try {
      var session = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), session);

      var result = mwc.runMultiWindowCheck(tmpDir, {});

      assert.ok(result.breakerState, 'breaker state created');
      assert.strictEqual(result.breakerState.tripped, false);
      assert.strictEqual(result.breakerState.consecutive_failures, 0);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });

  test('should reset breaker on healthy check after failures', function () {
    var tmpDir = makeTmpDir();
    try {
      var failedSession = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'failed' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), failedSession);

      var breakerState = mwc.createCircuitBreakerState();
      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      assert.strictEqual(breakerState.consecutive_failures, 2);

      // Now healthy
      var healthySession = makeSession({
        windows: {
          'win-1': makeWindowEntry({ window_id: 'win-1', status: 'active' })
        }
      });
      writeJson(path.join(tmpDir, 'multi-window-session.json'), healthySession);

      mwc.runMultiWindowCheck(tmpDir, {}, breakerState);
      assert.strictEqual(breakerState.consecutive_failures, 0);
    } finally {
      cleanupTmpDir(tmpDir);
    }
  });
});
