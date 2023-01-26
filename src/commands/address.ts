import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Wallet } from '../schema/wallet';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('address')
    .setDescription('Returns your public key')
  ,

  async execute(interaction: ChatInputCommandInteraction) {
    const wallet = await Wallet.findOne({ discord_id: interaction.user.id })
    if (!wallet) {
      await interaction.reply("Wallet not created. Get started by entering `/init`")
      return
    }

    await interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setTitle("This is your betting wallet")
          .setDescription("```" + wallet.publicKey + "```")
      ]
    })
  },
};