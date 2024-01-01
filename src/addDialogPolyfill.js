// Dynamic dialog support, no point in bundling that by default.
// This is needed for safari < 15.4 and firefox < 98
// https://caniuse.com/dialog

/**
 * @returns {Promise<Function>}
 */
async function addDialogPolyfill() {
  // Load css
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.type = "text/css";
  link.href = "https://cdn.jsdelivr.net/npm/dialog-polyfill/dist/dialog-polyfill.min.css";
  document.head.appendChild(link);

  // Load js dynamically
  const module = await import("https://cdn.jsdelivr.net/npm/dialog-polyfill/+esm");
  return module.default;
}

export default addDialogPolyfill;
