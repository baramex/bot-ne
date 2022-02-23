module.exports.run = async (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getMember("mention", true);
        var content = interaction.options.getString("content", true);
    } catch (error) {}

    if (member && content) {
        if (!(await bot.isHighestGrade(modo.id, member.id).catch(console.error)) || !(await bot.isGradePermission(modo.id, "MODERATE_MEMBERS").catch(console.error)) || member.id == modo.id) {
            bot.log(bot.codes.WARN, bot.status.NOT_PERMISSION, modo.id, member.id, { content });
            return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
        }

        var id = bot.generateID();
        db.collection("warns").insertOne({ _id: id, modoID: modo.id, memberID: member.id, content: content, date: new Date() }).then(() => {
            bot.log(bot.codes.WARN, bot.status.OK, modo.id, member.id, { content, warnID: id });

            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.validColor)
                .setTitle(":dagger: | New Empires - warn")
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addField("Information", ":white_check_mark: " + (lang == "en" ? "The member has been warned !" : "Le membre a été averti !"), true)
                .addField("Memb" + (lang == "fr" ? "re" : "er"), "<@" + member.id + ">", true)
                .addField("Modo", "<@" + modo.id + ">", true)
                .addField(lang == "fr" ? "Contenu" : "Content", content, true)
                .addField("ID", id, true)
                .setTimestamp()
                .setThumbnail(member.user.avatarURL());

            interaction.reply({ embeds: [embed] });
        }).catch(console.error);
    }
};

module.exports.info = {
    name: "warn",
    description: { en: "warn a user.", fr: "averti de manière écrite un utilisateur." },
    category: "mod",
    options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the user to warn."
        },
        {
            name: "content",
            type: "STRING",
            required: true,
            description: "the content of the warn."
        }
    ]
};