import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, setProvider, Program, Wallet } from "@coral-xyz/anchor";
import { BN } from "@coral-xyz/anchor"
import CustomWallet from "./wallet";
import { ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getMarketOutcomePriceData } from "./protocol";

export async function getProgram(protocolAddress: PublicKey, sk?: Uint8Array) {

    const wallet = CustomWallet.with_private_key(sk || new Keypair().secretKey)
    const connection = new Connection(process.env.RPC_URL as string)
    const provider = new AnchorProvider(connection, wallet as Wallet, AnchorProvider.defaultOptions())
    setProvider(provider);
    const program = await Program.at(protocolAddress, provider);
    return program
}

export const parseProtocolNumber = (protocolNumber: BN) =>
    new BN(protocolNumber).toNumber() / 10 ** 9;


export const getKeyByValue = (object: any, value: any) => {
    return Object.keys(object).find(key => object[key] === value);
}


export const embedBuilder = async (interaction: ChatInputCommandInteraction, marketsWithOutcomes: any[], row, page: number, idx: { value: number }) => {

    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));
    const newEmbed = new EmbedBuilder().setColor('#ff0062')
    console.log("Current starting index: ", idx)
    for (let i = idx.value; i < 100; i++) {
        idx.value += 1
        let marketPk = marketsWithOutcomes[i].publicKey;
        // console.log("\n\n", "This is the raw market: ", marketsWithOutcomes[i])

        let marketPricesData = await getMarketOutcomePriceData(program, marketPk);
        if (!marketPricesData) {
            console.log("No data: ", marketPk.toBase58())
            continue;
        }
        const marketData = {
            pk: marketPk.toString(),
            market: marketsWithOutcomes[i],
            prices: marketPricesData,
        };

        const formattedString = `For Outcome Price: \`${marketData.prices.forOutcomePrice}\`\nTo Outcome Price: \`${marketData.prices.againstOutcomePrice}\`\nAddress: \`${marketData.pk}\`\n[View on Solscan](https://solscan.io/account/${marketData.pk})`;
        newEmbed.addFields(
            {
                name: `${marketData.prices.marketOutcome} vs ${marketData.prices.marketOutcomeAgainst}`,
                value: formattedString
            }
        )
        let newData = { embeds: [newEmbed], content: `Page: ${page}\nFetching more...`, }

        if (newEmbed.data.fields.length == 3) {
            newData["components"] = [row]
            await interaction.editReply(newData);
            break
        } else {
            await interaction.editReply(newData);
        }


    }
    return newEmbed
}