import { Orders } from '@monaco-protocol/client';
import { PublicKey } from '@solana/web3.js';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../constants';
import { Wallet } from '../schema/wallet';
import { getProgram, parseProtocolNumber } from '../utils';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mybets')
    .setDescription('Returns your mets for a certain market event')

    .addStringOption((option: any) =>
      option.setName('market_address')
        .setDescription('[OPTIONAL] Public key of the market you want to see your bets for')
        .setRequired(false))

    .addStringOption((option: any) =>
      option.setName('address')
        .setDescription('Non custodial wallet')
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

    await interaction.reply({ content: "Fetching your bets...", ephemeral: true })

    const market_address = interaction.options.getString('market_address')
    const address = interaction.options.getString('address')
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

    let betOrdersResponse
    if (market_address) {
      betOrdersResponse = await new Orders(program)
        .filterByMarket(new PublicKey(market_address))
        .filterByPurchaser(new PublicKey(wallet!.publicKey as string))
        .fetch();
    } else {

      if (address) {
        betOrdersResponse = await new Orders(program)
          .filterByPurchaser(new PublicKey(address as string))
          .fetch();
      } else {
        betOrdersResponse = await new Orders(program)
          .filterByPurchaser(new PublicKey(wallet!.publicKey as string))
          .fetch();
      }

    }

    const accs = betOrdersResponse.data.orderAccounts
    const embed = new EmbedBuilder()
      .setTitle("Your Currently Active Bets")
      .setDescription(`These are your bets ${market_address ? `for account: \`\`\`${market_address}\`\`\`` : ''}`)
      .setColor(COLORS.default)

    if (!accs.length) {
      embed.setDescription("No bets found")
    }
    embed.addFields(
      ...accs.map((acc) => {
        console.log(acc.account.stake.toNumber())
        const formattedString = `Stake: \`${acc.account.stake / 1000000}\`\nOdds: \`${acc.account.expectedPrice}\`\nUnmatched Stake: \`${acc.account.stakeUnmatched / 1000000}\`\nAddress: \`${acc.publicKey.toBase58()}\`\n[View on Solscan](https://solscan.io/account/${acc.publicKey.toBase58()})`;
        return {
          name: `Bet Type: ${acc.account.forOutcome ? "FOR" : "AGAINST"}`,
          value: formattedString
        }
      })
    )
    await interaction.editReply({ embeds: [embed] })


  }
}