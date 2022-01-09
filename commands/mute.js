module.exports.run = (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getMember("mention", true);
        var reason = interaction.options.getString("reason", true);
        var duration = interaction.options.getString("duration", true);
    } catch (err) {}

    if (member && reason) {
        if (member.roles.highest.comparePositionTo(modo.roles.highest) >= 0 || !modo.permissions.has("MUTE_MEMBERS") || member.id == modo.id) {
            bot.log(bot.codes.MUTE, bot.status.NOT_PERMISSION, modo.id, member.id, { reason, duration });
            return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
        }

        if (member.isCommunicationDisabled()) {
            bot.log(bot.codes.MUTE, bot.status.ALREADY, modo.id, member.id, { reason, duration });

            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.warningColor)
                .setTitle(":dagger: | New Empires - error")
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addField("Already", ":x: This member has already been muted")

            return interaction.reply({ embeds: [embed] });
        }

        var before = "";
        var act = 0;
        var res = [];
        if (duration)
            duration.split("").forEach((dur, l, arr) => {
                res[act] = (res[act] || "") + dur;

                if (before.match(/[0-9]/) && dur.match(/[a-z]/i) && !(arr[l + 1] || "").match(/[a-z]/i)) {
                    act++;
                }

                if (!dur.match(/[a-z]/g)) before = dur;
            });

        var t = 0;
        res.forEach(r => {
            t += bot.libs.ms(r) || 0;
        });

        if (t == 0 || isNaN(t)) return interaction.reply("Please enter a valid time");

        var id = bot.generateID();
        db.collection("mutes").insertOne({ _id: id, modoID: modo.id, memberID: member.id, type: bot.types.DISCORD, reason: reason, duration: t || 0, endDate: new Date(t + new Date().getTime()), date: new Date() }).then(() => {
            member.timeout(t, reason);

            bot.log(bot.codes.MUTE, bot.status.OK, modo.id, member.id, { reason, duration, muteID: id });

            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.validColor)
                .setTitle(":dagger: | New Empires - mute")
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addField("Mute", ":white_check_mark: " + (lang == "en" ? "The member has been muted !" : "Le membre est maintenant muet !"), true)
                .addField("Type", bot.types.DISCORD, true)
                .addField("Memb" + (lang == "fr" ? "re" : "er"), "<@" + member.id + ">", true)
                .addField("Modo", "<@" + modo.id + ">", true)
                .addField(lang == "fr" ? "Raison" : "Reason", reason, true)
                .addField(lang == "fr" ? "Durée" : "Duration", bot.durationDate(t) || (lang == "fr" ? "Mute définitif" : "Definitive mute"), true)
                .addField(lang == "fr" ? "Fin" : "End", t ? bot.formatDate(new Date(t + new Date().getTime())) : (lang == "fr" ? "Mute définitif" : "Definitive mute"), true)
                .addField("ID", id, true)
                .setThumbnail(member.user.avatarURL());

            interaction.reply({ embeds: [embed] });
        });
    }
};

module.exports.info = {
    name: "mute",
    description: { en: "mute a user from the discord server.", fr: "rend muet un utilisateur du serveur discord." },
    category: "mod",
    options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the user to mute."
        },
        {
            name: "duration",
            type: "STRING",
            required: true,
            description: "the duration of the mute."
        },
        {
            name: "reason",
            type: "STRING",
            required: true,
            description: "the reason of the mute."
        }
    ]
};