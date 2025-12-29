const fs = require('fs');
const { loadJsonData, saveJsonData } = require('../src/data/function');
const settings = require('../settings.js');

const OWNER_ID = settings.ownerId;
const OWNER_FILE = './db/users/adminID.json';

const PREMIUM_FILE = './db/users/premiumUsers.json';
const PREMV2_FILE = './db/users/version/premiumV2.json';
const PREMV3_FILE = './db/users/version/premiumV3.json';
const PREMV4_FILE = './db/users/version/premiumV4.json';
const PREMV5_FILE = './db/users/version/premiumV5.json';
const PREMV6_FILE = './db/users/version/premiumV6.json';
const PREMV7_FILE = './db/users/version/premiumV7.json';

const RESS_FILE = './db/users/resellerUsers.json';
const RESSV2_FILE = './db/users/version/resellerV2.json';
const RESSV3_FILE = './db/users/version/resellerV3.json';
const RESSV4_FILE = './db/users/version/resellerV4.json';
const RESSV5_FILE = './db/users/version/resellerV5.json';
const RESSV6_FILE = './db/users/version/resellerV6.json';
const RESSV7_FILE = './db/users/version/resellerV7.json';

const CEO_FILE = './db/users/ceoUsers.json';
const TK_FILE = './db/users/tkUsers.json';
const PT_FILE = './db/users/ptUsers.json';
const RESSVPS_FILE = './db/users/resellerVps.json';

module.exports = (bot) => {

// command /addceo
bot.onText(/^\/addceo(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /addceo');
    }

    const targetUserId = msg.reply_to_message.from.id.toString();
    const ceoUsers = loadJsonData(CEO_FILE);

    if (!ceoUsers.includes(targetUserId)) {
        ceoUsers.push(targetUserId);
        saveJsonData(CEO_FILE, ceoUsers);
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan menjadi CEO`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi CEO!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }
});

// command /addtk
bot.onText(/^\/addtk(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /addtk');
    }

    const targetUserId = msg.reply_to_message.from.id.toString();

    let tkUsers = loadJsonData(TK_FILE);
    if (!tkUsers.includes(targetUserId)) {
        tkUsers.push(targetUserId);
        saveJsonData(TK_FILE, tkUsers);
    }

    // Tambahkan otomatis ke PT, Premium, dan Res
    let ptUsers = loadJsonData(PT_FILE);
    if (!ptUsers.includes(targetUserId)) {
        ptUsers.push(targetUserId);
        saveJsonData(PT_FILE, ptUsers);
    }

    [PREMIUM_FILE, PREMV2_FILE, PREMV3_FILE , PREMV4_FILE, PREMV5_FILE].forEach(file => {
        let premUsers = loadJsonData(file);
        if (!premUsers.includes(targetUserId)) {
            premUsers.push(targetUserId);
            saveJsonData(file, premUsers);
        }
    });

    [RESS_FILE, RESSV2_FILE, RESSV3_FILE , RESSV4_FILE, RESSV5_FILE].forEach(file => {
        let ressUsers = loadJsonData(file);
        if (!ressUsers.includes(targetUserId)) {
            ressUsers.push(targetUserId);
            saveJsonData(file, ressUsers);
        }
    });

    // Pesan akhir selalu sama
    bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan ke dalam daftar TK!`, { reply_to_message_id: msg.message_id });
});

bot.onText(/^\/deltk(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /deltk');
    }

    const targetUserId = msg.reply_to_message.from.id.toString();

    let tkUsers = loadJsonData(TK_FILE);
    tkUsers = tkUsers.filter(id => id !== targetUserId);
    saveJsonData(TK_FILE, tkUsers);

    let ptUsers = loadJsonData(PT_FILE);
    ptUsers = ptUsers.filter(id => id !== targetUserId);
    saveJsonData(PT_FILE, ptUsers);

    [PREMIUM_FILE, PREMV2_FILE, PREMV3_FILE , PREMV4_FILE, PREMV5_FILE].forEach(file => {
        let premUsers = loadJsonData(file);
        premUsers = premUsers.filter(id => id !== targetUserId);
        saveJsonData(file, premUsers);
    });

    [RESS_FILE, RESSV2_FILE, RESSV3_FILE , RESSV4_FILE, RESSV5_FILE].forEach(file => {
        let ressUsers = loadJsonData(file);
        ressUsers = ressUsers.filter(id => id !== targetUserId);
        saveJsonData(file, ressUsers);
    });

    bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil dihapus dari TK!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
}); 

