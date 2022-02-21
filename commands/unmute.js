module.exports.run = async (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getMember("mention", true);
    } catch (err) {}

    if (member) {
        if (!(await bot.isGradePermission(modo.id, "MUTE_MEMBERS"))) {
            bot.log(bot.codes.UNMUTE, bot.status.NOT_PERMISSION, modo.id, member.id, {});
            return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
        }

        if (!member.isCommunicationDisabled()) {
            bot.log(bot.codes.UNMUTE, bot.status.ALREADY, modo.id, member.id, {});

            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.warningColor)
                .setTitle(":dagger: | New Empires - error")
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addField("Already", ":x: This member has already been unmuted")

            return interaction.reply({ embeds: [embed] });
        }

        db.collection("mutes").find({ memberID: member.id }).toArray((err, res) => {
            if (err) return interaction.reply("Error");

            var mute = res.sort((a, b) => b.date.getTime() - a.date.getTime());
            if (mute.length == 0) return interaction.reply("Error");
            mute = mute[0];

            member.timeout(0, "unmute");

            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.validColor)
                .setTitle(":dagger: | New Empires - unmute")
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addField("Unmute", ":white_check_mark: " + (lang == "en" ? "The member has been unmuted !" : "Le membre peut maintenant parler !"), true)
                .addField("Memb" + (lang == "fr" ? "re" : "er"), "<@" + member.id + ">", true)
                .addField("Modo", "<@" + modo.id + ">", true)
                .addField("Mute ID", mute._id);

            bot.log(bot.codes.UNMUTE, bot.status.OK, modo.id, member.id, { muteID: mute._id });

            interaction.reply({ embeds: [embed] });
        });
    }
};

module.exports.info = {
    name: "unmute",
    description: { en: "unmute a member from the discord server.", fr: "rend plus muet un membre du serveur discord." },
    category: "mod",
    options: [{
        name: "mention",
        type: "USER",
        required: true,
        description: "the member to unmute."
    }]
};