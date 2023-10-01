import { ChatInputCommandInteraction, SlashCommandBuilder } from 'discord.js';
import { EMOJIS, TOKENLIST } from '../constants';
import { getMarkets } from '../protocol';
import { getKeyByValue } from '../utils';
import { Wallet } from '../schema/wallet';
import { isCustodial } from '../utils/isCustodial';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('switch')
        .setDescription('Toggle between custodial and non-custodial wallet'),

    async execute(interaction: ChatInputCommandInteraction) {

        const custodial = await isCustodial(interaction.user.id)
        if (custodial) {
            await Wallet.updateOne({ discord_id: interaction.user.id }, {
                custodial: false
            });

            await interaction.reply({content: `Switched to **non-custodial** wallet`, ephemeral: true})
        } else {
            await Wallet.updateOne({ discord_id: interaction.user.id }, {
                custodial: true
            });
            await interaction.reply({content: `Switched to **custodial** wallet`, ephemeral: true})
        }

    },
};