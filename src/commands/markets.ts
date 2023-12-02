import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { EMOJIS, SPORTS, TOKENLIST } from '../constants';
import { getMarkets } from '../protocol';
import { getKeyByValue } from '../utils';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('markets')
    .setDescription('Returns all active market data')
    .addStringOption((option: any) =>
      option.setName('token')
        .setDescription('Token symbols for markets')
        .setRequired(false)
        .addChoices(...Object.entries(TOKENLIST).map(([name, value]) => ({ name, value }))))
    .addStringOption((option: any) =>
      option.setName('sport')
        .setDescription('Select Sport')
        .setRequired(false)
        .addChoices(...SPORTS.map(value => ({ name: value, value })))),

  async execute(interaction: ChatInputCommandInteraction) {
    let token = TOKENLIST["USDC"]

    const tokenGiven = interaction.options.getString("token")
    const sport = interaction.options.getString("sport")

    if (tokenGiven) {
      token = tokenGiven
    }
    const tokenName = getKeyByValue(TOKENLIST, token)

    await interaction.reply(`Fetching latest **${tokenName}** market data ${EMOJIS.loading}`)
    await getMarkets(token, sport, interaction)
  },
};