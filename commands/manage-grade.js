module.exports.run = async (bot, interaction, lang, db) => {
    var modo = interaction.member;
    try {
        var member = interaction.options.getMember("mention", true);
    } catch (error) { }

    if (!(await bot.isGradePermission(modo.id, "MANAGE_ROLES")) && member.roles.highest.comparePositionTo(modo.roles.highest) >= 0) {
        return interaction.reply({ embeds: [bot.embedNotPerm(lang)] });
    }

    bot.getMemberInfo(member.id).then(mem => {
        if(!mem) return interaction.reply("Member not found !");

        var menu = new bot.libs.discord.MessageSelectMenu().setCustomId("action").setPlaceholder("Choose action").addOptions([
            {label: "add", value: "add", description: "Add the role if the user does not already have it", emoji: "➕"},
            {label: "remove", value: "remove", description: "Remove the role if the user has it", emoji: "🗑️"}
        ]);
        var button1 = new bot.libs.discord.MessageButton().setCustomId('valid')
        .setLabel('Manage')
        .setStyle('SUCCESS')
        .setEmoji("✔️");
        var button2 = new bot.libs.discord.MessageButton().setCustomId('cancel')
        .setLabel('Cancel')
        .setStyle('DANGER')
        .setEmoji("✖️");
        var row1 = new bot.libs.discord.MessageActionRow().addComponents(menu);
        var row2 = new bot.libs.discord.MessageActionRow().addComponents(button1, button2);

        var embed = new bot.libs.discord.MessageEmbed()
            .setColor(bot.validColor)
            .setTitle(":dagger: | New Empires - manage grade")
            .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL })
            .setDescription("Choose your options\nCurrent " + member.user.tag + "'s grade.s: **" + mem.grades.join(" & ") + "**");

        var filter = (int) => (int.isSelectMenu() || int.isButton()) && int.user.id == modo.id;

        var collector = interaction.channel.createMessageComponentCollector({filter, max: 1, time: 60 * 1000 * 5});

        var action = "";

        collector.on("collect", collected => {
            console.log(collected)
            if(collected.customId == "action") {
                action = collected.values[0];

                var comps = collected.message.components.filter(a => a.components.every(b => b.type == "BUTTON"));

                var options = [];
                Object.values(bot.grades).forEach(grade => {
                    if(mem.grades.includes(grade) == (action != "add")) options.push({ label: grade, value: grade, emoji: bot.getRolesFromGrades([grade])?.length > 0 ? (bot.getRolesFromGrades([grade])[0].name.split(" | ")[0] || "❔") : "❔"});
                });

                if(options.length == 0) return collected.reply({ephemeral: true, content: "You cannot remove a grade because the user has none !"});

                var menu = new bot.libs.discord.MessageSelectMenu().setMinValues(1).setMaxValues(options.length).setCustomId("grade").setPlaceholder("Choose grade to " + action).addOptions(options);
                comps.push(new bot.libs.discord.MessageActionRow().addComponents(menu));
                comps.reverse();
                console.log(comps);

                collected.update({components: comps});
            }
            else if(collected.customId == "cancel") {
                return collected.message.delete();
            }
            else collected.update({});
        });

        collector.on("end", collected => {
            collected.reply({content: "Interactions closed !", ephemeral: true});
        });

        interaction.reply({ embeds: [embed], components: [row1, row2] });
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