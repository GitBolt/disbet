import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../constants';
import { placeBet } from '../protocol';
import { askPassword } from '../utils/askPassword';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('placebet')
    .setDescription('Places a bet on an event either against or for it with the respective stake amount')
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

    const sk = await askPassword(interaction)
    if (!sk) return
    const res = await placeBet(
      args.getString('market_address', true),
      args.getString("type", true) as "for" | "against",
      args.getNumber("stake_amount", true),
      sk,
    )
    console.log(res)
    if (!res) {
      await interaction.followUp(`Error finding market data <@${interaction.user.id}>`)
      return
    }
    if (res.data.errors) {
      await interaction.followUp(`<@${interaction.user.id}> Following error occured while placing bet: \`\`\`${res.data.errors[0]}\`\`\`\ `)
      return
    }

    if (res.data.success) {
      const embed = new EmbedBuilder()
        .setTitle(`Successfully Placed Bet`)
        .setURL(`https://solscan.io/tx/${res.data.tnxID}`)
        .setColor(COLORS.success)
        .addFields(
          { name: "Event", value: `${res!.marketPricesData!.marketOutcome} * vs * ${res!.marketPricesData!.marketOutcomeAgainst}` },
          { name: "Bet Type", value: args.getString("type", true).toUpperCase() },
          { name: "Amount", value: `${args.getNumber("stake_amount", true)} USDT` },
          { name: "Market Address", value: "" + args.getString('market_address', true) + "" }
        )

      await interaction.editReply({ embeds: [embed], content: `<@${interaction.user.id}>` })
    }

  },

};