const BSON = require("bson");

module.exports.run = async (bot, interaction, lang, db) => {
    if (!(await bot.isGradePermission(interaction.member.id, "VIEW_AUDIT_LOG"))) {
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    var size = (await db.collection("logs").stats().catch(console.error)).totalSize;
    var docs = await db.collection("logs").countDocuments().catch(console.error);
    var lastDate = (await db.collection("logs").find({}).sort({ date: -1 }).limit(1).toArray().catch(console.error))[0];
    var todayDate = new Date();
    todayDate.setHours(0);
    var todays = (await db.collection("logs").find({date: {$gte: todayDate}}).toArray().catch(console.error)).length

    var embed = new bot.libs.discord.MessageEmbed()
        .setColor(bot.infoColor)
        .setTitle(":dagger: | New Empires - logs")
        .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
        .addField("Logs size", formatSize(size), true)
        .addField("Number of documents", docs.toString(), true)
        .addField("Last log", bot.formatDate(lastDate.date), true)
        .addField("Last log size", formatSize(BSON.calculateObjectSize(lastDate)), true)
        .addField("Number of logs since today", todays.toString(), true);

    interaction.reply({ embeds: [embed] });
};

function formatSize(bytes) {
    var k = 1024;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    var i = Math.floor(Math.log(bytes) / Math.log(k));
    if (bytes == 0) return "0 bytes";
    return Math.round(bytes / Math.pow(k, i), 2) + ' ' + sizes[i];
}

module.exports.info = {
    name: "logs-info",
    description: { en: "displays logs infos.", fr: "affiche les informations des logs." },
    category: "mod"
};