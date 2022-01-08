module.exports.run = (bot, interaction, lang, db) => {
    var modo = interaction.member;
    var member = interaction.options.getMember("mention", false) || modo;

    if (!modo.permissions.has("VIEW_AUDIT_LOG")) {
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    bot.getMemberD(member.id, async mem => {
        if (!mem) return interaction.reply("Member not found !");
        var b = await db.collection("bans").find({ memberID: member.id }).count();
        var k = await db.collection("kicks").find({ memberID: member.id }).count();
        var m = await db.collection("mutes").find({ memberID: member.id }).count();
        var w = await db.collection("warns").find({ memberID: member.id }).count();

        bot.getLevel(member.id, async level => {
            var exps = db.collection("members-discord").find(null, { projection: { lvl: true, exp: true } });
            var arr = await exps.toArray();

            var rank = 1;
            arr.forEach(m => {
                if (m.lvl > level.lvl) rank++;
                else if (m.lvl == level.lvl && m.exp > level.xp) rank++;
            });

            var grade = bot.getGrade(member).name;

            var embed = new bot.libs.discord.MessageEmbed()
                .setColor(bot.validColor)
                .setTitle(":dagger: | New Empires - result" + (lang == "fr" ? "at" : ""))
                .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
                .addFields([
                    { name: "ID", value: member.id, inline: true },
                    { name: "Username", value: member.user.tag, inline: true },
                    { name: "Nickname", value: member.nickname || "No Nickname", inline: true },
                    { name: "Joined At", value: bot.formatDate(member.joinedAt), inline: true },
                    { name: "Created At", value: bot.formatDate(member.user.createdAt), inline: true },
                    { name: "Level", value: "#" + rank + " Level " + level.lvl + " (" + level.xp + "/" + level.maxXP + " XP)", inline: true },
                    { name: "Lang", value: bot.getLang(member) == "fr" ? (lang == "fr" ? "FRANÇAIS" : "FRENCH") : (lang == "fr" ? "ANGLAIS" : "ENGLISH"), inline: true },
                    { name: "Grade", value: grade, inline: true },
                    { name: "Warns", value: w + " warn(s)", inline: true },
                    { name: "Mutes", value: m + " mute(s)", inline: true },
                    { name: "Kicks", value: k + " kick(s)", inline: true },
                    { name: "Bans", value: b + " ban(s)", inline: true }
                ])
                .setThumbnail(member.user.avatarURL());

            interaction.reply({ embeds: [embed] });
        });
    });
};

module.exports.info = {
    name: "user",
    description: { en: "get user infos.", fr: "récupère les informations d'un utilisateur." },
    category: "mod",
    options: [{
        name: "mention",
        type: "USER",
        required: false,
        description: "the user concerned."
    }]
};