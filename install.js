const axios = require("axios");
const fs = require("fs");
const path = require('path');
const { Client } = require("ssh2");
const dns = require("dns").promises;
const { loadJsonData } = require("../src/data/function");

const settings = require("../settings.js");
const dev = settings.dev;
const OWNER_ID = "./db/onlyID.json";
const ownerId = settings.ownerId;
const panel = settings.panel;
const ppNebula = "https://files.catbox.moe/sbqsli.jpg";

const OWNER_FILE = './db/users/adminID.json';

// fungsi validasi IP
function isValidIP(ip) {
  const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
  return ipRegex.test(ip);
}

global.subdomain = {
 "rexzystr.my.id": { 
    zone: "5f405908bbcf1b3b20173307ce046584",
    apitoken: "8_EQmOFSrPzb6wFtPFgrMTdLWDXzuuoDmUw2asJR"
  },
  "unix.biz.id": {
    zone: "c02121177bbabcc553b617354cd21d8e",
    apitoken: "4HI-JH1jJgl-PcAq9hPrSyp1i8LZxq_kKRSlc8AF"
  },
  "mypanel.web.id": {
    zone: "b8233801ad0b684d315c19b4b3963463",
    apitoken: "Jxwpvdw2IkwtuS-Dv97c0DQFZOQcrvDaM31HtiiU"
  },
  "panelku-vip.my.id": {
    zone: "0d9911cf588f189a626249a082af24be",
    apitoken: "jsli552xYmcVeVyX2-ulWeepLK_-XCqiar0PxO7l"
  },
  "storedigital.web.id": {
    zone: "2ce8a2f880534806e2f463e3eec68d31",
    apitoken: "v5_unJTqruXV_x-5uj0dT5_Q4QAPThJbXzC2MmOQ"
  },
  "tamaoffc.biz.id": {
    zone: "177538af7fb12443a80892554d01206f",
    apitoken: "ZaVSjxa96NQDV6lQgspAVsVXrvVzdOpqL1z6PG0Z"
  },
  "mamhost.biz.id": {
    zone: "d88dccee1fd5fd2dcd47ddb7c91e2591",
    apitoken: "3rDda7Q7k6N19CXpfGVoq3WOpCatxmDlnQHVjWWC"
  },
  "orang-gantengg.biz.id": {
    zone: "a9dd58ec424aa4bb2439d0c569d07573",
    apitoken: "3rDda7Q7k6N19CXpfGVoq3WOpCatxmDlnQHVjWWC"
  },
  "xyzmam.biz.id": {
    zone: "49bb8266d07adee6b8b0999db470f45d",
    apitoken: "3rDda7Q7k6N19CXpfGVoq3WOpCatxmDlnQHVjWWC"
  },
  "xyzmamhost.my.id": {
    zone: "0b61c1c8287675fcbc9c5894cb3d1b92",
    apitoken: "3rDda7Q7k6N19CXpfGVoq3WOpCatxmDlnQHVjWWC"
  },
  "panelku-ptero.my.id": {
    zone: "ea719beeec3cfe39b58f0195f848498f",
    apitoken: "Gb8j0xFasrWB1k80b4BFrIL_f2IgAQ5n66CamFbP"
  },
  "prabowoo.my.id": {
    zone: "af679c959583e9eff1685ef4c7cbf048",
    apitoken: "gGQeMyeo8jM5xNGMsfChkwrawZ3UiX3QUnBnvwTe"
  },
  "publicserver.my.id": {
    zone: "b1b16801d28009e899a843b0c8faee34",
    apitoken: "y_0WKCNCnOgx0sgbcQr-puVTXyTQPN9KErR9vlzN"
  },
  "storeid.my.id": {
    zone: "c651c828a01962eb3c530513c7ad7dcf",
    apitoken: "N-D6fN6la7jY0AnvbWn9FcU6ZHuDitmFXd-JF04g"
  },
  "panel-freefire.biz.id": {
    zone: "2d7adf23d5ea185bead30c8ad14e1907",
    apitoken: "le350OqR25wWm5SpSJpcTbalOaTOKJA3FcRV4ohK"
  },
  "apcb.biz.id": {
    zone: "01592fa9553ff4692ed443e5932ff285",
    apitoken: "le350OqR25wWm5SpSJpcTbalOaTOKJA3FcRV4ohK"
  },
  "anti-ddos.me": {
    zone: "3f33f6c4b5a3dd00ed16d1eb7677338e",
    apitoken: "le350OqR25wWm5SpSJpcTbalOaTOKJA3FcRV4ohK"
  },
  "bokepp.biz.id": {
    zone: "46b8cab5631c6c23c5ec4a7ef1f10803",
    apitoken: "A8df8PxnKIcxLUTE7XS4TRZBoLslvt4XjJb1XEyi"
  },
  "gacorr.biz.id": {
    zone: "cff22ce1965394f1992c8dba4c3db539",
    apitoken: "v9kYfj5g2lcacvBaJHA_HRgNqBi9UlsVy0cm_EhT"
  },
  "cafee.my.id": {
    zone: "0d7044fc3e0d66189724952fa3b850ce",
    apitoken: "wAOEzAfvb-L3vKYE2Xg8svJpHfNS_u2noWSReSzJ"
  },
  "vipstoree.my.id": {
    zone: "72fd03404485ddba1c753fc0bf47f0b3",
    apitoken: "J2_c07ypFEaen92RMS7irszQSrgZ_VFMfgNgzmp0"
  },
  "mafiapnel.my.id": {
    zone: "34e28e0546feabb87c023f456ef033bf",
    apitoken: "bHNaEBwaVSdNklVFzPSkSegxOd9OtKzWtY7P9Zwt"
  },
  "centzzcloud.my.id": {
    zone: "749f1d7d69e9329195761b570010c00f",
    apitoken: "9Su8A1EDXnt9-yGDb7YSGlY_ogJAw2vR9IDtpFrQ"
  },
  "privatesrvr.xyz": {
    zone: "b488e5d4635431243cab94d5fec4a3d2",
    apitoken: "Wv6SqCo8772I6WG-EGnD4w272sJsYVSXd-LpPc7C"
  },
  "cupenpendiem.shop": {
    zone: "a70c572f7c8f8bc0ad5ac2552e42e516",
    apitoken: "VEtKD6sBAvgwQd1pYBV957Rno1feXoxqXPo1biij"
  },
  "hostingers-vvip.my.id": {
    zone: "2341ae01634b852230b7521af26c261f",
    apitoken: "Ztw1ouD8_lJf-QzRecgmijjsDJODFU4b-y697lPw"
  },
  "ekiofficial.web.id": {
    zone: "e1b037c00268cae95076b58f7f78b1f6",
    apitoken: "EJO7mHrBORH9XoQrnUvBqotMYxNm5bjB5UO2PeQE"
  },
  "eki-panelpvrt.my.id": {
    zone: "6b4cb792b77b6118e91d8604253ca572",
    apitoken: "DsftwwFCAKrbSo-9r9hxqcscMw8Xvx8gQzTXMSz4"
  },
  "hostsatoruu.biz.id": {
    zone: "30ea1aac05ca26dda61540e172f52ff4",
    apitoken: "eZp1wNcc0Mj-btUQQ1cDIek2NZ6u1YW1Bxc2SB3z"
  },
  "kenz-host.my.id": {
    zone: "df24766ae8eeb04b330b71b5facde5f4",
    apitoken: "fyaxLxD0jNONtMWK3AmnaiLkkWi5Wg3Y9h8nqJh6"
  },
  "panelpro.fun": {
    zone: "a5c4697e86cf1cda49c0f81a699a690e",
    apitoken: "k-ZxmwqjyZf7iu4zNSJDTIx2tH6JZ--JQgfZReM9"
  },
  "pterodactyl-panel.web.id": {
    zone: "d69feb7345d9e4dd5cfd7cce29e7d5b0",
    apitoken: "32zZwadzwc7qB4mzuDBJkk1xFyoQ2Grr27mAfJcB"
  },
  "pterodaytl.my.id": {
    zone: "828ef14600aaaa0b1ea881dd0e7972b2",
    apitoken: "75HrVBzSVObD611RkuNS1ZKsL5A_b8kuiCs26-f9"
  },
  "store-panell.my.id": {
    zone: "0189ecfadb9cf2c4a311c0a3ec8f0d5c",
    apitoken: "eVI-BXIXNEQtBqLpdvuitAR5nXC2bLj6jw365JPZ"
  },
  "wannhosting.biz.id": {
    zone: "4e6fe33fb08c27d97389cad0246bfd9b",
    apitoken: "75HrVBzSVObD611RkuNS1ZKsL5A_b8kuiCs26-f9"
  },
  "wannhosting.my.id": {
    zone: "0b36d11edd793b3f702e0591f0424339",
    apitoken: "OsSjhDZLdHImYTX8fdeiP1wocKwVnoPw5EiI85IF"
  },
  "xpanelprivate.my.id": {
    zone: "f6bd04c23d4de3ec6d60d8eeabe1ff40",
    apitoken: "su_zz3Amd5WkrOv95OA6uQb1Y6ky6qVtjkhQnPCi"
  },
  "loveme.my.id": {
    zone: "91d8ac3650cf245d3119a4f32dbfe03d",
    apitoken: "Pnx3iE-AInXIyK2Ntxnsi149j6qdQ9YGMdca_j9b"
  }
};

