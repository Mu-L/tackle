'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const config = require('./lib/config');
const Logger = require('./lib/logger');
const StateFileManager = require('./lib/state-files');
const ProcessManager = require('./lib/process-manager');

/**
 * 帮助信息
 */
const HELP_TEXT = `
Watchdog Daemon — Claude Code Agent Teams 守护进程

用法:
  node watchdog.js <command> [options]

命令:
  init                   初始化守护进程配置目录
  start                  启动守护进程
  status                 查看守护进程状态
  restart                手动触发任务重启
  pause                  暂停守护进程检测
  stop                   停止守护进程

选项:
  --config <path>        指定配置文件路径 (默认: .claude-daemon/daemon-config.json)
  --help, -h             显示帮助信息

start 命令选项:
  --foreground           前台模式运行
  --background           后台模式运行 (默认)

restart 命令选项:
  --task <id>            指定要重启的任务 ID

pause 命令选项:
  --resume               恢复守护进程检测

示例:
  node watchdog.js init
  node watchdog.js start --foreground
  node watchdog.js status
  node watchdog.js restart --task 3
  node watchdog.js stop
`;

/**
 * 解析命令行参数
 * @param {string[]} args - process.argv.slice(2)
 * @returns {Object} 解析结果 { command, options, args }
 */
function parseArgs(args) {
  const result = {
    command: null,
    options: {
      config: '.claude-daemon/daemon-config.json'
    },
    args: {}
  };

  let i = 0;

  while (i < args.length) {
    const arg = args[i];

    // 全局选项
    if (arg === '--help' || arg === '-h') {
      result.command = 'help';
      break;
    }

    if (arg === '--config') {
      result.options.config = args[++i];
      i++;
      continue;
    }

    // start 命令选项
    if (arg === '--foreground' || arg === '--background') {
      result.args.mode = arg.replace('--', '');
      i++;
      continue;
    }

    // restart 命令选项
    if (arg === '--task') {
      result.args.task = args[++i];
      i++;
      continue;
    }

    // pause 命令选项
    if (arg === '--resume') {
      result.args.resume = true;
      i++;
      continue;
    }

    // 子命令
    if (!arg.startsWith('--')) {
      result.command = arg;
      i++;
      continue;
    }

    // 未知选项
    console.warn(`警告: 未知选项 ${arg}`);
    i++;
  }

  return result;
}

/**
 * 执行 init 命令
 */
function cmdInit(options) {
  const daemonDir = '.claude-daemon';
  const tasksDir = path.join(daemonDir, 'tasks');
  const configFile = path.join(daemonDir, 'daemon-config.json');
  const templatePath = config.getTemplatePath();

  // 检查是否已初始化
  if (fs.existsSync(daemonDir)) {
    console.log(`目录 ${daemonDir} 已存在，跳过创建`);
  } else {
    fs.mkdirSync(tasksDir, { recursive: true });
    console.log(`创建目录: ${daemonDir}/`);
    console.log(`创建目录: ${tasksDir}/`);
  }

  // 检查配置文件是否已存在
  if (fs.existsSync(configFile)) {
    console.log(`配置文件 ${configFile} 已存在，跳过创建`);
  } else {
    const template = fs.readFileSync(templatePath, 'utf8');
    fs.writeFileSync(configFile, template, 'utf8');
    console.log(`创建配置文件: ${configFile}`);
  }

  console.log('\n初始化完成！');
  console.log(`配置文件: ${configFile}`);
  console.log('可以运行 "node watchdog.js start" 启动守护进程');
  return 0;
}

/**
 * 执行 start 命令
 */
