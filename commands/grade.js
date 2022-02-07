module.exports.run = (bot, interaction, lang, db) => {
    var member = interaction.options.getMember("mention", false);

    var m = member || interaction.member;

    var grades = bot.getGradesMember(m.id);

    var embed = new bot.libs.discord.MessageEmbed()
        .setColor(bot.infoColor)
        .setTitle(":dagger: | New Empires - grade")
        .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
        .addField("Grade", (lang == "fr" ? ("Le.s grade.s de <@" + m.id + "> est.sont ") : ("<@" + m.id + ">'s grade.s is.are ")) + "**" + grades + "**")
        .setThumbnail(m.user.avatarURL());

    interaction.reply({ embeds: [embed] });
};

module.exports.info = {
    name: "grade",
    description: { en: "displays member's/your grade.", fr: "affiche le grade du membre/de vous." },
    category: "user",
    options: [{
        name: "mention",
        type: "USER",
        required: false,
        description: "the user concerned."
    }]
};