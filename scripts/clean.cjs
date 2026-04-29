#!/usr/bin/env node
/**
 * Removes Next / Turbo / tool caches.
 *
 * Never run while `next dev` is still running — it deletes `.next` out from under
 * the server and causes ENOENT (app-paths-manifest.json, routes-manifest.json, etc.).
 * Stop dev (Ctrl+C), then: npm run clean && npm run dev
 */
const fs = require("fs");
const path = require("path");

const root = process.cwd();
const targets = [".next", ".turbo", "node_modules/.cache"];

if (fs.existsSync(path.join(root, ".next")) && !process.env.INIGO_CLEAN_FORCE) {
  console.warn(
    "\n[inigo-website] Removing .next (and related caches).\n" +
      "  If `next dev` or `next start` is still running for this folder, stop it first (Ctrl+C).\n" +
      "  Cleaning while the server runs → missing manifest / chunk errors until you restart.\n" +
      "  To skip this message: INIGO_CLEAN_FORCE=1 npm run clean\n",
  );
}

for (const rel of targets) {
  const p = path.join(root, rel);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
  }
}
