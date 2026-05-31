# Tackle Plugin Package Convention

This document defines the directory structure and metadata conventions for external tackle-harness plugins (npm packages and local directories).

## Overview

Tackle-harness supports three plugin sources:

| sourceType  | Description                                      |
|-------------|--------------------------------------------------|
| `core`      | Built-in plugins shipped with tackle-harness      |
| `npm`       | External npm packages (e.g. `tackle-plugin-*`)    |
| `local`     | Local directories (absolute or relative paths)    |

## Package Naming

npm packages should follow the `tackle-plugin-*` naming convention:

```
tackle-plugin-<name>
```

For scoped packages:

```
@<scope>/tackle-plugin-<name>
```

## Directory Structure

An external plugin package must contain at minimum:

```
tackle-plugin-example/
  package.json        # npm package metadata
  plugin.json         # tackle plugin metadata (required)
  index.js            # JS module for hook/validator/provider types
  skill.md            # Skill instructions for skill type
```

### plugin.json (Required)

Every plugin must include a `plugin.json` with the following required fields:

```json
{
  "name": "tackle-plugin-example",
  "version": "1.0.0",
  "type": "skill",
  "description": "Example external plugin for tackle-harness"
}
```

**Required fields:**

| Field          | Type   | Description                                                      |
|----------------|--------|------------------------------------------------------------------|
| `name`         | string | Plugin identifier (should match package name)                    |
| `version`      | string | Semantic version (x.y.z)                                         |
| `type`         | string | Plugin type: `skill`, `hook`, `validator`, or `provider`         |
| `description`  | string | Human-readable description                                        |

**Optional fields:**

| Field          | Type     | Description                                              |
|----------------|----------|----------------------------------------------------------|
| `triggers`     | string[] | Activation triggers (for skill plugins)                  |
| `dependencies` | string[] | List of provider or plugin dependencies (e.g. `provider:state-store`) |
| `provides`     | string[] | Provider capability names (for provider plugins)         |
| `capabilities` | object   | Declared runtime capabilities for sandbox and security control |
| `source`       | string   | Source identifier for non-core plugins (npm package name or local path) |
| `sourceType`   | string   | Origin type: `core`, `npm`, or `local`                   |
| `metadata`     | object   | Additional metadata                                       |
| `config`       | object   | Default configuration                                     |

### Skill Plugins

Skill plugins must include a `skill.md` file:

```
tackle-plugin-example/
  plugin.json
  skill.md
```

The `skill.md` file contains markdown instructions that Claude Code reads as a slash command.

### Hook / Validator / Provider Plugins

Non-skill plugins must export a constructor function from `index.js`:

```javascript
'use strict';

class MyHookPlugin {
  constructor() {
    this.name = 'tackle-plugin-example';
    this.version = '1.0.0';
  }

  async handle(context) {
    return { allowed: true };
  }
}

module.exports = MyHookPlugin;
```

## Registry Configuration

To register an external plugin, add an entry to `plugin-registry.json`:

### npm Package

```json
{
  "name": "tackle-plugin-example",
  "source": "tackle-plugin-example",
  "sourceType": "npm",
  "enabled": true,
  "config": {}
}
```

For packages with a sub-path:

```json
{
  "name": "my-plugin",
  "source": "tackle-plugin-monorepo/plugins/my-plugin",
  "sourceType": "npm",
  "enabled": true,
  "config": {}
}
```

### Local Path (Absolute)

```json
{
  "name": "my-local-plugin",
  "source": "/absolute/path/to/my-local-plugin",
  "sourceType": "local",
  "enabled": true,
  "config": {}
}
```

### Local Path (Relative)

Relative paths are resolved against the directory containing `plugin-registry.json`:

```json
{
  "name": "my-local-plugin",
  "source": "../external-plugins/my-local-plugin",
  "sourceType": "local",
  "enabled": true,
  "config": {}
}
```

## Error Handling

| Scenario                          | Behavior                                              |
|-----------------------------------|-------------------------------------------------------|
| Invalid `sourceType`              | Error: "Invalid sourceType ..." with valid values     |
| npm package not installed         | Error: "Failed to resolve npm plugin ..." with hint   |
| Local path does not exist         | Error: "plugin.json not found in ..."                 |
| Missing `plugin.json`             | Error: "plugin.json not found in ..."                 |
| Missing required field            | Validation error with field name                      |

## Backward Compatibility

- Plugins without a `sourceType` field default to `core` behavior
- All existing core plugins continue to work without changes
- The `source` field defaults to the plugin `name` when omitted

## Schema Validation

All `plugin.json` files are validated against the formal JSON Schema defined in `plugins/contracts/plugin-schema.json`.

### How It Works

When you run `tackle validate`, the build pipeline:

1. Loads `plugin-schema.json` (JSON Schema Draft-07)
2. Validates each `plugin.json` against the schema
3. Reports errors for missing required fields, invalid types, pattern mismatches, and unknown properties

The schema enforces:

- **Required fields**: `name`, `version`, `type`, `description`
- **Name format**: lowercase alphanumeric with hyphens (`^[a-z][a-z0-9-]*$`)
- **Version format**: semver (`^\\d+\\.\\d+\\.\\d+`)
- **Type enum**: `skill`, `hook`, `validator`, `provider`
- **sourceType enum**: `core`, `npm`, `local`
- **capabilities structure**: validated object with known keys (`filesystem`, `network`, `child_process`, `env`, `plugin_access`)
- **No additional properties**: unknown top-level fields are rejected

### Validation Methods

The `plugin-validator` module (`plugins/runtime/plugin-validator.js`) provides two validation paths:

- **JSON Schema validation** (`validateWithSchema`): Uses `ajv` if available (optional dependency), otherwise falls back to inline validation
- **Capabilities validation** (`validateCapabilities`): Checks that declared capability keys are known names, produces warnings for unknown keys

```bash
# Validate all plugins
node bin/tackle.js validate
```
