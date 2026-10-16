import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourceAssets = path.join(projectDir, "assets");
const outputDir = path.join(projectDir, "dist");
const outputAssets = path.join(outputDir, "assets");
const htmlPath = path.join(projectDir, "index.html");
const faviconPath = path.join(projectDir, "favicon.svg");

const html = await readFile(htmlPath, "utf8");
if (!html.includes('src="./assets/') || !html.includes('href="./assets/')) {
  throw new Error("index.html must use relative ./assets/ URLs for root and GitHub Pages project paths.");
}

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputAssets, { recursive: true });
await cp(sourceAssets, outputAssets, { recursive: true });
await cp(htmlPath, path.join(outputDir, "index.html"));
await cp(faviconPath, path.join(outputDir, "favicon.svg"));
await writeFile(path.join(outputDir, ".nojekyll"), "", "utf8");

const assetNames = new Set(await readdir(outputAssets));
const localAssets = [...html.matchAll(/(?:src|href)="\.\/assets\/([^"?#]+)"/g)].map((match) => match[1]);
if (localAssets.length < 2) {
  throw new Error("Expected the application JavaScript and stylesheet to be referenced from index.html.");
}
for (const assetName of localAssets) {
  if (!assetNames.has(assetName)) {
    throw new Error(`A referenced app asset is missing from dist/assets: ${assetName}`);
  }
  const assetPath = path.join(outputAssets, assetName);
  if (!(await stat(assetPath)).isFile()) {
    throw new Error(`Referenced app asset is not a file: ${assetName}`);
  }
  if (assetName.endsWith(".css")) {
    const css = await readFile(assetPath, "utf8");
    if (/url\([\"']?\/assets\//.test(css)) {
      throw new Error(`${assetName} still contains root-absolute font/asset paths.`);
    }
  }
}

const copiedAssetCount = (await readdir(outputAssets)).length;
console.log(`Built static app to dist/ with ${copiedAssetCount} assets and a valid index.html.`);