const userStates = new Map();
let lastMessageContent = {};

module.exports = (bot) => {
    // log command
function notifyOwner(commandName, msg) {
    const userId = msg.from.id;
    const username = msg.from.username || msg.from.first_name;
    const chatId = msg.chat.id;
    const now = new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' });

    const logMessage = `<pre>💬 Command: /${commandName}
👤 User: @${username}
🆔 ID: ${userId}
🕒 Waktu: ${now}
</pre>
    `;
    bot.sendMessage(OWNER_ID, logMessage, { parse_mode: 'HTML' });
}
    
    // createloc
bot.onText(/^\/createloc (.+)$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const args = match[1].split("|");

  if (args.length < 3) {
    return bot.sendMessage(chatId, "❌ Format salah!\n\nContoh:\n/createloc https://domain|ptlaApikey|SG");
  }

  const domain = args[0].trim();
  const ptla = args[1].trim();
  const shortCode = args[2].trim().toUpperCase();

  try {
    const locationData = {
      short: shortCode,
      description: `Location ${shortCode}`
    };

    const response = await axios.post(
      `${domain}/api/application/locations`,
      locationData,
      {
        headers: {
          "Authorization": `Bearer ${ptla}`,
          "Content-Type": "application/json",
          "Accept": "Application/vnd.pterodactyl.v1+json"
        }
      }
    );

    const location = response.data.attributes;

    bot.sendMessage(
      chatId,
      `✅ *ʟᴏᴄᴀᴛɪᴏɴ ʙᴇʀʜᴀꜱɪʟ ᴅɪʙᴜᴀᴛ!*\n\nShort Code: ${location.short}\nID: ${location.id}`,
      { parse_mode: "Markdown" }
    );
  } catch (error) {
    console.error("Error creating location:", error.response?.data || error.message);

    if (error.response?.data?.errors) {
      const errorDetails = error.response.data.errors;
      let errorMessage = "❌ Gagal membuat location:\n";

      errorDetails.forEach(err => {
        errorMessage += `• ${err.detail || err.code}\n`;
      });

      bot.sendMessage(chatId, errorMessage);
    } else {
      bot.sendMessage(chatId, "❌ Terjadi kesalahan saat membuat location. Silakan coba lagi.");
    }
  }
});
bot.onText(/^(\.|\#|\/)createnode\s+(.+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const fromId = String(msg.from.id);
  const paramText = match[2];
  const owners = loadJsonData(OWNER_FILE);

  if (!owners.includes(fromId)) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses owner!");
  }

  const parts = paramText.split("|").map(x => x.trim());
  if (parts.length < 2) {
    return bot.sendMessage(
      chatId,
      "❌ Format salah: /createnode ipvps|password"
    );
  }

  userStates[chatId] = {
    type: "createnode",
    step: "node_name",
    userId: fromId,
    data: {
      ipvps: parts[0],
      passwd: parts[1]
    }
  };

  bot.sendMessage(chatId, "🛰 Masukkan nama node:");
});

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  const text = (msg.text || "").trim();
  if (!text || text.startsWith("/")) return;

  const state = userStates[chatId];
  if (!state || state.type !== "createnode") return;

  switch (state.step) {

    case "node_name":
      state.data.namenode = text;
      state.step = "domain";
      return bot.sendMessage(
        chatId,
        "🌐 Masukkan domain node:\nContoh: node1.example.com"
      );

    case "domain":
      state.data.domainnode = text;
      state.step = "ram";
      return bot.sendMessage(
        chatId,
        "💾 Masukkan RAM node\nContoh 16GB = 1600000"
      );

    case "ram":
      state.data.ramserver = text;
      state.step = "confirm";
      const d = state.data;

      return bot.sendMessage(
        chatId,
`<b>📋 Konfirmasi Data Node</b>
<blockquote>
🌐 IP VPS : ${d.ipvps}
🛰 Nama Node : ${d.namenode}
🔗 Domain Node : ${d.domainnode}
💾 RAM : ${d.ramserver}
</blockquote>`,
        {
          parse_mode: "HTML",
          reply_markup: {
            inline_keyboard: [
              [
                { text: "✅ YES", callback_data: "createnode_yes" },
                { text: "❌ CANCEL", callback_data: "createnode_cancel" }
              ]
            ]
          }
        }
      );
  }
});

bot.on("callback_query", async (query) => {
  const chatId = query.message.chat.id;
  const data = query.data;

  const state = userStates[chatId];
  if (!state || state.type !== "createnode") return;

  if (data === "createnode_yes") {
    const payload = { ...state.data };
    delete userStates[chatId];

    await bot.answerCallbackQuery(query.id, { text: "Memproses..." });
    return runCreateNode(chatId, query.message, payload);
  }

  if (data === "createnode_cancel") {
    delete userStates[chatId];
    await bot.answerCallbackQuery(query.id, { text: "Dibatalkan" });
    return bot.sendMessage(chatId, "❌ Proses create node dibatalkan.");
  }
});

function runCreateNode(chatId, msg, {
  ipvps,
  passwd,
  namenode,
  domainnode,
  ramserver
}) {
  const ssh = new Client();

  ssh.on("ready", () => {
    bot.sendMessage(chatId, "📡 Memproses create node...");

    const commandCreateNode =
      "bash <(curl -s https://raw.githubusercontent.com/rexzy223/tema/main/createnode.sh)";

    ssh.exec(commandCreateNode, (err, stream) => {
      if (err) {
        bot.sendMessage(chatId, "❌ Gagal menjalankan script.");
        ssh.end();
        return;
      }

      stream.on("close", () => {
        bot.sendMessage(
          chatId,
`<b>✅ Sukses Create Node!</b>
<blockquote>
<b>⚠️ Token Deployment</b>
1. Login panel Pterodactyl
2. Pilih node yang baru dibuat
3. Configuration → Generate Token
4. Ketik /swings ipvps|password|token
</blockquote>`,
          { parse_mode: "HTML", reply_to_message_id: msg.message_id }
        );
        ssh.end();
      });

      stream.on("data", (data) => {
        const o = data.toString();

        if (o.includes("Masukkan nama lokasi"))
          stream.write("SGP\n");
        else if (o.includes("Masukkan deskripsi lokasi"))
          stream.write("INSTALL BY REXZY\n");
        else if (o.includes("Masukkan domain"))
          stream.write(`${domainnode}\n`);
        else if (o.includes("Masukkan nama node"))
          stream.write(`${namenode}\n`);
        else if (o.includes("Masukkan RAM"))
          stream.write(`${ramserver}\n`);
        else if (o.includes("disk space"))
          stream.write(`${ramserver}\n`);
        else if (o.includes("Masukkan Locid"))
          stream.write("1\n");
      });
    });
  });

  ssh.on("error", () => {
    bot.sendMessage(chatId, "❌ IP atau password VPS salah!");
  });

  ssh.connect({
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd
  });
}
    // runtime vps
bot.onText(/^\/runtimevps(?:\s+(.+))?/, async (msg, match) => {
  notifyOwner('runtimevps', msg);
  const chatId = msg.chat.id;
  const input = match[1];
    
  if (!input) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /runtimevps ipvps|pwvps");
  }

  if (!input.includes("|")) {
    return bot.sendMessage(chatId, "❌ Format salah!\nGunakan: `/runtimevps ipvps|password`", {
      parse_mode: "Markdown"
    });
  }

  let [host, password] = input.split("|");
  host = host.trim();
  password = password.trim();

  try {
    const conn = new Client();

    conn
      .on("ready", () => {
        conn.exec("uptime -p", (err, stream) => {
          if (err) {
            bot.sendMessage(chatId, "❌ Gagal eksekusi command uptime.");
            return conn.end();
          }

          let output = "";
          stream
            .on("data", (data) => {
              output += data.toString();
            })
            .on("close", () => {
              bot.sendMessage(chatId, `✅ ʀᴜɴᴛɪᴍᴇ ᴠᴘꜱ ${host}\n\`\`\`${output.trim()}\`\`\``, {
                parse_mode: "Markdown"
              });
              conn.end();
            });
        });
      })
      .on("error", (err) => {
        bot.sendMessage(chatId, `❌ Gagal konek VPS: ${err.message}`);
      })
      .connect({
        host,
        port: 22,
        username: "root",
        password
      });

  } catch (err) {
    bot.sendMessage(chatId, "❌ Terjadi kesalahan koneksi VPS.");
    console.error(err);
  }
});
function generateDomainKeyboard(domains, page = 0, host, ip) {
    const perPage = 12;
    const start = page * perPage;
    const end = start + perPage;
    const currentDomains = domains.slice(start, end);
    const keyboard = [];

    for (let i = 0; i < currentDomains.length; i += 2) {
        const row = currentDomains.slice(i, i + 2).map((d, idx) => ({
            text: d,
            callback_data: `create_domain ${start + i + idx} ${host}|${ip}`
        }));
        keyboard.push(row);
    }

    const nav = [];
    if (page > 0) {
        nav.push({ text: "⬅️ Kembali", callback_data: `page_domain ${page - 1} ${host}|${ip}` });
    }
    if (end < domains.length) {
        nav.push({ text: "➡️ Lanjut", callback_data: `page_domain ${page + 1} ${host}|${ip}` });
    }
    if (nav.length > 0) keyboard.push(nav);

    return keyboard;
}

