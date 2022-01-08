const Discord = require('discord.js');

const moment = require("moment-timezone");

const mongo = require('mongodb');
const MongoClient = mongo.MongoClient;
const dbName = 'new-empires';
/**
 * @type {mongo.Db}
 */
var db;

/**
 * @type {"Release" | "Dev"}
 */
const runType = "Release";

MongoClient.connect(runType == "Dev" ? "mongodb://localhost:27017/" : 'mongodb://baramex:***REMOVED***@localhost:27017/', function (err, client) {
    console.log("Connected successfully to mongodb");
    db = client.db(dbName + (runType == "Dev" ? "-dev" : ""));
});

class Bot {
    errorColor = "FF0000";
    infoColor = "00F2FF";
    warningColor = "ffc107";
    validColor = "00FF03";

    constructor() {
        if (!["Dev", "Release"].includes(runType)) runType = "Dev";

        this.client = new Discord.Client({
            intents: [
                Discord.Intents.FLAGS.GUILDS,
                Discord.Intents.FLAGS.GUILD_MESSAGES,
                Discord.Intents.FLAGS.GUILD_MEMBERS,
                Discord.Intents.FLAGS.DIRECT_MESSAGES,
                Discord.Intents.FLAGS.GUILD_BANS,
                Discord.Intents.FLAGS.GUILD_VOICE_STATES,
                Discord.Intents.FLAGS.GUILD_INVITES
            ]
        });

        this.codes = {
            BULK_DELETE: 4001,
            BAN: 4002,
            WARN: 4003,
            UNBAN: 4004,
            KICK: 4005,
            MUTE: 4006,
            UNMUTE: 4007,
            REPORT: 4010,
            CLOSE_REPORT: 4011,
            CHANNEL: 4008,
            MESSAGE: 4009,
            ROLE: 4012,
            VOICE: 4013,
            MEMBER: 4014
        };
        this.status = {
            OK: 200,
            ERROR: 400,
            NOT_PERMISSION: 403,
            ERROR_ARGUMENT: 401,
            AUTOMATIC: 201,
            NOT_FOUND: 404,
            ALREADY: 406,
            CREATED: 204,
            UPDATED: 202,
            DELETED: 203,
            JOINED: 205,
            MUTED: 206,
            DEAFED: 207,
            QUITED: 208,
            UNMUTED: 209,
            UNDEAFED: 210,
            KICKED: 211,
            MOVE: 212,
            CHANGE: 213
        };
        this.statusEmoji = {
            200: ":white_check_mark:",
            204: ":heavy_plus_sign:",
            205: ":heavy_plus_sign:",
            206: ":mute:",
            207: ":x::headphones:",
            209: ":loud_sound:",
            210: ":headphones:",
            211: ":no_entry_sign:",
            212: ":left_right_arrow:",
            213: ":left_right_arrow:",
            202: ":new:",
            203: ":heavy_minus_sign:",
            208: ":heavy_minus_sign:",
            400: ":x:",
            403: ":no_entry_sign:",
            401: ":x:",
            201: ":clock1:",
            404: ":grey_question:",
            406: ":x:"
        };
        this.colorStatus = {
            200: this.validColor,
            204: this.validColor,
            205: this.validColor,
            206: this.validColor,
            207: this.validColor,
            208: this.validColor,
            209: this.validColor,
            210: this.validColor,
            211: this.validColor,
            212: this.validColor,
            213: this.validColor,
            202: this.validColor,
            203: this.validColor,
            400: this.errorColor,
            403: this.warningColor,
            401: this.errorColor,
            201: this.infoColor,
            404: this.errorColor,
            406: this.warningColor
        };
        this.types = {
            DISCORD: "DISCORD",
            MINECRAFT: "MINECRAFT"
        }

        this.libs = { fs: require('fs'), FileSync: require('lowdb/adapters/FileSync'), axios: require("axios"), lowdb: require("lowdb"), discord: Discord, schedule: require('node-schedule'), canvas: require("canvas"), ms: require("ms") };
        this.version = "0.3";

        this.footerAuthor = {};

        this.databases = {};
        Object.entries({ config: "config" + runType }).forEach(val => this.databases[val[0]] = this.libs.lowdb(new this.libs.FileSync("./databases/" + val[1] + ".json")));

        this.requestVerifMC = [];

        this.invites = [];

        setTimeout(() => this.client.login(require("./databases/keys.json")["token" + runType]), 2000);
    }

    get guild() {
        if (this.g) return this.g;

        var f = this.property("info", "server");
        if (!f) return undefined;
        var g = this.client.guilds.cache.get(f.id);
        this.g = g;
        return g;
    }

    /**
     * 
     * @param {string} family 
     * @param {string} name 
     * @returns {string | undefined}
     */
    property(family, name) {
        var f = this.databases.config.get(family);
        if (f) return f.find({ name: name }).value();
        else this.databases.config.set(family, []).write();
        return undefined;
    }

    /**
     * 
     * @param {string} name 
     * @returns  {Discord.Role}
     */
    getRole(name) {
        var p = this.property("roles", name);
        if (!p || !this.guild) return null;
        return this.guild.roles.cache.get(p.id);
    }

