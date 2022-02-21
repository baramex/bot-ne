module.exports.run = async (bot, interaction, lang, db) => {
    var modo = interaction.member;
    var member = interaction.options.getMember("mention", false) || modo;

    if (!(await bot.isGradePermission(modo.id, "VIEW_AUDIT_LOG"))) {
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    bot.getMemberInfo(member.id).then(async level => {
        if (!level) return interaction.reply("Member not found !");
        var b = await db.collection("bans").find({ memberID: member.id }).count().catch(console.error);
        var k = await db.collection("kicks").find({ memberID: member.id }).count().catch(console.error);
        var m = await db.collection("mutes").find({ memberID: member.id }).count().catch(console.error);
        var w = await db.collection("warns").find({ memberID: member.id }).count().catch(console.error);

        var exps = db.collection("members-discord").find(null, { projection: { lvl: true, exp: true } });
        var arr = await exps.toArray().catch(console.error);

        var rank = 1;
        arr.forEach(m => {
            if (m.lvl > level.lvl) rank++;
            else if (m.lvl == level.lvl && m.exp > level.xp) rank++;
        });

        var embed = new bot.libs.discord.MessageEmbed()
            .setColor(bot.validColor)
            .setTitle(":dagger: | New Empires - user")
            .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
            .addFields([
                { name: "ID", value: member.id, inline: true },
                { name: "Username", value: member.user.tag, inline: true },
                { name: "Nickname", value: member.nickname || "No Nickname", inline: true },
                { name: "Joined At", value: bot.formatDate(member.joinedAt), inline: true },
                { name: "Created At", value: bot.formatDate(member.user.createdAt), inline: true },
                { name: "Account created At", value: bot.formatDate(level.date), inline: true },
                { name: "Level", value: "#" + rank + " Level " + level.lvl + " (" + level.exp + "/" + level.maxExp + " XP)", inline: true },
                { name: "Langs", value: level.langs.join(" & ") || "no lang", inline: true },
                { name: "Agrees", value: level.agrees.join(" & ") || "no agree", inline: true },
                { name: "Grades", value: level.grades.join(" & ") || "no grade", inline: true },
                { name: "Warns", value: w + " warn(s)", inline: true },
                { name: "Mutes", value: m + " mute(s)", inline: true },
                { name: "Kicks", value: k + " kick(s)", inline: true },
                { name: "Bans", value: b + " ban(s)", inline: true }
            ])
            .setThumbnail(member.user.avatarURL());

        interaction.reply({ embeds: [embed] });
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