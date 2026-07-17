import fs from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
function option(name) {
  const index = argv.indexOf(`--${name}`);
  const value = index < 0 ? "" : argv[index + 1];
  if (!value) throw new Error(`Missing --${name}`);
  return value;
}

function absolute(name) {
  const value = path.resolve(option(name));
  if (!path.isAbsolute(value)) throw new Error(`Invalid --${name}`);
  return value;
}

function xml(value) {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&apos;");
}

const plist = absolute("plist");
const node = absolute("node");
const script = absolute("script");
const state = absolute("state");
const log = absolute("log");
const label = option("label");
const port = Number(option("port"));
if (!/^[a-z0-9.-]{3,120}$/i.test(label) || !Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid injector service settings.");
for (const file of [node, script, state]) {
  const stat = await fs.stat(file);
  if (!stat.isFile()) throw new Error(`Injector file is unavailable: ${file}`);
}

const content = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key><string>${xml(label)}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${xml(node)}</string>
    <string>${xml(script)}</string>
    <string>--state</string><string>${xml(state)}</string>
    <string>--port</string><string>${port}</string>
  </array>
  <key>RunAtLoad</key><true/>
  <key>KeepAlive</key><true/>
  <key>ThrottleInterval</key><integer>2</integer>
  <key>StandardOutPath</key><string>${xml(log)}</string>
  <key>StandardErrorPath</key><string>${xml(log)}</string>
</dict>
</plist>
`;
await fs.mkdir(path.dirname(plist), { recursive: true, mode: 0o700 });
await fs.writeFile(log, "", { mode: 0o600 });
await fs.writeFile(plist, content, { mode: 0o600 });
