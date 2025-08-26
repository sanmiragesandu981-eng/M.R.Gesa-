// pluginLoader.js
const fs = require('fs');
const path = require('path');

async function loadPlugins({ client, sendMessage }) {
  const pluginDir = path.join(__dirname, 'plugins');
  const files = fs.readdirSync(pluginDir);

  for (const file of files) {
    const pluginPath = path.join(pluginDir, file);
    const plugin = require(pluginPath);
    if (plugin.init) {
      await plugin.init({ client, sendMessage });
      console.log(`✅ Plugin loaded: ${plugin.name}`);
    }
  }
}

module.exports = { loadPlugins };
