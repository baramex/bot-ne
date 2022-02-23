module.exports.run = async (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getMember("mention", true);
    } catch (error) { }

    if (!(await bot.isGradePermission(modo.id, "MANAGE_ROLES").catch(console.error)) || !(await bot.isHighestGrade(modo.id, member.id).catch(console.error)) || modo.id == member.id) {
        bot.log(bot.codes.MANAGE_GRADES, bot.status.NOT_PERMISSION, modo.id, member.id, {});
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    bot.getMemberInfo(member.id).then(async mem => {
        if (!mem) return interaction.reply("Member not found !");

        var menu = new bot.libs.discord.MessageSelectMenu().setCustomId("action").setPlaceholder("Choose action").addOptions([
            { label: "add", value: "add", description: "Add the role if the user does not already have it", emoji: "➕" },
            { label: "remove", value: "remove", description: "Remove the role if the user has it", emoji: "🗑️" }
        ]);
        var button = new bot.libs.discord.MessageButton().setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle('DANGER')
            .setEmoji("✖️");
        var row1 = new bot.libs.discord.MessageActionRow().addComponents(menu);
        var row2 = new bot.libs.discord.MessageActionRow().addComponents(button);

        var embed = new bot.libs.discord.MessageEmbed()
            .setColor(bot.validColor)
            .setTitle(":dagger: | New Empires - manage grade")
            .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
            .setDescription("Choose your options\nCurrent " + member.user.tag + "'s grade.s: **" + mem.grades.join(" & ") + "**");

        var filter = (int) => (int.isSelectMenu() || int.isButton()) && int.user.id == modo.id;

        await interaction.reply({ embeds: [embed], components: [row1, row2] });
        var collector = (await interaction.fetchReply().catch(console.error)).createMessageComponentCollector({ filter, time: 60 * 1000 * 5 });

        var action = "";

        collector.on("collect", async collected => {
            if (collected.customId == "action") {
                action = collected.values[0];

                var comps = collected.message.components.filter(a => a.components.every(b => b.type == "BUTTON"));

                var highestP = bot.getHighestRole(bot.getRolesFromGrades(await bot.getGradesMember(modo.id).catch(console.error)))?.position;
                if (!highestP) return;
                var options = [];
                Object.values(bot.grades).forEach(grade => {
                    var role = bot.getRolesFromGrades([grade])[0];
                    if (mem.grades.includes(grade) == (action != "add") && role && role.position < highestP) options.push({ label: grade, value: grade, emoji: role.name.split(" | ")[0] });
                });

                if (options.length == 0) return collected.reply({ ephemeral: true, content: "You cannot remove a grade because the user has none !" });

                var menu = new bot.libs.discord.MessageSelectMenu().setMinValues(1).setMaxValues(options.length).setCustomId("grade").setPlaceholder("Choose grade to " + action).addOptions(options);
                comps.push(new bot.libs.discord.MessageActionRow().addComponents(menu));
                comps.reverse();

                collected.update({ components: comps });
            }
            else if (collected.customId == "grade") {
                var grades = collected.values;
                if (action == "add") await db.collection("members-discord").findOneAndUpdate({ id: member.id }, { $addToSet: { grades: { $each: grades } } }).catch(console.error);
                else if (action == "remove") await db.collection("members-discord").findOneAndUpdate({ id: member.id }, { $pull: { grades: { $in: grades } } }).catch(console.error);

                await bot.updateRoles(member);
                await bot.updatePseudo(member);

                bot.log(bot.codes.MANAGE_GRADES, bot.status.SUCCESS, modo.id, member.id, { grades, action });
                return collected.message.delete();
            }
            else if (collected.customId == "cancel") {
                bot.log(bot.codes.MANAGE_GRADES, bot.status.CANCELLED, modo.id, member.id, {});
                return collected.message.delete();
            }
        });

        collector.on("end", () => {
            interaction.editReply({ content: "interaction ended !", embeds: [], components: [] }).catch(console.error);
        });
    });
};

module.exports.info = {
    name: "manage-grade",
    description: { en: "add or remove an user grade.", fr: "ajouter ou retirer un grade d'un joueur." },
    category: "mod",
    options: [{
        name: "mention",
        type: "USER",
        required: true,
        description: "the user concerned."
    }]
};