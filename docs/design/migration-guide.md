# Tackle Harness Migration Guide

This document describes how to upgrade from v0.1.x to v0.2.0 and how to roll back if needed.

## Overview

v0.2.0 introduces global mode: skills and hooks are loaded from the npm package directory instead of being copied into each project's `.claude/` directory. The `tackle migrate` command automates the transition.

## Upgrade: v0.1.x to v0.2.0

### Step 1: Backup

Before migrating, back up your project's `.claude/` directory:

```bash
cp -r .claude/ .claude.backup.$(date +%Y%m%d)
```

If you have custom project-level skills that are not part of the core tackle-harness distribution, they will be preserved during migration. Only skills matching core plugin names are removed.

### Step 2: Install v0.2.0

```bash
npm install -g tackle-harness@0.2.0
```

### Step 3: Run Migration

```bash
tackle migrate --root /path/to/your/project
```

The migrate command will:

1. **Remove legacy project-level hooks from `.claude/settings.json`** -- Hook entries referencing relative paths (`../` or `..\`) are removed. Non-legacy hooks (absolute paths, drive-letter paths) are preserved.
2. **Remove core plugin skill directories from `.claude/skills/`** -- Directories matching core plugin names (e.g., `skill-task-creator`) are removed since they are now available globally.
3. **Remove project-level hook directories from `.claude/hooks/`** -- All hook directories under `.claude/hooks/` are removed.
4. **Inject CLAUDE.md plan-mode rules** -- Updates the project's `CLAUDE.md` with current rules.

### Step 4: Verify

Run build and validate to confirm everything works:

```bash
tackle build --root /path/to/your/project
tackle validate --root /path/to/your/project
```

## Rollback: v0.2.0 to v0.1.x

If you need to revert to v0.1.x:

### Step 1: Restore Backup

```bash
rm -rf .claude/
cp -r .claude.backup.YYYYMMDD .claude
```

### Step 2: Downgrade Package

```bash
npm install -g tackle-harness@0.1.x
```

### Step 3: Rebuild

```bash
tackle build --root /path/to/your/project
```

### Rollback Limitations

- **Custom skills and hooks** created between backup and rollback will be lost unless manually copied.
- **Settings.json changes** made by other tools between backup and rollback will be reverted.
- The `tackle migrate` command is one-directional; there is no automated rollback command.

## Schema Compatibility

### plugin.json

The v0.2.0 plugin.json schema (`plugins/contracts/plugin-schema.json`) is backward compatible with v0.1.x:

| v0.1.x Field | v0.2.0 Status | Notes |
|---|---|---|
| `name` | Required (unchanged) | Must match `^[a-z][a-z0-9-]*$` |
| `version` | Required (unchanged) | Must follow semver `x.y.z` |
| `type` | Required (unchanged) | Enum: `skill`, `hook`, `validator`, `provider` |
| `description` | Required (unchanged) | Must have `minLength: 1` |
| `triggers` | Optional (unchanged) | Array of non-empty strings |
| `dependencies` | Optional (unchanged) | Array of dependency identifiers |
| `provides` | Optional (unchanged) | Array of service identifiers |
| `config` | Optional (unchanged) | Object with any properties |
| `source` | Optional (unchanged) | Source identifier string |
| `sourceType` | Optional (unchanged) | Enum: `core`, `npm`, `local` |
| `metadata` | Optional (unchanged) | Object with recognized sub-fields |
| `capabilities` | **New in v0.2.0** | Optional; declared runtime capabilities |
| `metadata.requiresPlanMode` | **New in v0.2.0** | Optional boolean for skills |
| `metadata.gatedByCode` | **New in v0.2.0** | Optional boolean for hook-gated plugins |

All v0.1.x plugin.json files pass v0.2.0 schema validation without modification. New fields are optional with sensible defaults.

### plugin-registry.json

The registry schema is unchanged between v0.1.x and v0.2.0. Each entry requires `name`, `source`, and `enabled` fields.

## Boundary Cases Handled by `tackle migrate`

| Case | Behavior |
|---|---|
| No `.claude/settings.json` | Proceeds without error |
| Malformed `settings.json` | Logs warning, continues |
| Settings without hooks | Preserves other settings |
| Non-legacy hooks (absolute paths) | Preserved in settings |
| Custom (non-core) project skills | Preserved in `.claude/skills/` |
| Empty `.claude/skills/` after cleanup | Directory removed |
| Empty `.claude/hooks/` after cleanup | Directory removed |
| Missing plugin registry | Logs warning, continues |
| Windows backslash paths in hooks | Detected and removed |

## Testing

Migration tests are located at `test/runtime/test-migrate.js` and cover:

- **WP-124-1**: v0.1.x to v0.2.0 full upgrade path (5 tests)
- **WP-124-2**: Boundary cases for the migrate command (7 tests)
- **WP-124-3**: Schema backward compatibility (8 tests)

Run with:

```bash
node --test test/runtime/test-migrate.js
```
