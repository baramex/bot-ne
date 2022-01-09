module.exports.run = (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getMember("mention", true);
        var reason = interaction.options.getString("reason", true);
    } catch (err) {}

    if (member && reason) {
        if (member.roles.highest.comparePositionTo(modo.roles.highest) >= 0 || !member.kickable || !modo.permissions.has("KICK_MEMBERS") || member.id == modo.id) {
            bot.log(bot.codes.KICK, bot.status.NOT_PERMISSION, modo.id, member.id, { reason });
            return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
        }

        bot.kick(member, modo, reason).then(id => {
            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.validColor)
                .setTitle(":dagger: | New Empires - kick")
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addField("Kick", ":white_check_mark: " + (lang == "en" ? "The member has been kicked !" : "Le membre a été expulsé !"), true)
                .addField("Type", bot.types.DISCORD)
                .addField("Memb" + (lang == "fr" ? "re" : "er"), member.user.tag + " - <@" + member.id + ">", true)
                .addField("Modo", "<@" + modo.id + ">", true)
                .addField(lang == "fr" ? "Raison" : "Reason", reason, true)
                .addField("ID", id, true)
                .setThumbnail(member.user.avatarURL());

            interaction.reply({ embeds: [embed] });
        })
    }
};

module.exports.info = {
    name: "kick",
    description: { en: "kick a user from the discord server.", fr: "expulse un utilisateur du serveur discord." },
    category: "mod",
    options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the user to kick."
        },
        {
            name: "reason",
            type: "STRING",
            required: true,
            description: "the reason of the kick."
        }
    ]
};