async function cmdStart(options, args) {
  // 加载配置
  const loadedConfig = config.loadConfig(options.config);
  const mode = args.mode || loadedConfig.daemon.mode;

  // 创建状态管理器
  const stateManager = new StateFileManager({
    heartbeatDir: loadedConfig.heartbeat_dir
  });

  // 检查是否已有实例在运行
  const existingStatus = stateManager.readDaemonStatus();
  if (existingStatus && existingStatus.pid) {
    const procManager = new ProcessManager({
      killTimeoutSec: loadedConfig.process.kill_timeout_sec
    });

    if (procManager.isProcessAlive(existingStatus.pid)) {
      console.error(`错误: 守护进程已在运行 (PID: ${existingStatus.pid})`);
      console.error('如需重启，请先运行 "node watchdog.js stop"');
      return 1;
    } else {
      // PID 文件存在但进程已不存在，清理旧状态
      console.log('检测到旧的守护进程状态文件，清理中...');
    }
  }

  // 前台模式
  if (mode === 'foreground') {
    console.log('启动守护进程（前台模式）...');
    console.log('配置文件:', options.config);

    // 创建前台日志器
    const logger = new Logger({
      logDir: loadedConfig.heartbeat_dir,
      level: loadedConfig.logging.level,
      maxFileSizeMB: loadedConfig.logging.max_file_size_mb,
      maxFiles: loadedConfig.logging.max_files,
      foreground: true
    });

    // 导入并运行 Watchdog
    const { Watchdog } = require('./lib/daemon');
    const watchdog = new Watchdog(loadedConfig, logger);

    // 处理退出信号
    process.on('SIGINT', () => {
      console.log('\n收到 SIGINT，正在停止守护进程...');
      watchdog.stop();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n收到 SIGTERM，正在停止守护进程...');
      watchdog.stop();
      process.exit(0);
    });

    // 初始化并启动
    watchdog.init();
    watchdog.start();

    // 保持进程运行
    console.log('守护进程已启动，按 Ctrl+C 退出');
    return 0;
  }

  // 后台模式
  console.log('启动守护进程（后台模式）...');

  // 日志文件路径
  const logDir = path.resolve(loadedConfig.heartbeat_dir);
  const stdoutLog = path.join(logDir, 'daemon-stdout.log');
  const stderrLog = path.join(logDir, 'daemon-stderr.log');

  // 确保 log 目录存在
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }

  // 创建 detached 子进程
  const child = spawn(process.argv[0], [process.argv[1], 'start', '--config', options.config, '--foreground'], {
    detached: true,
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: process.cwd(),
    env: process.env
  });

  // 重定向输出到日志文件
  const stdoutStream = fs.createWriteStream(stdoutLog, { flags: 'a' });
  const stderrStream = fs.createWriteStream(stderrLog, { flags: 'a' });

  child.stdout.pipe(stdoutStream);
  child.stderr.pipe(stderrStream);

  // 取消父进程引用，使子进程成为守护进程
  child.unref();

  // 等待一小段时间确保子进程启动
  await new Promise(resolve => setTimeout(resolve, 500));

  // 检查子进程是否存活
  const procManager = new ProcessManager({
    killTimeoutSec: loadedConfig.process.kill_timeout_sec
  });

  if (procManager.isProcessAlive(child.pid)) {
    // 写入守护进程状态文件
    stateManager.writeDaemonStatus({
      pid: child.pid,
      mode: 'background',
      started_at: new Date().toISOString(),
      last_check: new Date().toISOString(),
      health: 'healthy'
    });

    console.log(`守护进程已启动 (PID: ${child.pid})`);
    console.log(`标准输出: ${stdoutLog}`);
    console.log(`错误输出: ${stderrLog}`);
    return 0;
  } else {
    console.error('守护进程启动失败，请查看日志文件');
    return 1;
  }
}

/**
 * 执行 status 命令
 */
