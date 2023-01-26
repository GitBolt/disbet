
import dotenv from 'dotenv'
import mongoose from 'mongoose';
const fs = require('node:fs');
const path = require('node:path');
const { Client, Collection, Events, GatewayIntentBits } = require('discord.js');

dotenv.config()


const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages] });

client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file: any) => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  client.commands.set(command.data.name, command);
}

client.once(Events.ClientReady, () => {
  console.log('Ready!');
});

client.on(Events.InteractionCreate, async (interaction: any) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);

  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});


const start = async () => {
  const db = process.env.MONGO_URL
  const token = process.env['TOKEN']
  if (!db || !token) return console.log("Missing MONGO_URL or TOKEN env variable")

  mongoose.connect(db, {
    keepAlive: true
  })
  mongoose.connection.on('error', err => {
    console.log(err)
    process.exit(1)
  })
  client.login(token);
}

start()
