import { EmbedBuilder, SlashCommandBuilder } from "discord.js";
import { ChatInputCommandInteraction } from "discord.js";
import { COLORS } from "../constants";

const fs = require('fs');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('Lists all available commands'),
  async execute(interaction: ChatInputCommandInteraction) {
    const commandFiles = fs.readdirSync(__dirname).filter((file: any) => file.endsWith('.js'));

    const embed = new EmbedBuilder()
    .setTitle("All commands")
    .setColor(COLORS.default)

    const fields = []
    for (const file of commandFiles) {
      const command = require(`./${file}`);
      fields.push({
        name: "/" + command.data.name,
        value: command.data.description
      })
    }

    embed.setFields(...fields)

    return interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });
  },
};