bot.onText(/^\/subdo(?:\s+(.+))?$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const owners = loadJsonData(OWNER_FILE);
    if (!owners.includes(msg.from.id.toString())) {
        return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses owner!!!");
    }

    const text = match[1];
    if (!text || !text.includes("|")) {
        return bot.sendMessage(chatId, "❌ Contoh: /subdo host|ipvps");
    }

    const [host, ip] = text.split("|").map(v => v.trim());
    const dom = Object.keys(global.subdomain);
    if (dom.length === 0) {
        return bot.sendMessage(chatId, "❌ Tidak ada domain.");
    }

    const keyboard = generateDomainKeyboard(dom, 0, host, ip);

    bot.sendMessage(chatId, `🔹 *Subdomain yang tersedia*`, {
        parse_mode: "Markdown",
        reply_markup: { inline_keyboard: keyboard }
    });
});

bot.on("callback_query", async (callbackQuery) => {
    const msg = callbackQuery.message;
    const data = callbackQuery.data.split(" ");

    if (data[0] === "page_domain") {
        const page = Number(data[1]);
        const payload = data.slice(2).join(" ");
        const [host, ip] = payload.split("|");
        const dom = Object.keys(global.subdomain);
        const keyboard = generateDomainKeyboard(dom, page, host, ip);

        await bot.editMessageReplyMarkup(
            { inline_keyboard: keyboard },
            { chat_id: msg.chat.id, message_id: msg.message_id }
        );
        return bot.answerCallbackQuery(callbackQuery.id);
    }

    if (data[0] === "create_domain") {
        const domainIndex = Number(data[1]);
        const payload = data.slice(2).join(" ");
        const [host, ip] = payload.split("|");
        const dom = Object.keys(global.subdomain);

        if (domainIndex < 0 || domainIndex >= dom.length) {
            return bot.answerCallbackQuery(callbackQuery.id, { text: "❌ Domain tidak ditemukan", show_alert: true });
        }

        const tldnya = dom[domainIndex];

        async function createSubDomain(host, ip) {
            try {
                const res = await axios.post(
                    `https://api.cloudflare.com/client/v4/zones/${global.subdomain[tldnya].zone}/dns_records`,
                    {
                        type: "A",
                        name: `${host.replace(/[^a-z0-9.-]/gi, "")}.${tldnya}`,
                        content: ip.replace(/[^0-9.]/gi, ""),
                        ttl: 1,
                        proxied: false
                    },
                    {
                        headers: {
                            Authorization: `Bearer ${global.subdomain[tldnya].apitoken}`,
                            "Content-Type": "application/json"
                        }
                    }
                );
                if (res.data.success) {
                    return { success: true, name: res.data.result.name, ip: res.data.result.content };
                }
                return { success: false, error: "Gagal membuat subdomain" };
            } catch (e) {
                return { success: false, error: e.response?.data?.errors?.[0]?.message || e.message };
            }
        }

        const result = await createSubDomain(host.toLowerCase(), ip);

        if (result.success) {
            await bot.editMessageText(
                `✅ *Berhasil Membuat Subdomain*\n\n🌐 *Subdomain:* \`${result.name}\`\n📌 *IP VPS:* \`${result.ip}\``,
                {
                    chat_id: msg.chat.id,
                    message_id: msg.message_id,
                    parse_mode: "Markdown",
                    reply_markup: { inline_keyboard: [] }
                }
            );
        } else {
            await bot.sendMessage(
                msg.chat.id,
                `❌ *Gagal membuat subdomain:*\n${result.error}`,
                { parse_mode: "Markdown" }
            );
        }

        return bot.answerCallbackQuery(callbackQuery.id);
    }
});
bot.onText(/^\/totaldomain(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const text = match[1];

    if (!text || !text.includes("|")) {
        return bot.sendMessage(chatId, "❌ Contoh: /totaldomain zoneid|apitoken");
    }

    const [zoneId, apiToken] = text.split("|").map(i => i.trim());

    try {
        const res = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records?per_page=1000`,
            {
                headers: {
                    Authorization: `Bearer ${apiToken}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!res.data.success) {
            return bot.sendMessage(chatId, "❌ Gagal mengambil data domain");
        }

        const records = res.data.result;
        if (!records || records.length === 0) {
            return bot.sendMessage(chatId, "❌ Tidak ada domain terdaftar");
        }

        const listDomain = records
            .map((r, i) => `${i + 1}. ${r.name}`)
            .join("\n");

        await bot.sendMessage(
            chatId,
            `📊 *TOTAL DOMAIN*\n\n🌐 Zone ID : \`${zoneId}\`\n📌 Total Domain : *${records.length}*\n\n${listDomain}`,
            { parse_mode: "Markdown" }
        );
    } catch (e) {
        await bot.sendMessage(chatId, "❌ Zone ID atau API Token tidak valid");
    }
});
bot.onText(/^\/ceksubdo(?:\s+(.+))?$/i, async (msg, match) => {
    const chatId = msg.chat.id;
    const domain = match[1]?.trim();

    if (!domain) {
        return bot.sendMessage(chatId, "❌ Contoh: /ceksubdo sub.example.com");
    }

    const domainRegex = /^(?!:\/\/)([a-zA-Z0-9-_]+\.)+[a-zA-Z]{2,}$/;
    if (!domainRegex.test(domain)) {
        return bot.sendMessage(chatId, "❌ Format domain tidak valid");
    }

    try {
        const records = await dns.resolve4(domain);

        if (!records || records.length === 0) {
            return bot.sendMessage(
                chatId,
                `❌ *SUBDOMAIN TIDAK DITEMUKAN*\n\n🌐 Domain : \`${domain}\``,
                { parse_mode: "Markdown" }
            );
        }

        await bot.sendMessage(
            chatId,
            `✅ *SUBDOMAIN VALID*\n\n🌐 Domain : \`${domain}\`\n📌 IP : \`${records.join(", ")}\``,
            { parse_mode: "Markdown" }
        );
    } catch (e) {
        await bot.sendMessage(
            chatId,
            `❌ *SUBDOMAIN TIDAK DITEMUKAN*\n\n🌐 Domain : \`${domain}\``,
            { parse_mode: "Markdown" }
        );
    }
});
bot.onText(/^\/listsubdo$/, async (msg) => {
  const chatId = msg.chat.id;
  const owners = loadJsonData(OWNER_FILE);

  if (!owners.includes(msg.from.id.toString())) {
    return bot.sendMessage(
      chatId,
      "<blockquote>❌ Khusus owner!</blockquote>",
      { parse_mode: "HTML" }
    );
  }

  const allSubdomains = Object.keys(global.subdomain);
  if (allSubdomains.length === 0) {
    return bot.sendMessage(
      chatId,
      "<blockquote>❌ Tidak ada domain yang tersedia saat ini.</blockquote>",
      { parse_mode: "HTML" }
    );
  }

  let teks = "<blockquote>📜 <b>Daftar Subdomain</b>\n\n";

  const cekPromises = allSubdomains.map(async (d, index) => {
    const { zone, apitoken } = global.subdomain[d];
    let icon = "❌"; // default error

    try {
      const cek = await axios.get(`https://api.cloudflare.com/client/v4/zones/${zone}`, {
        headers: {
          Authorization: `Bearer ${apitoken}`,
          "Content-Type": "application/json"
        }
      });

      if (cek.data.success) icon = "✅"; // valid
    } catch {}

    return `${icon} ${index + 1}. ${d}`;
  });

  const hasil = await Promise.all(cekPromises);
  teks += hasil.join("\n") + "</blockquote>"; // tutup blok quote setelah semua teks

  bot.sendMessage(chatId, teks, {
    parse_mode: "HTML",
    reply_to_message_id: msg.message_id
  });
});
bot.onText(/^\/delsubdo(?:\s+(.+))?/, async (msg, match) => {
    notifyOwner('delsubdo', msg);
    const chatId = msg.chat.id;
    const owners = loadJsonData(OWNER_FILE);

    if (!owners.includes(msg.from.id.toString())) {
        return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses owner!!!");
    }

    const domain = match[1];
    if (!domain) {
        return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /delsubdo sub.example.com");
    }

    // cari domain induk dari global.subdomain
    const tld = Object.keys(global.subdomain).find(d => domain.endsWith(d));
    if (!tld) return bot.sendMessage(chatId, "❌ Domain tidak ditemukan dalam list global.subdomain!");

    const zone = global.subdomain[tld].zone;
    const token = global.subdomain[tld].apitoken;

    try {
        // cari record ID berdasarkan nama domain
        const find = await axios.get(
            `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records?type=A&name=${domain}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (!find.data.success || find.data.result.length === 0) {
            return bot.sendMessage(chatId, "❌ Subdomain tidak ditemukan di Cloudflare!");
        }

        const recordId = find.data.result[0].id;

        // hapus record
        const del = await axios.delete(
            `https://api.cloudflare.com/client/v4/zones/${zone}/dns_records/${recordId}`,
            {
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );

        if (del.data.success) {
            bot.sendMessage(chatId, `✅ *Berhasil menghapus subdomain*\n\n🌐 \`${domain}\``, { parse_mode: "Markdown" });
        } else {
            bot.sendMessage(chatId, `❌ Gagal menghapus subdomain\n${del.data.errors?.[0]?.message || ""}`);
        }

    } catch (e) {
        bot.sendMessage(chatId, `❌ Error:\n${e.response?.data?.errors?.[0]?.message || e.message}`);
    }
});
// Command /installdepend
bot.onText(/^\/installdepend (.+)$/, async (msg, match) => {
  notifyOwner('installdepend', msg);
  const chatId = msg.chat.id;
  const text = match[1];

  const owners = loadJsonData(OWNER_FILE);
  if (!owners.includes(msg.from.id.toString())) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!");
  }

  if (!text.includes("|")) {
    return bot.sendMessage(chatId, "⚠️ Format: /installdepend IpVps|PwVps");
  }

  const [ipvps, passwd] = text.split("|").map(item => item.trim());
  if (!ipvps || !passwd) {
    return bot.sendMessage(chatId, "⚠️ Format: /installdepend IpVps|PwVps");
  }

  const loadingMsg = await bot.sendMessage(chatId, "🔍 Mengulas koneksi VPS...");
  lastMessageContent[chatId] = "🔍 Mengulas koneksi VPS...";

  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd,
    readyTimeout: 15000
  };

  const command = `bash <(curl -s https://raw.githubusercontent.com/KiwamiXq1031/installer-premium/refs/heads/main/zero.sh)`;
  const conn = new Client();

  const updateProgress = async (newText) => {
    if (lastMessageContent[chatId] !== newText) {
      try {
        await bot.editMessageText(newText, {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        });
        lastMessageContent[chatId] = newText;
      } catch (error) {
        if (!error.message.includes('message is not modified')) {
          console.error('Edit message error:', error.message);
        }
      }
    }
  };

  conn.on("ready", async () => {
    await updateProgress("✅ Koneksi berhasil\n⏳ Memproses install depend Pterodactyl...\n⏰ Tunggu 1-10 menit hingga proses selesai ✅");

    conn.exec(command, (err, stream) => {
      if (err) {
        updateProgress("❌ Gagal mengeksekusi command!");
        return conn.end();
      }

      let progressUpdated = false;

      stream.on("close", async () => {
        try {
          await bot.deleteMessage(chatId, loadingMsg.message_id);
          delete lastMessageContent[chatId];
          await bot.sendMessage(chatId, "✅ Berhasil install depend!");
        } catch (error) {
          console.error('Delete message error:', error.message);
        }
        conn.end();
      }).on("data", (data) => {
        const output = data.toString();
        console.log("OUTPUT:", output);

        if (!progressUpdated && output.includes("Installing")) {
          updateProgress("📦 Menginstall paket dependensi...\n⏰ Tunggu sebentar");
          progressUpdated = true;
        }

        stream.write("11\n");
        stream.write("A\n");
        stream.write("Y\n");
        stream.write("Y\n");
      }).stderr.on("data", (data) => {
        console.log("ERROR:", data.toString());
      });
    });
  }).on("error", async (err) => {
    console.error("SSH Error:", err.message);
    await updateProgress("❌ Katasandi atau IP tidak valid\nPastikan VPS aktif dan kredensial benar!");
  }).connect(connSettings);
});


