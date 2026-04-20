// WP-035: Subagent 并发控制测试用例
//
// 测试覆盖:
// 1. 配置文件加载（harness-config.yaml + plugin-registry.json）
// 2. get_max_concurrent() 时间匹配逻辑
// 3. is_time_in_range() 跨午夜场景
// 4. Phase C 并发上限限制
// 5. default_max 回退
//
// 运行方式: node tests/wp-035-concurrency-test.js

const assert = require('assert');
const fs = require('fs');
const path = require('path');

// ==================== 辅助函数实现 ====================

/**
 * 判断当前时间是否在范围内，支持跨午夜
 * @param {string} current - 当前时间 HH:MM
 * @param {string} start - 开始时间 HH:MM
 * @param {string} end - 结束时间 HH:MM
 * @returns {boolean}
 */
function is_time_in_range(current, start, end) {
  if (start <= end) {
    // 正常范围: 14:00-18:00
    return start <= current && current < end;
  } else {
    // 跨午夜: 22:00-06:00
    return current >= start || current < end;
  }
}

/**
 * 根据当前时间匹配 schedule，返回对应并发上限
 * @param {object} config - 并发配置对象
 * @param {Date} current_time - 当前时间
 * @returns {number}
 */
function get_max_concurrent(config, current_time) {
  if (!config || !config.schedules) {
    return config ? config.default_max || 6 : 6;
  }

  const current_hhmm = current_time.toTimeString().slice(0, 5);
  for (const schedule of config.schedules) {
    const start = schedule.time_range.start;
    const end = schedule.time_range.end;
    if (is_time_in_range(current_hhmm, start, end)) {
      return schedule.max_concurrent;
    }
  }

  return config.default_max || 6;
}

// ==================== 测试用例 ====================

console.log('开始运行 WP-035 并发控制测试...\n');

// 测试 1: 配置文件加载
console.log('【测试 1】配置文件加载测试');
console.log('---------------------------');

// 检查 harness-config.yaml
const harnessConfigPath = path.join(__dirname, '../templates/harness-config.yaml');
const harnessConfig = fs.readFileSync(harnessConfigPath, 'utf8');

assert(
  harnessConfig.includes('agent_dispatcher:'),
  'harness-config.yaml 应包含 agent_dispatcher 配置节'
);
assert(
  harnessConfig.includes('concurrency:'),
  'agent_dispatcher 应包含 concurrency 配置'
);
assert(
  harnessConfig.includes('default_max:'),
  'concurrency 应包含 default_max 配置'
);
assert(
  harnessConfig.includes('schedules:'),
  'concurrency 应包含 schedules 配置'
);
console.log('✓ harness-config.yaml 包含正确的 agent_dispatcher.concurrency 配置');

