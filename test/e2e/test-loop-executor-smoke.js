/**
 * E2E smoke: executor-default 真实链路（followup-work-plan e2e-smoke）
 *
 * 核心卖点「自主闭环跑到达成」的真实 spawn 链路在 CI 上 0 覆盖（runner 无 claude binary，
 * test-executor-claude-integration.js Section 1 真实冒烟全程 skip；全仓 e2e 只有
 * test-init-build-validate.js，无任何 loop e2e）。本测试补这个盲区：driver 真实跑
 * plan-reader → engine init → while(step) → executor.run → lastChecklist 回填 →
 * PROGRESS.md → achieved → exit 0，唯一替换的是 executor 的 spawnFn（返回受控 stdout）。
 *
 * 策略（承袭 test-executor-claude-integration.js Section 3 的 _REGISTRY monkey-patch 先例）：
 *   - 注册临时 loop-executor._REGISTRY['stub-default']，工厂内 createExecutor 注入 spawnFn
 *   - spawnFn spawn 真实 node 子进程立即写受控 stdout（对齐真实 claude -p --output-format json
 *     顶层结构 + 内嵌 json:machine-readable block）后 exit 0——child.stdin/stdout/close 全走
 *     真实 event 路径，非伪造对象
 *   - --executor=stub-default 触发 driver 全链路；零生产改动
 *
 * Run with: node --test test/e2e/test-loop-executor-smoke.js
 */

'use strict';

var test = require('node:test');
var assert = require('node:assert');
var fs = require('fs');
var path = require('path');
var os = require('os');
var { spawn } = require('child_process');

var loopCmd = require('../../bin/commands/loop');
var loopExecutor = require('../../plugins/runtime/loop-executor');
var executorDefault = require('../../plugins/runtime/executor-default');

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

function makeTmpDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'loop-e2e-smoke-'));
}
function cleanupTmpDir(dir) {
  try { fs.rmSync(dir, { recursive: true, force: true }); } catch (_e) {}
}

/**
 * 构造对齐真实 claude -p --output-format json 的 stub stdout。
 * 顶层 {type, result, duration_ms, ttft_ms, usage}；result 内嵌 json:machine-readable block。
 */
function makeStubStdout(wpId, passed) {
  var checkResult = {
    wpId: wpId,
    passed: passed,
    summary: passed ? { total: 1, passed: 1, failed: 0 } : { total: 1, passed: 0, failed: 1 },
    failedItems: passed ? [] : [{ wpId: wpId, category: '测试', item: 't1', reason: '未通过' }],
  };
  var text = '执行完成。\n```json:machine-readable\n' + JSON.stringify(checkResult) + '\n```\n';
  return JSON.stringify({
    type: 'result',
    result: text,
    duration_ms: 120,
    ttft_ms: 100,
    usage: { input_tokens: 100, output_tokens: 50 },
  });
}

/**
 * 构造 stub spawnFn：spawn 真实 node 子进程写 stub stdout 后 exit。
 * 子进程走真实 event 路径（stdin.write / stdout.on('data') / on('close')），非伪造对象。
 */
function makeStubSpawn(stubStdout, exitCode) {
  return function (_binary, _args, spOpts) {
    var script = 'process.stdout.write(' + JSON.stringify(stubStdout) +
      '); process.exit(' + (exitCode || 0) + ');\n';
    return spawn('node', ['-e', script], spOpts);
  };
}

/** 注册临时 stub executor provider 到 _REGISTRY，返回原始 registry 副本供恢复。 */
function registerStub(name, stubStdout) {
  var orig = Object.assign({}, loopExecutor._REGISTRY);
  loopExecutor._REGISTRY[name] = function () {
    return {
      createExecutor: function (opts) {
        var exec = executorDefault.createExecutor(Object.assign({}, opts, {
          spawnFn: makeStubSpawn(stubStdout, 0),
          timeoutMs: 30000,
        }));
        exec.name = name;
        return exec;
      },
    };
  };
  return orig;
}

function restoreRegistry(orig) {
  Object.keys(loopExecutor._REGISTRY).forEach(function (k) {
    if (!orig[k]) delete loopExecutor._REGISTRY[k];
  });
}

