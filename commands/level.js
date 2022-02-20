module.exports.run = (bot, interaction, lang, db) => {
    var m = interaction.options.getUser("mention", false);

    var id = m ? m.id : interaction.member.id;
    bot.getMemberInfo(id).then(async level => {
        if (!level) return interaction.reply("User not found !");

        var user = m ? m : interaction.user;

        const { lvl, exp, maxExp } = level;

        var exps = db.collection("members-discord").find(null, { projection: { lvl: true, exp: true } });
        var arr = await exps.toArray();

        var rank = 1;
        arr.forEach(mem => {
            if (mem.lvl > level.lvl) rank++;
            else if (mem.lvl == level.lvl && mem.exp > level.exp) rank++;
        });

        const width = 950,
            height = 250;

        const canvas = bot.libs.canvas.createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = "rgb(40, 40, 40)";
        ctx.strokeStyle = "rgb(30, 30, 30)";
        ctx.lineWidth = 8;
        roundedRect(ctx, 4, 4, width - 8, height - 8, 20);
        ctx.fill();
        ctx.stroke();

        /*ctx.strokeStyle = "rgba(220, 220, 220, 0.5)";
        roundedRect(ctx, 9, 9, width - 18, height - 18, 20);
        ctx.stroke();*/

        ctx.fillStyle = "rgb(20, 20, 20)";
        ctx.beginPath();
        ctx.arc(height * 0.45 + 15, height / 2, height * 0.45, 0, 2 * Math.PI, false);
        ctx.fill();

        var imgCanvas = bot.libs.canvas.createCanvas(height * 0.8, height * 0.8);
        var imgCtx = imgCanvas.getContext('2d');
        imgCtx.clearRect(0, 0, imgCtx.width, imgCtx.height);
        imgCtx.globalCompositeOperation = 'source-over';
        imgCtx.drawImage(await bot.libs.canvas.loadImage(user.avatarURL({ format: "png", size: 256 }) || __dirname.replace("commands", "") + "/images/avatar.png"), 0, 0, height * 0.8, height * 0.8);
        imgCtx.fillStyle = '#fff';
        imgCtx.globalCompositeOperation = 'destination-in';
        imgCtx.beginPath();
        imgCtx.arc(height * 0.4, height * 0.4, height * 0.4, 0, 2 * Math.PI, true);
        imgCtx.closePath();
        imgCtx.fill();

        ctx.drawImage(imgCanvas, 15 + height * 0.05, height / 2 - height * 0.8 / 2, height * 0.8, height * 0.8);

        ctx.font = "80px arial";
        ctx.textBaseline = "middle";
        ctx.fillStyle = "#F5F2F2";
        ctx.fillText(user.username, height * 0.95 + 15 + 10, height / 4 * 3);

        ctx.fillStyle = "#F5F2F2";
        ctx.font = "50px arial";
        ctx.fillText("Level " + lvl, height * 0.95 + 15 + 10, height / 2 - 47);

        var c = ["#FFD700", "#C0C0C0", "#b36700"];

        ctx.fillStyle = "rgba(50, 50, 50, 0.9)";
        ctx.beginPath();
        ctx.arc(height * 0.8, height * 0.75, height * 0.18, 0, 2 * Math.PI, false);
        ctx.fill();

        ctx.fillStyle = c[rank - 1] || "#F5F2F2";
        ctx.font = "55px sans-serif";
        ctx.textAlign = "center";
        ctx.fillText("#" + rank, height * 0.8, height * 0.75);

        ctx.fillStyle = "rgba(150, 150, 150, 0.6)";
        roundedRect(ctx, height * 0.95 + 15 + 10, height / 2 - 20, width - (height * 0.95 + 15 + 10) - 15, 30, 30);
        ctx.fill();

        ctx.fillStyle = "rgba(106, 17, 17, 0.9)";
        roundedRect(ctx, height * 0.95 + 15 + 10, height / 2 - 20, (width - (height * 0.95 + 15 + 10) - 15) * (exp / maxExp), 30, 30);
        ctx.fill();

        ctx.fillStyle = "#817F7F";
        ctx.font = "35px arial";
        ctx.textAlign = "right";
        var l = ctx.measureText(maxExp + " XP");
        ctx.fillText(maxExp + " XP", width - 15, height / 2 - 47);
        ctx.fillText("/", width - 15 - l.width - 3, height / 2 - 47);

        ctx.fillStyle = "#F5F2F2";
        ctx.textAlign = "right";
        ctx.font = "bold 35px arial";
        ctx.fillText(exp, width - 15 - l.width - 20, height / 2 - 47);

        const attach = new bot.libs.discord.MessageAttachment(canvas.toBuffer(), "card.png");
        interaction.reply({ files: [attach] });
    });
};

function roundedRect(ctx, x, y, width, height, radius) {
    if (width < 2 * radius) radius = width / 2;
    if (height < 2 * radius) radius = height / 2;
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.arcTo(x + width, y, x + width, y + height, radius);
    ctx.arcTo(x + width, y + height, x, y + height, radius);
    ctx.arcTo(x, y + height, x, y, radius);
    ctx.arcTo(x, y, x + width, y, radius);
    ctx.closePath();
}

module.exports.info = {
    name: "level",
    description: { en: "displays your xp and level.", fr: "affiche votre xp et niveau." },
    category: "user",
    options: [{
        name: "mention",
        type: "USER",
        required: false,
        description: "to display the level of another user."
    }]
};