    /**
     * 
     * @param {string} name 
     * @returns {Discord.GuildChannel}
     */
    getChannel(name) {
        var p = this.property("channels", name);
        if (!p || !this.guild) return null;
        return this.guild.channels.cache.get(p.id);
    }

    /**
     * 
     * @param {string} name 
     * @returns {Discord.GuildChannel}
     */
    getCategorie(name) {
        var p = this.property("categories", name);
        if (!p || !this.guild) return null;
        return this.guild.channels.cache.get(p.id);
    }

    /**
     * 
     * @param {string} name 
     * @param {string} channel 
     * @returns {Promise<Discord.Message>}
     */
    getMessage(name, channel) {
        return new Promise((res, rej) => {
            var p = this.property("messages", name);
            if (!p || !this.guild || !channel) rej();
            channel.messages.fetch(p.id).then(res).catch(rej);
        })
    }

    /**
     * 
     * @param {"fr" | "en"} lang 
     * @returns
     */
    embedNotPerm(lang) {
        var embed = new Discord.MessageEmbed()
            .setColor(this.warningColor)
            .setTitle(":dagger: | New Empires - error")
            .setFooter({ text: this.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: this.footerAuthor.iconURL })
            .addField("Permission", ":no_entry_sign: " + (lang == "en" ? "You do not have permission to do this action !" : "Vous n'avez pas la permission de faire cette action !"));

        return embed;
    }

    /**
     * 
     * @param {number} code 
     * @param {number} status 
     * @param {string} author 
     * @param {string} member 
     * @param {string} content 
     * @param {Date} [date]
     */
    log(code, status, author, member, content, date = new Date()) {
        var id = this.generateID();

        db.collection("logs").insertOne({ _id: id, code, status, author, member, content, date });

        var l = this.getChannel("logs");
        if (l) {
            l.send({ embeds: [this.logEmbed(code, status, author, member, content, id, date)] });
        } else this.errorDebug(...this.channelError(l));
    }

    /**
     * 
     * @param {string} userID 
     * @param {string} banID 
     */
    unban(userID, banID) {
        db.collection("bans").updateOne({ _id: banID }, { $set: { active: false } }).then(() => {
            this.guild.members.unban(userID, "Auto Unban").then(() => {
                this.log(this.codes.UNBAN, this.status.AUTOMATIC, this.client.user.id, userID, { banID });
            });
        });
    }

    /**
     * 
     * @param {Discord.GuildMember} member 
     * @param {Discord.GuildMember} modo 
     * @param {string} reason 
     * @param {number} status 
     * @returns {Promise<string>}
     */
    kick(member, modo, reason, status = this.status.OK) {
        return new Promise((res, rej) => {
            var id = this.generateID();
            db.collection("kicks").insertOne({ _id: id, modoID: modo.id, memberID: member.id, type: this.types.DISCORD, reason: reason, date: new Date() }).then(() => {
                member.kick(reason).then(() => {
                    this.log(this.codes.KICK, status, modo.id, member.id, { reason, kickID: id });
                    res(id);
                }).catch(rej);
            }).catch(rej);
        });
    }

    /**
     * 
     * @param {Discord.GuildMember} member 
     * @returns {"en" | "fr"}
     */
    getLang(member) {
        if (!this.getRole("french")) {
            this.errorDebug("Config/Role", "Cannot get role FRENCH");
            return "en";
        }

        var lang = "en";
        if (member.roles.cache.has(this.getRole("french").id)) lang = "fr";
        return lang;
    }

    /**
     * 
     * @param {Discord.GuildMember} member 
     * @returns
     */
    getGrade(member) {
        if (!member || !member.roles) return undefined;
        var r = member.roles.highest;
        return { id: r.id, name: parseRoleName(r.name) };
    }

    logEmbed(code, status, author, member, content, id, date = new Date(), lang = "en") {
        var cntSTR = "{";
        if (content) {
            var chID = content.channelID;
            Object.entries(content).forEach(cnt => {
                var val = cnt[1];
                if (cnt[0].toLocaleLowerCase() == "channelid") {
                    val = channelID(bot.guild.channels.cache.get(cnt[1])) || cnt[1];
                }
                else if (cnt[0].toLocaleLowerCase() == "messageid" && chID) {
                    var ch = bot.guild.channels.cache.get(chID);
                    if (ch.isText()) val = messageID(ch.messages.cache.get(cnt[1])) || cnt[1];
                }
                else if (cnt[0].toLocaleLowerCase() == "author") {
                    val = `<@${cnt[1]}>`;
                }
                cntSTR += "\n   " + cnt[0] + ": " + val;
            });
        }
        else cntSTR += "No Content";
        cntSTR += "\n}";

        var embed = new this.libs.discord.MessageEmbed()
            .setColor(this.colorStatus[status])
            .setTitle(":dagger: | New Empires - logs")
            .setFooter({ text: this.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: this.footerAuthor.iconURL })
            .addField("ID", id, true)
            .addField("Code", code + ": " + Object.keys(this.codes)[Object.values(this.codes).findIndex(a => a == code)], true)
            .addField("Status", status + ": " + this.statusEmoji[status] + " " + Object.keys(this.status)[Object.values(this.status).findIndex(a => a == status)], true)
            .addField("Author", author ? `<@${author}>` : "No Author", true)
            .addField("Member", member ? `<@${member}>` : "No Member", true)
            .addField("Content", cntSTR, true)
            .addField("Date", this.formatDate(date), true)
            .setTimestamp();

        return embed;
    }
}

