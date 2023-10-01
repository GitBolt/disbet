import { TOKEN_PROGRAM_ID, createTransferInstruction, getOrCreateAssociatedTokenAccount } from '@solana/spl-token';
import { Connection, LAMPORTS_PER_SOL, PublicKey, Keypair, Transaction, SystemProgram, sendAndConfirmTransaction } from '@solana/web3.js';
import { ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { COLORS, EMOJIS } from '../constants';
import { Wallet } from '../schema/wallet';
import axios from 'axios'
import { askPassword } from '../utils/askPassword';
import { isCustodial } from '../utils/isCustodial';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('transfer')
        .setDescription('Transfer or withdraw your wallet balance')

        .addStringOption((option: any) =>
            option.setName('token_name')
                .setDescription('Enter your token name')
                .setRequired(true))

        .addNumberOption((option: any) =>
            option.setName('amount')
                .setDescription('Token amount')
                .setRequired(true))


        .addStringOption((option: any) =>
            option.setName('address')
                .setDescription('Address to send')
                .setRequired(true))
    ,

    async execute(interaction: ChatInputCommandInteraction) {

        const custodial = await isCustodial(interaction.user.id)
        if (!custodial) {
            await interaction.reply({ content: "Switch to custodial wallet to transfer its balance. Enter `/switch`", ephemeral: true })
            return
        }

        await interaction.reply("Transferring...")
        const args = interaction.options

        const token = args.getString("token_name")
        const amount = args.getNumber("amount")
        const address = args.getString("address")

        const wallet = await Wallet.findOne({ discord_id: interaction.user.id })
        if (!wallet) {
            await interaction.followUp({ content: "Wallet not created. Get started by entering `/init`", ephemeral: true })
            return
        }

        const sk = await askPassword(interaction)
        if (!sk) return

        const connection = new Connection(process.env.RPC_URL as string)
        let response = await connection.getParsedTokenAccountsByOwner(new PublicKey(wallet!.publicKey as string), {
            programId: TOKEN_PROGRAM_ID,
        });

        const lamports = await connection.getBalance(new PublicKey(wallet!.publicKey as string))

        const res = await axios.get('https://cdn.jsdelivr.net/gh/solana-labs/token-list@latest/src/tokens/solana.tokenlist.json')
        const tokenList = await res.data
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

        const userToken = finalList.find((t) => t.symbol == token)
        const kpObject = Keypair.fromSecretKey(sk)
        if (!userToken && token != "SOL") {
            await interaction.followUp({ content: `<@${interaction.user.id}> You don't own that token. Use the command \`/wallet\` to view your tokens and balances.`, ephemeral: true })
        } else {

            if (token == "SOL") {
                const tx = new Transaction().add(
                    SystemProgram.transfer({
                        fromPubkey: kpObject.publicKey,
                        toPubkey: new PublicKey(address!),
                        lamports: LAMPORTS_PER_SOL * amount!,
                    })
                );
                const latestBlockHash = await connection.getLatestBlockhash('confirmed');
                tx.recentBlockhash = await latestBlockHash.blockhash;
                const signature = await connection.sendTransaction(tx, [kpObject]);
                const embed = new EmbedBuilder()
                    .setTitle(`Successfully Transferred SOL`)
                    .setURL(`https://solscan.io/tx/${signature}`)
                    .setColor(COLORS.success)
                await interaction.followUp({ embeds: [embed] })
            } else {
                try {
                    let sourceAccount = await getOrCreateAssociatedTokenAccount(
                        connection,
                        kpObject,
                        new PublicKey(userToken.mint),
                        kpObject.publicKey
                    );

                    let destinationAccount = await getOrCreateAssociatedTokenAccount(
                        connection,
                        kpObject,
                        new PublicKey(userToken.mint),
                        new PublicKey(address!)
                    );

                    const tx = new Transaction();
                    tx.add(createTransferInstruction(
                        sourceAccount.address,
                        destinationAccount.address,
                        kpObject.publicKey,
                        amount! * Math.pow(10, userToken.decimals)
                    ))

                    const latestBlockHash = await connection.getLatestBlockhash('confirmed');
                    tx.recentBlockhash = await latestBlockHash.blockhash;
                    const signature = await connection.sendTransaction(tx, [kpObject]);
                    const embed = new EmbedBuilder()
                        .setTitle(`Successfully Transferred Token`)
                        .setURL(`https://solscan.io/tx/${signature}`)
                        .setColor(COLORS.success)
                    await interaction.followUp({ embeds: [embed] })
                }
                catch (e) {
                    await interaction.followUp({ content: `<@${interaction.user.id}> Error: \`\`\`${e}\`\`\` `, ephemeral: true })

                }
            }


        }
    },
};