module.exports.run = (bot, interaction, lang, db) => {
    var member = interaction.options.getMember("mention", false);

    var m = member || interaction.member;

    var lStr = bot.getLangsMember(m);

    var embed = new bot.libs.discord.MessageEmbed()
        .setColor(bot.infoColor)
        .setTitle(":dagger: | New Empires - lang")
        .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
        .addField("Lang" + (lang == "fr" ? "ue" : ""), (lang == "fr" ? ("La.les langue.s de <@" + m.id + "> est.sont ") : ("<@" + m.id + ">'s language.s is.are ")) + "**" + lStr + "**")
        .setThumbnail(m.user.avatarURL());

    interaction.reply({ embeds: [embed] });
};

module.exports.info = {
    name: "lang",
    description: { en: "displays member's/your lang.", fr: "affiche la langue du membre/de vous." },
    category: "user",
    options: [{
        name: "mention",
        type: "USER",
        required: false,
        description: "the user concerned."
    }]
};