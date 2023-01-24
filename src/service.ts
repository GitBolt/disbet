import {
    getMarketAccountsByStatusAndMintAccount,
    getMarketPrices,
    MarketStatus,
    ClientResponse,
    MarketAccounts,
    MarketPricesAndPendingOrders,
    MarketOutcomes,
} from "@monaco-protocol/client";
import { Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Message, MessageEmbed } from "discord.js";
import { TOKENLIST } from "./constants";
import { getKeyByValue, getProgram } from "./utils";

const marketsStatus = MarketStatus.Open;

export const getMarketOutcomePriceData = async (
    program: Program,
    marketPk: PublicKey
) => {
    console.log("marketPk", marketPk.toString());
    let marketPricesResponse: ClientResponse<MarketPricesAndPendingOrders> =
        await getMarketPrices(program, marketPk);
    if (marketPricesResponse.success && marketPricesResponse.data) {
        return getBestMarketOutcomeWithOdd(marketPricesResponse.data);
    }
    return null;
};


export const getMarkets = async (token: string, message: Message) => {
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));
    const marketsResponse: ClientResponse<MarketAccounts> =
        await getMarketAccountsByStatusAndMintAccount(
            program,
            marketsStatus,
            new PublicKey(token)
        );

    const embed = new MessageEmbed();
    embed.setColor('#0099ff')
        .setTitle('Market Outcomes')
        .setDescription(`These are the latest market outcomes of **${getKeyByValue(TOKENLIST, token)}**`)
        .setTimestamp()
    message.edit({ embeds: [embed] });
    if (marketsResponse.success && marketsResponse.data?.markets?.length) {
        //Only get an open market with a non-zero marketOutcomesCount
        const marketsWithOutcomes = marketsResponse.data.markets.filter(
            (market) => market.account.marketOutcomesCount > 0
        );
        for (let i = 0; i < marketsWithOutcomes.length; i++) {
            let marketPk = marketsWithOutcomes[i].publicKey;
            let marketPricesData = await getMarketOutcomePriceData(program, marketPk);
            if (!marketPricesData) {
                continue;
            }
            const marketData = {
                pk: marketPk.toString(),
                market: marketsWithOutcomes[i],
                prices: marketPricesData,
            };
            embed.addField(`${marketData.prices.marketOutcome} vs ${marketData.prices.marketOutcomeAgainst}`, `[For Outcome Price: **${marketData.prices.forOutcomePrice}** | Against Outcome Price: **${marketData.prices.againstOutcomePrice}**](https://solscan.io/account/${marketData.pk})`);
            await message.edit({ embeds: [embed] });
        }
    } else {
     await message.edit({embeds: [embed.setDescription('No markets found')]})   
    }
    await message.edit({ embeds: [embed], content: "Done!" })
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