import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { generateKeyPair } from '../crypto/keypair';
import { Wallet } from '../schema/wallet';
import { encrypt } from '../crypto/encrypt'
import { COLORS } from '../constants';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('init')
    .setDescription('Initialize your betting account')
  ,

  async execute(interaction: ChatInputCommandInteraction) {

    const existingWallet = await Wallet.findOne({ discord_id: interaction.user.id });
    if (existingWallet) {
      await interaction.reply({ content: `You already have a wallet with public key \`${existingWallet.publicKey}\``, ephemeral: true })
    } else {
      try {
        const embed = new EmbedBuilder()
          .setTitle("Enter your password to encrypt wallet")
          .setDescription("The next message which you will send will become your encryption password.")
          .setColor("Blue")

        await interaction.reply("Please check your DM")
        const dmMessage = await interaction.user.send({ embeds: [embed] })

        const password = (await dmMessage.channel.awaitMessages({ time: 20000, max: 1 })).first()
        if (!password) { await interaction.user.send("You took too long"); return }

        const kp = generateKeyPair()
        const newWallet = new Wallet({
          discord_id: interaction.user.id,
          publicKey: kp.publicKey,
          privateKey: await encrypt(Buffer.from(kp.privateKey), Buffer.from(password.content)),
        });
        await newWallet.save();

        const successEmbed = new EmbedBuilder()
          .setTitle("Betting wallet created successfully")
          .setColor(COLORS.success)
          .setFields(
            {
              name: "Public Key",
              value: "```" + kp.publicKey + "```"
            },
            {
              name: "Backup mnemonic",
              value: "```" + kp.generatedMnemonic + "```"
            },
            {
              name: "Warning",
              value: "**Do NOT** use this as your primary wallet, only deposit funds for betting.\nNot your keys, not your crypto."
            }
          )

        await interaction.user.send({ embeds: [successEmbed] })

      } catch (e: any) {
        if (e.toString().includes("DiscordAPIError")) {
          await interaction.followUp({content: "I am not able to DM you, please open your DMs to create your betting wallet", ephemeral: true})
        } else {
          await interaction.followUp("Uh oh, something went wrong")
        }
      }
    }
  }
}