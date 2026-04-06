#!/usr/bin/env node

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { readdir } from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Patches imports in document-models module.ts files
 * Replaces regular imports from "@powerhousedao/agent-manager/document-models/*" with "./index.js"
 * Preserves type imports as-is
 */

async function patchImports() {
  // Find all module.ts files in document-models directories
  const documentModelsDir = path.join(__dirname, "..", "document-models");

  let files = [];
  try {
    const dirs = await readdir(documentModelsDir, { withFileTypes: true });
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const moduleFile = path.join(documentModelsDir, dir.name, "module.ts");
        if (fs.existsSync(moduleFile)) {
          files.push(moduleFile);
        }
      }
    }
  } catch (error) {
    console.error("Error reading document-models directory:", error);
    return;
  }

  if (files.length === 0) {
    console.log("No module.ts files found in document-models directories");
    return;
  }

  console.log(`Found ${files.length} module.ts files to process`);

  files.forEach((filePath) => {
    const relativePath = path.relative(process.cwd(), filePath);
    console.log(`\nProcessing: ${relativePath}`);

    let content = fs.readFileSync(filePath, "utf8");
    const originalContent = content;

    // Extract the document model name from the path
    const modelName = path.basename(path.dirname(filePath));

    // Pattern to match regular imports (not type imports) from @powerhousedao/agent-manager/document-models/*
    // This regex matches the entire import statement including the 'from' part
    const importRegex =
      /^(\s*import\s+)(?!type\s+)(\{[^}]+\})\s+from\s+["']@powerhousedao\/agent-manager\/document-models\/[^"']+["'];?$/gm;

    // Replace regular imports with ./index.js
    content = content.replace(
      importRegex,
      (match, importStart, importContent) => {
        console.log(`  Replacing import: ${match.trim()}`);
        return `${importStart}${importContent} from "./index.js";`;
      },
    );

    // Count changes
    const changesMade = originalContent !== content;

    if (changesMade) {
      fs.writeFileSync(filePath, content, "utf8");
      console.log(`  ✓ Patched imports in ${relativePath}`);
    } else {
      console.log(`  - No changes needed in ${relativePath}`);
    }
  });

  console.log("\n✅ Import patching complete");
}

// Run the script
try {
  await patchImports();
  process.exit(0);
} catch (error) {
  console.error("❌ Error patching imports:", error);
  process.exit(1);
}