function makeCtx(dir, planPath, executorName, maxIters) {
  var logs = [];
  var exitCode = { value: null };
  return {
    ctx: {
      targetRoot: dir,
      packageRoot: path.resolve(__dirname, '..', '..'),
      flags: { noColor: true },
      command: 'loop',
      packageVersion: 'test',
      argv: [planPath, '--executor=' + executorName, '--max-iters=' + maxIters],
      colorize: function (t) { return t; },
      exit: function (code) { exitCode.value = code; },
      log: function (msg) { logs.push(String(msg)); },
    },
    logs: logs,
    exitCode: exitCode,
  };
}

// ─────────────────────────────────────────────
// E2E cases
// ─────────────────────────────────────────────

test.describe('E2E: loop executor-default 真实链路 smoke', function () {
  test('passed=true：spawn→解析→回填→PROGRESS→achieved→exit 0', async function () {
    var dir = makeTmpDir();
    var origRegistry;
    var origCwd = process.cwd();
    try {
      // 非隔离 loop 基于 cwd 探测 projectRoot（engine snapshot 从 cwd 读 PROGRESS.md）；
      // chdir 到 dir 使 appendProgressLine 写的 PROGRESS.md 与 snapshot 读取路径一致。
      process.chdir(dir);
      fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'wp'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'task.md'), '# Task\n', 'utf8');
      // plan.md：显式 WP-001 section（plan-reader extractExplicitWpId 提取为 WP-001）
      var planPath = path.join(dir, '.claude', 'plan.md');
      fs.writeFileSync(planPath, '# Plan\n\n## WP-001: 冒烟任务\n- [ ] 任务1\n', 'utf8');

      origRegistry = registerStub('stub-passed', makeStubStdout('WP-001', true));
      var env = makeCtx(dir, planPath, 'stub-passed', 3);

      await loopCmd.execute(env.ctx);

      // 断言全链路：achieved → exit 0
      assert.strictEqual(env.exitCode.value, 0,
        'achieved → exit 0（实际 ' + env.exitCode.value + '）');
      var combined = env.logs.join('\n');
      assert.ok(combined.indexOf('Agentic Loop achieved') !== -1,
        'logs 含 achieved 收尾：' + combined.slice(0, 400));

      // PROGRESS.md 含 WP-001（回填 appendProgressLine + snapshot 读 completed）
      var progressPath = path.join(dir, 'PROGRESS.md');
      assert.ok(fs.existsSync(progressPath), 'PROGRESS.md 已生成');
      var progress = fs.readFileSync(progressPath, 'utf8');
      assert.ok(/WP-001/.test(progress), 'PROGRESS.md 含 WP-001：' + progress);
    } finally {
      if (origRegistry) restoreRegistry(origRegistry);
      process.chdir(origCwd);
      cleanupTmpDir(dir);
    }
  });

  test('passed=false 持续 → 收敛到 diverged/timeout exit 1', async function () {
    var dir = makeTmpDir();
    var origRegistry;
    var origCwd = process.cwd();
    try {
      // 非隔离 loop 基于 cwd 探测 projectRoot（engine snapshot 从 cwd 读 PROGRESS.md）；
      // chdir 到 dir 使 appendProgressLine 写的 PROGRESS.md 与 snapshot 读取路径一致。
      process.chdir(dir);
      fs.mkdirSync(path.join(dir, '.claude'), { recursive: true });
      fs.mkdirSync(path.join(dir, 'docs', 'wp'), { recursive: true });
      fs.writeFileSync(path.join(dir, 'task.md'), '# Task\n', 'utf8');
      var planPath = path.join(dir, '.claude', 'plan.md');
      fs.writeFileSync(planPath, '# Plan\n\n## WP-001: 冒烟任务\n- [ ] 任务1\n', 'utf8');

      // passed=false stub；非 git tmpDir → 工作树检测降级，靠 max_iterations/发散兜底收敛
      origRegistry = registerStub('stub-failed', makeStubStdout('WP-001', false));
      var env = makeCtx(dir, planPath, 'stub-failed', 3);

      await loopCmd.execute(env.ctx);

      // 持续 passed=false + 未达成 → diverged 或 timeout → exit 1
      assert.strictEqual(env.exitCode.value, 1,
        '未达成 → exit 1（实际 ' + env.exitCode.value + '）');
      var combined = env.logs.join('\n');
      assert.ok(
        combined.indexOf('Agentic Loop terminated') !== -1,
        'logs 含 loop 终止信息：' + combined.slice(0, 400));
    } finally {
      if (origRegistry) restoreRegistry(origRegistry);
      process.chdir(origCwd);
      cleanupTmpDir(dir);
    }
  });
});