// command /addpt
bot.onText(/^\/addpt(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /addpt');
    }

    const targetUserId = msg.reply_to_message.from.id.toString();

    // ===== Tambahkan ke PT =====
    const ptUsers = loadJsonData(PT_FILE);
    if (!ptUsers.includes(targetUserId)) {
        ptUsers.push(targetUserId);
        saveJsonData(PT_FILE, ptUsers);
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan menjadi PT`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi PT!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }

    // ===== Tambahkan ke Premium V1 & V2 =====
    [PREMIUM_FILE, PREMV2_FILE].forEach(file => {
        const premUsers = loadJsonData(file);
        if (!premUsers.includes(targetUserId)) {
            premUsers.push(targetUserId);
            saveJsonData(file, premUsers);
        }
    });

    // ===== Tambahkan ke Reseller V1 & V2 =====
    [RESS_FILE, RESSV2_FILE].forEach(file => {
        const ressUsers = loadJsonData(file);
        if (!ressUsers.includes(targetUserId)) {
            ressUsers.push(targetUserId);
            saveJsonData(file, ressUsers);
        }
    });
});
bot.onText(/^\/delpt(?:\s+(.+))?$/, (msg, match) => { 
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /delpt');
    }

    const targetUserId = msg.reply_to_message.from.id.toString();

    // ===== Hapus dari PT =====
    let ptUsers = loadJsonData(PT_FILE);
    if (ptUsers.includes(targetUserId)) {
        ptUsers = ptUsers.filter(id => id !== targetUserId);
        saveJsonData(PT_FILE, ptUsers);
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil dihapus dari PT`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} tidak ditemukan di PT!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }

    // ===== Hapus dari Premium V1 & V2 =====
    [PREMIUM_FILE, PREMV2_FILE].forEach(file => {
        let premUsers = loadJsonData(file);
        if (premUsers.includes(targetUserId)) {
            premUsers = premUsers.filter(id => id !== targetUserId);
            saveJsonData(file, premUsers);
        }
    });

    // ===== Hapus dari Reseller V1 & V2 =====
    [RESS_FILE, RESSV2_FILE].forEach(file => {
        let ressUsers = loadJsonData(file);
        if (ressUsers.includes(targetUserId)) {
            ressUsers = ressUsers.filter(id => id !== targetUserId);
            saveJsonData(file, ressUsers);
        }
    });
});
// command /addown panel
bot.onText(/^\/addown(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;

    if (msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /addown');
    }

    const targetUserId = msg.reply_to_message.from.id.toString();

    // Tambahkan ke OWNER
    let ownerUsers = loadJsonData(OWNER_FILE);
    if (!ownerUsers.includes(targetUserId)) {
        ownerUsers.push(targetUserId);
        saveJsonData(OWNER_FILE, ownerUsers);
    }

    // Semua file Premium
    const premiumFiles = [PREMIUM_FILE, PREMV2_FILE, PREMV3_FILE, PREMV4_FILE, PREMV5_FILE, PREMV6_FILE, PREMV7_FILE];
    premiumFiles.forEach(file => {
        let premUsers = loadJsonData(file);
        if (!premUsers.includes(targetUserId)) {
            premUsers.push(targetUserId);
            saveJsonData(file, premUsers);
        }
    });

    // Semua file Res
    const ressFiles = [RESS_FILE, RESSV2_FILE, RESSV3_FILE, RESSV4_FILE, RESSV5_FILE, RESSV6_FILE, RESSV7_FILE];
    ressFiles.forEach(file => {
        let ressUsers = loadJsonData(file);
        if (!ressUsers.includes(targetUserId)) {
            ressUsers.push(targetUserId);
            saveJsonData(file, ressUsers);
        }
    });

    // Tambahkan ke PT
    let ptUsers = loadJsonData(PT_FILE);
    if (!ptUsers.includes(targetUserId)) {
        ptUsers.push(targetUserId);
        saveJsonData(PT_FILE, ptUsers);
    }

    // Tambahkan ke TK
    let tkUsers = loadJsonData(TK_FILE);
    if (!tkUsers.includes(targetUserId)) {
        tkUsers.push(targetUserId);
        saveJsonData(TK_FILE, tkUsers);
    }

    bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan menjadi Owner!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
});

