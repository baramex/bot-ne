module.exports.run = async(bot, interaction, lang, db) => {
    var exps = db.collection("members-discord").find(null, { projection: { lvl: true, exp: true, lastAvatarURL: true, id: true } });
    var arr = await exps.toArray();

    arr.sort((a, b) => {
        if (a.lvl != b.lvl) return b.lvl - a.lvl;
        else return b.exp - a.exp;
    });

    arr.splice(5);

    str = "";
    arr.forEach((m, i) => {
        str += `#${i+1} - <@${m.id}> - level ${m.lvl} (${m.exp}/${bot.getExpLvl(m.lvl)} xp)\n`;
    });

    var embed = new bot.libs.discord.MessageEmbed()
        .setColor(bot.infoColor)
        .setTitle(":dagger: | New Empires - command" + (lang == "fr" ? "e" : ""))
        .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
        .addField("Rank", str)
        .setThumbnail(arr[0].lastAvatarURL);

    interaction.reply({ embeds: [embed] });
};

module.exports.info = {
    name: "rank",
    description: { en: "displays the 5 best levels.", fr: "affiche les 5 meilleurs niveaux." },
    category: "user"
};