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

    message.channel.send(`Fetching latest **${getKeyByValue(TOKENLIST, token)}** market data ${EMOJIS.loading}`)
    const res = await getMarkets(token)
    console.log(Object.keys(res))


    const embed = new MessageEmbed();

    res.forEach((data) => {
      embed.addField(data.prices.marketOutcome + ' vs ' + data.prices.marketOutcomeAgainst, 'For Outcome Price: ' + data.prices.forOutcomePrice + ' | Against Outcome Price: ' + data.prices.againstOutcomePrice);
    });

    embed.setColor('#0099ff')
      .setTitle('Market Outcomes')
      .setDescription(`These are the latest market outcomes of *${getKeyByValue(TOKENLIST, token)}**`)
      .setFooter('Page 1/' + Math.ceil(res.length / 10))
      .setTimestamp()

    message.react('⬅️').then(() => {
      message.react('➡️');
    });

    const filter = (reaction: any, user: any) => {
      return ['⬅️', '➡️'].includes(reaction.emoji.name) && user.id === message.author.id;
    };

    message
      .awaitReactions({ max: 1, time: 60000, errors: ['time'], filter })
      .then((collected) => {
        const reaction = collected.first();
        if (!reaction) return
        if (reaction.emoji.name === '⬅️') {
          console.log("yes")
        } else {
          console.log("no")
        }
      })
      .catch((collected) => {
        console.log(`After a minute, only ${collected.size} out of 4 reacted.`);
      });


    message.channel.send({ embeds: [embed] });

  }
});

client.login(process.env['TOKEN']);