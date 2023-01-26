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
        .setDescription('Public key of the market you want to see your bets for')
        .setRequired(true))

  ,

  async execute(interaction: ChatInputCommandInteraction) {

    const wallet = await Wallet.findOne({ discord_id: interaction.user.id })

    if (!wallet) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder().setTitle("Wallet not created")
            .setDescription("Enter `/init` to get started")
            .setColor("Orange")
        ]
      })
      return
    }

    await interaction.reply("Fetching your bets...")

    const market_address = interaction.options.getString('market_address', true)
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

    const betOrdersResponse = await new Orders(program)
      .filterByMarket(new PublicKey(market_address))
      .filterByPurchaser(new PublicKey(wallet!.publicKey as string))
      .fetch();
    const accs = betOrdersResponse.data.orderAccounts

    const embed = new EmbedBuilder()
      .setTitle("Your Bets")
      .setDescription(`These are your bets for account: \`\`\`${market_address}\`\`\``)
      .setColor(COLORS.default)

    if (!accs.length) {
      embed.setDescription("No bets found")
    }
    embed.addFields(
      ...accs.map((acc) => {
        const formattedString = `Stake: \`${parseProtocolNumber(acc.account.stake)}\`\nOdds: \`${acc.account.expectedPrice}\`\nUnmatched Stake: \`${parseProtocolNumber(acc.account.stakeUnmatched)}\`\nAddress: \`${acc.publicKey.toBase58()}\`\n[View on Solscan](https://solscan.io/account/${acc.publicKey.toBase58()})`;
        return {
          name: `Bet Type: ${acc.account.forOutcome ? "FOR" : "AGAINST"}`,
          value: formattedString
        }
      })
    )
    await interaction.editReply({ embeds: [embed] })


  }
}