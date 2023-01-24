import dotenv from 'dotenv'
import {
  Client,
  Intents,
  MessageEmbed,
  Options,

} from 'discord.js'

import { getMarketOutcomePriceData, getMarkets, placeBet } from './service';
import { EMOJIS, TOKENLIST } from './constants';
import { getKeyByValue, getProgram } from './utils';
import { PublicKey } from '@solana/web3.js';
import { getMarket } from '@monaco-protocol/client';

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
      await message.channel.send("You must specify the market public key and amount for betting")
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


    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

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

    console.log(res)

    const embed = new MessageEmbed();
    embed
      .setTitle(`Successfully Placed Bet`)
      .setURL('https://solscan.io/tx/aa')
      .setColor('#0099ff')
      .addField('Event', `**${allMarketData.prices.marketOutcome}** vs **${allMarketData.prices.marketOutcomeAgainst}**`)
      .addField("Bet Type", type.toUpperCase())
      .addField("Amount", amount)

    await message.channel.send({
      embeds: [embed]
    })

    await infoMessage.edit("Done")
  }

});

client.login(process.env['TOKEN']);