function cmdStatus(options) {
  // 加载配置
  const loadedConfig = config.loadConfig(options.config);

  // 创建状态管理器
  const stateManager = new StateFileManager({
    heartbeatDir: loadedConfig.heartbeat_dir
  });

  // 创建进程管理器
  const procManager = new ProcessManager({
    killTimeoutSec: loadedConfig.process.kill_timeout_sec
  });

  // 读取守护进程状态
  const daemonStatus = stateManager.readDaemonStatus();

  if (!daemonStatus) {
    console.log('守护进程未运行');
    console.log('提示: 运行 "node watchdog.js start" 启动守护进程');
    return 0;
  }

  // 检查进程是否存活
  const isAlive = procManager.isProcessAlive(daemonStatus.pid);

  // 输出守护进程信息
  console.log('\n' + '='.repeat(50));
  console.log('守护进程状态');
  console.log('='.repeat(50));
  console.log(`PID:         ${daemonStatus.pid}`);
  console.log(`模式:        ${daemonStatus.mode}`);
  console.log(`状态:        ${isAlive ? '\u001b[32m运行中\u001b[0m' : '\u001b[31m已停止\u001b[0m'}`);
  console.log(`健康:        ${_formatHealthStatus(daemonStatus.health)}`);
  console.log(`启动时间:    ${daemonStatus.started_at ? new Date(daemonStatus.started_at).toLocaleString('zh-CN') : '未知'}`);
  console.log(`最后检查:    ${daemonStatus.last_check ? new Date(daemonStatus.last_check).toLocaleString('zh-CN') : '未知'}`);

  // 会话信息
  if (daemonStatus.session) {
    const session = daemonStatus.session;
    console.log('\n会话信息:');
    console.log(`  会话 ID:    ${session.session_id || '未知'}`);
    console.log(`  状态:       ${session.status || '未知'}`);
    console.log(`  迭代次数:   ${session.heartbeat_iteration || 0}`);
    console.log(`  任务统计:`);
    console.log(`    总计:     ${session.total_tasks || 0}`);
    console.log(`    已完成:   ${session.completed || 0}`);
    console.log(`    进行中:   ${session.in_progress || 0}`);
    console.log(`    待处理:   ${session.pending || 0}`);
  }

  // 任务状态表格
  const tasks = stateManager.readAllTaskFiles();
  if (tasks.length > 0) {
    console.log('\n任务状态:');
    console.log('  ID    | 状态       | 工作包     | 最后更新');
    console.log('  ' + '-'.repeat(55));
    for (const task of tasks) {
      const status = _formatTaskStatus(task.status);
      const wpId = task.wp_id || 'N/A';
      const lastUpdate = task.last_update
        ? new Date(task.last_update).toLocaleString('zh-CN', { hour12: false })
        : '未知';
      console.log(`  ${task.task_id.padEnd(5)} | ${status.padEnd(10)} | ${wpId.padEnd(9)} | ${lastUpdate}`);
    }
  } else {
    console.log('\n任务状态: 无任务');
  }

  // 重启历史
  if (daemonStatus.restarts && daemonStatus.restarts.length > 0) {
    console.log('\n重启历史:');
    console.log('  任务 ID | 次数 | 策略                | 最后重启时间');
    console.log('  ' + '-'.repeat(65));
    for (const restart of daemonStatus.restarts) {
      const taskId = String(restart.task_id).padEnd(7);
      const attempts = String(restart.attempts).padEnd(4);
      const strategy = (restart.strategy || 'unknown').padEnd(18);
      const lastTime = restart.last_restart_at
        ? new Date(restart.last_restart_at).toLocaleString('zh-CN', { hour12: false })
        : '未知';
      console.log(`  ${taskId} | ${attempts} | ${strategy} | ${lastTime}`);
    }
  }

  // 熔断状态
  if (daemonStatus.circuit_breaker) {
    const cb = daemonStatus.circuit_breaker;
    console.log('\n熔断状态:');
    if (cb.tripped) {
      console.log(`  \u001b[31m已触发\u001b[0m - 连续失败次数: ${cb.consecutive_failures || 0}`);
      if (cb.tripped_at) {
        console.log(`  触发时间: ${new Date(cb.tripped_at).toLocaleString('zh-CN')}`);
      }
    } else if (cb.consecutive_failures > 0) {
      console.log(`  \u001b[33m警告\u001b[0m - 连续失败次数: ${cb.consecutive_failures}`);
    } else {
      console.log('  \u001b[32m正常\u001b[0m');
    }
  }

  console.log('='.repeat(50) + '\n');

  return 0;
}

/**
 * 格式化健康状态
 * @private
 */
function _formatHealthStatus(health) {
  const healthMap = {
    healthy: '\u001b[32m健康\u001b[0m',
    degraded: '\u001b[33m降级\u001b[0m',
    critical: '\u001b[31m严重\u001b[0m',
    terminated: '\u001b[90m已终止\u001b[0m'
  };
  return healthMap[health] || health || '未知';
}

/**
 * 格式化任务状态
 * @private
 */
