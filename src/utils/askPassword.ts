import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { decrypt } from "../crypto/encrypt";
import { Wallet } from "../schema/wallet";
import { COLORS } from '../constants';

export const askPassword = async (interaction: ChatInputCommandInteraction) => {

    const embed = new EmbedBuilder()
        .setTitle("Enter your encryption password")
        .setDescription("The next message which you will send will be considered your password to authorize transaction")
        .setColor(COLORS.default)
    try {
        const dmMessage = await interaction.user.send({ embeds: [embed] })

        const password = (await dmMessage.channel.awaitMessages({ time: 20000, max: 1 })).first()
        if (!password) { await interaction.user.send("You took too long"); return }

        const wallet = await Wallet.findOne({ discord_id: interaction.user.id })
        if (!wallet?.privateKey) return
        try {
            const keypair = await decrypt(Buffer.from(wallet.privateKey), Buffer.from(password.content))
            await interaction.user.send("Authorized! Processing action now...\nYou may go back to the channel to view status.")
            return keypair
        } catch (e) {
            await interaction.user.send("Incorrect password")
            return
        }
    } catch (e: any) {
        if (e.toString().includes("DiscordAPIError")) {
            await interaction.followUp("I am not able to DM you, please open your DMs to authorize transaction")
            return
        } else {
            await interaction.followUp("Uh oh, something went wrong")
            return
        }
    }

}
