'use strict';

var ProviderPlugin = require('../../contracts/plugin-interface').ProviderPlugin;

/**
 * Watchdog Provider Plugin
 *
 * Provides watchdog daemon status query API.
 * When enabled and built, deploys watchdog assets to .claude/watchdog/.
 */
class WatchdogProvider extends ProviderPlugin {
  constructor() {
    super();
    this.name = 'provider-watchdog';
    this.version = '0.1.0';
    this.description = 'Watchdog Daemon Provider';
    this.provides = 'provider:watchdog';
  }

  async onActivate(context) {
    this._context = context;
    context.logger.info('WatchdogProvider activated');
  }

  async factory(context) {
    var fs = require('fs');
    var path = require('path');

    return {
      /**
       * 检查 watchdog 是否已部署到目标项目
       * @returns {boolean}
       */
      isDeployed: function () {
        var watchdogPath = path.join('.claude', 'watchdog', 'watchdog.js');
        return fs.existsSync(watchdogPath);
      },

      /**
       * 获取 watchdog 部署路径
       * @returns {string}
       */
      getDeployPath: function () {
        return path.join('.claude', 'watchdog');
      },

      /**
       * 获取守护进程状态文件路径
       * @returns {string}
       */
      getStatusFilePath: function () {
        return path.join('.claude-daemon', 'daemon-status.json');
      },

      /**
       * 检查守护进程是否正在运行
       * @returns {boolean}
       */
      isRunning: function () {
        var statusFile = path.join('.claude-daemon', 'daemon-status.json');
        if (!fs.existsSync(statusFile)) {
          return false;
        }
        try {
          var status = JSON.parse(fs.readFileSync(statusFile, 'utf8'));
          return status.health !== 'terminated';
        } catch (e) {
          return false;
        }
      }
    };
  }
}

module.exports = WatchdogProvider;
