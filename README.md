# CommuMathy exercise-topic fix

This package contains a replacement for **`assets/index-B25gbNMy.js`**. It fixes cross-topic exercise generation by routing specialized generators only to chapters they match, using a chapter/subtopic-aware fallback for the rest, and passing the selected subtopic through so the prompt and displayed label agree.

## Apply it to the live site

1. In your local **CommuMathy** repository, save or commit any work you want to keep, then switch to `main` and pull the latest version.
2. Extract this ZIP at the repository root and allow it to replace `assets/index-B25gbNMy.js`.
3. Check the change, then commit and push **only that asset**:

   ```bash
   git status --short
   git diff -- assets/index-B25gbNMy.js
   git add assets/index-B25gbNMy.js
   git commit -m "Fix chapter exercise topic routing"
   git push origin main
   ```

4. Keep GitHub Pages set to **Deploy from a branch → `main` → `/ (root)`**. Do not switch to `gh-pages` for this fix. After GitHub Pages finishes publishing, reload the site and try chapters such as Integers, Geometric Constructions, Counting, Qualitative Data, and Random Variables.

This is a code fix; clearing browser storage is not required.

## Validation performed

- `npm run check`: all 8 regression tests passed and the static build completed.
- Regression coverage checks all 49 current curriculum chapters.
- Browser smoke tests confirmed that Integers no longer produces a linear-equation exercise, and that formerly misrouted geometry/counting/data chapters use content from their own chapter/subtopic. The Pythagorean chapter retains a Pythagorean exercise.