const bot = new Bot();

bot.client.on("channelCreate", channel => {
    bot.guild.fetchAuditLogs({ type: "CHANNEL_CREATE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, createdTimestamp, target } = log.entries.first();
        if (executor.bot) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (channel.id != target.id) return;
        bot.log(bot.codes.CHANNEL, bot.status.CREATED, executor.id, null, { channelID: channel.id, changes, parentID: channel.parentId });
    });
});
bot.client.on("channelDelete", channel => {
    bot.guild.fetchAuditLogs({ type: "CHANNEL_DELETE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, target, createdTimestamp } = log.entries.first();
        if (executor.bot) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (channel.id != target.id) return;
        bot.log(bot.codes.CHANNEL, bot.status.DELETED, executor.id, null, { channelID: channel.id, changes, parentID: channel.parentId });
    });
});
bot.client.on("channelUpdate", (oldChannel, newChannel) => {
    bot.guild.fetchAuditLogs({ type: "CHANNEL_UPDATE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, target, createdTimestamp } = log.entries.first();
        if (executor.bot) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (newChannel.id != target.id) return;
        bot.log(bot.codes.CHANNEL, bot.status.UPDATED, executor.id, null, { channelID: newChannel.id, changes, parentID: newChannel.parentId });
    });
});
bot.client.on("guildBanAdd", ban => {
    bot.guild.fetchAuditLogs({ type: "MEMBER_BAN_ADD", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, reason, createdTimestamp, target } = log.entries.first();
        if (executor.bot) return;
        if (ban.user.id != target.id) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;

        var id = bot.generateID();
        db.collection("bans").insertOne({ _id: id, modoID: executor.id, memberID: ban.user.id, type: bot.types.DISCORD, reason, active: true, duration: 0, endDate: new Date(), date: new Date() }).then(() => {
            bot.log(bot.codes.BAN, bot.status.OK, executor.id, ban.user.id, { reason, banID: id });
        });
    });
});
bot.client.on("guildBanRemove", ban => {
    bot.guild.fetchAuditLogs({ type: "MEMBER_BAN_REMOVE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, target, createdTimestamp } = log.entries.first();
        if (executor.bot) return;
        if (ban.user.id != target.id) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;

        db.collection("bans").findOneAndUpdate({ memberID: ban.user.id, active: true }, { $set: { active: false } }, { projection: { _id: true } }).then((doc) => {
            if (doc.value) bot.log(bot.codes.UNBAN, bot.status.OK, executor.id, ban.user.id, { banID: doc.value._id });
        });
    });
});
bot.client.on("messageDelete", message => {
    if (message.author.bot) return;
    bot.log(bot.codes.MESSAGE, bot.status.DELETED, null, null, { messageID: message.id, channelID: message.channelId, content: message.content, author: message.author.id, embeds: message.embeds });
});
bot.client.on("messageCreate", message => {
    if (message.author.bot) return;
    bot.log(bot.codes.MESSAGE, bot.status.CREATED, message.author.id, null, { messageID: message.id, channelID: message.channelId, content: message.content, embeds: message.embeds });
});
bot.client.on("messageUpdate", (oldMessage, newMessage) => {
    if (newMessage.author.bot) return;
    bot.log(bot.codes.MESSAGE, bot.status.UPDATED, newMessage.author.id, null, { messageID: newMessage.id, channelID: newMessage.channelId, content: { before: oldMessage.content, after: newMessage.content }, embeds: { before: oldMessage.embeds, after: newMessage.embeds } });
});
bot.client.on("roleCreate", role => {
    bot.guild.fetchAuditLogs({ type: "ROLE_CREATE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, target, createdTimestamp } = log.entries.first();
        if (executor.bot) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (role.id != target.id) return;
        bot.log(bot.codes.ROLE, bot.status.CREATED, executor.id, null, { roleID: role.id, changes });
    });
});
bot.client.on("roleDelete", role => {
    bot.guild.fetchAuditLogs({ type: "ROLE_DELETE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, target, createdTimestamp } = log.entries.first();
        if (executor.bot) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (role.id != target.id) return;
        bot.log(bot.codes.ROLE, bot.status.DELETED, executor.id, null, { roleID: role.id, changes });
    });
});
bot.client.on("roleUpdate", (oldRole, newRole) => {
    bot.guild.fetchAuditLogs({ type: "ROLE_UPDATE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, createdTimestamp, target } = log.entries.first();
        if (executor.bot) return;
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (newRole.id != target.id) return;
        if (oldRole == newRole) return;
        bot.log(bot.codes.ROLE, bot.status.UPDATED, executor.id, null, { roleID: newRole.id, changes });
    });
});
bot.client.on("voiceStateUpdate", (oldState, newState) => {
    bot.guild.fetchAuditLogs({ type: "MEMBER_UPDATE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, target, createdTimestamp } = log.entries.first();
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (target.id != newState.member.id) return;
        if (executor.bot) return;
        if (oldState.deaf == newState.deaf && oldState.mute == newState.mute) return;
        if (changes[0].key == "mute" && changes[0].old == false && changes[0].new == true) {
            bot.log(bot.codes.VOICE, bot.status.MUTED, executor.id, newState.member.id, { channelID: newState.channelId });
        } else if (changes[0].key == "mute") {
            bot.log(bot.codes.VOICE, bot.status.UNMUTED, executor.id, newState.member.id, { channelID: newState.channelId });
        }

        if (changes[0].key == "deaf" && changes[0].old == false && changes[0].new == true) {
            bot.log(bot.codes.VOICE, bot.status.DEAFED, executor.id, newState.member.id, { channelID: newState.channelId });
        } else if (changes[0].key == "deaf") {
            bot.log(bot.codes.VOICE, bot.status.UNDEAFED, executor.id, newState.member.id, { channelID: newState.channelId });
        }
    });

    if (oldState.channel && newState.channel && oldState.channel != newState.channel) {
        return bot.log(bot.codes.VOICE, bot.status.CHANGE, newState.member.id, null, { channelID: { before: oldState.channelId, after: newState.channelId } });
    }

    if (oldState.channel && !newState.channel) {
        return bot.log(bot.codes.VOICE, bot.status.QUITED, newState.member.id, null, { channelID: oldState.channelId });
    }

    if (!oldState.channel && newState.channel) {
        return bot.log(bot.codes.VOICE, bot.status.JOINED, newState.member.id, null, { channelID: newState.channelId });
    }
});
bot.client.on("guildMemberRemove", member => {
    bot.guild.fetchAuditLogs({ type: "MEMBER_KICK", limit: 1 }).then(log => {
        if (log) {
            const { executor, reason, target, createdTimestamp } = log.entries.first();
            if (createdTimestamp + 5 * 1000 >= new Date().getTime()) {
                if (target.id == member.id) {
                    if (!executor.bot) {
                        var id = bot.generateID();
                        db.collection("kicks").insertOne({ _id: id, modoID: executor.id, memberID: member.id, type: bot.types.DISCORD, reason, date: new Date() }).then(() => {
                            bot.log(bot.codes.KICK, bot.status.OK, executor.id, member.id, { reason, kickID: id });
                        });
                        return;
                    } else return;
                }
            }
        }
        if (!bot.guild.bans.cache.has(member.id)) bot.log(bot.codes.MEMBER, bot.status.QUITED, member.id, null, {});
    });
});
bot.client.on("guildMemberUpdate", (oldMember, newMember) => {
    bot.guild.fetchAuditLogs({ type: "MEMBER_ROLE_UPDATE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, target, createdTimestamp } = log.entries.first();
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (target.id != newMember.id) return;
        if (executor.bot) return;
        if (oldMember.roles.cache == newMember.roles.cache) return;
        bot.log(bot.codes.MEMBER, bot.status.UPDATED, executor.id, newMember.id, { roles: changes });
    });
    bot.guild.fetchAuditLogs({ type: "MEMBER_UPDATE", limit: 1 }).then(log => {
        if (!log) return;
        const { executor, changes, reason, target, createdTimestamp } = log.entries.first();
        if (createdTimestamp + 5 * 1000 < new Date().getTime()) return;
        if (target.id != newMember.id) return;
        if (executor.bot) return;
        if (changes[0].key == "communication_disabled_until" && oldMember.communicationDisabledUntil != newMember.communicationDisabledUntil) {
            var date = changes[0].old || changes[0].new;
            if (!date) return;
            var type = changes[0].old ? bot.codes.UNMUTE : bot.codes.MUTE;
            if (type == bot.codes.MUTE) {
                var id = bot.generateID();
                db.collection("mutes").insertOne({ _id: id, modoID: executor.id, memberID: newMember.id, type: bot.types.DISCORD, reason, duration: new Date(date).getTime() - new Date().getTime(), endDate: new Date(date), date: new Date() }).then(() => {
                    bot.log(bot.codes.MUTE, bot.status.OK, executor.id, newMember.id, { reason, duration: new Date(date).getTime() - new Date().getTime(), muteID: id });
                });
            } else {
                db.collection("mutes").find({ memberID: newMember.id }).toArray((err, res) => {
                    if (err) return;

                    var mute = res.sort((a, b) => b.date.getTime() - a.date.getTime());
                    if (mute.length == 0) return interaction.reply("Error");
                    mute = mute[0];

                    bot.log(bot.codes.UNMUTE, bot.status.OK, executor.id, newMember.id, { muteID: mute._id });
                });
            }
        }
        if (changes[0].key != "nick" || oldMember.nickname == newMember.nickname) return;
        bot.log(bot.codes.MEMBER, bot.status.UPDATED, executor.id, newMember.id, { nickname: { before: changes[0].old, after: changes[0].new } });
    });
});
bot.client.on("guildMemberAdd", member => {
    bot.log(bot.codes.MEMBER, bot.status.JOINED, member.id, null, {});
});

