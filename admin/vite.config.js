const fs = require("fs");
const path = require("path");
const { resolve } = require("path");

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(source, target) {
  fs.mkdirSync(target, { recursive: true });
  fs.readdirSync(source, { withFileTypes: true }).forEach(function copyEntry(entry) {
    const sourcePath = path.join(source, entry.name);
    const targetPath = path.join(target, entry.name);
    if (entry.isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      copyFile(sourcePath, targetPath);
    }
  });
}

function copyAdminStaticAssets() {
  return {
    name: "copy-admin-static-assets",
    closeBundle: function closeBundle() {
      const dist = resolve(__dirname, "dist");
      copyFile(resolve(__dirname, "../frontend/styles.css"), path.join(dist, "styles.css"));
      copyFile(resolve(__dirname, "../frontend/site.js"), path.join(dist, "site.js"));
      copyDirectory(resolve(__dirname, "../frontend/assets"), path.join(dist, "assets"));
    }
  };
}

module.exports = {
  plugins: [copyAdminStaticAssets()],
  build: {
    rollupOptions: {
      input: {
        index: resolve(__dirname, "index.html"),
        "admin-dashboard": resolve(__dirname, "admin-dashboard.html")
      }
    }
  }
};
