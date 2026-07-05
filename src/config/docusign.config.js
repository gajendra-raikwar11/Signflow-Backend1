const fs = require("fs");
const path = require("path");

function getPrivateKey() {
  // Environment variable se lo (production/Render)
  if (process.env.DOCUSIGN_PRIVATE_KEY) {
    return process.env.DOCUSIGN_PRIVATE_KEY.replace(/\\n/g, "\n");
  }
  // Local me file se lo
  const keyPath = path.resolve(process.env.DOCUSIGN_PRIVATE_KEY);
  return fs.readFileSync(keyPath, "utf8");
}

module.exports = { getPrivateKey };