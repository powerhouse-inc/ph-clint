#!/usr/bin/env node

/**
 * Patch for @svar-ui/react-grid to fix scroll jump issue on first click
 *
 * The issue: The Grid's mousedown handler calls focus() on the table element,
 * which causes the browser to scroll the element into view on first click.
 *
 * The fix: We check if the element already has focus or if the click target
 * is already within the focused area before calling focus().
 */

const fs = require("fs");
const path = require("path");

const GRID_FILE_PATH = path.join(
  __dirname,
  "../node_modules/@svar-ui/react-grid/dist/index.es.js",
);

const BACKUP_FILE_PATH = GRID_FILE_PATH + ".backup";

function patchGridFile() {
  try {
    // Check if file exists
    if (!fs.existsSync(GRID_FILE_PATH)) {
      console.log("[@svar-ui/react-grid] File not found, skipping patch");
      return;
    }

    // Read the file
    let content = fs.readFileSync(GRID_FILE_PATH, "utf8");

    // Check if already patched
    if (content.includes("PATCHED_SCROLL_FIX")) {
      console.log("[@svar-ui/react-grid] Already patched, skipping");
      return;
    }

    // Create backup if it doesn't exist
    if (!fs.existsSync(BACKUP_FILE_PATH)) {
      fs.writeFileSync(BACKUP_FILE_PATH, content);
      console.log("[@svar-ui/react-grid] Created backup");
    }

    // Find and patch the problematic focus() call
    // Original pattern: o.shiftKey && o.preventDefault(), ee.current && ee.current.focus && ee.current.focus();

    const originalPattern =
      /(\w+)\.shiftKey && \1\.preventDefault\(\), (\w+)\.current && \2\.current\.focus && \2\.current\.focus\(\)/;

    if (!originalPattern.test(content)) {
      console.log(
        "[@svar-ui/react-grid] Pattern not found, trying alternative match",
      );

      // Try a more specific pattern based on what we saw
      const altPattern =
        /o\.shiftKey && o\.preventDefault\(\), ee\.current && ee\.current\.focus && ee\.current\.focus\(\)/;

      if (altPattern.test(content)) {
        // Replace with fixed version - completely remove the focus call
        content = content.replace(
          altPattern,
          `/* PATCHED_SCROLL_FIX */ o.shiftKey && o.preventDefault() /* Removed focus() call that was causing scroll jump */`,
        );
        console.log(
          "[@svar-ui/react-grid] Applied scroll fix patch (alt pattern)",
        );
      } else {
        console.log("[@svar-ui/react-grid] Could not find pattern to patch");
        return;
      }
    } else {
      // Replace with fixed version using captured groups - completely remove the focus call
      content = content.replace(originalPattern, (match, eventVar, refVar) => {
        return `/* PATCHED_SCROLL_FIX */ ${eventVar}.shiftKey && ${eventVar}.preventDefault() /* Removed focus() call that was causing scroll jump */`;
      });
      console.log("[@svar-ui/react-grid] Applied scroll fix patch");
    }

    // Write the patched content
    fs.writeFileSync(GRID_FILE_PATH, content);
    console.log("[@svar-ui/react-grid] Patch applied successfully");
  } catch (error) {
    console.error("[@svar-ui/react-grid] Error applying patch:", error.message);
    // Don't fail the build if patch fails
    process.exit(0);
  }
}

function restoreBackup() {
  try {
    if (fs.existsSync(BACKUP_FILE_PATH)) {
      const backup = fs.readFileSync(BACKUP_FILE_PATH, "utf8");
      fs.writeFileSync(GRID_FILE_PATH, backup);
      console.log("[@svar-ui/react-grid] Restored from backup");
    }
  } catch (error) {
    console.error(
      "[@svar-ui/react-grid] Error restoring backup:",
      error.message,
    );
  }
}

// Parse command line arguments
const command = process.argv[2];

if (command === "--restore") {
  restoreBackup();
} else {
  patchGridFile();
}
