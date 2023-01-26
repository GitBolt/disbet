const { SlashCommandBuilder } = require('discord.js');
import { ChatInputCommandInteraction } from 'discord.js';
import { EMOJIS, TOKENLIST } from '../constants';
import { getMarkets } from '../protocol';
import { getKeyByValue } from '../utils';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('markets')
    .setDescription('Returns all active market data')
    .addStringOption((option: any) =>
      option.setName('category')
        .setDescription('Token symbols for markets')
        .setRequired(false)
        .addChoices(...Object.entries(TOKENLIST).map(([name, value]) => ({ name, value })))),
    
  async execute(interaction: ChatInputCommandInteraction) {
    let token = TOKENLIST["USDT"]
    const category = interaction.options.getString("category")
    if (category) {
      token = TOKENLIST[category]
    }
    const tokenName = getKeyByValue(TOKENLIST, token)
    await interaction.reply(`Fetching latest **${tokenName}** market data ${EMOJIS.loading}`)
    await getMarkets(token, interaction)
  },
};