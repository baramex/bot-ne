module.exports.run = (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var nb = interaction.options.getNumber("nb-message", true);
    } catch (error) {}

    if (!modo.permissions.has("MANAGE_MESSAGES")) {
        bot.log(bot.codes.BULK_DELETE, bot.status.NOT_PERMISSION, modo.id, null, {});
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    if (nb <= 1 || nb > 99) {
        var embed = new bot.libs.discord.MessageEmbed()
            .setColor(bot.errorColor)
            .setTitle(":dagger: | New Empires - error")
            .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
            .addField("Argument", lang == "fr" ? "L'argument *nb-message* doit être compris entre 2 et 100" : "The argument *nb-message* must be between 1 and 99", true)
        bot.log(bot.codes.BULK_DELETE, bot.status.ERROR_ARGUMENT, modo.id, null, { argument_name: "nb-message", argument_value: nb });
        interaction.reply({ embeds: [embed] });
    } else {
        interaction.channel.bulkDelete(nb).then(mes => {
            interaction.reply(mes.size + (lang == "fr" ? " messages supprimés" : " messages deleted"));
            var res = [];
            mes.forEach(m => {
                res.push({ content: m.content, embeds: m.embeds, author: m.author.id })
            });
            bot.log(bot.codes.BULK_DELETE, bot.status.OK, modo.id, null, { messages: res });
            setTimeout(() => {
                if (interaction.replied) interaction.deleteReply();
            }, 3000);
        }).catch(err => interaction.reply({ content: err.message, ephemeral: true }));
    }
};

module.exports.info = {
    name: "clear",
    description: { en: "bulk message deletion.", fr: "suppression de messages en bloc." },
    category: "mod",
    options: [{
        name: "nb-message",
        type: "NUMBER",
        required: true,
        description: "the number of message to delete."
    }]
};