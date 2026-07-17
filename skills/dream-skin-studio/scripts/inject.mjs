import fs from "node:fs/promises";

const argv = process.argv.slice(2);
function option(name, fallback = "") {
  const index = argv.indexOf(`--${name}`);
  return index < 0 ? fallback : argv[index + 1];
}

const stateFile = option("state");
const port = Number(option("port", "9473"));
const once = argv.includes("--once");
const remove = argv.includes("--remove");
const printCss = argv.includes("--print-css");
const verify = argv.includes("--verify");
const verifyRemoved = argv.includes("--verify-removed");
const debug = argv.includes("--debug");
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid local port.");

function cssFor(theme) {
  const accent = theme.accent;
  const panel = theme.panel;
  const text = theme.text;
  const background = theme.background;
  const retro = theme.mode === "retro-messenger" ? `
html, body, button, input, textarea { font-family: Tahoma, Verdana, "PingFang SC", sans-serif !important; }
button, [role="button"] { color: #102b3b !important; background: linear-gradient(#ffffff 0%, #e7f3f8 45%, #b9d3df 48%, #eef7fa 100%) !important; border: 1px solid #648da3 !important; border-radius: 3px !important; box-shadow: inset 1px 1px #ffffff, inset -1px -1px #8aa9b8 !important; }
nav, aside, [role="dialog"] { border: 1px solid #557b91 !important; border-radius: 4px !important; box-shadow: inset 0 22px rgba(31,145,202,.18), inset 1px 1px #ffffff, 2px 3px 0 rgba(39,69,82,.16) !important; }
input, textarea, [contenteditable="true"] { background: #ffffffee !important; border: 1px inset #7c9aa8 !important; border-radius: 1px !important; }
` : "";
  return `
:root { --dream-accent: ${accent}; --dream-panel: ${panel}; --dream-text: ${text}; }
html, body { background: ${background} !important; color: var(--dream-text) !important; }
#root, .bg-token-main-surface-primary { background: transparent !important; }
body::before { content: ""; position: fixed; inset: 0; pointer-events: none; z-index: -1; background: ${background}; }
main, [role="main"] { background: transparent !important; }
button, [role="button"] { border-color: color-mix(in srgb, var(--dream-accent) 38%, transparent) !important; }
input, textarea, [contenteditable="true"] { caret-color: var(--dream-accent) !important; }
::selection { background: color-mix(in srgb, var(--dream-accent) 38%, transparent); }
${retro}
`;
}

async function selected() {
  const value = JSON.parse(await fs.readFile(stateFile, "utf8"));
  if (!value.theme || !/^#[0-9a-fA-F]{6}$/.test(value.theme.accent)) throw new Error("Invalid selected theme.");
  if (value.theme.backgroundImage) {
    if (!value.assetRoot || !/^[^/]+\.(png|jpe?g|webp)$/i.test(value.theme.backgroundImage)) throw new Error("Invalid selected background image.");
    const imagePath = `${value.assetRoot}/${value.theme.backgroundImage}`;
    const bytes = await fs.readFile(imagePath);
    if (bytes.length > 20 * 1024 * 1024) throw new Error("Selected background is too large.");
    const extension = value.theme.backgroundImage.split(".").at(-1).toLowerCase();
    const mime = extension === "png" ? "image/png" : extension === "webp" ? "image/webp" : "image/jpeg";
    value.theme.background = `${value.theme.background}, url("data:${mime};base64,${bytes.toString("base64")}") center/cover fixed`;
  }
  return value;
}

if (printCss) {
  process.stdout.write(cssFor((await selected()).theme));
  process.exit(0);
}

function expression(css) {
  if (remove) return `document.getElementById("dream-skin-studio-style")?.remove(); true`;
  return `(() => { let s=document.getElementById("dream-skin-studio-style"); if(!s){s=document.createElement("style");s.id="dream-skin-studio-style";document.documentElement.appendChild(s)} s.textContent=${JSON.stringify(css)}; return true })()`;
}

async function evaluate(webSocketUrl, source) {
  if (!/^ws:\/\/(127\.0\.0\.1|localhost):\d+\//.test(webSocketUrl)) throw new Error("Refusing a non-loopback debugger target.");
  return await new Promise((resolve, reject) => {
    const socket = new WebSocket(webSocketUrl);
    const timer = setTimeout(() => { socket.close(); reject(new Error("CDP timeout")); }, 2500);
    socket.addEventListener("open", () => socket.send(JSON.stringify({ id: 1, method: "Runtime.evaluate", params: { expression: source, returnByValue: true } })));
    socket.addEventListener("message", (event) => {
      const message = JSON.parse(String(event.data));
      if (message.id !== 1) return;
      if (debug) process.stderr.write(`${JSON.stringify(message)}\n`);
      clearTimeout(timer);
      socket.close();
      message.error ? reject(new Error(message.error.message)) : resolve(message.result?.result?.value);
    });
    socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("CDP connection failed")); });
  });
}

async function applyOnce() {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
  if (!response.ok) throw new Error("Local debugger is unavailable.");
  const targets = await response.json();
  const css = remove ? "" : cssFor((await selected()).theme);
  const pages = targets.filter((target) => target.type === "page" && target.webSocketDebuggerUrl);
  if (!pages.length) throw new Error("No Codex page target found.");
  await Promise.all(pages.map((target) => evaluate(target.webSocketDebuggerUrl, expression(css))));
}

async function verifyOnce(expectPresent = true) {
  const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
  if (!response.ok) throw new Error("Local debugger is unavailable.");
  const targets = await response.json();
  const pages = targets.filter((target) => target.type === "page" && target.webSocketDebuggerUrl);
  if (!pages.length) throw new Error("No Codex page target found.");
  const source = `(() => { const s=document.getElementById("dream-skin-studio-style"); const root=document.body.firstElementChild; const largeOpaque=[...document.querySelectorAll("*")].flatMap((element)=>{const rect=element.getBoundingClientRect();const style=getComputedStyle(element);if(rect.width<500||rect.height<300||style.backgroundColor==="rgba(0, 0, 0, 0)")return [];return [{tag:element.tagName,id:element.id||"",className:String(element.className||"").slice(0,120),backgroundColor:style.backgroundColor,width:Math.round(rect.width),height:Math.round(rect.height)}]}).slice(0,12); return JSON.stringify({present:Boolean(s),accent:getComputedStyle(document.documentElement).getPropertyValue("--dream-accent").trim(),cssLength:s?.textContent.length||0,bodyBackground:getComputedStyle(document.body).background,rootTag:root?.tagName||"",rootId:root?.id||"",rootBackground:root?getComputedStyle(root).background:"",largeOpaque}) })()`;
  const values = await Promise.allSettled(pages.map((target) => evaluate(target.webSocketDebuggerUrl, source)));
  const results = values.flatMap((item) => {
    if (item.status !== "fulfilled" || typeof item.value !== "string") return [];
    try { return [JSON.parse(item.value)]; }
    catch { return []; }
  });
  if (!results.length) throw new Error("Theme state could not be read from Codex.");
  if (expectPresent && !results.some((result) => result.present && result.cssLength > 100)) throw new Error("Theme style is not active in Codex.");
  if (!expectPresent && results.some((result) => result.present)) throw new Error("Theme style is still active in Codex.");
  process.stdout.write(`${JSON.stringify(results)}\n`);
}

if (verify) await verifyOnce(true);
else if (verifyRemoved) await verifyOnce(false);
else if (once) await applyOnce();
else {
  for (;;) {
    try { await applyOnce(); }
    catch (error) { process.stderr.write(`${new Date().toISOString()} ${error.message}\n`); }
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }
}
