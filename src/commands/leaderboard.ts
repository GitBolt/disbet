import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { Bet, Wallet } from '../schema/wallet';
import mongoose from 'mongoose';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('leaderboard')
    .setDescription('Returns your betting history')
  ,

  async execute(interaction: ChatInputCommandInteraction) {

    const topUserData = await getTopUsersByTotalBets()
    const embed = new EmbedBuilder()
      .setTitle('Top Users by Total Bets')
      .setColor('#0099ff');

    embed.addFields(
      topUserData.map((d: any, index) => ({
        name: `${index+1}. ${d.public_key}`,
        value: `Stake: \`${d.total_stake}\`\n` +
          `Discord Id: \`${d.user_id}\``
      }))
    )

    await interaction.reply({ embeds: [embed], ephemeral: true })


  }
}



const getTopUsersByTotalBets = async () => {
  try {
    const allBets = await Bet.find({});

    const userSums = allBets.reduce((acc, bet) => {
      acc[bet.wallet_id] = (acc[bet.wallet_id] || 0) + bet.stake_amount;
      return acc;
    }, {});
    // @ts-ignore
    const sortedSums = Object.entries(userSums).sort((a, b) => b[1] - a[1]);

    const walletIds = sortedSums.map(([wallet_id]) => new mongoose.Types.ObjectId(wallet_id));
    const userDetails = await Wallet.find({ '_id': { $in: walletIds } });

    const result = sortedSums.map(([wallet_id, totalStake]) => {
      const user = userDetails.find(user => user._id.toString() === wallet_id);
      return {
        user_id: wallet_id,
        public_key: user ? user.publicKey : null,
        total_stake: totalStake
      };
    });

    return result;
  } catch (error) {
    console.error("Error in getTopUsersByTotalBets: ", error);
    throw error;
  }
};

// Usage example
getTopUsersByTotalBets
