const fs = require("fs");
const path = require("path");
const { resolve } = require("path");

const pages = [
  "index",
  "quick-book",
  "plan-ahead",
  "find-driver",
  "become-driver",
  "contact",
  "support",
  "terms",
  "privacy-policy",
  "safety",
  "safety-policy",
  "client-disclaimer",
  "driver-agreement",
  "incident-reporting-policy",
  "login",
  "create-account",
  "forgot-password",
  "client-dashboard",
  "driver-dashboard",
  "driver-profile"
];

function copyFile(source, target) {
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyStaticScripts() {
  return {
    name: "copy-static-scripts",
    closeBundle: function closeBundle() {
      const dist = resolve(__dirname, "dist");
      copyFile(resolve(__dirname, "site.js"), path.join(dist, "site.js"));
      copyFile(resolve(__dirname, "api.js"), path.join(dist, "api.js"));
    }
  };
}

module.exports = {
  plugins: [copyStaticScripts()],
  build: {
    rollupOptions: {
      input: pages.reduce(function buildInputs(inputs, page) {
        inputs[page] = resolve(__dirname, page + ".html");
        return inputs;
      }, {})
    }
  }
};
