// Adds any setting from .env.example that .env is missing, and fills an empty
// BETTER_AUTH_SECRET with a new random value. Existing values are never changed or printed.
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const envPath = new URL("../.env", import.meta.url);
const examplePath = new URL("../.env.example", import.meta.url);

const settingPattern = /^([A-Z][A-Z0-9_]*)=(.*)$/;
const current = existsSync(envPath) ? readFileSync(envPath, "utf8").split(/\r?\n/) : [];
const currentKeys = new Set(current.map((line) => line.match(settingPattern)?.[1]).filter(Boolean));

const added = [];
for (const line of readFileSync(examplePath, "utf8").split(/\r?\n/)) {
  const key = line.match(settingPattern)?.[1];
  if (key && !currentKeys.has(key)) {
    current.push(line);
    added.push(key);
  }
}

let generatedSecret = false;
const lines = current.map((line) => {
  if (/^BETTER_AUTH_SECRET=\s*$/.test(line)) {
    generatedSecret = true;
    return `BETTER_AUTH_SECRET=${randomBytes(32).toString("base64url")}`;
  }
  return line;
});

while (lines.length > 0 && lines.at(-1) === "") lines.pop();
writeFileSync(envPath, `${lines.join("\n")}\n`);

console.log(added.length ? `Added to .env: ${added.join(", ")}` : "No settings were missing.");
if (generatedSecret) console.log("Generated a new BETTER_AUTH_SECRET (not shown).");
