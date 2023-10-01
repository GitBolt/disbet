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


export const embedBuilder = async (embed: EmbedBuilder, interaction: ChatInputCommandInteraction, marketsWithOutcomes: any[], row, page: number) => {

    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));
    console.log("IN THE LOOP MARKET OUTCOMES: ", marketsWithOutcomes)


    for (let i = 0; embed.data.fields ? embed.data.fields.length <= 2 : i <= 2; i++) {


        let marketPk = marketsWithOutcomes[i].publicKey;
        console.log("\n\n", "This is the raw market: ", marketsWithOutcomes[i])
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
        embed.addFields(
            {
                name: `${marketData.prices.marketOutcome} vs ${marketData.prices.marketOutcomeAgainst}`,
                value: formattedString
            }
        )

        let newData = { embeds: [embed], content: `Page: ${page}\nFetching more...`, }

        if (embed.data.fields.length == 3) {
            newData["components"] = [row]
            await interaction.editReply(newData);
            break
        } else {
            await interaction.editReply(newData);
        }


    }
    return embed
}