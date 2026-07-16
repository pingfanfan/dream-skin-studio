import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

const [command, ...argv] = process.argv.slice(2);

function option(name, fallback = "") {
  const index = argv.indexOf(`--${name}`);
  if (index < 0) return fallback;
  const value = argv[index + 1];
  if (!value || value.startsWith("--")) throw new Error(`Missing value for --${name}`);
  return value;
}

function safeId(value) {
  if (!/^[a-z0-9][a-z0-9-]{0,63}$/.test(value)) throw new Error(`Invalid pack id: ${value}`);
  return value;
}

function within(root, relative) {
  const base = path.resolve(root);
  const target = path.resolve(base, relative);
  if (target !== base && !target.startsWith(`${base}${path.sep}`)) throw new Error("Pack path escapes its root.");
  return target;
}

async function json(file) {
  const value = JSON.parse(await fs.readFile(file, "utf8"));
  if (!value || Array.isArray(value) || typeof value !== "object") throw new Error(`Invalid JSON object: ${file}`);
  return value;
}

async function digest(file) {
  return crypto.createHash("sha256").update(await fs.readFile(file)).digest("hex");
}

async function rejectLinks(directory) {
  for (const item of await fs.readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, item.name);
    if (item.isSymbolicLink()) throw new Error(`Pack symlink rejected: ${target}`);
    if (item.isDirectory()) await rejectLinks(target);
  }
}

async function copyTree(source, destination) {
  const parent = path.dirname(destination);
  const stage = path.join(parent, `.${path.basename(destination)}.${process.pid}.new`);
  await fs.mkdir(parent, { recursive: true, mode: 0o700 });
  await fs.rm(stage, { recursive: true, force: true });
  await fs.cp(source, stage, { recursive: true, errorOnExist: true });
  await fs.rm(destination, { recursive: true, force: true });
  await fs.rename(stage, destination);
}

const packsRoot = path.resolve(option("packs-root"));
if (!option("packs-root")) throw new Error("Pass --packs-root.");
const catalog = await json(path.join(packsRoot, "catalog.json"));
if (catalog.schemaVersion !== 1 || !Array.isArray(catalog.packs)) throw new Error("Unsupported catalog.");

if (command === "list") {
  console.log(JSON.stringify(catalog.packs.map(({ id, name, description, moods, petId }) => ({ id, name, description, moods, petId })), null, 2));
  process.exit(0);
}

if (command !== "install") throw new Error("Use list or install.");
const id = safeId(option("id"));
const home = path.resolve(option("home"));
const stateRoot = path.resolve(option("state-root"));
if (!option("home") || !option("state-root")) throw new Error("Install requires --home and --state-root.");

const entry = catalog.packs.find((pack) => pack.id === id);
if (!entry) throw new Error(`Unknown pack: ${id}`);
const packRoot = within(packsRoot, id);
await rejectLinks(packRoot);
const manifest = await json(path.join(packRoot, "pack.json"));
const rights = await json(path.join(packRoot, "rights.json"));
const allowedLicenses = new Set(["CC0-1.0", "PRIVATE-USER-ASSET"]);
const allowedBases = new Set(["procedurally-generated-original", "safe-original-generated", "user-owned-private"]);
if (manifest.id !== id || manifest.rights !== "rights.json" || !allowedLicenses.has(manifest.license)) throw new Error("Pack license is not approved.");
if (rights.status !== "approved" || rights.license !== manifest.license || !allowedBases.has(rights.basis)) throw new Error("Pack rights basis is not approved.");
if (!Array.isArray(rights.assets) || rights.assets.length < 1) throw new Error("Pack has no asset fingerprints.");
for (const asset of rights.assets) {
  if (!/^[a-f0-9]{64}$/.test(asset.sha256 || "")) throw new Error("Invalid asset fingerprint.");
  const file = within(packRoot, asset.path);
  const stat = await fs.lstat(file);
  if (!stat.isFile() || stat.isSymbolicLink()) throw new Error("Invalid rights asset.");
  if ((await digest(file)) !== asset.sha256) throw new Error(`Changed asset rejected: ${asset.path}`);
}

const theme = await json(path.join(packRoot, "theme.json"));
if (theme.id !== id || theme.petId !== entry.petId) throw new Error("Theme identity mismatch.");
if (!/^#[0-9a-fA-F]{6}$/.test(theme.accent || "")) throw new Error("Invalid accent color.");
if (typeof theme.background !== "string" || theme.background.length > 1200 || /url\s*\(|@import|expression\s*\(/i.test(theme.background)) {
  throw new Error("Unsafe theme background.");
}
if (theme.backgroundImage) {
  if (path.basename(theme.backgroundImage) !== theme.backgroundImage || !/\.(png|jpe?g|webp)$/i.test(theme.backgroundImage)) throw new Error("Unsafe background image path.");
  const imageStat = await fs.stat(path.join(packRoot, theme.backgroundImage));
  if (!imageStat.isFile() || imageStat.size > 20 * 1024 * 1024) throw new Error("Invalid background image.");
}
const petRoot = path.join(packRoot, "pet");
const pet = await json(path.join(petRoot, "pet.json"));
if (pet.id !== entry.petId || path.basename(pet.spritesheetPath) !== pet.spritesheetPath) throw new Error("Pet identity mismatch.");
await copyTree(petRoot, path.join(home, ".codex", "pets", pet.id));

await fs.mkdir(stateRoot, { recursive: true, mode: 0o700 });
const activePack = path.join(stateRoot, "active-pack");
await copyTree(packRoot, activePack);
const selected = { schemaVersion: 1, id, name: entry.name, petId: pet.id, theme, assetRoot: activePack, license: rights.license, rightsBasis: rights.basis };
await fs.writeFile(path.join(stateRoot, "selected.json"), `${JSON.stringify(selected, null, 2)}\n`, { mode: 0o600 });
console.log(JSON.stringify(selected));