function _formatTaskStatus(status) {
  const statusMap = {
    pending: '\u001b[36m待处理\u001b[0m',
    in_progress: '\u001b[33m进行中\u001b[0m',
    completed: '\u001b[32m已完成\u001b[0m',
    failed: '\u001b[31m已失败\u001b[0m'
  };
  return statusMap[status] || status || '未知';
}

/**
 * 执行 restart 命令
 */
async function cmdRestart(options, args) {
  if (!args.task) {
    console.error('错误: restart 命令需要 --task 选项');
    console.error('示例: node watchdog.js restart --task 3');
    return 1;
  }

  const taskId = args.task;

  // 加载配置
  const loadedConfig = config.loadConfig(options.config);

  // 创建状态管理器
  const stateManager = new StateFileManager({
    heartbeatDir: loadedConfig.heartbeat_dir
  });

  // 检查守护进程是否运行
  const daemonStatus = stateManager.readDaemonStatus();
  if (!daemonStatus) {
    console.error('错误: 守护进程未运行');
    console.error('提示: 运行 "node watchdog.js start" 启动守护进程');
    return 1;
  }

  const procManager = new ProcessManager({
    killTimeoutSec: loadedConfig.process.kill_timeout_sec
  });

  if (!procManager.isProcessAlive(daemonStatus.pid)) {
    console.error('错误: 守护进程未运行');
    console.error('提示: 运行 "node watchdog.js start" 启动守护进程');
    return 1;
  }

  // 读取任务文件
  const task = stateManager.readTaskFile(taskId);
  if (!task) {
    console.error(`错误: 任务 #${taskId} 不存在`);
    return 1;
  }

  // 检查任务状态
  if (task.status === 'completed') {
    console.warn(`警告: 任务 #${taskId} 已完成，无需重启`);
    return 0;
  }

  // 读取现有动作
  const actionsData = stateManager.readDaemonActions();

  // 检查是否已有待处理的 restart 动作
  const hasPendingRestart = actionsData.actions.some(
    a => a.target_task === taskId && a.action === 'restart'
  );

  if (hasPendingRestart) {
    console.warn(`警告: 任务 #${taskId} 已有待处理的重启动作`);
    return 0;
  }

  // 根据 complexity_score 选择策略
  const complexityScore = task.complexity_score || 0;
  const strategy = complexityScore > 6 ? 'checkpoint_resume' : 'full_restart';

  // 创建 restart 动作
  const action = {
    id: `act-manual-restart-${taskId}-${Date.now()}`,
    target_task: taskId,
    action: 'restart',
    reason: 'manual_restart: triggered by CLI',
    strategy: strategy,
    timestamp: new Date().toISOString(),
    context: {
      retry_count: (task.retry_count || 0) + 1,
      complexity_score: complexityScore,
      manual: true
    }
  };

  // 写入动作
  const combinedActions = [...actionsData.actions, action];
  stateManager.writeDaemonActions(
    combinedActions,
    daemonStatus.session ? daemonStatus.session.heartbeat_iteration : 0
  );

  console.log(`已提交任务 #${taskId} 重启请求`);
  console.log(`策略: ${strategy}`);
  console.log('守护进程将在下次循环中处理此请求');
  return 0;
}

/**
 * 执行 pause 命令
 */
async function cmdPause(options, args) {
  const isResume = args.resume || false;
  const action = isResume ? '恢复' : '暂停';

  // 加载配置
  const loadedConfig = config.loadConfig(options.config);

  // 创建状态管理器
  const stateManager = new StateFileManager({
    heartbeatDir: loadedConfig.heartbeat_dir
  });

  // 创建进程管理器
  const procManager = new ProcessManager({
    killTimeoutSec: loadedConfig.process.kill_timeout_sec
  });

  // 读取守护进程状态
  const daemonStatus = stateManager.readDaemonStatus();

  if (!daemonStatus) {
    console.error('错误: 守护进程未运行');
    console.error('提示: 运行 "node watchdog.js start" 启动守护进程');
    return 1;
  }

  // 检查进程是否存活
  if (!procManager.isProcessAlive(daemonStatus.pid)) {
    console.error(`错误: 守护进程 (PID: ${daemonStatus.pid}) 未运行`);
    return 1;
  }

  // 检查当前状态
  if (daemonStatus.state === 'paused' && !isResume) {
    console.warn('守护进程已处于暂停状态');
    return 0;
  }

  if (daemonStatus.state === 'running' && isResume) {
    console.warn('守护进程正在运行，无需恢复');
    return 0;
  }

  // 通过写入状态文件触发 pause/resume
  daemonStatus.state = isResume ? 'running' : 'paused';
  daemonStatus.last_check = new Date().toISOString();
  stateManager.writeDaemonStatus(daemonStatus);

  console.log(`${action}指令已发送 (PID: ${daemonStatus.pid})`);
  console.log('守护进程将在下次循环中响应此指令');
  return 0;
}