bot.onText(/^\/hbpanel(?:\s+(.+))?/, async (msg, match) => {
  notifyOwner('hbpanel', msg);
  const chatId = msg.chat.id;
  const userId = msg.from.id;

  let text = match[1];
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /hbpanel ipvps|pwvps");
  }
    
  let t = text.split("|");
  if (t.length < 2) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh:\n/hbpanel ipvps|pwvps");
  }

  let ipvps = t[0].trim();
  let passwd = t[1].trim();

  await bot.sendMessage(chatId, "⏳ Proses hackback panel...");

  let newuser = "admin" + Math.floor(Math.random() * 9999).toString();
  let newpw = "admin" + Math.floor(Math.random() * 9999).toString();

  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd
  };

  const command = `bash <(curl -s https://raw.githubusercontent.com/rexzy223/tema/refs/heads/main/install.sh)`;
  const conn = new Client();

  conn.on("ready", () => {
    conn.exec(command, (err, stream) => {
      if (err) throw err;

      stream.on("close", async () => {
        let teks = `
*HackBack Akun Success ✅*

*Detail akun panel anda:*
👤 Username: \`${newuser}\`
🔑 Password: \`${newpw}\`
`;
        await bot.sendMessage(chatId, teks, { parse_mode: "Markdown" });
        conn.end();
      }).on("data", (data) => {
        console.log("STDOUT:", data.toString());
      }).stderr.on("data", (data) => {
        console.log("STDERR:", data.toString());
        stream.write("7\n");
        stream.write(`${newuser}\n`);
        stream.write(`${newpw}\n`);
      });
    });
  }).on("error", (err) => {
    console.log("Connection Error:", err);
    bot.sendMessage(chatId, "❌ ᴋᴀᴛᴀꜱᴀɴᴅɪ ᴀᴛᴀᴜ ɪᴘ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ");
  }).connect(connSettings);
});
    
// command /setpwvps
bot.onText(/^\/setpwvps(?:\s+(.+))?/, async (msg, match) => {
  notifyOwner('setpwvps', msg);
  const chatId = msg.chat.id;
  const userId = msg.from.id;
    
  let text = match[1];
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /setpwvps ipvps|password_lama|password_baru");
  }
    
  let t = text.split("|");
  if (t.length < 3) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh:\n/setpwvps ipvps|password_lama|password_baru");
  }

  let ipvps = t[0].trim();
  let passwd = t[1].trim();
  let newpw = t[2].trim();

  await bot.sendMessage(chatId, "⏳ Sedang Memproses...");

  const connSettings = {
    host: ipvps,
    port: 22,
    username: "root",
    password: passwd
  };

  const command = `bash <(curl -s https://raw.githubusercontent.com/rexzy223/tema/refs/heads/main/install.sh)`;
  const conn = new Client();

  conn.on("ready", () => {
    conn.exec(command, (err, stream) => {
      if (err) throw err;

      stream.on("close", async () => {
        conn.end();
      }).on("data", (data) => {
        console.log("STDOUT:", data.toString());
      }).stderr.on("data", (data) => {
        console.log("STDERR:", data.toString());
        stream.write("8\n");
        stream.write(`${newpw}\n`);
        stream.write(`${newpw}\n`);
      });
    });
  }).on("error", (err) => {
    console.log("Connection Error:", err);
    bot.sendMessage(chatId, "❌ ᴋᴀᴛᴀꜱᴀɴᴅɪ ᴀᴛᴀᴜ ɪᴘ ᴛɪᴅᴀᴋ ᴠᴀʟɪᴅ");
  }).connect(connSettings);
    
    let teks = `
*Sukses mengganti password ✅*

*Detail Password:*
📌 IP VPS: \`${ipvps}\`
🔑 Password: \`${newpw}\`
`;
        await bot.sendMessage(chatId, teks, { parse_mode: "Markdown" });
});
    
