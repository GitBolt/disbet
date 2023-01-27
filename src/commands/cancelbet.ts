import { cancelOrder } from '@monaco-protocol/client';
import { PublicKey } from '@solana/web3.js';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../constants';
import { getProgram } from '../utils';
import { askPassword } from '../utils/askPassword';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cancelbet')
    .setDescription('Cancels a bet with the provided bet address')

    .addStringOption((option: any) =>
      option.setName('bet_address')
        .setDescription('Public key of the bet you want to cancel')
        .setRequired(true))

  ,

  async execute(interaction: ChatInputCommandInteraction) {

    await interaction.reply("Processing...")
    const bet_address = interaction.options.getString('bet_address', true)

    const sk = await askPassword(interaction)
    if (!sk) return
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'), sk);

    const res = await cancelOrder(program, new PublicKey(bet_address))

    if (res.success) {
      await interaction.editReply({
        embeds: [
          new EmbedBuilder()
            .setTitle("Successfully Canceled Bet")
            .setURL(`https://solscan.io/tx/${res.data.tnxID}`)
            .setColor(COLORS.success)
            .addFields({ name: "Account", value: "```" + bet_address + "```" })
        ]
      })
    } else if (res.errors[0].toString().includes("Order is not cancellable")) {
      await interaction.editReply("Bet is not cancelable as unmatched stake is 0")
    } else {
      await interaction.editReply("```" + res.errors[0] + "```")
    }

  }
}