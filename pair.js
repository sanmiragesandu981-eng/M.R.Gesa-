const express = require("express");
const fs = require("fs");
const { exec } = require("child_process");
let router = express.Router();
const pino = require("pino");
const {
  default: makeWASocket,
  useMultiFileAuthState,
  delay,
  makeCacheableSignalKeyStore,
  Browsers,
  jidNormalizedUser,
} = require("@whiskeysockets/baileys");
const { upload } = require("./mega"); // Mega upload helper

// Helper to remove folder/file
function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

// Bot branding info
const BOT_NAME = "🤖 M.R.Gesa";
const BOT_LOGO = "https://raw.githubusercontent.com/gesandu1111/ugjv/main/Create%20a%20branding%20ba.png";

// Route for pairing
router.get("/", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.send({ error: "Please provide a WhatsApp number with country code" });

  const cleanNumber = num.replace(/[^0-9]/g, "");
  const sessionFolder = `./session/${cleanNumber}`;
  if (!fs.existsSync(sessionFolder)) fs.mkdirSync(sessionFolder, { recursive: true });

  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState(sessionFolder);

    try {
      const RobinPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(state.keys, pino({ level: "fatal" })),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!RobinPairWeb.authState.creds.registered) {
        await delay(1500);
        const code = await RobinPairWeb.requestPairingCode(cleanNumber);
        if (!res.headersSent) await res.send({ code });
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);

      RobinPairWeb.ev.on("connection.update", async (update) => {
        const { connection, lastDisconnect } = update;

        if (connection === "open") {
          try {
            await delay(5000);
            const credsPath = `${sessionFolder}/creds.json`;
            const mega_url = await upload(fs.createReadStream(credsPath), `${cleanNumber}-session.json`);
            const session_id = mega_url.replace("https://mega.nz/file/", "");

            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);
            const msg = `*${BOT_NAME} [WhatsApp Bot]*\n\n👉 ${session_id} 👈\n\n*Do not share this code with anyone!*`;

            await RobinPairWeb.sendMessage(user_jid, { image: { url: BOT_LOGO }, caption: msg });
          } catch (e) {
            console.log("Error sending session to user:", e);
            exec("pm2 restart M-R-Gesa");
          }
        } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
          await delay(10000);
          RobinPair();
        }
      });

    } catch (err) {
      console.log("Service error, restarting bot:", err);
      exec("pm2 restart M-R-Gesa");
      await removeFile(sessionFolder);
      if (!res.headersSent) await res.send({ code: "Service Unavailable" });
    }
  }

  return await RobinPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart M-R-Gesa");
});

module.exports = router;
