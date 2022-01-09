module.exports.run = (bot, interaction, lang, db) => {
    var embed = new bot.libs.discord.MessageEmbed()
        .setColor(bot.infoColor)
        .setTitle(":dagger: | New Empires - help")
        .setFooter({ text: bot.footerAuthor.text + " | " + lang.toUpperCase(), iconURL: bot.footerAuthor.iconURL });

    var utilsCMD = "";
    var userCMD = "";
    var modCMD = "";
    var mcCMD = "";

    bot.commands.forEach(cmd => {
        var cmds = [];

        var args = "";
        var args1 = undefined;

        if (cmd.infos.options) {
            if (cmd.infos.options[0].type == "SUB_COMMAND") {
                var bop = undefined;
                args1 = [];
                var i = 0;
                args1[i] = "[";
                cmd.infos.options.sort((a, b) => {
                    if (a.options[0].type == b.options[0].type && a.options[0].name == b.options[0].name) return 1;
                    else return -1;
                });

                cmd.infos.options.forEach((sub, a, arr) => {
                    if (bop && sub.options[0].name + sub.options[0].type != bop) {
                        args1[i] = args1[i].substring(0, args1[i].length - 1);
                        args1[i] += "]";
                        args1[i] = { subs: args1[i], args: arr[a - 1].options };
                        i++;
                        args1[i] = "[";
                    }

                    args1[i] += sub.name + "|";

                    bop = sub.options[0].name + sub.options[0].type;
                });
                args1[i] = args1[i].substring(0, args1[i].length - 1);
                args1[i] += "]";
                args1[i] = { subs: args1[i], args: cmd.infos.options[cmd.infos.options.length - 1].options };
            }
        }

        (args1 || cmd.infos.options || []).forEach((arg, i) => {
            if (arg.subs) {
                args += arg.subs;
                arg.args.forEach(arg1 => {
                    var par = [];
                    if (arg1.required) par = ["[", "]"];
                    else par = ["(", ")"];
                    args += " " + par[0];
                    args += arg1.name + ":" + arg1.type.toLowerCase();
                    args += par[1];
                });
                cmds.push({ name: cmd.infos.name, description: cmd.infos.description, args: args });
                args = "";
            } else {
                var par = [];
                if (arg.required) par = ["[", "]"];
                else par = ["(", ")"];

                args += (i == 0 ? "" : " ") + par[0];
                args += arg.name + ":" + arg.type.toLowerCase();
                args += par[1];
            }
        });
        if (cmds.length == 0) {
            cmds.push({ name: cmd.infos.name, description: cmd.infos.description, args: args });
        }

        var str = "";
        cmds.forEach(c => {
            str += "- **/" + c.name + "**" + (c.args ? (" *" + c.args + "*") : "") + ": " + (c.description[lang] || c.description) + "\n";
        });

        if (cmd.infos.category == "utils") utilsCMD += str;
        else if (cmd.infos.category == "user") userCMD += str;
        else if (cmd.infos.category == "mod") modCMD += str;
        else if (cmd.infos.category == "mc") mcCMD += str;
    });

    embed.addField(":hotel: " + (lang == "en" ? "Utility/main commands" : "Commandes utilitaires et principales") + " :book:", utilsCMD);
    embed.addField(":construction_worker: " + (lang == "en" ? "Commands for users" : "Commandes pour les utilisateurs") + " :hut:", userCMD);
    embed.addField(":police_officer: " + (lang == "en" ? "Moderation commands" : "Commandes de modération") + " :no_entry_sign:", modCMD);
    embed.addField(":desert: Minecraft :pick:", mcCMD);

    interaction.reply({ embeds: [embed] });
};

module.exports.info = {
    name: "help",
    description: { en: "displays the list of bot commands.", fr: "affiche la liste des commandes." },
    category: "utils"
};