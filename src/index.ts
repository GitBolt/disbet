import dotenv from 'dotenv'
import {
  Client,
  Intents,
  MessageEmbed,
  Options,

} from 'discord.js'

import { getMarkets } from './service';
import { EMOJIS, TOKENLIST } from './constants';
import { getKeyByValue } from './utils';

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
  }
});

client.login(process.env['TOKEN']);