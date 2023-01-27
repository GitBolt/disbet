import { token } from '@project-serum/anchor/dist/cjs/utils';
import { TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, EMOJIS, TOKENLISTURL } from '../constants';
import { Wallet } from '../schema/wallet';

module.exports = {
  data: new SlashCommandBuilder()
    .setName('wallet')
    .setDescription('Returns your betting wallet details')
  ,

  async execute(interaction: ChatInputCommandInteraction) {
    const wallet = await Wallet.findOne({ discord_id: interaction.user.id })
    if (!wallet) {
      await interaction.reply("Wallet not created. Get started by entering `/init`")
      return
    }

    // interaction.reply("Getting wallet details...")
    const connection = new Connection(process.env.RPC_URL as string)
    let response = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet!.publicKey as string), {
      programId: TOKEN_PROGRAM_ID,
    });

    const lamports = await connection.getBalance(new PublicKey(wallet!.publicKey as string))

    const res = await fetch('https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json')
    const tokenList = await res.json()
    const parsedTokens = response.value.map((item) => { return ({ mint: item.account.data.parsed.info.mint, amount: item.account.data.parsed.info.tokenAmount.uiAmount }) })

    const finalList = parsedTokens.map((token) => {
      const others = tokenList.tokens.find((tk: any) => tk.address == token.mint)
      return (
        {
          ...token,
          ...others
        }
      )
    })

    let tokenString = `${EMOJIS.sol} **SOL**\n**Balance**: ${lamports / LAMPORTS_PER_SOL}\n\n`

    finalList.forEach(token => {
      const symbol = token.symbol;
      const mint = token.mint;
      const amount = token.amount;
      tokenString += `[**${symbol}**](https://solscan.io/account/${mint})\n**Balance**: ${amount}\n\n`;
    });

    await interaction.channel.send({
      content: "Done! " + `<@${interaction.user.id}>`,
      embeds: [
        new EmbedBuilder()
          .setTitle("This is your betting wallet")
          .setColor(COLORS.default)
          .setDescription("```" + wallet.publicKey + "```" + "\n" + tokenString)
      ]
    },
    )
  },
};