bot.client.on('ready', async () => {
    bot.client.user.setPresence({ activities: [{ name: "In Update | v" + bot.version, type: 'PLAYING' }], status: "dnd" });

    await bot.guild.members.fetch();

    if (bot.guild.members.cache.get(bot.client.user.id).nickname != "B》New Empires") {
        bot.guild.members.cache.get(bot.client.user.id).setNickname("B》New Empires");
    }

    bot.footerAuthor = { text: "New Empires | by Baramex", iconURL: bot.guild.iconURL() };

    await bot.guild.invites.fetch().then(invites => {
        invites.forEach(invite => {
            bot.invites.push({ id: invite.inviter.id, uses: invite.uses, code: invite.code });
        });
    });

    await bot.getChannel("rules").messages.fetch();
    await bot.getChannel("roles").messages.fetch();

    //commands
    bot.commands = [];
    bot.libs.fs.readdir('./commands/', (err, files) => {
        if (err) console.log(err);

        let jsFile = files.filter(f => f.split('.').pop() == "js");
        if (jsFile.length > 0) {
            jsFile.forEach((f, i) => {
                let props = require("./commands/" + f);
                bot.commands.push({ infos: props.info, cmd: props });

                bot.guild.commands.create({
                    name: props.info.name,
                    description: props.info.description.en,
                    options: props.info.options || []
                });
            });
        }
    });

    bot.getMessage("roles", bot.getChannel("roles")).catch(() => {
        var button1 = new Discord.MessageButton()
            .setCustomId('role_choice_english')
            .setLabel('I speak english')
            .setStyle('SECONDARY')
            .setEmoji("🇬🇧");

        var button2 = new Discord.MessageButton()
            .setCustomId('role_choice_french')
            .setLabel('Je parle français')
            .setStyle('SECONDARY')
            .setEmoji("🇫🇷");

        bot.getChannel("roles").send({ content: "Choose your roles !", components: [new Discord.MessageActionRow().addComponents(button1, button2)] }).then(mes => {
            if (bot.property("messages", "roles")) {
                bot.databases.config.get("messages").find({ name: "roles" }).assign({ id: mes.id }).write();
            } else bot.databases.config.get("messages").push({ name: "roles", id: mes.id }).write();
        });
    });

    bot.getMessage("rules", bot.getChannel("rules")).catch(() => {
        var embed = new Discord.MessageEmbed()
            .setColor(bot.infoColor)
            .setTitle(":dagger: | New Empires - rules")
            .setFooter(bot.footerAuthor)
            .addField("Re-coming soon", "revient bientôt ");
        var button = new Discord.MessageButton()
            .setCustomId('rules_agree')
            .setLabel('I have read and accepted the rules')
            .setStyle('SUCCESS');

        bot.getChannel("rules").send({ embeds: [embed], components: [new Discord.MessageActionRow().addComponents(button)] }).then(mes => {
            if (bot.property("messages", "rules")) {
                bot.databases.config.get("messages").find({ name: "rules" }).assign({ id: mes.id }).write();
            } else bot.databases.config.get("messages").push({ name: "rules", id: mes.id }).write();
        });
    });

    bot.getMessage("ticket", bot.getChannel("tickets")).catch(() => {
        var embed = new Discord.MessageEmbed()
            .setColor(bot.infoColor)
            .setTitle("Open a ticket")
            .setFooter(bot.footerAuthor)
            .setDescription(":warning: Have you a problem ?");
        var button = new Discord.MessageButton()
            .setCustomId('ticket')
            .setLabel('Open a ticket')
            .setStyle('PRIMARY')
            .setEmoji("📩");

        bot.getChannel("tickets").send({ embeds: [embed], components: [new Discord.MessageActionRow().addComponents(button)] }).then(mes => {
            if (bot.property("messages", "ticket")) {
                bot.databases.config.get("messages").find({ name: "ticket" }).assign({ id: mes.id }).write();
            } else bot.databases.config.get("messages").push({ name: "ticket", id: mes.id }).write();
        });
    });

    bot.getMessage("bug", bot.getChannel("bugs")).catch(() => {
        var embed = new Discord.MessageEmbed()
            .setColor(bot.infoColor)
            .setTitle("Report a bug")
            .setFooter(bot.footerAuthor)
            .setDescription(":octagonal_sign: Have you noticed a bug ?");
        var button = new Discord.MessageButton()
            .setCustomId('bug')
            .setLabel('Report')
            .setStyle('PRIMARY')
            .setEmoji("📩");

        bot.getChannel("bugs").send({ embeds: [embed], components: [new Discord.MessageActionRow().addComponents(button)] }).then(mes => {
            if (bot.property("messages", "bug")) {
                bot.databases.config.get("messages").find({ name: "bug" }).assign({ id: mes.id }).write();
            } else bot.databases.config.get("messages").push({ name: "bug", id: mes.id }).write();
        });
    });

    checkExpired();

    update.invoke();

    console.log("Bot Ready !");
});

