const { SlashCommandBuilder } = require('discord.js');
import { ChatInputCommandInteraction } from 'discord.js';
import { EMOJIS, TOKENLIST } from '../constants';
import { getMarkets } from '../protocol';
import { getKeyByValue } from '../utils';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('markets')
    .setDescription('Returns all active market data')
    .addStringOption((option: any) =>
      option.setName('category')
        .setDescription('Token symbols for markets')
        .setRequired(false)
        .addChoices(...Object.entries(TOKENLIST).map(([name, value]) => ({ name, value })))),
    
  async execute(interaction: ChatInputCommandInteraction) {
    let token = TOKENLIST["USDT"]
    const category = interaction.options.getString("category")
    if (category) {
      token = TOKENLIST[category]
    }
    const tokenName = getKeyByValue(TOKENLIST, token)
    await interaction.reply(`Fetching latest **${tokenName}** market data ${EMOJIS.loading}`)
    await getMarkets(token, interaction)
  },
};



//   } else if (message.content.startsWith('!mybets')) {
//     const args = message.content.split(" ")
//     if (args.length < 2) {
//       await message.channel.send("You must specify the __market public key__ to view all bets on that")
//       return
//     }

//     const betOrdersResponse = await new Orders(program)
//       .filterByMarket(new PublicKey(args[1]))
//       .filterByPurchaser(new PublicKey('AoVdX5T9cTGqWKyhDNxNMqhkkuh4xEeVNZ2pFdaeKa64'))
//       .fetch();
//     const accs = betOrdersResponse.data.orderAccounts

//     const infoMessage = await message.channel.send("Fetching your bets...")
//     const embed = new MessageEmbed()
//       .setTitle("Your Bets")
//       .setDescription(`These are your bets for account \`${args[1]}\``)
//       .setColor('#ff0062')


//     accs.forEach((acc) => {
//       const formattedString = `Stake: \`${parseProtocolNumber(acc.account.stake)}\`\nOdds: \`${acc.account.expectedPrice}\`\nStake Unmatched: \`${parseProtocolNumber(acc.account.stakeUnmatched) === 0}\`\nAddress: \`${acc.publicKey.toBase58()}\`\n[View on Solscan](https://solscan.io/account/${acc.publicKey.toBase58()})`;
//       embed.addField(
//         `Bet Type: ${acc.account.forOutcome ? "FOR" : "AGAINST"}`,
//         formattedString,
//       )
//     })
//     await message.channel.send({ embeds: [embed] })
//     await infoMessage.delete()
//   } else if (message.content.startsWith('!cancelbet')) {
//     const args = message.content.split(" ")
//     if (args.length < 2) {
//       await message.channel.send("You must enter bet public key")
//       return
//     }
//     const infoMessage = await message.channel.send("Processing...")
//     try {
//       const res = await cancelOrder(program, new PublicKey(args[1]))
//       console.log(res)
//       if (res.success) {
//         await message.channel.send({
//           embeds: [
//             new MessageEmbed()
//               .setTitle("Successfully Canceled Bet")
//               .setURL(`https://solscan.io/tx/${res.data.tnxID}`)
//               .setColor('#00ff1e')
//               .addField("Account", "```" + args[1] + "```")
//           ]
//         })
//       } else if (res.errors[0].toString().includes("Order is not cancellable")) {
//         await message.channel.send("Bet is uncancelable as stake is matched")
//       } else {
//         await message.channel.send("```" + res.errors[0] + "```")
//       }
//     } catch (e: any) {
//       console.log(e.toString())
//     }
//     await infoMessage.delete()
//   }

// });

// client.login(process.env['TOKEN']);