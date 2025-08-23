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
const { upload } = require("./mega");

// Remove folder helper
function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

// Bot branding info
const BOT_NAME = "🤖 M.R.Gesa";
const BOT_LOGO = "https://raw.githubusercontent.com/gesandu1111/ugjv/main/Create%20a%20branding%20ba.png";

router.get("/", async (req, res) => {
  let num = req.query.number;
  if (!num) return res.send({ error: "Please provide a number" });

  const sessionFolder = `./session/${num.replace(/[^0-9]/g, "")}`;
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
        const code = await RobinPairWeb.requestPairingCode(num);
        if (!res.headersSent) await res.send({ code });
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);

      RobinPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;

        if (connection === "open") {
          try {
            await delay(10000);
            const credsPath = `${sessionFolder}/creds.json`;
            const mega_url = await upload(fs.createReadStream(credsPath), `${num}-session.json`);
            const session_id = mega_url.replace("https://mega.nz/file/", "");

            const sidMsg = `*${BOT_NAME} [WhatsApp Bot]*\n\n👉 ${session_id} 👈\n\n*Do not share this code with anyone*`;

            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);
            await RobinPairWeb.sendMessage(user_jid, { image: { url: BOT_LOGO }, caption: sidMsg });
          } catch (e) {
            console.log("Error sending session:", e);
            exec("pm2 restart M-R-Gesa");
          }
        } else if (connection === "close" && lastDisconnect?.error?.output?.statusCode !== 401) {
          await delay(10000);
          RobinPair();
        }
      });
    } catch (err) {
      console.log("Service error, restarting:", err);
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