// 检查 plugin-registry.json
const registryPath = path.join(__dirname, '../plugins/plugin-registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const dispatcherPlugin = registry.plugins.find(p => p.name === 'skill-agent-dispatcher');
assert(dispatcherPlugin, 'plugin-registry.json 应包含 skill-agent-dispatcher 插件');
assert(dispatcherPlugin.config, 'skill-agent-dispatcher 应有 config 字段');
assert(dispatcherPlugin.config.concurrency, 'config 应包含 concurrency 配置');
assert.strictEqual(dispatcherPlugin.config.concurrency.default_max, 6, '默认并发数应为 6');
assert(dispatcherPlugin.config.concurrency.schedules, '应有 schedules 配置');
assert.strictEqual(dispatcherPlugin.config.concurrency.schedules.length, 1, '应有一个 schedule');
console.log('✓ plugin-registry.json 包含正确的默认并发配置\n');

// 测试 2: is_time_in_range 正常范围
console.log('【测试 2】is_time_in_range 正常范围测试');
console.log('---------------------------------------');

const normalTests = [
  { current: '14:00', start: '14:00', end: '18:00', expected: true, desc: '刚好在开始时间' },
  { current: '15:30', start: '14:00', end: '18:00', expected: true, desc: '在范围内' },
  { current: '17:59', start: '14:00', end: '18:00', expected: true, desc: '接近结束时间' },
  { current: '18:00', start: '14:00', end: '18:00', expected: false, desc: '刚好在结束时间（不包含）' },
  { current: '13:59', start: '14:00', end: '18:00', expected: false, desc: '在开始时间之前' },
  { current: '19:00', start: '14:00', end: '18:00', expected: false, desc: '在结束时间之后' },
];

for (const test of normalTests) {
  const result = is_time_in_range(test.current, test.start, test.end);
  assert.strictEqual(result, test.expected, `${test.desc}: 期望 ${test.expected}, 实际 ${result}`);
  console.log(`✓ ${test.desc}: ${test.current} 在 [${test.start}, ${test.end}) = ${result}`);
}
console.log('');

// 测试 3: is_time_in_range 跨午夜场景
console.log('【测试 3】is_time_in_range 跨午夜测试');
console.log('-----------------------------------');

const midnightTests = [
  { current: '22:00', start: '22:00', end: '06:00', expected: true, desc: '刚好在开始时间（跨午夜）' },
  { current: '23:59', start: '22:00', end: '06:00', expected: true, desc: '接近午夜（跨午夜）' },
  { current: '00:00', start: '22:00', end: '06:00', expected: true, desc: '午夜零点（跨午夜）' },
  { current: '03:30', start: '22:00', end: '06:00', expected: true, desc: '凌晨时段（跨午夜）' },
  { current: '05:59', start: '22:00', end: '06:00', expected: true, desc: '接近结束时间（跨午夜）' },
  { current: '06:00', start: '22:00', end: '06:00', expected: false, desc: '刚好在结束时间（跨午夜，不包含）' },
  { current: '21:59', start: '22:00', end: '06:00', expected: false, desc: '在开始时间之前（跨午夜）' },
  { current: '07:00', start: '22:00', end: '06:00', expected: false, desc: '在结束时间之后（跨午夜）' },
];

for (const test of midnightTests) {
  const result = is_time_in_range(test.current, test.start, test.end);
  assert.strictEqual(result, test.expected, `${test.desc}: 期望 ${test.expected}, 实际 ${result}`);
  console.log(`✓ ${test.desc}: ${test.current} 在 [${test.start}, ${test.end}) = ${result}`);
}
console.log('');

// 测试 4: is_time_in_range 边界值
console.log('【测试 4】is_time_in_range 边界值测试');
console.log('-----------------------------------');

const boundaryTests = [
  { current: '12:00', start: '12:00', end: '12:00', expected: false, desc: 'start=end，当前时间等于该值' },
  { current: '12:01', start: '12:00', end: '12:00', expected: false, desc: 'start=end，当前时间大于该值' },
];

for (const test of boundaryTests) {
  const result = is_time_in_range(test.current, test.start, test.end);
  assert.strictEqual(result, test.expected, `${test.desc}: 期望 ${test.expected}, 实际 ${result}`);
  console.log(`✓ ${test.desc}: ${test.current} 在 [${test.start}, ${test.end}) = ${result}`);
}
console.log('');

// 测试 5: get_max_concurrent 时间匹配
console.log('【测试 5】get_max_concurrent 时间匹配测试');
console.log('---------------------------------------');

const sampleConfig = {
  default_max: 6,
  schedules: [
    { name: 'peak', time_range: { start: '14:00', end: '18:00' }, max_concurrent: 3 }
  ]
};

const timeMatchTests = [
  { time: '13:00', expected: 6, desc: '高峰时段前，使用 default_max' },
  { time: '14:00', expected: 3, desc: '刚好在高峰时段开始，使用 schedule.max_concurrent' },
  { time: '15:30', expected: 3, desc: '在高峰时段内，使用 schedule.max_concurrent' },
  { time: '18:00', expected: 6, desc: '刚好在高峰时段结束，使用 default_max' },
  { time: '19:00', expected: 6, desc: '高峰时段后，使用 default_max' },
];

for (const test of timeMatchTests) {
  const [hours, minutes] = test.time.split(':').map(Number);
  const testTime = new Date();
  testTime.setHours(hours, minutes, 0, 0);
  const result = get_max_concurrent(sampleConfig, testTime);
  assert.strictEqual(result, test.expected, `${test.desc}: 期望 ${test.expected}, 实际 ${result}`);
  console.log(`✓ ${test.desc}: ${test.time} → ${result}`);
}
console.log('');

// 测试 6: get_max_concurrent default_max 回退
console.log('【测试 6】get_max_concurrent default_max 回退测试');
console.log('----------------------------------------------');

const fallbackTests = [
  { config: null, expected: 6, desc: '无配置' },
  { config: {}, expected: 6, desc: '空配置对象' },
  { config: { default_max: 10 }, expected: 10, desc: '有 default_max 但无 schedules' },
  { config: { default_max: 8, schedules: [] }, expected: 8, desc: '有 default_max 但 schedules 为空' },
  { config: { schedules: [{ name: 'peak', time_range: { start: '14:00', end: '18:00' }, max_concurrent: 3 }] }, expected: 6, desc: '有 schedules 但无 default_max（回退到硬编码 6）' },
];

for (const test of fallbackTests) {
  const testTime = new Date();
  testTime.setHours(10, 0, 0, 0); // 10:00，不在任何 schedule 内
  const result = get_max_concurrent(test.config, testTime);
  assert.strictEqual(result, test.expected, `${test.desc}: 期望 ${test.expected}, 实际 ${result}`);
  console.log(`✓ ${test.desc}: → ${result}`);
}
console.log('');

// 测试 7: Phase C 并发上限限制模拟
console.log('【测试 7】Phase C 并发上限限制模拟');
console.log('---------------------------------');

function simulate_phase_c(teamee_map_size, max_concurrent, pending_unblocked_count) {
  const can_create = [];
  const skipped = [];

  for (let i = 0; i < pending_unblocked_count; i++) {
    if (teamee_map_size >= max_concurrent) {
      skipped.push(i);
    } else {
      can_create.push(i);
      teamee_map_size++;
    }
  }

  return { can_create, skipped, final_active_count: teamee_map_size };
}

const phaseCTests = [
  {
    desc: '活跃数已达上限',
    active: 3,
    max: 3,
    pending: 5,
    expected_can_create: 0,
    expected_skipped: 5
  },
  {
    desc: '活跃数接近上限',
    active: 2,
    max: 3,
    pending: 5,
    expected_can_create: 1,
    expected_skipped: 4
  },
  {
    desc: '活跃数远低于上限',
    active: 1,
    max: 6,
    pending: 5,
    expected_can_create: 5,
    expected_skipped: 0
  },
];

for (const test of phaseCTests) {
  const result = simulate_phase_c(test.active, test.max, test.pending);
  assert.strictEqual(result.can_create.length, test.expected_can_create, `${test.desc}: 可创建数`);
  assert.strictEqual(result.skipped.length, test.expected_skipped, `${test.desc}: 跳过数`);
  console.log(`✓ ${test.desc}: 活跃=${test.active}, 上限=${test.max}, 待处理=${test.pending} → 创建=${result.can_create.length}, 跳过=${result.skipped.length}`);
}
console.log('');

// 测试 8: 多个 schedule 优先级匹配
console.log('【测试 8】多个 schedule 优先级匹配测试');
console.log('-------------------------------------');

const multiScheduleConfig = {
  default_max: 8,
  schedules: [
    { name: 'off-peak', time_range: { start: '06:00', end: '14:00' }, max_concurrent: 6 },
    { name: 'peak', time_range: { start: '14:00', end: '18:00' }, max_concurrent: 3 },
    { name: 'evening', time_range: { start: '18:00', end: '22:00' }, max_concurrent: 4 }
  ]
};

const multiScheduleTests = [
  { time: '05:00', expected: 8, desc: '凌晨，不在任何 schedule' },
  { time: '10:00', expected: 6, desc: '上午，匹配 off-peak' },
  { time: '15:00', expected: 3, desc: '下午，匹配 peak' },
  { time: '20:00', expected: 4, desc: '晚上，匹配 evening' },
  { time: '23:00', expected: 8, desc: '深夜，不在任何 schedule' },
];

for (const test of multiScheduleTests) {
  const [hours, minutes] = test.time.split(':').map(Number);
  const testTime = new Date();
  testTime.setHours(hours, minutes, 0, 0);
  const result = get_max_concurrent(multiScheduleConfig, testTime);
  assert.strictEqual(result, test.expected, `${test.desc}: 期望 ${test.expected}, 实际 ${result}`);
  console.log(`✓ ${test.desc}: ${test.time} → ${result}`);
}
console.log('');

// ==================== 测试总结 ====================

console.log('═══════════════════════════════════════════');
console.log('✅ 所有测试通过！');
console.log('═══════════════════════════════════════════');
console.log('\n测试覆盖:');
console.log('  ✓ 配置文件加载（harness-config.yaml + plugin-registry.json）');
console.log('  ✓ is_time_in_range 正常范围');
console.log('  ✓ is_time_in_range 跨午夜场景');
console.log('  ✓ is_time_in_range 边界值');
console.log('  ✓ get_max_concurrent 时间匹配');
console.log('  ✓ get_max_concurrent default_max 回退');
console.log('  ✓ Phase C 并发上限限制');
console.log('  ✓ 多个 schedule 优先级匹配');
