import { Orders } from '@monaco-protocol/client';
import { PublicKey } from '@solana/web3.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, ComponentType, EmbedBuilder, Interaction, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../constants';
import { Bet, Wallet } from '../schema/wallet';
import { getProgram, parseProtocolNumber } from '../utils';
import { simpleErrors } from '../utils/simpleErrors';
import { askPassword } from '../utils/askPassword';
import { sendPlaceBetURL } from '../network/getCustodialUrl';
import { isCustodial } from '../utils/isCustodial';
import { placeBet } from '../protocol';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('share')
    .setDescription('Returns your mets for a certain market event')

    .addStringOption((option: any) =>
      option.setName('bet_address')
        .setDescription('Public key of the bet you want to share')
        .setRequired(true))

    .addStringOption((option: any) =>
      option.setName('address')
        .setDescription('Non-custodial wallet')
        .setRequired(false))
  ,

  async execute(interaction: ChatInputCommandInteraction) {

    const wallet = await Wallet.findOne({ discord_id: interaction.user.id })

    if (!wallet) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder().setTitle("Wallet not created")
            .setDescription("Enter `/init` to get started")
            .setColor("Orange")
        ],
        ephemeral: true
      })
      return
    }

    await interaction.reply({ content: "Sharing your bet...", ephemeral: true })

    const bet_address = interaction.options.getString('bet_address')
    const address = interaction.options.getString('address')
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

    const betOrdersResponse = await new Orders(program)
      .filterByPurchaser(new PublicKey(address as string || wallet!.publicKey as string))
      .fetch();

    const accs = betOrdersResponse.data.orderAccounts

    const betDetails = accs.find((a) => a.publicKey.toBase58() == bet_address)

    if (!betDetails) {
      await interaction.editReply({ content: "No bet with the given address found" })
      return
    }

    console.log(betDetails)
    const embed = new EmbedBuilder()
      .setTitle("Snipe Bet")
      .setDescription(`Stake: \`${parseProtocolNumber(betDetails.account.stake)}\`\nOdds: \`${betDetails.account.expectedPrice}\`\nUnmatched Stake: \`${parseProtocolNumber(betDetails.account.stakeUnmatched)}\`\nAddress: \`${betDetails.publicKey.toBase58()}\`\n[View on Solscan](https://solscan.io/account/${betDetails.publicKey.toBase58()})`)
      .setColor(COLORS.default)

    if (!accs.length) {
      embed.setDescription("No bets found")
      await interaction.editReply({ embeds: [embed] })
      return
    }

    const nextButton = new ButtonBuilder()
      .setCustomId('copy')
      .setLabel('COPY')
      .setStyle(ButtonStyle.Primary);


    const row = new ActionRowBuilder().addComponents(nextButton);

    // @ts-ignore
    await interaction.editReply({ embeds: [embed], components: [row] })


    const collectorFilter = (i: Interaction) => i.user.id === interaction.user.id;
    try {
      const collector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter, time: 120000, componentType: ComponentType.Button });

      collector.on('collect', async (i) => {
        if (i.customId == "copy") {
          const outcome = betDetails.account.forOutcome ? "for" : "against"
          const betAddress = betDetails.publicKey.toBase58()
          const stake = parseProtocolNumber(betDetails.account.stake)

          console.log(outcome, betAddress, stake)

          const custodial = await isCustodial(interaction.user.id)
          if (!custodial) {
            const res = await sendPlaceBetURL(
              betDetails.publicKey.toBase58(),
              betDetails.account.forOutcome ? "for" : "against",
              parseProtocolNumber(betDetails.account.stake),
            )
            await interaction.channel.send({ content: `Head over to [this link](${res}) and sign the transaction using your browser wallet! <@${i.user.id}>` })
            return
          }

          const sk = await askPassword(interaction)
          if (!sk) return
          const res = await placeBet(
            betDetails.account.market.toBase58(),
            outcome,
            stake,
            sk,
          )

          if (!res) {
            await interaction.channel.send({ content: `Error finding market data <@${interaction.user.id}>` })
            return
          }
          if (res.data.errors.length) {
            await interaction.channel.send({
              content: `<@${interaction.user.id}> Following error occured while placing bet: \`\`\`${simpleErrors(res.data.errors[0].toString())}\`\`\`\ `,
            })
            return
          }

          if (res.data.success) {
            console.log(res)
            const user = await Wallet.findOne({ discord_id: i.user.id });

            const newBet = new Bet({
              stake_amount: stake,
              type: outcome.toUpperCase(),
              market_address: betDetails.account.market.toBase58(),
              wallet_id: user.id
            });

            await newBet.save();

            const embed = new EmbedBuilder()
              .setTitle(`Successfully Copied Bet`)
              .setURL(`https://solscan.io/tx/${res.data.data.tnxID}`)
              .setColor(COLORS.success)
              .addFields(
                { name: "Event", value: `${res!.marketPricesData!.marketOutcome} * vs * ${res!.marketPricesData!.marketOutcomeAgainst}` },
                { name: "Bet Type", value: outcome },
              )

            await interaction.channel.send({ embeds: [embed], content: `<@${interaction.user.id}>` })
          }

        }
      })
    } catch (e) {
      console.log(e)
      await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    }



  }
}