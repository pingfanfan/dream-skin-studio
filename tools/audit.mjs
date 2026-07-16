import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const root = path.resolve(process.argv[2] || path.join(import.meta.dirname, ".."));
const packsRoot = path.join(root, "skills", "dream-skin-studio", "assets", "packs");

async function json(file) { return JSON.parse(await fs.readFile(file, "utf8")); }
async function hash(file) { return crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex"); }
function inside(base, relative) {
  const target = path.resolve(base, relative);
  if (!target.startsWith(`${path.resolve(base)}${path.sep}`)) throw new Error("Asset path escapes its pack.");
  return target;
}
async function walk(directory, files = []) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    if (item.name === ".git") continue;
    const target = path.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error(`Symlink rejected: ${target}`);
    if (item.isDirectory()) await walk(target, files);
    else files.push(target);
  }
  return files;
}

for (const required of ["LICENSE", "LICENSE-ASSETS.md", "NOTICE.md", "SECURITY.md", "skills/dream-skin-studio/SKILL.md"]) {
  const stat = await fs.stat(path.join(root, required));
  if (!stat.isFile()) throw new Error(`Missing required file: ${required}`);
}

const textExtensions = new Set([".md", ".js", ".mjs", ".json", ".html", ".css", ".sh", ".py", ".yml", ".yaml"]);
const forbidden = [["Fei", "Away"].join("-"), ["Codex", "Dream", "Skin"].join("-")];
for (const file of await walk(root)) {
  if (!textExtensions.has(path.extname(file))) continue;
  const text = await fs.readFile(file, "utf8");
  for (const marker of forbidden) if (text.includes(marker)) throw new Error(`Reference-repository marker found in ${path.relative(root, file)}`);
}

const catalog = await json(path.join(packsRoot, "catalog.json"));
if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.packs) || catalog.packs.length !== 4) throw new Error("Expected four public packs.");
const approved = [];
for (const entry of catalog.packs) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(entry.id)) throw new Error("Invalid public pack id.");
  const pack = path.join(packsRoot, entry.id);
  const manifest = await json(path.join(pack, "pack.json"));
  const rights = await json(path.join(pack, "rights.json"));
  if (manifest.license !== "CC0-1.0" || manifest.rights !== "rights.json") throw new Error(`${entry.id} is not redistributable.`);
  if (rights.status !== "approved" || rights.basis !== "procedurally-generated-original" || rights.license !== "CC0-1.0") throw new Error(`${entry.id} lacks an original rights basis.`);
  if (!Array.isArray(rights.assets) || !rights.assets.length) throw new Error(`${entry.id} lacks fingerprints.`);
  for (const asset of rights.assets) {
    if (!/^[a-f0-9]{64}$/.test(asset.sha256 || "")) throw new Error("Invalid SHA-256.");
    const file = inside(pack, asset.path);
    if ((await hash(file)) !== asset.sha256) throw new Error(`Fingerprint mismatch: ${entry.id}/${asset.path}`);
  }
  approved.push(entry.id);
}

console.log(JSON.stringify({ pass: true, independentProject: true, approvedPublicPacks: approved }, null, 2));
