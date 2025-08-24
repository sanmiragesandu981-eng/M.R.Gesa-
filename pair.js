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

function removeFile(FilePath) {
  if (!fs.existsSync(FilePath)) return false;
  fs.rmSync(FilePath, { recursive: true, force: true });
}

router.get("/", async (req, res) => {
  let num = req.query.number;

  async function RobinPair() {
    const { state, saveCreds } = await useMultiFileAuthState(`./session`);
    try {
      let RobinPairWeb = makeWASocket({
        auth: {
          creds: state.creds,
          keys: makeCacheableSignalKeyStore(
            state.keys,
            pino({ level: "fatal" }).child({ level: "fatal" })
          ),
        },
        printQRInTerminal: false,
        logger: pino({ level: "fatal" }).child({ level: "fatal" }),
        browser: Browsers.macOS("Safari"),
      });

      if (!RobinPairWeb.authState.creds.registered) {
        await delay(1500);
        num = num.replace(/[^0-9]/g, "");
        const code = await RobinPairWeb.requestPairingCode(num);
        if (!res.headersSent) {
          await res.send({ code });
        }
      }

      RobinPairWeb.ev.on("creds.update", saveCreds);
      RobinPairWeb.ev.on("connection.update", async (s) => {
        const { connection, lastDisconnect } = s;
        if (connection === "open") {
          try {
            await delay(10000);
            const auth_path = "./session/";
            const user_jid = jidNormalizedUser(RobinPairWeb.user.id);

            function randomMegaId(length = 6, numberLength = 4) {
              const characters =
                "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
              let result = "";
              for (let i = 0; i < length; i++) {
                result += characters.charAt(
                  Math.floor(Math.random() * characters.length)
                );
              }
              const number = Math.floor(
                Math.random() * Math.pow(10, numberLength)
              );
              return `${result}${number}`;
            }

            const mega_url = await upload(
              fs.createReadStream(auth_path + "creds.json"),
              `${randomMegaId()}.json`
            );

            const string_session = mega_url.replace(
              "https://mega.nz/file/",
              ""
            );

            // 🅼🆁.🅶🅴🆂🅰 branding message
            const brandImage = "https://github.com/gesandu1111/ugjv/blob/main/Create%20a%20branding%20ba.png?raw=true";
            const brandedMessage = `*📡 Smart Tech News Channel*  
✨ නවතම තාක්ෂණික පුවත්, AI tools, App updates, Tips & Tricks — හැමදෙයක්ම එකම තැනක!

🔗 Join now:  
https://whatsapp.com/channel/0029Vb5dXIrBKfi7XjLb8g1S

🔋 Stay updated. Stay smart.  
Powered by 🅼🆁.🅶🅴🆂🅰 ⚡
`;

            const mg = `🛑 *Do not share this code with anyone* 🛑`;

            // Session code + branding
            const sid = `*ROBIN [The powerful WA BOT]*\n\n👉 ${string_session} 👈\n\n*ඔබේ Session ID එක, config.js file එකේ paste කරන්න*\n\n*ඔබට කිසිදු ප්‍රශ්නයක් WhatsApp එකෙන් අසන්න පුළුවන්*\n\n*wa.me/message/WKGLBR2PCETWD1*\n\n*ඔබට group එකට එකතු විය හැක*\n\n*https://chat.whatsapp.com/GAOhr0qNK7KEvJwbenGivZ*`;

            // Send branding image + message
            await RobinPairWeb.sendMessage(user_jid, {
              image: { url: brandImage },
              caption: brandedMessage,
            });

            // Send session ID separately
            await RobinPairWeb.sendMessage(user_jid, { text: sid });

            // Send warning message
            await RobinPairWeb.sendMessage(user_jid, { text: mg });

          } catch (e) {
            exec("pm2 restart prabath");
          }

          await delay(100);
          await removeFile("./session");
          process.exit(0);

        } else if (
          connection === "close" &&
          lastDisconnect &&
          lastDisconnect.error &&
          lastDisconnect.error.output.statusCode !== 401
        ) {
          await delay(10000);
          RobinPair();
        }
      });

    } catch (err) {
      exec("pm2 restart Robin-md");
      console.log("service restarted");
      RobinPair();
      await removeFile("./session");
      if (!res.headersSent) {
        await res.send({ code: "Service Unavailable" });
      }
    }
  }

  return await RobinPair();
});

process.on("uncaughtException", function (err) {
  console.log("Caught exception: " + err);
  exec("pm2 restart Robin");
});

module.exports = router;
