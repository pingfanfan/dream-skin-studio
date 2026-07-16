import fs from "node:fs/promises";
import path from "node:path";

const [command, configArg, backupArg, petId] = process.argv.slice(2);
if (!configArg || !backupArg) throw new Error("Usage: config-pet.mjs set|restore <config> <backup> [pet-id]");
const config = path.resolve(configArg);
const backup = path.resolve(backupArg);

async function readConfig() {
  try { return await fs.readFile(config, "utf8"); }
  catch (error) { if (error.code === "ENOENT") return ""; throw error; }
}

if (command === "set") {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(petId || "")) throw new Error("Invalid pet id.");
  const source = await readConfig();
  const lines = source.split(/\r?\n/);
  const matches = lines.map((line, index) => (/^\s*pet\s*=/.test(line) ? index : -1)).filter((index) => index >= 0);
  if (matches.length > 1) throw new Error("Multiple top-level pet settings found; refusing an ambiguous edit.");
  await fs.mkdir(path.dirname(backup), { recursive: true, mode: 0o700 });
  try { await fs.access(backup); }
  catch {
    await fs.writeFile(backup, `${JSON.stringify({ hadPet: matches.length === 1, original: matches.length ? lines[matches[0]] : null }, null, 2)}\n`, { mode: 0o600 });
  }
  const replacement = `pet = "${petId}"`;
  if (matches.length) lines[matches[0]] = replacement;
  else {
    while (lines.length && lines.at(-1) === "") lines.pop();
    lines.push(replacement, "");
  }
  await fs.mkdir(path.dirname(config), { recursive: true, mode: 0o700 });
  await fs.writeFile(config, lines.join("\n"), { mode: 0o600 });
} else if (command === "restore") {
  let saved;
  try { saved = JSON.parse(await fs.readFile(backup, "utf8")); }
  catch (error) { if (error.code === "ENOENT") process.exit(0); throw error; }
  const source = await readConfig();
  const lines = source.split(/\r?\n/).filter((line) => !/^\s*pet\s*=/.test(line));
  while (lines.length && lines.at(-1) === "") lines.pop();
  if (saved.hadPet && typeof saved.original === "string") lines.push(saved.original);
  lines.push("");
  await fs.writeFile(config, lines.join("\n"), { mode: 0o600 });
  await fs.rm(backup, { force: true });
} else throw new Error("Use set or restore.");
