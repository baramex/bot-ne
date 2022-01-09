module.exports.run = (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getMember("mention", true);
        var reason = interaction.options.getString("reason", true);
    } catch (err) {}

    var duration = interaction.options.getString("duration", false);

    if (member && reason) {
        if (member.roles.highest.comparePositionTo(modo.roles.highest) >= 0 || !member.bannable || !modo.permissions.has("BAN_MEMBERS") || member.id == modo.id) {
            bot.log(bot.codes.BAN, bot.status.NOT_PERMISSION, modo.id, member.id, { reason, duration });
            return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
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

        var id = bot.generateID();
        db.collection("bans").insertOne({ _id: id, modoID: modo.id, memberID: member.id, type: bot.types.DISCORD, reason: reason, active: true, duration: t || 0, endDate: new Date(t + new Date().getTime()), date: new Date() }).then(() => {
            member.ban({ reason: reason });

            bot.log(bot.codes.BAN, bot.status.OK, modo.id, member.id, { reason, duration, banID: id });

            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.validColor)
                .setTitle(":dagger: | New Empires - ban")
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addField("Ban", ":white_check_mark: " + (lang == "en" ? "The member has been banned !" : "Le membre a été banni !"), true)
                .addField("Type", bot.types.DISCORD, true)
                .addField("Memb" + (lang == "fr" ? "re" : "er"), member.user.tag + " - <@" + member.id + ">", true)
                .addField("Modo", "<@" + modo.id + ">", true)
                .addField(lang == "fr" ? "Raison" : "Reason", reason, true)
                .addField(lang == "fr" ? "Durée" : "Duration", bot.durationDate(t) || (lang == "fr" ? "Ban définitif" : "Definitive ban"), true)
                .addField(lang == "fr" ? "Fin" : "End", t ? bot.formatDate(new Date(t + new Date().getTime())) : (lang == "fr" ? "Ban définitif" : "Definitive ban"), true)
                .addField("ID", id, true)
                .setThumbnail(member.user.avatarURL());

            interaction.reply({ embeds: [embed] });
        });
    }
};

module.exports.info = {
    name: "ban",
    description: { en: "ban a user from the discord server.", fr: "banni un utilisateur du serveur discord." },
    category: "mod",
    options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the user to ban."
        },
        {
            name: "reason",
            type: "STRING",
            required: true,
            description: "the reason of the ban."
        },
        {
            name: "duration",
            type: "STRING",
            required: false,
            description: "the duration of the ban."
        }
    ]
};