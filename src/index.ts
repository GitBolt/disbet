import dotenv from 'dotenv'
import {
  Client,
  Intents,
  MessageEmbed,
  Options,

} from 'discord.js'

import { getMarketOutcomePriceData, getMarkets, placeBet } from './protocol';
import { EMOJIS, TOKENLIST } from './constants';
import { getKeyByValue, getProgram, parseProtocolNumber } from './utils';
import { PublicKey } from '@solana/web3.js';
import { getMarket, Orders, cancelOrder } from '@monaco-protocol/client';

dotenv.config()


const client = new Client({
  intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILD_MESSAGE_REACTIONS],
  partials: ['MESSAGE', 'CHANNEL', 'REACTION'],
  makeCache: Options.cacheEverything()
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user?.username}!`);
});



client.on("message", async (message) => {
  const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));
  if (message.content.startsWith("!markets")) {
    const args: string[] = message.content.split(" ")

    let token = TOKENLIST["USDT"]
    if (args.length > 1 && Object.keys(TOKENLIST).includes(args[1])) {
      token = TOKENLIST[args[1]]
    }

    const tokenName = getKeyByValue(TOKENLIST, token)
    const infoMessage = await message.channel.send(`Fetching latest **${tokenName}** market data ${EMOJIS.loading}`)
    await getMarkets(token, infoMessage)
  } else if (message.content.startsWith("!placebet")) {
    const args: string[] = message.content.split(" ")
    if (args.length < 2) {
      await message.channel.send("You must specify the __market public key__ and __amount__ for betting")
      return
    }

    const infoMessage = await message.channel.send("Executing order...")

    const type: any = args[1]
    const pubKey = args[2]
    const amount = args[3]

    if (!["for", "against"].includes(type)) {
      await message.channel.send("Bet must be **against* or **for**")
      return
    }
    let res: any



    let marketPricesData = await getMarketOutcomePriceData(program, new PublicKey(pubKey));
    const marketData = await getMarket(program, new PublicKey(pubKey))

    if (!marketPricesData || !marketData.success) {
      await message.channel.send("Error finding data")
      return
    }
    const allMarketData = {
      prices: marketPricesData,
      marketData: marketData.data
    };

    res = await placeBet(new PublicKey(pubKey), type.toLowerCase(), Number(amount), allMarketData)

    console.log("Bet Response: ", res)


    if (res.success) {
      const embed = new MessageEmbed();
      embed
        .setTitle(`Successfully Placed Bet`)
        .setURL(`https://solscan.io/tx/${res.data.tnxID}`)
        .setColor('#00ff1e')
        .addField('Event', `*${allMarketData.prices.marketOutcome}* vs *${allMarketData.prices.marketOutcomeAgainst}*`)
        .addField("Bet Type", type.toUpperCase())
        .addField("Amount", `${amount} USDT`)
        .addField("Market Address", "```" + pubKey + "```")

      await message.channel.send({
        embeds: [embed]
      })
    } else {
      await message.channel.send("Following error placing bet:" + "```" + res.errors[0].toString() + "```")
    }


    await infoMessage.delete()
  } else if (message.content.startsWith('!mybets')) {
    const args = message.content.split(" ")
    if (args.length < 2) {
      await message.channel.send("You must specify the __market public key__ to view all bets on that")
      return
    }

    const betOrdersResponse = await new Orders(program)
      .filterByMarket(new PublicKey(args[1]))
      .filterByPurchaser(new PublicKey('AoVdX5T9cTGqWKyhDNxNMqhkkuh4xEeVNZ2pFdaeKa64'))
      .fetch();
    const accs = betOrdersResponse.data.orderAccounts

    const infoMessage = await message.channel.send("Fetching your bets...")
    const embed = new MessageEmbed()
      .setTitle("Your Bets")
      .setDescription(`These are your bets for account \`${args[1]}\``)
      .setColor('#ff0062')


    accs.forEach((acc) => {
      const formattedString = `Stake: \`${parseProtocolNumber(acc.account.stake)}\`\nOdds: \`${acc.account.expectedPrice}\`\nStake Unmatched: \`${parseProtocolNumber(acc.account.stakeUnmatched) === 0}\`\nAddress: \`${acc.publicKey.toBase58()}\`\n[View on Solscan](https://solscan.io/account/${acc.publicKey.toBase58()})`;
      embed.addField(
        `Bet Type: ${acc.account.forOutcome ? "FOR" : "AGAINST"}`,
        formattedString,
      )
    })
    await message.channel.send({ embeds: [embed] })
    await infoMessage.delete()
  } else if (message.content.startsWith('!cancelbet')) {
    const args = message.content.split(" ")
    if (args.length < 2) {
      await message.channel.send("You must enter bet public key")
      return
    }
    const infoMessage = await message.channel.send("Processing...")
    try {
      const res = await cancelOrder(program, new PublicKey(args[1]))
      console.log(res)
      if (res.success) {
        await message.channel.send({embeds: [
          new MessageEmbed()
          .setTitle("Successfully Canceled Bet")
          .setURL(`https://solscan.io/tx/${res.data.tnxID}`)
          .setColor('#00ff1e')
          .addField("Account", "```" + args[1] + "```")
        ]})
      } else if (res.errors[0].toString().includes("Order is not cancellable")) {
        await message.channel.send("Bet is uncancelable as stake is matched")
      } else {
        await message.channel.send("```" + res.errors[0] + "```")
      }
    } catch (e: any) {
      console.log(e.toString())
    }
    await infoMessage.delete()
  }

});

client.login(process.env['TOKEN']);