bot.client.on("inviteCreate", invite => {
    bot.invites.push({ id: invite.inviter.id, uses: invite.uses, code: invite.code });
});

bot.client.on("guildMemberAdd", async (member) => {
    var channel = bot.getChannel("gate");
    var rules = bot.getChannel("rules");
    var inv = "";
    await getInviter().then(val => inv = val).catch(console.error);
    if (!inv) bot.errorDebug("Invite/Inviter", "Error to get the inviter !");
    if (channel && rules && channel.type == "GUILD_TEXT") {
        channel.send(":airplane_arriving: <@" + member.id + "> joined the server by <@" + inv + "> !").catch(() => {
            bot.errorDebug(...bot.channelError(channel))
        });
        rules.permissionOverwrites.create(member, { VIEW_CHANNEL: true });
    } else bot.errorDebug(...bot.channelError(channel));
});

bot.client.on("guildMemberRemove", (member) => {
    var channel = bot.getChannel("gate");
    if (channel && channel.type == "GUILD_TEXT") {
        channel.send(":airplane_departure: **" + member.user.tag + "** left the server !").catch(() => {
            bot.errorDebug(...bot.channelError(channel))
        });
    } else bot.errorDebug(...bot.channelError(channel));
});

bot.client.on("interactionCreate", interaction => {
    if (!interaction.isCommand()) return;

    var lang = bot.getLang(interaction.member);

    var cmd = bot.commands.find(a => interaction.commandName.startsWith(a.infos.name));
    if (cmd) cmd.cmd.run(bot, interaction, lang, db);
});

