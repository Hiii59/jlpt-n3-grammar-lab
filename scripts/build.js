const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const files = ["index.html", "styles.css", "app.js", "grammar-data.js", "examples-data.js", "conjugation-data.js"];

fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const file of files) {
  fs.copyFileSync(path.join(root, file), path.join(dist, file));
}

fs.cpSync(path.join(root, "assets"), path.join(dist, "assets"), { recursive: true });

console.log(`Built ${files.length} files and assets into ${path.relative(root, dist)}`);