// command /cwings
bot.onText(/^\/cwings(?:\s+(.+))?/, async (msg, match) => {
  notifyOwner('cwings', msg);
  const chatId = msg.chat.id;
  const messageId = msg.message_id;

  const owners = loadJsonData(OWNER_FILE);

  if (!owners.includes(msg.from.id.toString())) {
    return bot.sendMessage(chatId, "❌ Hanya untuk owner!");
  }
    
  const text = match[1];
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /cwings ipvps|pwvps");
  }
    
  if (!text.includes("|")) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /cwings ipvps|pwvps");
  }

  const [ip, password] = text.split("|").map(x => x.trim());
  const conn = new Client();

  const loadingMsg = await bot.sendMessage(chatId, "🔍 Menghubungkan ke VPS...");

  const progressStages = [
    "🔗 Menghubungkan ke VPS...",
    "📡 Mengecek status Wings...",
    "⚡ Memproses informasi...",
    "✅ Menganalisa hasil..."
  ];

  let currentStage = 0;

  const updateProgress = async (newText) => {
    if (lastMessageContent[chatId] !== newText) {
      try {
        await bot.editMessageText(newText, {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        });
        lastMessageContent[chatId] = newText;
      } catch (error) {
        if (!error.message.includes('message is not modified')) {
          console.error('Edit message error:', error.message);
        }
      }
    }
  };

  conn.on("ready", async () => {
    await updateProgress();

    conn.exec("systemctl is-active wings", (err, stream) => {
      if (err) {
        console.error("SSH EXEC ERROR:", err);
        bot.editMessageText("❌ Gagal menjalankan pengecekan Wings.", {
          chat_id: chatId,
          message_id: loadingMsg.message_id
        });
        return conn.end();
      }

      let output = "";
      
      stream.on("data", (data) => {
        output += data.toString();
        console.log("STDOUT:", data.toString());
        updateProgress();
      });
      
      stream.stderr.on("data", (data) => {
        output += data.toString();
        console.log("STDERR:", data.toString());
        updateProgress();
      });

      stream.on("close", async () => {
        await updateProgress();
        conn.end();
        
        setTimeout(async () => {
          await bot.deleteMessage(chatId, loadingMsg.message_id);
          
          const status = output.trim();
          let statusEmoji = "❓";
          let statusText = "Tidak diketahui";
          let description = "";

          if (status === "active") {
            statusEmoji = "✅";
            statusText = "Aktif";
            description = "Wings berjalan dengan lancar";
          } else if (status === "inactive") {
            statusEmoji = "🛑";
            statusText = "Tidak aktif";
            description = "Wings tidak dapat dijalankan";
          } else if (status === "failed") {
            statusEmoji = "❌";
            statusText = "Gagal";
            description = "Terjadi kesalahan saat memulai";
          } else {
            description = `Output: ${status}`;
          }

          const message = `
🌐 Hasil pengecekan Wings

📡 IP VPS: ${ip}
${statusEmoji} Status: ${statusText.toUpperCase()}
📊 Deskripsi: ${description}

${status === "inactive" ? "🔌 Silahkan start Wings dengan /swings ip|password|token" : "✨ Semuanya terlihat baik"}
          `.trim();

          await bot.sendMessage(chatId, message, { 
            parse_mode: "Markdown",
            reply_to_message_id: messageId
          });
        }, 1000);
      });
    });
  }).on("error", async (err) => {
    console.error("SSH CONNECTION ERROR:", err.message);
    await bot.editMessageText("❌ Tidak dapat terhubung ke VPS!\nPastikan:\n• IP dan password benar\n• VPS sedang aktif\n• Koneksi internet stabil", {
      chat_id: chatId,
      message_id: loadingMsg.message_id
    });
  }).connect({
    host: ip,
    port: 22,
    username: "root",
    password: password,
    readyTimeout: 15000
  });
});
bot.onText(/^\/uninstallpanel(?:\s+(.+))?$/, async (msg, match) => {
  notifyOwner('uninstallpanel', msg);
  const chatId = msg.chat.id;
  const text = match[1];

  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /uninstallpanel ip|password");
  }

  const owners = loadJsonData(OWNER_FILE);
  if (!owners.includes(msg.from.id.toString())) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses owner!!");
  }

  const [ip, password] = text.split("|");
  if (!ip || !password) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /uninstallpanel ip|password", { parse_mode: "Markdown" });
  }

  const conn = new Client();

  bot.sendMessage(chatId, `
📡 ᴍᴇɴɢʜᴜʙᴜɴɢᴋᴀɴ ᴋᴇ ᴠᴘꜱ *${ip}*
ꜱɪʟᴀʜᴋᴀɴ ᴛᴜɴɢɢᴜ 10-20 ᴍᴇɴɪᴛ...`, { parse_mode: "Markdown" });

  // CLEANER paling aman (tanpa merusak sistem)
  const CLEAN_DOMAIN = `
rm -rf /etc/nginx/sites-enabled/*;
rm -rf /etc/nginx/sites-available/*;
rm -rf /etc/letsencrypt/live/*;
rm -rf /etc/letsencrypt/archive/*;
rm -rf /etc/letsencrypt/renewal/*;
rm -rf /var/www/pterodactyl/*;
rm -rf /etc/pterodactyl/*;
rm -rf /var/www/html/*;
rm -rf /root/.acme.sh/*;
systemctl reload nginx || true;
systemctl restart nginx || true;
pm2 delete all || true;
`;

  conn.on("ready", () => {

    // Jalankan cleaner terlebih dahulu
    conn.exec(CLEAN_DOMAIN, (err) => {
      if (err) console.log("Cleaner Error:", err);
    });

    // Setelah bersih, jalankan uninstaller
    conn.exec("bash <(curl -s https://pterodactyl-installer.se)", (err, stream) => {
      if (err) {
        conn.end();
        return bot.sendMessage(chatId, "❌ Gagal menjalankan installer.");
      }

      stream.on("close", (code) => {
        conn.end();

        if (code === 0) {
          bot.sendMessage(chatId, `
✅ *ꜱᴜᴋꜱᴇꜱ ᴜɴɪɴꜱᴛᴀʟʟ ᴘᴀɴᴇʟ & ᴍᴇɴɢʜᴀᴘᴜꜱ sᴇᴍᴜᴀ ᴋᴏɴᴇᴋsɪ ᴅᴏᴍᴀɪɴ!*

📌 ɪᴘ ᴠᴘꜱ: \`${ip}\`
🔑 ᴘᴀꜱꜱᴡᴏʀᴅ: \`${password}\`

ᴜɴᴛᴜᴋ ɪɴꜱᴛᴀʟʟ ᴋᴇᴍʙᴀʟɪ, ᴋᴇᴛɪᴋ /installpanel ipvps|pwvps|domain|domain_node|ram!
`, { parse_mode: "Markdown" });
        } else {
          bot.sendMessage(chatId, `⚠️ ɪɴꜱᴛᴀʟʟᴇʀ ꜱᴇʟᴇꜱᴀɪ ᴅᴇɴɢᴀɴ ᴋᴏᴅᴇ ${code}. ʙᴇʙᴇʀᴀᴘᴀ ᴍᴜɴɢᴋɪɴ ɢᴀɢᴀʟ. ᴄᴇᴋ ᴍᴀɴᴜᴀʟ ᴠᴘꜱ.`);
        }
      });

      stream.on("data", (data) => {
        const out = data.toString();

        if (out.includes("Input 0-6")) stream.write("6\n");
        if (out.includes("Do you want to remove panel? (y/N)")) stream.write("y\n");
        if (out.includes("Do you want to remove Wings (daemon)? (y/N)")) stream.write("y\n");
        if (out.includes("Continue with uninstallation? (y/N)")) stream.write("y\n");
        if (out.includes("Choose the panel database")) stream.write("\n");
        if (out.includes("Database called panel")) stream.write("y\n");
        if (out.includes("User called pterodactyl")) stream.write("y\n");
      });

      stream.stderr.on("data", (data) => {
        console.error("UNINSTALL ERR:", data.toString());
      });

    });

  }).on("error", (err) => {
    bot.sendMessage(chatId, `❌ Gagal konek ke VPS:\n${err.message}`);
  }).connect({
    host: ip,
    port: 22,
    username: "root",
    password: password,
    readyTimeout: 30000
  });
});

bot.onText(/^\/uninstallwings(?:\s+(.+))?$/, async (msg, match) => {
  notifyOwner('uninstallwings', msg);
  const chatId = msg.chat.id;
  const text = match[1];
  
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /uninstallwings ip|password");
  }

  const owners = loadJsonData(OWNER_FILE);

  if (!owners.includes(msg.from.id.toString())) {
    return bot.sendMessage(chatId, "❌ Kamu tidak memiliki akses owner!!!");
  }
    
  const [ip, password] = text.split("|");
  if (!ip || !password) {
    return bot.sendMessage(chatId, "❌ Format salah!\nGunakan:\n`/uninstallwings ip|password`", { parse_mode: "Markdown" });
  }

  const conn = new Client();
  bot.sendMessage(chatId, `🛠 ᴍᴇɴɢʜᴜʙᴜɴɢᴋᴀɴ ᴋᴇ ᴠᴘꜱ *${ip}*...\nꜱᴇᴅᴀɴɢ ᴘʀᴏꜱᴇꜱ ᴜɴɪɴꜱᴛᴀʟʟ ᴡɪɴɢꜱ + ʀᴇꜱᴇᴛ ᴘᴏʀᴛ`, { parse_mode: "Markdown" });

  conn.on("ready", () => {
    const script = `
systemctl stop wings
systemctl disable wings
rm -f /etc/systemd/system/wings.service
rm -f /usr/local/bin/wings
rm -rf /etc/pterodactyl
rm -rf /var/lib/pterodactyl
`;

    conn.exec(script, (err, stream) => {
      if (err) {
        conn.end();
        return bot.sendMessage(chatId, "❌ Gagal mengeksekusi perintah di VPS.");
      }

      stream.on("close", (code) => {
        conn.end();
        if (code === 0) {
          bot.sendMessage(chatId, `✅ *Wings berhasil dihapus dari VPS ${ip}*\n🧹 Port 8080 & 2022 juga dibersihkan.`, { parse_mode: "Markdown" });
        } else {
          bot.sendMessage(chatId, `⚠️ Selesai dengan kode ${code}. Sebagian mungkin gagal. Periksa manual.`);
        }
      }).on("data", (data) => {
        console.log("STDOUT:", data.toString());
      }).stderr.on("data", (data) => {
        console.error("STDERR:", data.toString());
      });
    });
  }).on("error", (err) => {
    bot.sendMessage(chatId, `❌ Tidak bisa konek ke VPS:\n${err.message}`);
  }).connect({
    host: ip,
    port: 22,
    username: "root",
    password: password,
    readyTimeout: 15000
  });
});