bot.client.on("interactionCreate", async interaction => {
    if (!interaction.isButton()) return;

    if (interaction.customId == "rules_agree") {
        interaction.update({});

        var member = interaction.member;
        if (member.roles.cache.size == 1) {
            var rules = bot.getChannel("rules");
            if (!rules) return bot.errorDebug(...bot.channelError(rules));
            rules.permissionOverwrites.delete(member);

            var c = bot.getChannel("roles");
            if (!c) return bot.errorDebug(...bot.channelError(c));
            c.permissionOverwrites.create(member, { VIEW_CHANNEL: true });
        }
    }

    if (interaction.customId == "ticket") {
        createReport("tickets", interaction);
    }

    if (interaction.customId == "delete_ticket") {
        deleteReport("tickets", interaction);
    }

    if (interaction.customId == "bug") {
        createReport("bugs", interaction);
    }

    if (interaction.customId == "delete_bug") {
        deleteReport("bugs", interaction);
    }

    if (interaction.customId.includes("role_choice")) {
        var member = interaction.member;

        var fr = bot.getRole("french");
        var en = bot.getRole("english");
        if (!fr || !en) return bot.errorDebug("Config/Role", "Cannot get role FRENCH or ENGLISH");

        if (interaction.customId.includes("french")) {
            if (member.roles.cache.has(fr.id)) {
                if (!member.roles.cache.has(en.id)) {
                    interaction.reply({ content: ":x: You must to have at least 1 role", ephemeral: true });
                } else {
                    interaction.reply({ content: ":heavy_minus_sign: Rôle retiré !", ephemeral: true });
                    member.roles.remove(fr.id);
                }
            } else {
                interaction.reply({ content: ":heavy_plus_sign: Rôle ajouté !", ephemeral: true });
                member.roles.add(fr.id);
            }
        }

        if (interaction.customId.includes("english")) {
            if (member.roles.cache.has(en.id)) {
                if (!member.roles.cache.has(fr.id)) {
                    interaction.reply({ content: ":x: You must to have at least 1 role", ephemeral: true });
                } else {
                    interaction.reply({ content: ":heavy_minus_sign: Role removed !", ephemeral: true });
                    member.roles.remove(en.id);
                }
            } else {
                interaction.reply({ content: ":heavy_plus_sign: Role added !", ephemeral: true });
                member.roles.add(en.id);
            }
        }

        if (member.roles.cache.size == 1) {
            var c = bot.getChannel("roles");
            if (!c) return bot.errorDebug(...bot.channelError(c));
            c.permissionOverwrites.delete(member);

            member.roles.add(bot.getRole("member").id).catch(() => {
                bot.errorDebug("Adding Role", "Unable to add role to new member !")
            });
        }
    }
});

function deleteReport(type, interaction) {
    interaction.channel.messages.fetch().then(msg => {
        if (interaction.channel.name.split("-").length != 2) return;
        var res = [];
        msg.forEach(m => {
            res.push({ content: m.content, embeds: m.embeds, author: m.author.id })
        });
        bot.log(bot.codes.CLOSE_REPORT, bot.status.OK, interaction.member.id, null, { index: Number(interaction.channel.name.split("-")[0]), type: type.slice(0, -1), reportAutor: interaction.channel.name.split("-")[1], channelID: interaction.channelId, messages: res })
        interaction.channel.delete();
    }).catch(console.error);
}

