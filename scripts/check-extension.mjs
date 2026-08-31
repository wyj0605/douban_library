import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
const root = path.resolve(new URL("..", import.meta.url).pathname);
const manifest = JSON.parse(fs.readFileSync(path.join(root, "manifest.json"), "utf8"));
for (const file of [manifest.background.service_worker, manifest.action.default_popup, manifest.options_ui.page, ...manifest.content_scripts.flatMap((item) => [...(item.js || []), ...(item.css || [])])]) {
  if (!fs.existsSync(path.join(root, file))) throw new Error(`缺少 Manifest 资源: ${file}`);
}
for (const file of ["background.js", "content.js", "extension-utils.js", "result-ui.js", "search.js", "options.mjs", "popup.mjs", "provinces.js"]) execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "inherit" });
if (!manifest.host_permissions?.includes("https://navy82.icu/*")) throw new Error("缺少接口 host_permissions");
if (manifest.web_accessible_resources) throw new Error("不应公开内部页面");
console.log(`Manifest ${manifest.version} 与脚本静态检查通过`);
