import { Orders } from '@monaco-protocol/client';
import { PublicKey } from '@solana/web3.js';
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS } from '../constants';
import { Bet, Wallet } from '../schema/wallet';
import { getProgram, parseProtocolNumber } from '../utils';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('history')
    .setDescription('Returns your betting history')

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

    const betsPerPage = 10;
    await sendBettingHistory(interaction, wallet.id, 0, betsPerPage);
  }
}


async function sendBettingHistory(interaction, walletId, page, betsPerPage) {
  const totalBets = await Bet.countDocuments({ user_id: walletId });

  const bets = await Bet.find({ user_id: walletId })
    .skip(page * betsPerPage)
    .limit(betsPerPage);


  const embed = new EmbedBuilder()
    .setTitle("Your Betting History")
    .setColor(COLORS.default);

  if (totalBets === 0) {
    embed.setDescription("No bets found");
    await interaction.reply({ embeds: [embed] });
    return

  } else {
    embed.addFields(
      bets.map(bet => ({
        name: `Bet Type: ${bet.type}`,
        value: `Stake: \`${bet.stake_amount}\`\n` +
          `Date: <t:${Math.floor(bet.date_added.getTime() / 1000)}:f>\n` +
          `Market Address: \`${bet.market_address}\`` 
      }))
    );
  }


  const row = new ActionRowBuilder();
  if (page > 0) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('previous_page')
        .setLabel('Previous Page')
        .setStyle(ButtonStyle.Primary)
    );
  }
  if ((page + 1) * betsPerPage < totalBets) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId('next_page')
        .setLabel('Next Page')
        .setStyle(ButtonStyle.Primary)
    );
  }


  await interaction.reply({ embeds: [embed], components: row.components.length > 0 ? [row] : [] });

  const filter = i =>
    ['next_page', 'previous_page'].includes(i.customId) &&
    i.user.id === interaction.user.id;

  const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

  collector.on('collect', async i => {
    if (i.customId === 'next_page') {
      page++;
    } else if (i.customId === 'previous_page') {
      page--;
    }
    await sendBettingHistory(interaction, walletId, page, betsPerPage);
    await i.deferUpdate();
  });
}