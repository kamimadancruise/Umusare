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

module.exports = {
  build: {
    rollupOptions: {
      input: pages.reduce(function buildInputs(inputs, page) {
        inputs[page] = resolve(__dirname, page + ".html");
        return inputs;
      }, {})
    }
  }
};
