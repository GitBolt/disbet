const { SlashCommandBuilder } = require('discord.js');
import { ChatInputCommandInteraction, EmbedBuilder } from 'discord.js';
import { placeBet } from '../protocol';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('placebet')
    .setDescription('Returns all active market data')
    .addStringOption((option: any) =>
      option.setName('type')
        .setDescription('Whether you want to place bet against or for the market event')
        .setRequired(true)
        .addChoices({ name: "For", value: "for" }, { name: "Against", value: "against" }))

    .addStringOption((option: any) =>
      option.setName('market_address')
        .setDescription('Public key of the market you want to place the bet on')
        .setRequired(true))

    .addNumberOption((option: any) =>
      option.setName('stake_amount')
        .setDescription('How much amount you wanna bet?')
        .setRequired(true))
  ,

  async execute(interaction: ChatInputCommandInteraction) {
    await interaction.reply("Executing order...")
    const args = interaction.options
    const res = await placeBet(
      args.getString('market_address', true),
      args.getString("type", true) as "for" | "against",
      args.getNumber("stake_amount", true)
    )

    if (!res) {
      await interaction.editReply("Error finding market data")
      return
    }
    if (res.error) {
      await interaction.editReply(`Following error occured while placing bet: \`\`\`${res.data}\`\`\`\ `)
      return
    }

    const embed = new EmbedBuilder()
      .setTitle(`Successfully Placed Bet`)
      .setURL(`https://solscan.io/tx/${res.data.tnxID}`)
      .setColor('#00ff1e')
      .addFields(
        { name: "Event", value: `${res.market!.marketPricesData.marketOutcome} * vs * ${res.market!.marketPricesData.marketOutcomeAgainst}` },
        { name: "Bet Type", value: args.getString("type", true).toUpperCase() },
        { name: "Amount", value: `${args.getNumber("stake_amount", true)} USDT` },
        { name: "Market Address", value: "" + args.getString('market_address', true) + "" }
      )

    await interaction.editReply({ embeds: [embed] })
  },

};