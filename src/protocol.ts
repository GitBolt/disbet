import {
    getMarketAccountsByStatusAndMintAccount,
    getMarketPrices,
    MarketStatus,
    ClientResponse,
    MarketAccounts,
    MarketPricesAndPendingOrders,
    createOrder,
    getMintInfo,
    getMarket,
} from "@monaco-protocol/client";
import { BN, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { TOKENLIST } from "./constants";
import { getKeyByValue, getProgram } from "./utils";


export const getMarketOutcomePriceData = async (
    program: Program,
    marketPk: PublicKey
) => {
    console.log("Market Public Key", marketPk.toString());
    let marketPricesResponse: ClientResponse<MarketPricesAndPendingOrders> =
        await getMarketPrices(program, marketPk);
    if (marketPricesResponse.success && marketPricesResponse.data) {
        const moreData = getBestMarketOutcomeWithOdd(marketPricesResponse.data);
        return moreData
    }
    return null;
};

const marketsStatus = MarketStatus.Open;

export const getMarkets = async (token: string, interaction: ChatInputCommandInteraction) => {
    console.log("Fetching markets...")
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

    const marketsResponse: ClientResponse<MarketAccounts> =
        await getMarketAccountsByStatusAndMintAccount(
            program,
            marketsStatus,
            new PublicKey(token)
        );
    console.log(marketsResponse)
    const embed = new EmbedBuilder();
    embed.setColor('#ff0062')
        .setTitle('Market Outcomes')
        .setDescription(`These are the latest market outcomes of **${getKeyByValue(TOKENLIST, token)}**`)
        .setTimestamp()

    console.log("Market Response: ", marketsResponse.success)
    await interaction.editReply({ embeds: [embed], content: "Loading..." });
    if (marketsResponse.success && marketsResponse.data?.markets?.length) {

        const currentTime = +new Date() / 1000

        const marketsWithOutcomes = marketsResponse.data.markets.filter(
            (market) => market.account.marketOutcomesCount > 0
        ).filter((market) => market.account.marketLockTimestamp.toNumber() > currentTime)

        for (let i = 0; i < marketsWithOutcomes.length; i++) {
            let marketPk = marketsWithOutcomes[i].publicKey;
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
            await interaction.editReply({ embeds: [embed], content: "Loading..." });
        }
    } else {
        await interaction.editReply({ embeds: [embed.setDescription('Looks empty in here')], content: "No markets found" })
    }
    await interaction.editReply({ embeds: [embed], content: "Done!" })
};


const getBestMarketOutcomeWithOdd = (
    marketPricesAndPendingOrders: MarketPricesAndPendingOrders
) => {
    const { marketPrices } = marketPricesAndPendingOrders;

    let marketOutcomes: any = {};
    for (let i = 0; i < marketPrices.length; i++) {
        let marketPrice = marketPrices[i];
        // skip Draw market outcome
        if (marketPrice.marketOutcome === "Draw") {
            continue;
        }
        if (!marketOutcomes[marketPrice.marketOutcome]) {
            marketOutcomes[marketPrice.marketOutcome] = {
                marketOutcomeIndex: marketPrice.marketOutcomeIndex,
                forOutcomePrice: 0,
                againstOutcomePrice: 0,
            };
        }
        if (
            marketPrice.forOutcome &&
            marketPrice.price >
            marketOutcomes[marketPrice.marketOutcome].forOutcomePrice
        ) {
            marketOutcomes[marketPrice.marketOutcome].forOutcomePrice =
                marketPrice.price;
        } else if (
            !marketPrice.forOutcome &&
            marketPrice.price >
            marketOutcomes[marketPrice.marketOutcome].againstOutcomePrice
        ) {
            marketOutcomes[marketPrice.marketOutcome].againstOutcomePrice =
                marketPrice.price;
        }
    }
    if (Object.keys(marketOutcomes).length !== 2) {
        return null;
    }
    let marketOutcomeA = Object.keys(marketOutcomes)[0];
    let marketOutcomeB = Object.keys(marketOutcomes)[1];
    for (let marketOutcome in marketOutcomes) {
        let forOutcomePrice = marketOutcomes[marketOutcome].forOutcomePrice;
        let againstOutcomePrice = marketOutcomes[marketOutcome].againstOutcomePrice;
        if (forOutcomePrice > 0 && againstOutcomePrice > 0) {
            return {
                marketOutcome: marketOutcome,
                marketOutcomeAgainst:
                    marketOutcome === marketOutcomeA ? marketOutcomeB : marketOutcomeA,
                marketOutcomeIndex: marketOutcomes[marketOutcome].marketOutcomeIndex,
                forOutcomePrice: forOutcomePrice,
                againstOutcomePrice: againstOutcomePrice,
            };
        }
    }
    return null;
};


export const placeBet = async (
    marketPk: string,
    type: "for" | "against",
    amount: number,
) => {

    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

    const marketData = await getMarket(program, new PublicKey(marketPk))
    const mintInfo = await getMintInfo(program, marketData.data.account.mintAccount)
    const stakeInteger = new BN(amount * 10 ** mintInfo.data.decimals);
    let marketPricesData = await getMarketOutcomePriceData(program, new PublicKey(marketPk));

    if (!marketPricesData || !marketData.success) {
        return undefined
    }

    try {
        const createOrderResponse = await createOrder(
            program,
            new PublicKey(marketPk),
            marketPricesData.marketOutcomeIndex,
            type == "for" ? true : false,
            marketPricesData.forOutcomePrice,
            stakeInteger
        );
        return { error: false, data: createOrderResponse, market: { marketData, marketPricesData } }
    } catch (e: any) {
        return { error: true, data: e.toString() }
    }
};