bot.onText(/^\/usrpanel(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /usrpanel ip|password");
  }

  if (!text.includes("|")) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /usrpanel ipvps|password");
  }

  const [ip, password] = text.split("|");
  if (!ip || !password) {
    return bot.sendMessage(chatId, "❌ Format tidak valid.\nGunakan: /usrpanel ipvps|password");
  }

  const sshConfig = {
    host: ip,
    port: 22,
    username: "root",
    password: password.trim()
  };

  const conn = new Client();

  conn.on("ready", () => {
    conn.exec(
      'cd /var/www/pterodactyl && php artisan tinker --execute="print_r(Pterodactyl\\\\Models\\\\User::all([\'id\',\'username\',\'email\'])->toArray());"',
      (err, stream) => {
        if (err) {
          bot.sendMessage(chatId, "❌ Gagal eksekusi command.");
          return conn.end();
        }

        let output = "";
        stream.on("data", (data) => {
          output += data.toString();
        });

        stream.on("close", () => {
          conn.end();
          if (!output.trim()) {
            return bot.sendMessage(chatId, "❌ Tidak ada output dari server.");
          }

          if (output.length > 3500) {
            output = output.slice(0, 3500) + "\n... (dipotong)";
          }
          bot.sendMessage(chatId, "📋 Daftar User Panel\nOutput:\n```\n" + output + "\n```", {
            parse_mode: "Markdown"
          });
        });
      }
    );
  }).on("error", (err) => {
    bot.sendMessage(chatId, "❌ Gagal konek SSH: " + err.message);
  }).connect(sshConfig);
});

bot.onText(/^\/usrpasswd(?:\s+(.+))?/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1];
  
  if (!text) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: /usrpasswd ip|password");
  }

  const parts = text.split("|");
  if (parts.length < 4) {
    return bot.sendMessage(
      chatId,
      "❌ Format salah!\nContoh: /usrpasswd ipvps|passwordroot|iduser|passwordbaru"
    );
  }

  const [ip, rootPass, userId, newPass] = parts;

  const sshConfig = {
    host: ip,
    port: 22,
    username: "root",
    password: rootPass.trim()
  };

  const conn = new Client();

  conn.on("ready", () => {
    const cmd = `cd /var/www/pterodactyl && php artisan tinker --execute="if(Pterodactyl\\Models\\User::find(${userId})){ Pterodactyl\\Models\\User::find(${userId})->update(['password' => bcrypt('${newPass}')]); echo 'Password user ID ${userId} berhasil diubah'; } else { echo 'User tidak ditemukan'; }"`;

    conn.exec(cmd, (err, stream) => {
      if (err) {
        bot.sendMessage(chatId, "❌ Gagal eksekusi command.");
        return conn.end();
      }

      let output = "";
      stream.on("data", (data) => {
        output += data.toString();
      });

      stream.on("close", () => {
        conn.end();
        if (!output.trim()) output = "❌ Tidak ada respon dari server.";
        bot.sendMessage(chatId, "🔑 Output:\n```\n" + output.trim() + "\n```", {
          parse_mode: "Markdown"
        });
      });
    });
  }).on("error", (err) => {
    bot.sendMessage(chatId, "❌ Gagal konek SSH: " + err.message);
  }).connect(sshConfig);
});

// /clearall user&server panel
bot.onText(/^\/clearall (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id;

    const params = match[1].split('|');
    if (params.length !== 2) {
        return bot.sendMessage(chatId, '❌ Format salah! Gunakan: /clearall ipvps|pwvps');
    }

    const [ipvps, pwvps] = params;

    try {
        const processingMsg = await bot.sendMessage(chatId, '🔄 ᴍᴇᴍᴘʀᴏꜱᴇꜱ ᴄʟᴇᴀʀ ᴀʟʟ...');

        // koneksi SSH
        const conn = new Client();
        let sshOutput = '';

        conn.on('ready', () => {
            console.log('SSH Connection Ready');
            
            const cmd = `cd /var/www/pterodactyl && php artisan tinker --execute="DB::statement('SET FOREIGN_KEY_CHECKS=0;'); \\\\Pterodactyl\\\\Models\\\\User::truncate(); \\\\Pterodactyl\\\\Models\\\\Server::truncate(); DB::statement('SET FOREIGN_KEY_CHECKS=1;'); echo 'Clear all berhasil dilakukan!';"`;
            
            conn.exec(cmd, (err, stream) => {
                if (err) {
                    bot.editMessageText(`❌ SSH Error: ${err.message}`, {
                        chat_id: chatId,
                        message_id: processingMsg.message_id
                    });
                    return conn.end();
                }
                
                stream.on('close', (code, signal) => {
                    console.log('Stream closed');
                    conn.end();
                    
                    bot.editMessageText(`✅ Sukses clear all User & Server!
ᴏᴜᴛᴘᴜᴛ:
\`\`\`
${sshOutput || 'Tidak ada output'}
\`\`\`
`, {
                        chat_id: chatId,
                        parse_mode: "Markdown",
                        message_id: processingMsg.message_id
                    });
                }).on('data', (data) => {
                    sshOutput += data.toString();
                }).stderr.on('data', (data) => {
                    sshOutput += data.toString();
                });
            });
        });

        conn.on('error', (err) => {
            console.error('SSH Connection Error:', err);
            bot.editMessageText(`❌ SSH Connection Error: ${err.message}`, {
                chat_id: chatId,
                message_id: processingMsg.message_id
            });
        });

        conn.on('end', () => {
            console.log('SSH Connection Ended');
        });

        // Connect to SSH
        conn.connect({
            host: ipvps,
            port: 22,
            username: 'root',
            password: pwvps
        });

    } catch (error) {
        console.error('Error:', error);
        bot.sendMessage(chatId, `❌ Terjadi error: ${error.message}`);
    }
});

