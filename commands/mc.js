module.exports.run = (bot, interaction, lang, db) => {
    interaction.reply({ ephemeral: true, content: "Comming soon !" });
};

module.exports.info = {
    name: "mc",
    description: { en: "minecraft commands.", fr: "commandes minecraft." },
    category: "mc",
    options: [{
        name: "ban",
        description: "get minecraft ban.",
        type: "SUB_COMMAND",
        options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the member concerned."
        }]
    }, {
        name: "kick",
        description: "get minecraft kick.",
        type: "SUB_COMMAND",
        options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the member concerned."
        }]
    }, {
        name: "mute",
        description: "get minecraft mute.",
        type: "SUB_COMMAND",
        options: [{
            name: "mention",
            type: "USER",
            required: true,
            description: "the member concerned."
        }]
    }]
};