module.exports.run = (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getString("id", true);
    } catch (err) {}

    if (member) {
        if (!modo.permissions.has("BAN_MEMBERS")) {
            bot.log(bot.codes.UNBAN, bot.status.NOT_PERMISSION, modo.id, member, {});
            return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
        }

        db.collection("bans").findOneAndUpdate({ memberID: member, active: true }, { $set: { active: false } }, { projection: { _id: true } }).then((doc) => {
            if (doc.value) {
                bot.guild.members.unban(member)

                var embed = new bot.libs.discord.MessageEmbed()
                    .setColor(bot.validColor)
                    .setTitle(":dagger: | New Empires - unban")
                    .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                    .addField("Unban", ":white_check_mark: " + (lang == "en" ? "The user has been unbanned !" : "L'utilisateur a été débanni !"), true)
                    .addField("Memb" + (lang == "fr" ? "re" : "er"), member, true)
                    .addField("Modo", "<@" + modo.id + ">", true)
                    .addField("Ban ID", doc.value._id);

                bot.log(bot.codes.UNBAN, bot.status.OK, modo.id, member, { banID: doc.value._id });

                interaction.reply({ embeds: [embed] });
            } else {
                var embed = new bot.libs.discord.MessageEmbed()
                    .setColor(bot.warningColor)
                    .setTitle(":dagger: | New Empires - error")
                    .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                    .addField("Already", ":x: This member has already been unbanned", true);

                bot.log(bot.codes.UNBAN, bot.status.ALREADY, modo.id, member, {});

                interaction.reply({ embeds: [embed] });
            }
        });
    }
};

module.exports.info = {
    name: "unban",
    description: { en: "unban a user from the discord server.", fr: "débanni un utilisateur du serveur discord." },
    category: "mod",
    options: [{
        name: "id",
        type: "STRING",
        required: true,
        description: "the id to unban."
    }]
};