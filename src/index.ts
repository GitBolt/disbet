import dotenv from 'dotenv'
import {
  Client,
  Intents,
  Options
} from 'discord.js'
import { getMarkets } from './service';

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
  if (message.content == "!ping") {
    const res = await getMarkets()
    console.log(res)
    message.channel.send("hi");
  }
});

client.login(process.env['TOKEN']);