bot.onText(/^\/delown(?:\s+(.+))?$/, (msg, match) => {
    const chatId = msg.chat.id;

    if (msg.from.id !== OWNER_ID) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /delown');
    }

    const targetUserId = msg.reply_to_message.from.id.toString();

    // Hapus dari OWNER
    saveJsonData(OWNER_FILE, loadJsonData(OWNER_FILE).filter(id => id !== targetUserId));

    // Hapus dari semua Premium
    const premiumFiles = [PREMIUM_FILE, PREMV2_FILE, PREMV3_FILE, PREMV4_FILE, PREMV5_FILE, PREMV6_FILE, PREMV7_FILE];
    premiumFiles.forEach(file => {
        saveJsonData(file, loadJsonData(file).filter(id => id !== targetUserId));
    });

    // Hapus dari semua Res
    const ressFiles = [RESS_FILE, RESSV2_FILE, RESSV3_FILE, RESSV4_FILE, RESSV5_FILE, RESSV6_FILE, RESSV7_FILE];
    ressFiles.forEach(file => {
        saveJsonData(file, loadJsonData(file).filter(id => id !== targetUserId));
    });

    // Hapus dari PT
    saveJsonData(PT_FILE, loadJsonData(PT_FILE).filter(id => id !== targetUserId));

    // Hapus dari TK
    saveJsonData(TK_FILE, loadJsonData(TK_FILE).filter(id => id !== targetUserId));

    bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil dihapus dari daftar Owner!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
}); 
// command add premium & reseller
bot.onText(/^\/addpr (.+)$/, (msg, match) => {
    const chatId = msg.chat.id;
    const userId = msg.from.id.toString();
    
    const owners = loadJsonData(OWNER_FILE);
    if (msg.from.id !== OWNER_ID && !owners.includes(userId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜsᴜs ᴏᴡɴᴇʀ', { reply_to_message_id: msg.message_id });
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply ke pesan user!\nContoh: reply pesan lalu ketik /addpr', { reply_to_message_id: msg.message_id });
    }

    const targetUserId = msg.reply_to_message.from.id.toString();
    const premiumUsers = loadJsonData(PREMIUM_FILE);
    const ressUsers = loadJsonData(RESS_FILE);

    let addedPrem = false;
    let addedRes = false;

    if (!premiumUsers.includes(targetUserId)) {
        premiumUsers.push(targetUserId);
        saveJsonData(PREMIUM_FILE, premiumUsers);
        addedPrem = true;
    }

    if (!ressUsers.includes(targetUserId)) {
        ressUsers.push(targetUserId);
        saveJsonData(RESS_FILE, ressUsers);
        addedRes = true;
    }

    if (addedPrem || addedRes) {
        bot.sendMessage(chatId, `✅ User ID ${targetUserId} berhasil ditambahkan menjadi Premium & Reseller`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    } else {
        bot.sendMessage(chatId, `⚠️ User ID ${targetUserId} sudah menjadi Premium & Reseller!`, { parse_mode: "Markdown", reply_to_message_id: msg.message_id });
    }
});
bot.onText(/^\/addall$/, (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);

    if (msg.from.id !== OWNER_ID && !owners.includes(fromId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply pesan user!\nLalu ketik /addall');
    }

    const target = msg.reply_to_message.from.id.toString();

    // Load semua list
    const ownerUsers = loadJsonData(OWNER_FILE);
    const premiumFiles = [PREMIUM_FILE, PREMV2_FILE, PREMV3_FILE, PREMV4_FILE, PREMV5_FILE, PREMV6_FILE, PREMV7_FILE];
    const ressFiles = [RESS_FILE, RESSV2_FILE, RESSV3_FILE, RESSV4_FILE, RESSV5_FILE, RESSV6_FILE, RESSV7_FILE];
    const ceoUsers = loadJsonData(CEO_FILE);
    const tkUsers = loadJsonData(TK_FILE);
    const ptUsers = loadJsonData(PT_FILE);

    let added = [];

    function addIfNot(list, file, name) {
        if (!list.includes(target)) {
            list.push(target);
            saveJsonData(file, list);
            added.push(name);
        }
    }

    // Tambahkan ke Owner
    addIfNot(ownerUsers, OWNER_FILE, "Owner");

    // Tambahkan ke semua Premium
    premiumFiles.forEach(file => {
        let list = loadJsonData(file);
        addIfNot(list, file, `Premium (${file})`);
    });

    // Tambahkan ke semua Res
    ressFiles.forEach(file => {
        let list = loadJsonData(file);
        addIfNot(list, file, `Reseller (${file})`);
    });

    // Tambahkan ke CEO, TK, PT
    addIfNot(ceoUsers, CEO_FILE, "CEO");
    addIfNot(tkUsers, TK_FILE, "TK");
    addIfNot(ptUsers, PT_FILE, "PT");

    if (added.length > 0) {
        bot.sendMessage(
            chatId,
            `✅ User *${target}* berhasil ditambahkan ke all akses!`,
            { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
        );
    } else {
        bot.sendMessage(
            chatId,
            `⚠️ User *${target}* sudah memiliki semua role!`,
            { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
        );
    }
});
bot.onText(/^\/delall$/, (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);

    if (msg.from.id !== OWNER_ID && !owners.includes(fromId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply pesan user!\nLalu ketik /delall');
    }

    const target = msg.reply_to_message.from.id.toString();

    // Hapus dari Owner
    saveJsonData(OWNER_FILE, loadJsonData(OWNER_FILE).filter(id => id !== target));

    // Hapus dari semua Premium
    const premiumFiles = [PREMIUM_FILE, PREMV2_FILE, PREMV3_FILE, PREMV4_FILE, PREMV5_FILE, PREMV6_FILE, PREMV7_FILE];
    premiumFiles.forEach(file => {
        saveJsonData(file, loadJsonData(file).filter(id => id !== target));
    });

    // Hapus dari semua Res
    const ressFiles = [RESS_FILE, RESSV2_FILE, RESSV3_FILE, RESSV4_FILE, RESSV5_FILE, RESSV6_FILE, RESSV7_FILE];
    ressFiles.forEach(file => {
        saveJsonData(file, loadJsonData(file).filter(id => id !== target));
    });

    // Hapus dari CEO, TK, PT
    saveJsonData(CEO_FILE, loadJsonData(CEO_FILE).filter(id => id !== target));
    saveJsonData(TK_FILE, loadJsonData(TK_FILE).filter(id => id !== target));
    saveJsonData(PT_FILE, loadJsonData(PT_FILE).filter(id => id !== target));

    bot.sendMessage(
        chatId,
        `✅ User *${target}* berhasil dihapus dari semua akses!`,
        { parse_mode: "Markdown", reply_to_message_id: msg.message_id }
    );
});
bot.onText(/^\/addresvps$/, (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);

    if (msg.from.id !== OWNER_ID && !owners.includes(fromId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply pesan user!\nLalu ketik /addvps');
    }

    const target = msg.reply_to_message.from.id.toString();
    const ressVps = loadJsonData(RESSVPS_FILE);

    if (!ressVps.includes(target)) {
        ressVps.push(target);
        saveJsonData(RESSVPS_FILE, ressVps);
        return bot.sendMessage(chatId, `✅ User *${target}* ditambahkan ke RESSVPS`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });
    }

    bot.sendMessage(chatId, `⚠️ User *${target}* sudah ada di RESSVPS`, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
    });
});
bot.onText(/^\/delresvps$/, (msg) => {
    const chatId = msg.chat.id;
    const fromId = msg.from.id.toString();

    const owners = loadJsonData(OWNER_FILE);

    if (msg.from.id !== OWNER_ID && !owners.includes(fromId)) {
        return bot.sendMessage(chatId, '❌ ᴋʜᴜꜱᴜꜱ ᴏᴡɴᴇʀ ʙᴏᴛ');
    }

    if (!msg.reply_to_message) {
        return bot.sendMessage(chatId, '❌ Reply pesan user!\nLalu ketik /delvps');
    }

    const target = msg.reply_to_message.from.id.toString();
    const ressVps = loadJsonData(RESSVPS_FILE);

    if (ressVps.includes(target)) {
        const updated = ressVps.filter(id => id !== target);
        saveJsonData(RESSVPS_FILE, updated);

        return bot.sendMessage(chatId, `🗑️ User *${target}* dihapus dari RESSVPS`, {
            parse_mode: "Markdown",
            reply_to_message_id: msg.message_id
        });
    }

    bot.sendMessage(chatId, `⚠️ User *${target}* tidak ada di RESSVPS`, {
        parse_mode: "Markdown",
        reply_to_message_id: msg.message_id
    });
});
}