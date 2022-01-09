module.exports.run = async (bot, interaction, lang, db) => {
    if (!interaction.member.permissions.has("VIEW_AUDIT_LOG")) {
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    try {
        var sub = interaction.options.getSubcommand(true);
    } catch (error) { };

    if (sub == "ban" || sub == "kick" || sub == "warn" || sub == "mute" || sub == "log" || sub == "member") {
        try {
            var id = interaction.options.getString("id", true);
        } catch (error) { };

        if (id) {
            db.collection(sub == "member" ? "members-discord" : (sub + "s")).findOne(sub == "member" ? ({ id }) : ({ _id: id }), async (err, res) => {
                if (res && !err) {
                    if (sub == "log") {
                        return interaction.reply({ embeds: [bot.logEmbed(res.code, res.status, res.author, res.member, res.content, id, res.date, lang)] });
                    }
                    else {
                        var embed = new bot.libs.discord.MessageEmbed()
                            .setColor(bot.validColor)
                            .setTitle(":dagger: | New Empires - get")
                            .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                            .addField("ID", id, true)
                        if (res.date) embed.addField("Date", bot.formatDate(res.date), true);
                        if (res.modoID || res.author) embed.addField("Modo", (res.modoID || res.author) ? ("<@" + (res.modoID || res.author) + ">") : "No Modo", true)
                        if (res.memberID || res.member) embed.addField("Member", (res.member || res.memberID) ? ("<@" + (res.member || res.memberID) + ">") : "No Member", true);
                        if (res.type) embed.addField("Type", res.type, true);
                        if (res.hasOwnProperty("active")) embed.addField("Active", res.active ? "true" : "false", true);
                        if (res.reason) embed.addField(lang == "fr" ? "Raison" : "Reason", res.reason || "No Reason", true);
                        if (res.endDate) {
                            embed.addField(lang == "fr" ? "Fin" : "End", bot.durationDate(res.duration) ? bot.formatDate(res.endDate) : (lang == "fr" ? "Définitif" : "Definitive"), true)
                                .addField(lang == "fr" ? "Durée" : "Duration", bot.durationDate(res.duration) || (lang == "fr" ? "Définitif" : "Definitive"), true)
                        }
                        if (res.code) embed.addField("Code", res.code + ": " + Object.keys(bot.codes)[Object.values(bot.codes).findIndex(a => a == res.code)], true)
                        if (res.status) embed.addField("Status", res.status + ": " + bot.statusEmoji[res.status] + " " + Object.keys(bot.status)[Object.values(bot.status).findIndex(a => a == res.status)], true)
                        if (res.content) embed.addField("Content", res.content, true);
                        if (sub == "member") {
                            var b = await db.collection("bans").find({ memberID: id }).count();
                            var k = await db.collection("kicks").find({ memberID: id }).count();
                            var m = await db.collection("mutes").find({ memberID: id }).count();
                            var w = await db.collection("warns").find({ memberID: id }).count();
                            await bot.getLevel(id, async level => {
                                var exps = db.collection("members-discord").find(null, { projection: { lvl: true, exp: true } });
                                var arr = await exps.toArray();

                                var rank = 1;
                                arr.forEach(mem => {
                                    if (mem.lvl > level.lvl) rank++;
                                    else if (mem.lvl == level.lvl && mem.exp > level.xp) rank++;
                                });

                                embed.addFields([
                                    { name: "Last username", value: (res.lastUsername || "No Username") + "#" + (res.lastDiscriminator || "No Discriminator"), inline: true },
                                    { name: "Level", value: "#" + rank + " Level " + level.lvl + " (" + level.xp + "/" + level.maxXP + " XP)", inline: true },
                                    { name: "Warns", value: w + " warn(s)", inline: true },
                                    { name: "Mutes", value: m + " mute(s)", inline: true },
                                    { name: "Kicks", value: k + " kick(s)", inline: true },
                                    { name: "Bans", value: b + " ban(s)", inline: true }
                                ]).setThumbnail(res.lastAvatarURL);

                                interaction.reply({ embeds: [embed] });
                            });
                        } else {
                            interaction.reply({ embeds: [embed] });
                        }
                    }
                } else {
                    var embed = new bot.libs.discord.MessageEmbed()
                        .setColor(bot.errorColor)
                        .setTitle(":dagger: | New Empires - error")
                        .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                        .addField("Get", ":x: " + (lang == "fr" ? "Aucun résultat trouvé" : "Not result found"), true);

                    interaction.reply({ embeds: [embed] });
                }
            });
        }
    } else if (sub == "kicks" || sub == "bans" || sub == "warns" || sub == "mutes") {
        try {
            var member = interaction.options.getMember("mention", true);
        } catch (error) { };

        if (member) {
            var l = await db.collection(sub).find({ memberID: member.id }).toArray();
            if (l.length > 0) {
                var embeds = [];
                l.forEach((res, i) => {
                    var embed = new bot.libs.discord.MessageEmbed()
                        .setColor(bot.validColor)
                        .setTitle(":dagger: | New Empires - get")
                        .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                        .addField("Index", i.toString() || "0", true)
                        .addField("ID", member.id, true)
                        .addField("Date", bot.formatDate(res.date), true)
                        .addField("Modo", (res.modoID || res.author) ? ("<@" + (res.modoID || res.author) + ">") : "No Modo", true)
                        .addField("Member", (res.member || res.memberID) ? ("<@" + (res.member || res.memberID) + ">") : "No Member", true);
                    if (res.type) embed.addField("Type", res.type, true);
                    if (res.hasOwnProperty("active")) embed.addField("Active", res.active ? "true" : "false", true);
                    if (res.reason) embed.addField(lang == "fr" ? "Raison" : "Reason", res.reason || "No Reason", true);
                    if (res.endDate) {
                        embed.addField(lang == "fr" ? "Fin" : "End", bot.durationDate(res.duration) ? bot.formatDate(res.endDate) : (lang == "fr" ? "Définitif" : "Definitive"), true)
                            .addField(lang == "fr" ? "Durée" : "Duration", bot.durationDate(res.duration) || (lang == "fr" ? "Définitif" : "Definitive"), true)
                    }
                    if (res.content) embed.addField("Content", res.content || "No Content", true);

                    embeds.push(embed);
                });

                interaction.reply({ embeds: embeds });
            } else {
                var embed = new bot.libs.discord.MessageEmbed()
                    .setColor(bot.errorColor)
                    .setTitle(":dagger: | New Empires - error")
                    .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                    .addField("Get", ":x: " + (lang == "fr" ? "Aucun résultat trouvé" : "Not result found"), true);

                interaction.reply({ embeds: [embed] });
            }
        }
    }
};

module.exports.info = {
    name: "get",
    description: { en: "get ban, kick, warn...", fr: "récupérer un bannissement, un avertissement..." },
    category: "mod",
    options: [{
        name: "member",
        description: "get member.",
        type: "SUB_COMMAND",
        options: [{
            name: "id",
            type: "STRING",
            required: true,
            description: "the member's id."
        }]
    },
    {
        name: "ban",
        description: "get ban.",
        type: "SUB_COMMAND",
        options: [{
            name: "id",
            type: "STRING",
            required: true,
            description: "the ban's id."
        }]
    }, {
        name: "kick",
        description: "get kick.",
        type: "SUB_COMMAND",
        options: [{
            name: "id",
            type: "STRING",
            required: true,
            description: "the kick's id"
        }]
    }, {
        name: "mute",
        description: "get mute.",
        type: "SUB_COMMAND",
        options: [{
            name: "id",
            type: "STRING",
            required: true,
            description: "the mute's id."
        }]
    }, {
        name: "warn",
        description: "get warn.",
        type: "SUB_COMMAND",
        options: [{
            name: "id",
            type: "STRING",
            required: true,
            description: "the warn's id."
        }]
    }, {
        name: "mutes",
        description: "get player's mutes.",
        type: "SUB_COMMAND",
        options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the member concerned."
        }]
    }, {
        name: "warns",
        description: "get player's warns.",
        type: "SUB_COMMAND",
        options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the member concerned."
        }]
    }, {
        name: "kicks",
        description: "get player's kicks.",
        type: "SUB_COMMAND",
        options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the member concerned."
        }]
    }, {
        name: "bans",
        description: "get player's bans.",
        type: "SUB_COMMAND",
        options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the member concerned."
        }]
    }, {
        name: "log",
        description: "get log.",
        type: "SUB_COMMAND",
        options: [{
            name: "id",
            type: "STRING",
            required: true,
            description: "the log's id."
        }]
    }
    ]
};