async function createReport(type, interaction) {
    if (!bot.getCategorie(type)) await bot.guild.channels.create("▁▃▅▇ " + type + " ▇▅▃▁", { type: "GUILD_CATEGORY", permissionOverwrites: [{ id: bot.guild.id, deny: ["VIEW_CHANNEL"] }, { id: bot.guild.roles.cache.find(a => a.name.includes("staff")).id, allow: ["VIEW_CHANNEL"] }] }).then(cha => {
        if (bot.property("categories", type)) {
            bot.databases.config.get("categories").find({ name: type }).assign({ id: cha.id }).write();
        } else bot.databases.config.get("categories").push({ name: type, id: cha.id }).write();
    });

    var c = bot.getCategorie(type);

    var n = 1;
    var channels = bot.guild.channels.cache.filter(a => a.parentId == c.id);
    if (channels.size > 0) {
        var memberChannels = channels.filter(a => a.name.split("-")[1] == interaction.member.id);
        if (memberChannels.size >= 5) {
            return interaction.reply({ content: ":x: You have reached the maximum number of reports (5)", ephemeral: true })
        }

        n = Number(channels.sort((a, b) => Number(b.name.split("-")[0]) - Number(a.name.split("-")[0])).first().name.split("-")[0]) + 1;
    }

    bot.guild.channels.create(n.toString().padStart(3, "0") + "-" + interaction.member.id, { type: "GUILD_TEXT", permissionOverwrites: [{ id: interaction.member.id, allow: ["VIEW_CHANNEL"] }, { id: bot.guild.id, deny: ["VIEW_CHANNEL"] }, { id: bot.guild.roles.cache.find(a => a.name.includes("staff")).id, allow: ["VIEW_CHANNEL"] }], parent: c }).then(cha => {
        cha.send({
            embeds: [new Discord.MessageEmbed().setColor(bot.infoColor)
                .setTitle(":dagger: | New Empires - report")
                .setFooter(bot.footerAuthor)
                .addField("Number", n.toString().padStart(3, "0") || "no index", true)
                .addField("Type", type.slice(0, -1), true)
                .addField("Member", "<@" + interaction.member.id + ">", true)
                .addField("Date", bot.formatDate(new Date()) || "no date", true)
                .addField("Lang", bot.getLang(interaction.member) || "no lang", true)
                .addField("Grade", bot.getGrade(interaction.member).name || "no grade", true)
                .setThumbnail(interaction.user.avatarURL())
            ],
            components: [new Discord.MessageActionRow().addComponents(new Discord.MessageButton().setCustomId('delete_' + type.slice(0, -1))
                .setLabel('Delete report')
                .setStyle('DANGER')
                .setEmoji("🗑️"))]
        });

        bot.log(bot.codes.REPORT, bot.status.OK, interaction.member.id, null, { index: n, channelID: cha.id, type: type.slice(0, -1) });

        interaction.reply({ content: ":white_check_mark: Report created <#" + cha.id + "> !", ephemeral: true });
    });
}

bot.client.on("messageCreate", mes => {
    if (mes.channel.type == "DM") return;
    if (mes.author.bot) return;

    var exp = Math.round(Math.sqrt(Math.sqrt(mes.content.length)) * 6);
    addExp(mes.author, exp, lvl => {
        mes.reply(bot.getLang(mes.member) == "fr" ? ("Bravo, tu passes niveau " + lvl + " !") : ("GG, you are going to level " + lvl + " !"));
    });
});

bot.channelError = (channel) => {
    return ["Config/Channels", "The channel " + channelID(channel) + " generates an error to send a message"];
}

function messageID(message) {
    if (!message) return;
    return `[${message.id}](${message.url})`;
}

/**
 * 
 * @param {Discord.GuildChannel} channel 
 * @returns 
 */
function channelID(channel) {
    if (!channel) return;
    return channel.isText() ? `<#${channel.id}>` : channel.id;
}

function parseRoleName(name) {
    var list = ["french", "english", "member", "staff", "builder", "moderator", "administrator", "developer", "founder", "bot"];

    return list.find(a => name.replace(/ /g, "").toLowerCase().includes(a.replace(/ /g, "").toLowerCase())) || "everyone";
}

function getPrefixRole(roleName) {
    return { builder: "B", moderator: "M", administrator: "A", developer: "D", founder: "F", bot: "B" }[roleName] || "";
}

async function getInviter() {
    var n = [];
    await bot.guild.invites.fetch().then(invites => {
        invites.forEach(invite => {
            n.push({ id: invite.inviter.id, uses: invite.uses, code: invite.code });
        });
    });
    var invite = bot.invites.find(a => a.uses < n.find(b => b.id == a.id && b.code == a.code).uses);
    return invite.id;
}

bot.errorDebug = (subject, message) => {
    var channel = bot.getChannel("logs");
    var embed = new Discord.MessageEmbed()
        .setColor(bot.warningColor)
        .setTitle(":dagger: | New Empires - error")
        .setFooter(bot.footerAuthor)
        .setTimestamp()
        .addField("Date", bot.formatDate(new Date()), true)
        .addField("Subject", subject, true)
        .addField("Description", message, true)

    if (channel.type == "GUILD_TEXT") channel.send({ embeds: [embed] });
}

bot.formatDate = (dateObj) => {
    var date = moment(dateObj.getTime()).tz("Europe/Paris");

    var str = date.format("YYYY/MM/DD HH:mm:ss Z");

    return str;
}

