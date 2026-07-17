import fs from "node:fs/promises";
import path from "node:path";

const argv = process.argv.slice(2);
function option(name, fallback = "") {
  const index = argv.indexOf(`--${name}`);
  return index < 0 ? fallback : argv[index + 1];
}

const port = Number(option("port", "9473"));
const output = path.resolve(option("output"));
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Invalid local port.");
if (!option("output") || path.extname(output).toLowerCase() !== ".png") throw new Error("Pass a PNG --output path.");

const response = await fetch(`http://127.0.0.1:${port}/json/list`, { signal: AbortSignal.timeout(1500) });
if (!response.ok) throw new Error("Local Codex debugger is unavailable.");
const targets = await response.json();
const page = targets.find((target) => target.type === "page" && target.webSocketDebuggerUrl);
if (!page || !/^ws:\/\/(127\.0\.0\.1|localhost):\d+\//.test(page.webSocketDebuggerUrl)) throw new Error("No safe local Codex page target was found.");

const data = await new Promise((resolve, reject) => {
  const socket = new WebSocket(page.webSocketDebuggerUrl);
  const timer = setTimeout(() => { socket.close(); reject(new Error("Screenshot timed out.")); }, 5000);
  socket.addEventListener("open", () => {
    socket.send(JSON.stringify({ id: 1, method: "Page.bringToFront" }));
    socket.send(JSON.stringify({ id: 2, method: "Page.captureScreenshot", params: { format: "png", fromSurface: true, captureBeyondViewport: false } }));
  });
  socket.addEventListener("message", (event) => {
    const message = JSON.parse(String(event.data));
    if (message.id !== 2) return;
    clearTimeout(timer);
    socket.close();
    if (message.error || !message.result?.data) reject(new Error(message.error?.message || "Codex did not return a screenshot."));
    else resolve(message.result.data);
  });
  socket.addEventListener("error", () => { clearTimeout(timer); reject(new Error("Screenshot connection failed.")); });
});

await fs.mkdir(path.dirname(output), { recursive: true });
await fs.writeFile(output, Buffer.from(data, "base64"));
process.stdout.write(`${output}\n`);