bot.onText(/^\/datavps(?:\s+(.+))?/, async (msg, match) => {
  notifyOwner('infovps', msg);
  const chatId = msg.chat.id;
  const input = match[1];

  if (!input) {
    return bot.sendMessage(chatId, "❌ Format salah!\nContoh: `/infovps 1.1.1.1|password`", {
      parse_mode: "Markdown"
    });
  }

  if (!input.includes("|")) {
    return bot.sendMessage(chatId, "❌ Format salah!\nGunakan format:\n`/infovps ip|password`", {
      parse_mode: "Markdown"
    });
  }

  let [host, password] = input.split("|");
  host = host.trim();
  password = password.trim();

  try {
    const conn = new Client();

    conn.on("ready", () => {
      const command = `
        echo "RUNTIME: $(uptime -p)"
        echo "LOAD: $(uptime | awk -F'load average:' '{print $2}')"
        echo "RAM_TOTAL: $(free -g | awk '/Mem:/ {print $2}')"
        echo "RAM_USED: $(free -g | awk '/Mem:/ {print $3}')"
        echo "CORE: $(nproc)"
        echo "CPU_USAGE: $(top -bn1 | grep "Cpu(s)" | awk '{print 100 - $8}' )"
        echo "DISK_TOTAL: $(df -h / | awk 'NR==2 {print $2}')"
        echo "DISK_USED: $(df -h / | awk 'NR==2 {print $3}')"
        echo "DISK_FREE: $(df -h / | awk 'NR==2 {print $4}')"
        echo "OS: $(hostnamectl | grep 'Operating System' | cut -d ':' -f2)"
        echo "KERNEL: $(uname -r)"
      `;

      conn.exec(command, (err, stream) => {
        if (err) {
          bot.sendMessage(chatId, "❌ Gagal mengeksekusi perintah di VPS.");
          return conn.end();
        }

        let output = "";
        stream.on("data", (data) => (output += data.toString()));
        stream.on("close", () => {

          // Pisahkan per baris
          let info = {};
          output.trim().split("\n").forEach(line => {
            const [key, ...valueParts] = line.split(":");
            info[key.trim()] = valueParts.join(":").trim();
          });

          // Hilangkan nilai 0
          const fix = (val) => (!val || val === "0" || val === "0G") ? "-" : val;

          const runtime = fix(info.RUNTIME);
          const load = fix(info.LOAD);
          const ramTotal = fix(info.RAM_TOTAL);
          const ramUsed = fix(info.RAM_USED);
          const core = fix(info.CORE);
          const cpuUsage = fix(parseFloat(info.CPU_USAGE).toFixed(1));
          const diskTotal = fix(info.DISK_TOTAL);
          const diskUsed = fix(info.DISK_USED);
          const diskFree = fix(info.DISK_FREE);
          const osName = fix(info.OS);
          const kernel = fix(info.KERNEL);

          // Output
          const result = `
📡 *INFO VPS (${host})*

🖥 *System*
• OS: ${osName}
• Kernel: ${kernel}
• Runtime: ${runtime}
• Load Average: ${load}

💾 *Memory*
• RAM Total: ${ramTotal} GB
• RAM Terpakai: ${ramUsed} GB

⚙️ *CPU*
• Core: ${core}
• CPU Usage: ${cpuUsage}%

🗂 *Disk*
• Total: ${diskTotal}
• Digunakan: ${diskUsed}
• Tersisa: ${diskFree}
          `.trim();

          bot.sendMessage(chatId, result, { parse_mode: "Markdown" });
          conn.end();
        });
      });
    });

    conn.on("error", (err) => {
      bot.sendMessage(chatId, `❌ Gagal konek ke VPS: ${err.message}`);
    });

    conn.connect({
      host,
      port: 22,
      username: "root",
      password
    });

  } catch (err) {
    bot.sendMessage(chatId, "❌ Terjadi kesalahan koneksi VPS.");
    console.error(err);
  }
});
bot.onText(/^\/refreshvps(?:\s+(.+))?$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const input = match[1];

  if (!input) {
    return bot.sendMessage(
      chatId,
      "❌ Cara penggunaan: /refreshvps ip|password"
    );
  }

  if (!input.includes("|")) {
    return bot.sendMessage(
      chatId,
      "❌ Cara penggunaan: /refreshvps ip|password"
    );
  }

  const [ip, password] = input.split("|").map(a => a.trim());

  const conn = new Client();
  bot.sendMessage(chatId, `🔄 Memproses clear cache VPS`, { reply_to_message_id: msg.message_id });

  conn.on("ready", () => {
    conn.exec(
      `cd /var/www/pterodactyl && php artisan config:clear && php artisan route:clear && php artisan view:clear && php artisan cache:clear && php artisan optimize`,
      (err, stream) => {
        if (err) {
          bot.sendMessage(chatId, `❌ Error eksekusi command: ${err.message}`);
          conn.end();
          return;
        }

        let output = "";
        stream.on("data", (data) => { output += data.toString(); });
        stream.stderr.on("data", (data) => { output += data.toString(); });

        stream.on("close", () => {
          bot.sendMessage(chatId, `✅ Refresh VPS selesai!`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
          });
          conn.end();
        });
      }
    );
  })

  .connect({
    host: ip,
    port: 22,
    username: "root",
    password: password
  });

  conn.on("error", (err) => {
    bot.sendMessage(chatId, `❌ Gagal konek ke VPS: ${err.message}`);
  });
});
bot.onText(/^\/spekvps (.+)$/, async (msg, match) => {
    const chatId = msg.chat.id;
    const userInput = match[1].trim();

    if (!userInput.includes("|")) {
        return bot.sendMessage(chatId, "❌ Cara penggunaan: /spekvps ip|password");
    }

    const [host, password] = userInput.split("|").map(a => a.trim());
    const username = "root";

    bot.sendMessage(chatId, "🔌 Menghubungkan ke VPS...");

    const conn = new Client();
    conn
        .on("ready", () => {
            const commands = [
                "echo '=== CPU Info ===' && lscpu | grep 'Model name'",
                "echo '=== Core Count ===' && nproc",
                "echo '=== RAM ===' && free -m | awk 'NR==2{print $2\" MB Total, \"$3\" MB Used, \"$4\" MB Free\"}'",
                "echo '=== Disk ===' && df -h --total | grep total",
                "echo '=== OS ===' && lsb_release -a 2>/dev/null || cat /etc/os-release | grep PRETTY_NAME",
                "echo '=== Kernel ===' && uname -r",
                "echo '=== Uptime ===' && uptime -p"
            ];

            conn.exec(commands.join(" && echo '---' && "), (err, stream) => {
                if (err) return bot.sendMessage(chatId, "❌ Error eksekusi perintah: " + err.message);

                let output = "";
                stream.on("data", (data) => output += data.toString());

                stream.on("close", () => {
                    bot.sendMessage(chatId, "📊 Spesifikasi VPS:\n\n```\n" + output + "\n```", {
                        parse_mode: "Markdown",
                        reply_to_message_id: msg.message_id
                    });
                    conn.end();
                });
            });
        })
        .on("error", (err) => {
            bot.sendMessage(chatId, "❌ Gagal koneksi: " + err.message);
        })
        .connect({
            host,
            port: 22,
            username,
            password,
        });
});
bot.onText(/^\/cpuvps (.+)$/i, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match[1].trim();

  if (!text.includes("|")) {
    return bot.sendMessage(chatId, "❌ Cara penggunaan: /cpuvps ip|password");
  }

  const [ip, password] = text.split("|").map(a => a.trim());

  bot.sendMessage(chatId, `🔄 Mengecek CPU VPS *${ip}*...`, { parse_mode: "Markdown" });

  const conn = new Client();
  conn
    .on("ready", () => {
      conn.exec("top -bn1 | grep 'Cpu(s)'", (err, stream) => {
        if (err) {
          bot.sendMessage(chatId, `❌ Gagal eksekusi command di ${ip}`);
          conn.end();
          return;
        }

        let data = "";
        stream.on("data", (chunk) => data += chunk.toString());

        stream.on("close", () => {
          conn.end();

          const matchCpu = data.match(/(\d+\.\d+)\s*id/);
          if (matchCpu) {
            const idle = parseFloat(matchCpu[1]);
            const used = (100 - idle).toFixed(2);

            bot.sendMessage(chatId, `📊 Total CPU VPS: *${used}%*`, {
              parse_mode: "Markdown",
              reply_to_message_id: msg.message_id
            });
          } else {
            bot.sendMessage(chatId, `⚠️ Gagal parsing data CPU dari VPS *${ip}*`);
          }
        });
      });
    })
    .on("error", (err) => {
      bot.sendMessage(chatId, `❌ Gagal koneksi ke VPS *${ip}*\nPesan: ${err.message}`, { parse_mode: "Markdown" });
    })
    .connect({
      host: ip,
      port: 22,
      username: "root",
      password,
    });
});
bot.onText(/^\/clearstorage(?:\s+(.+))?$/, (msg, match) => {
  const chatId = msg.chat.id;
  const input = match && match[1] ? match[1].trim() : "";

  if (!input) {
    return bot.sendMessage(chatId,
      "❌ Format salah!\nContoh:\n/clearstorage ipvps|pwvps",
      { parse_mode: "Markdown" }
    );
  }

  const parts = input.split("|");
  if (parts.length < 2) {
    return bot.sendMessage(chatId,
      "❌ Format salah!\nContoh:\n/clearstorage ipvps|pwvps",
      { parse_mode: "Markdown" }
    );
  }

  const ipvps = parts[0].trim();
  const pwvps = parts[1].trim();

  const conn = new Client();
  let output = "";
  let stderr = "";

  conn.on("ready", () => {
    bot.sendMessage(chatId, `🚀 Membersihkan storage di VPS: ${ipvps}`);
    conn.exec(
      `docker stop $(docker ps -aq) >/dev/null 2>&1 || true && \
docker system prune -af --volumes && \
rm -rf /var/lib/docker/containers/*/*-json.log || true && \
df -h`,
      (err, stream) => {
        if (err) {
          bot.sendMessage(chatId, "❌ Error eksekusi perintah");
          conn.end();
          return;
        }

        stream.on("data", (data) => {
          output += data.toString();
        });

        stream.stderr.on("data", (data) => {
          stderr += data.toString();
        });

        stream.on("close", (code, signal) => {
          let combined = "";
          if (output) combined += output;
          if (stderr) combined += "\n\nSTDERR:\n" + stderr;

          const safeOutput = combined.length > 3900
            ? combined.slice(0, 3900) + "\n\n... (dipotong)"
            : combined || "Tidak ada output.";

          bot.sendMessage(
            chatId,
            `<b>✅ Storage dibersihkan di VPS ${ipvps}</b>\n\n📊 Sisa storage VPS:\n<pre>${safeOutput}</pre>\n\n<b>Exit code:</b> ${code}, <b>Signal:</b> ${signal}`,
            { parse_mode: "HTML" }
          ).catch(() => {});

          conn.end();
        });
      }
    );
  });

  conn.on("error", (err) => {
    bot.sendMessage(chatId, `❌ Gagal terkoneksi ke VPS ${ipvps}\nError: ${err.message}`);
  });

  conn.on("end", () => {
    console.log(`SSH connection to ${ipvps} ended`);
  });

  conn.on("timeout", () => {
    bot.sendMessage(chatId, `❌ Koneksi ke VPS ${ipvps} timeout`);
    conn.end();
  });

  try {
    conn.connect({
      host: ipvps,
      port: 22,
      username: "root",
      password: pwvps,
      readyTimeout: 20000
    });
  } catch (e) {
    bot.sendMessage(chatId, `❌ Terjadi error saat mencoba koneksi: ${e.message}`);
  }
});
bot.onText(/^\/swings(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match && match[1] ? match[1].trim() : "";

  const parts = text.split("|");
  if (!text || parts.length < 3) {
    return bot.sendMessage(
      chatId,
      `<blockquote>❌ Format salah!\nGunakan: <code>/swings ipvps|pwvps|token_node</code></blockquote>`,
      { parse_mode: "HTML" }
    );
  }

  const ipvps = parts[0].trim();
  const passwd = parts[1].trim();
  const token = parts.slice(2).join("|").trim();

  const sent = await bot.sendMessage(
    chatId,
    `<blockquote>🔄 <b>Memulai koneksi SSH untuk menjalankan Wings...</b></blockquote>`,
    { parse_mode: "HTML" }
  );

  const ssh = new Client();
  let connectionError = null;

  try {
    await new Promise((resolve, reject) => {
      ssh.on("ready", resolve)
         .on("error", reject)
         .connect({
           host: ipvps,
           port: 22,
           username: "root",
           password: passwd,
           readyTimeout: 15000
         });
    });

    await bot.editMessageText(
      `<blockquote>🔄 <b>Mengonfigurasi dan Menjalankan Wings...</b>\n\nTarget: <code>${ipvps}</code></blockquote>`,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: "HTML" }
    );

    const commandSSH = `${token} && systemctl enable wings && systemctl restart wings`;

    await new Promise((resolve, reject) => {
      ssh.exec(commandSSH, (err, stream) => {
        if (err) return reject(err);
        stream.on("close", resolve);
        stream.on("data", () => {});
        stream.stderr.on("data", () => {});
      });
    });

    await bot.editMessageText(
      `<blockquote>✅ <b>Wings berhasil dikonfigurasi dan dijalankan!</b>\n\nVPS: <code>${ipvps}</code></blockquote>`,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: "HTML" }
    );

  } catch (err) {
    connectionError = err;
  } finally {
    ssh.end();
  }

  if (connectionError) {
    await bot.editMessageText(
      `<blockquote>❌ Gagal menjalankan CONFIGUREWINGS: ${connectionError.message || "Koneksi SSH gagal."}</blockquote>`,
      { chat_id: chatId, message_id: sent.message_id, parse_mode: "HTML" }
    );
  }
});
function generateReadableString(length = 4) {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let res = "";
  for (let i = 0; i < length; i++) {
    res += chars[Math.floor(Math.random() * chars.length)];
  }
  return res;
}

