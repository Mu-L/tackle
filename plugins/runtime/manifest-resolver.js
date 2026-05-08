/**
 * ManifestResolver - Project-level plugin selection system
 *
 * Manages project-specific plugin overrides via .claude/harness-manifest.json.
 * Projects can override the global plugin-registry.json enabled status.
 *
 * Rules:
 * - Manifest only records overrides (plugins where project != global)
 * - Unlisted plugins use global registry defaults
 * - New plugins appear automatically unless explicitly disabled
 *
 * Manifest format:
 * {
 *   "version": "1.0.0",
 *   "tackleHarnessVersion": "0.0.19",
 *   "plugins": {
 *     "skill-task-creator": { "enabled": true },
 *     "hook-skill-gate": { "enabled": false }
 *   }
 * }
 */

'use strict';

var fs = require('fs');
var path = require('path');

// Default manifest version
var MANIFEST_VERSION = '1.0.0';

// Read package.json for version
var packageJsonPath = path.resolve(__dirname, '../../package.json');
var TACKLE_HARNESS_VERSION = '0.0.19';
try {
  var pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
  TACKLE_HARNESS_VERSION = pkg.version || TACKLE_HARNESS_VERSION;
} catch (e) {
  // Use default version
}

/**
 * Read the global plugin registry.
 * @param {string} packageRoot - Root directory of tackle-harness package
 * @returns {object} Parsed registry object
 */
