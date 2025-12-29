# Migration from ESLint to Biome

The goal is to replace ESLint with Biome for linting and formatting in the `app`
package.

## User Review Required

> [!IMPORTANT]
> This migration will remove ESLint and all associated plugins. Biome will be
> the sole linter and formatter. Some ESLint rules might not have direct Biome
> equivalents, but Biome's recommended rules cover most best practices.

## Proposed Changes

### `app/package.json`

- **Remove dependencies**:
  - `eslint`
  - `eslint-plugin-react-hooks`
  - `eslint-plugin-react-refresh`
  - `globals`
  - `typescript-eslint`
  - `@eslint/js`
- **Update scripts**:
  - Change `lint` script to use `biome check` (or `biome lint` + `biome format`)

### `app/biome.json`

- Ensure configuration matches project standards.
- Add `dist` to ignores if not covered by gitignore (though
  `vcs.useIgnoreFile: true` should handle it).
- Verify React rules are enabled (usually part of recommended).

### `app/eslint.config.js`

- **DELETE** this file.

## Verification Plan

### Automated Tests

- Run `npm run lint` (which will be `biome check --write .`) to verify it runs
  and reports issues.
- Run `npm run build` to ensure no build regressions (types are still checked by
  `tsc`).

### Manual Verification

- Open a `.tsx` file and verify that VS Code (if using Biome extension) or the
  CLI reports linting errors (e.g. by introducing a momentary error).
