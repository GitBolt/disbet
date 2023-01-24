import dotenv from 'dotenv'
import {
  Client,
  Intents,
  MessageEmbed,
  Options,

} from 'discord.js'

import { getMarketOutcomePriceData, getMarkets, placeBetAgainst, placeBetFor } from './service';
import { EMOJIS, TOKENLIST } from './constants';
import { getKeyByValue, getProgram } from './utils';
import { PublicKey } from '@solana/web3.js';

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

    const type = args[1]
    const pubKey = args[2]
    const amount = args[3]

    let res: any

    
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

    let marketPricesData = await getMarketOutcomePriceData(program, new PublicKey(pubKey));

    if (!marketPricesData) {
      await message.channel.send("Price data not found")
      return
    }
    const marketData = {
      prices: marketPricesData,
    };

    if (type.toLowerCase() == "for") {
      res = await placeBetFor(new PublicKey(pubKey), Number(amount), marketData)
    } else {
      res = await placeBetAgainst(new PublicKey(pubKey), Number(amount), marketData)
    }
    console.log(res)

    const embed = new MessageEmbed();
    embed
      .setTitle(`Successfully Placed Bet`)
      .setURL('https://solscan.io/tx/aa')
      .setColor('#0099ff')
      .addField('Event', `**${marketData.prices.marketOutcome}** vs **${marketData.prices.marketOutcomeAgainst}**`)
      .addField("Bet Type", type.toUpperCase())
      .addField("Amount", amount)

    await message.channel.send({
      embeds: [embed]
    })

    await infoMessage.edit("Done")
  }

});

client.login(process.env['TOKEN']);