/**
 * 执行 stop 命令
 */
async function cmdStop(options) {
  // 加载配置
  const loadedConfig = config.loadConfig(options.config);

  // 创建状态管理器
  const stateManager = new StateFileManager({
    heartbeatDir: loadedConfig.heartbeat_dir
  });

  // 创建进程管理器
  const procManager = new ProcessManager({
    killTimeoutSec: loadedConfig.process.kill_timeout_sec
  });

  // 读取守护进程状态
  const daemonStatus = stateManager.readDaemonStatus();

  if (!daemonStatus) {
    console.log('守护进程未运行');
    return 0;
  }

  const pid = daemonStatus.pid;

  // 检查进程是否存活
  if (!procManager.isProcessAlive(pid)) {
    console.log(`守护进程 (PID: ${pid}) 未运行`);
    // 清理状态文件
    _clearDaemonStatus(stateManager);
    return 0;
  }

  console.log(`正在停止守护进程 (PID: ${pid})...`);

  // 尝试优雅终止
  const success = await procManager.killProcess(pid);

  if (success) {
    console.log('守护进程已停止');
    // 清理状态文件
    _clearDaemonStatus(stateManager);
    return 0;
  } else {
    console.error('守护进程停止失败');
    return 1;
  }
}

/**
 * 清理守护进程状态文件
 * @private
 */
function _clearDaemonStatus(stateManager) {
  try {
    const fs = require('fs');
    const path = require('path');
    const statusFile = path.join(stateManager.heartbeatDir, 'daemon-status.json');

    if (fs.existsSync(statusFile)) {
      // 更新为 terminated 状态而不是删除
      const status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
      status.health = 'terminated';
      status.last_check = new Date().toISOString();
      fs.writeFileSync(statusFile, JSON.stringify(status, null, 2), 'utf8');
    }
  } catch (err) {
    // 忽略清理错误
  }
}

/**
 * 主入口
 */
async function main() {
  const args = process.argv.slice(2);
  const parsed = parseArgs(args);

  // 处理 help 命令
  if (parsed.command === 'help' || !parsed.command) {
    console.log(HELP_TEXT);
    return 0;
  }

  // 加载配置（如果命令需要）
  let loadedConfig = null;
  if (['start', 'status', 'restart', 'pause', 'stop'].includes(parsed.command)) {
    try {
      loadedConfig = config.loadConfig(parsed.options.config);
    } catch (err) {
      console.error(`配置加载失败: ${err.message}`);
      console.error('\n提示: 请先运行 "node watchdog.js init" 初始化配置');
      return 1;
    }
  }

  // 分发到具体命令处理
  let exitCode = 0;
  switch (parsed.command) {
    case 'init':
      exitCode = cmdInit(parsed.options);
      break;
    case 'start':
      exitCode = await cmdStart(parsed.options, parsed.args);
      break;
    case 'status':
      exitCode = cmdStatus(parsed.options);
      break;
    case 'restart':
      exitCode = await cmdRestart(parsed.options, parsed.args);
      break;
    case 'pause':
      exitCode = cmdPause(parsed.options);
      break;
    case 'stop':
      exitCode = await cmdStop(parsed.options);
      break;
    default:
      console.error(`错误: 未知命令 "${parsed.command}"`);
      console.log(HELP_TEXT);
      exitCode = 1;
  }

  return exitCode;
}

// 运行主程序
if (require.main === module) {
  (async () => {
    const exitCode = await main();
    process.exit(exitCode);
  })();
}

module.exports = { main, parseArgs };
