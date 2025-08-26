module.exports = {
  name: 'whatsappBot',
  init: async ({ client, sendMessage }) => {
    client.ev.on('messages.upsert', async ({ messages }) => {
      const msg = messages[0];
      if (!msg.message) return;

      const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
      if (text === 'hello') {
        await sendMessage(msg.key.remoteJid, { text: 'ආයුබෝවන්! Sinhala bot එක active වෙලා තියෙනවා.' });
      }
    });
  }
};