bot.durationDate = (ms) => {
    var y = Math.floor(ms / (1000 * 60 * 60 * 24 * 365));
    var m = Math.floor(ms / (1000 * 60 * 60 * 24 * 30)) % 365;
    var d = Math.floor(ms / (1000 * 60 * 60 * 24)) % 30;
    var h = Math.floor(ms / (1000 * 60 * 60)) % 24;
    var min = Math.floor(ms / (1000 * 60)) % 60;
    var sec = Math.floor(ms / 1000) % 60;

    return (y ? (y + " years ") : "") + (m ? m + " month " : "") + (d ? d + " days " : "") + (h ? h + " hours " : "") + (min ? min + " minutes" : "") + (sec ? sec + " seconds" : "");
}

function getExp(exp, level) {
    if (exp >= bot.getExpLvl(level)) {
        exp = exp - bot.getExpLvl(level);
    }
    return Math.round(exp);
}

function getLevel(exp, level) {
    if (exp >= bot.getExpLvl(level)) {
        level = level + 1;
    }
    return level;
}

bot.getExpLvl = (level) => {
    return ((level * 100 + level * 30) * (Math.round(level / 5) + 1));
}

function addExp(user, _exp, callback) {
    bot.getMemberD(user.id, res => {
        if (res) {
            var exp = getExp(_exp + res.exp, res.lvl);
            var lvl = getLevel(_exp + res.exp, res.lvl);
            db.collection("members-discord").updateOne({ id: user.id }, { $set: { exp: exp, lvl: lvl } });
            if (lvl != res.lvl) callback(lvl);
        } else {
            createMember(user.id, user.username, user.discriminator, user.avatarURL());
        }
    });
}

bot.getLevel = async (id, callback) => {
    await bot.getMemberD(id, user => {
        if (!user) return callback(false);
        callback({ lvl: user.lvl, maxXP: bot.getExpLvl(user.lvl), xp: user.exp });
    });
};

bot.getMemberD = (id, callback) => {
    db.collection("members-discord").findOne({ id }, (err, res) => {
        callback(res, err);
    });
};

function createMember(id, username, discriminator, avatar) {
    db.collection("members-discord").insertOne({ _id: bot.generateID(), id: id, lastUsername: username, lastDiscriminator: discriminator, exp: 0, lvl: 1, lastAvatarURL: avatar });
}

bot.generateID = () => {
    var a = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890".split("");
    var b = "";
    for (var i = 0; i < 16; i++) {
        var j = (Math.random() * (a.length - 1)).toFixed(0);
        b += a[j];
    }
    return b;
}

const update = bot.libs.schedule.scheduleJob('0 */3 * * *', async () => {
    bot.guild.members.cache.forEach(member => {
        if (!member.user.bot) {
            bot.getMemberD(member.id, res => {
                if (!res) createMember(member.id, member.user.username, member.user.discriminator, member.user.avatarURL());
                else {
                    if (res.lastUsername != member.user.username || res.lastAvatarURL != member.user.avatarURL() || res.lastDiscriminator != member.user.discriminator) {
                        db.collection("members-discord").updateOne({ id: member.id }, { $set: { lastUsername: member.user.username, lastDiscriminator: member.user.discriminator, lastAvatarURL: member.user.avatarURL() } });
                    }
                }
            });
        }
        if (member.nickname != getPrefixRole(bot.getGrade(member).name) + "》" + member.user.username || (!getPrefixRole(bot.getGrade(member).name) && member.nickname)) {
            if (member.manageable && member.id != bot.client.user.id) {
                if (!getPrefixRole(bot.getGrade(member).name)) member.setNickname("");
                else member.setNickname(getPrefixRole(bot.getGrade(member).name) + "》" + member.user.username);
            }
        }
    });

    bot.guild.members.cache.filter(a => a.roles.cache.size == 1 && a.joinedTimestamp + 1000 * 60 * 60 * 24 <= new Date().getTime()).forEach(async member => {
        await member.send("You have been kicked because you did not accept the rules or recover a role in the last 24 hours\nInvite: https://discord.gg/" + await getServerInvitation()).catch(console.error);
        bot.kick(member, bot.client.user, "inactive (auto)", bot.status.AUTOMATIC);
    });
});

async function checkExpired() {
    var bans = await db.collection("bans").find({ active: true, endDate: { $lt: new Date() }, duration: { $ne: 0 } }, { projection: { memberID: true, _id: true, endDate: true } }).toArray();
    bans.forEach(ban => {
        bot.unban(ban.memberID, ban._id);
    });

    setTimeout(checkExpired, 1000 * 60);
}

function getServerInvitation() {
    return new Promise((res, rej) => {
        var prop = bot.property("info", "invite");
        if (prop) return res(prop.code);
        var cha = bot.getChannel("rules");
        if (!cha) return rej(bot.errorDebug(...bot.channelError(cha)));
        bot.guild.invites.create(cha, { maxAge: 0, maxUses: 0 }).then(inv => {
            bot.databases.config.get("info").push({ name: "invite", code: inv.code }).write();
            res(inv.code);
        }).catch(rej);
    });
}