function readGlobalRegistry(packageRoot) {
  var registryPath = path.join(packageRoot, 'plugins', 'plugin-registry.json');

  if (!fs.existsSync(registryPath)) {
    return { version: '1.0.0', plugins: [] };
  }

  try {
    var content = fs.readFileSync(registryPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    return { version: '1.0.0', plugins: [] };
  }
}

/**
 * Read the project manifest file.
 * @param {string} targetRoot - Target project root directory
 * @returns {object|null} Parsed manifest object or null if not exists
 */
function readProjectManifest(targetRoot) {
  var manifestPath = path.join(targetRoot, '.claude', 'harness-manifest.json');

  if (!fs.existsSync(manifestPath)) {
    return null;
  }

  try {
    var content = fs.readFileSync(manifestPath, 'utf-8');
    return JSON.parse(content);
  } catch (e) {
    // Invalid manifest, treat as missing
    return null;
  }
}

/**
 * Resolve effective plugin list by merging global registry with project manifest.
 * Project manifest overrides take precedence.
 *
 * @param {string} packageRoot - Root directory of tackle-harness package
 * @param {string} targetRoot - Target project root directory
 * @returns {object} Registry object with merged plugin states
 */
function resolveEffectivePlugins(packageRoot, targetRoot) {
  var globalRegistry = readGlobalRegistry(packageRoot);
  var projectManifest = readProjectManifest(targetRoot);

  // If no manifest, return global registry as-is (backward compatibility)
  if (!projectManifest || !projectManifest.plugins) {
    return globalRegistry;
  }

  // Create a copy of global plugins
  var mergedPlugins = [];
  var globalPlugins = globalRegistry.plugins || [];

  // Build map of global plugins by name for quick lookup
  var globalMap = {};
  for (var i = 0; i < globalPlugins.length; i++) {
    var p = globalPlugins[i];
    globalMap[p.name] = p;
  }

  // Process all global plugins with manifest overrides
  for (var j = 0; j < globalPlugins.length; j++) {
    var globalPlugin = globalPlugins[j];
    var pluginName = globalPlugin.name;

    // Create merged entry (start with global)
    var merged = {
      name: globalPlugin.name,
      source: globalPlugin.source,
      enabled: globalPlugin.enabled,
      config: globalPlugin.config || {}
    };

    // Apply manifest override if exists
    if (projectManifest.plugins[pluginName]) {
      var override = projectManifest.plugins[pluginName];
      if (typeof override.enabled === 'boolean') {
        merged.enabled = override.enabled;
      }
      if (override.config) {
        merged.config = override.config;
      }
    }

    mergedPlugins.push(merged);
  }

  // Note: New plugins in global registry will appear automatically
  // because we iterate over all globalPlugins above.
  // Only explicitly disabled plugins in manifest are overridden.

  return {
    version: globalRegistry.version,
    plugins: mergedPlugins
  };
}

/**
 * Write a project manifest file.
 * @param {string} targetRoot - Target project root directory
 * @param {object} manifest - Manifest object to write
 * @returns {boolean} Success status
 */
function writeProjectManifest(targetRoot, manifest) {
  var claudeDir = path.join(targetRoot, '.claude');
  var manifestPath = path.join(claudeDir, 'harness-manifest.json');

  try {
    // Ensure .claude directory exists
    if (!fs.existsSync(claudeDir)) {
      fs.mkdirSync(claudeDir, { recursive: true });
    }

    // Write manifest with proper formatting
    manifest.version = manifest.version || MANIFEST_VERSION;
    manifest.tackleHarnessVersion = manifest.tackleHarnessVersion || TACKLE_HARNESS_VERSION;

    fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n', 'utf-8');
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Create a default manifest from the global registry.
 * Only includes plugins that differ from global defaults (for now, all enabled).
 *
 * @param {string} packageRoot - Root directory of tackle-harness package
 * @returns {object} Default manifest object
 */
function createDefaultManifest(packageRoot) {
  var globalRegistry = readGlobalRegistry(packageRoot);
  var plugins = globalRegistry.plugins || [];

  var manifestPlugins = {};

  // By default, all plugins are enabled (inherit global state)
  // Only record if we want to override (for now, record all for clarity)
  for (var i = 0; i < plugins.length; i++) {
    var p = plugins[i];
    manifestPlugins[p.name] = {
      enabled: (p.enabled !== false)
    };
  }

  return {
    version: MANIFEST_VERSION,
    tackleHarnessVersion: TACKLE_HARNESS_VERSION,
    plugins: manifestPlugins
  };
}

/**
 * Update a single plugin's enabled status in the project manifest.
 * Creates or updates manifest as needed.
 *
 * @param {string} packageRoot - Root directory of tackle-harness package
 * @param {string} targetRoot - Target project root directory
 * @param {string} pluginName - Name of the plugin to update
 * @param {boolean} enabled - New enabled status
 * @returns {boolean} Success status
 */
function updatePluginInManifest(packageRoot, targetRoot, pluginName, enabled) {
  var manifest = readProjectManifest(targetRoot);

  // If no manifest exists, create default first
  if (!manifest) {
    manifest = createDefaultManifest(packageRoot);
  }

  // Ensure plugins object exists
  if (!manifest.plugins) {
    manifest.plugins = {};
  }

  // Get global default for this plugin
  var globalRegistry = readGlobalRegistry(packageRoot);
  var globalPlugins = globalRegistry.plugins || [];
  var globalPlugin = null;
  for (var i = 0; i < globalPlugins.length; i++) {
    if (globalPlugins[i].name === pluginName) {
      globalPlugin = globalPlugins[i];
      break;
    }
  }

  // If plugin not found in global registry, we can't manage it
  if (!globalPlugin) {
    return false;
  }

  var globalDefault = (globalPlugin.enabled !== false);

  // If new status matches global default, remove from manifest (use default)
  if (enabled === globalDefault) {
    delete manifest.plugins[pluginName];
  } else {
    // Override global default
    manifest.plugins[pluginName] = { enabled: enabled };
  }

  // Update version
  manifest.tackleHarnessVersion = TACKLE_HARNESS_VERSION;

  return writeProjectManifest(targetRoot, manifest);
}

// ---------------------------------------------------------------------------
// Module exports
// ---------------------------------------------------------------------------

module.exports = {
  readGlobalRegistry: readGlobalRegistry,
  readProjectManifest: readProjectManifest,
  resolveEffectivePlugins: resolveEffectivePlugins,
  writeProjectManifest: writeProjectManifest,
  createDefaultManifest: createDefaultManifest,
  updatePluginInManifest: updatePluginInManifest
};
