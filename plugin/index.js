const { default: makeWASocket, useMultiFileAuthState } = require('@whiskeysockets/baileys');
const { loadPlugins } = require('./pluginLoader');

(async () => {
  const { state, saveCreds } = await useMultiFileAuthState('auth');
  const client = makeWASocket({
    auth: state,
    printQRInTerminal: true
  });

  client.ev.on('creds.update', saveCreds);

  const sendMessage = async (jid, message) => {
    await client.sendMessage(jid, message);
  };

  // Load plugins
  await loadPlugins({ client, sendMessage });
})();