// ===== SAFE EDIT (FIX chat not found) =====
async function safeEdit(bot, chatId, messageId, text) {
  try {
    return await bot.editMessageText(text, {
      chat_id: chatId,
      message_id: messageId,
      parse_mode: "HTML"
    });
  } catch (e) {
    return await bot.sendMessage(chatId, text, { parse_mode: "HTML" });
  }
}

// ===== HELPER ESCAPE HTML (WAJIB) =====
function escapeHTML(text = "") {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

bot.onText(/^\/installpanel(?:\s+(.+))?$/, async (msg, match) => {
  const chatId = msg.chat.id;
  const text = match && match[1] ? match[1].trim() : "";

  if (!text || text.split("|").length < 5) {
    return bot.sendMessage(
      chatId,
`<blockquote>❌ <b>Format salah!</b>
Gunakan: <code>/installpanel ipvps|pwvps|panel.com|node.com|ramserver</code></blockquote>`,
      { parse_mode: "HTML" }
    );
  }

  const startTime = Date.now();

  await bot.sendMessage(
    chatId,
`<blockquote>⏳ <b>Proses install panel....</b></blockquote>`,
    { parse_mode: "HTML" }
  );

  const [vpsIP, vpsPassword, domainpanel, domainnode, ramserver] =
    text.split("|").map(v => v.trim());

  const ssh = new Client();
  const connSettings = {
    host: vpsIP,
    port: 22,
    username: "root",
    password: vpsPassword
  };

  const user = "admin";
  const pass = generateReadableString(8);

  const commandPanel = `bash <(curl -s https://pterodactyl-installer.se)`;
  const commandCreateNode = `bash <(curl -s https://raw.githubusercontent.com/rexzy223/tema/main/createnode.sh)`;

  try {
    await new Promise((resolve, reject) => {
      ssh.on("ready", resolve).on("error", reject).connect(connSettings);
    });

    await new Promise((resolve, reject) => {
      ssh.exec(commandPanel, (err, stream) => {
        if (err) return reject(err);
        stream.on("close", resolve);
        stream.on("data", d => {
          const o = d.toString();
          if (o.includes("Input 0-6")) stream.write("0\n");
          else if (o.includes("Database name")) stream.write("\n");
          else if (o.includes("Database username")) stream.write("\n");
          else if (o.includes("Password")) stream.write("\n");
          else if (o.includes("Select timezone")) {
            stream.write("Asia/Jakarta\n");
            stream.write("admin@gmail.com\n");
            stream.write("admin@gmail.com\n");
            stream.write(`${user}\n`);
            stream.write("admin\n");
            stream.write("admin\n");
            stream.write(`${pass}\n`);
            stream.write(`${domainpanel}\n`);
          } else if (o.includes("(y/N)") || o.includes("(Y)es/(N)o")) {
            stream.write("y\n");
          } else if (o.includes("Set the FQDN")) {
            stream.write(`${domainpanel}\n`);
          }
        });
      });
    });

    await new Promise((resolve, reject) => {
      ssh.exec(commandPanel, (err, stream) => {
        if (err) return reject(err);
        stream.on("close", resolve);
        stream.on("data", d => {
          const o = d.toString();
          if (o.includes("Input 0-6")) stream.write("1\n");
          else if (o.includes("Enter the panel address")) stream.write(`${domainpanel}\n`);
          else if (o.includes("Database host username")) stream.write(`${user}\n`);
          else if (o.includes("Database host password")) stream.write(`${pass}\n`);
          else if (o.includes("Set the FQDN")) stream.write(`${domainnode}\n`);
          else if (o.includes("Enter email address")) stream.write("admin@gmail.com\n");
          else if (o.includes("(y/N)") || o.includes("(Y)es/(N)o")) stream.write("y\n");
        });
      });
    });

    await new Promise((resolve, reject) => {
      ssh.exec(commandCreateNode, (err, stream) => {
        if (err) return reject(err);
        stream.on("close", resolve);
        stream.on("data", d => {
          const o = d.toString();
          if (o.includes("Masukkan nama lokasi")) stream.write("SGP\n");
          else if (o.includes("Masukkan deskripsi lokasi")) stream.write("INSTALL BY REXZY\n");
          else if (o.includes("Masukkan domain")) stream.write(`${domainnode}\n`);
          else if (o.includes("Masukkan nama node")) stream.write("NODE BY REXZY\n");
          else if (o.includes("Masukkan RAM")) stream.write(`${ramserver}\n`);
          else if (o.includes("disk space")) stream.write(`${ramserver}\n`);
          else if (o.includes("Masukkan Locid")) stream.write("1\n");
        });
      });
    });

    ssh.end();

    const durationMs = Date.now() - startTime;
    const minutes = Math.floor(durationMs / 60000);
    const seconds = Math.floor((durationMs % 60000) / 1000);

    return bot.sendMessage(
      chatId,
`<blockquote>✅ <b>Instalasi Berhasil</b>

<b>Username :</b> <code>${escapeHTML(user)}</code>
<b>Password :</b> <code>${escapeHTML(pass)}</code>
<b>Panel :</b> ${escapeHTML(domainpanel)}
<b>Node :</b> ${escapeHTML(domainnode)}
⏱ <b>Waktu Instalasi :</b> ${minutes} menit ${seconds} detik

<i>Buat Allocation & ambil token Wings di Panel.
Lalu ketik /swings ipvps|pwvps|token_node</i>
</blockquote>`,
      { parse_mode: "HTML" }
    );

  } catch (err) {
    ssh.end();
    return bot.sendMessage(
      chatId,
`<blockquote>❌ <b>Gagal install panel</b>

<code>${escapeHTML(err.message)}</code>
</blockquote>`,
      { parse_mode: "HTML" }
    );
  }
});

}