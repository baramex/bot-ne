module.exports.run = (bot, interaction, lang, db) => {
    if (!interaction.member.permissions.has("VIEW_AUDIT_LOG")) {
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    bot.libs.axios.get("http://localhost:15203/requests/files").then(r => {
        var data = r.data;
        if (data.status > 299) return;

        var last = data.result.files.sort((a, b) => b.time - a.time)[0];

        var embed = new bot.libs.discord.MessageEmbed()
            .setColor(bot.validColor)
            .setTitle(":dagger: | New Empires - backup")
            .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
            .addField("Size of backups", formatSize(data.result.totalSize), true)
            .addField("Number of files", data.result.files.length + " backups", true)
            .addField("Last backup", bot.formatDate(new Date(last.time)), true)
            .addField("Last backup size", formatSize(last.size));

        interaction.reply({ embeds: [embed] });
    }).catch(console.error);
};

function formatSize(bytes) {
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    if (bytes == 0) return "0 bytes";
    return Math.round(bytes / Math.pow(k, i), 2) + ' ' + sizes[i];
}

module.exports.info = {
    name: "db-backups",
    description: { en: "get db backups' infos.", fr: "récupère les informations de la souvegarde de la base de donnée." },
    category: "mod"
};