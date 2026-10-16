import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import handler from "./api/apply.js";

const dir = path.dirname(fileURLToPath(import.meta.url));
for (const line of fs.readFileSync(path.join(dir, ".env"), "utf8").split("\n")) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith("#")) continue;
  const i = trimmed.indexOf("=");
  if (i > 0 && !process.env[trimmed.slice(0, i)]) process.env[trimmed.slice(0, i)] = trimmed.slice(i + 1);
}

const port = Number(process.env.PORT || 8787);
http.createServer((req, res) => handler(req, res)).listen(port, "127.0.0.1", () => {
  console.log("apply api http://127.0.0.1:" + port + "/api/apply");
});
