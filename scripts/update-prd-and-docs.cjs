#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const PRD_PATH = path.join(ROOT, "PRD.md");
const DOCS_DIR = path.join(ROOT, "docs");

const REQUIRED_DOCS = [
  "README.md",
  "architecture.md",
  "data-model.md",
  "features.md",
  "modules.md",
  "google-sheets.md",
  "testing.md",
];

function today() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function updatePrdLastUpdated() {
  if (!fs.existsSync(PRD_PATH)) {
    console.warn("PRD.md not found, skipping PRD update");
    return;
  }
  let content = fs.readFileSync(PRD_PATH, "utf8");
  const date = today();
  const updated = content.replace(
    /\*\*Last updated:\*\*[^\n]+/,
    `**Last updated:** ${date}`
  );
  if (updated !== content) {
    fs.writeFileSync(PRD_PATH, updated);
    console.log("PRD.md: updated Last updated to", date);
  }
}

function ensureDocsExist() {
  if (!fs.existsSync(DOCS_DIR)) {
    fs.mkdirSync(DOCS_DIR, { recursive: true });
    console.log("Created docs/");
  }
  for (const name of REQUIRED_DOCS) {
    const filePath = path.join(DOCS_DIR, name);
    if (!fs.existsSync(filePath)) {
      const title = name.replace(/\.md$/, "").replace(/-/g, " ");
      const stub = `# ${title}\n\n(Stub: add content here.)\n`;
      fs.writeFileSync(filePath, stub);
      console.log("Created stub:", path.relative(ROOT, filePath));
    }
  }
}

function main() {
  updatePrdLastUpdated();
  ensureDocsExist();
}

main();
