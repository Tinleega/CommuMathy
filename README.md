# CommuMathy

A Thai-language mathematics-learning demo. The committed app is a self-contained compiled frontend bundle; the original React/TypeScript source was not present in the repository history when this repair was made. `scripts/exercise-generators.mjs` defines varied, topic-specific question templates for all 49 curriculum chapters, while `scripts/exercise-diagrams.mjs` draws accessible inline SVG figures for geometry, coordinate, vector and graph questions. `scripts/patch-legacy-bundle.mjs` injects these readable repairs into the legacy bundle.

## Local workflow

Requires Node.js 20 or newer.

```sh
npm ci
npm test
npm run build
npm run preview
```

The static build is written to `dist/`. The build checks that `index.html` references existing app assets, that stylesheet font URLs are relative, and that the page entry point is present. Relative paths let the app run at the repository root or below a GitHub Pages project path.

## Publishing

This repository is configured for GitHub Pages to deploy from **`main` / repository root**. After reviewed changes are merged to `main`, GitHub Pages will publish the root `index.html` and `assets/` automatically. The project intentionally has no `gh-pages` deployment command, which would conflict with that Pages configuration.

## Editing limitation

The upstream editable component source and Vite/TypeScript project files were not recoverable from local repository history. The visible app is preserved as a bundled legacy artifact, with readable, idempotent patches and tests for the repaired behavior. Restoring the original source (or replacing the legacy bundle with a fully source-maintained application) remains a worthwhile follow-up.
