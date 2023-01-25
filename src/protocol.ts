import {
    getMarketAccountsByStatusAndMintAccount,
    getMarketPrices,
    MarketStatus,
    ClientResponse,
    MarketAccounts,
    MarketPricesAndPendingOrders,
    createOrder,
    getMintInfo,
} from "@monaco-protocol/client";
import { BN, Program } from "@project-serum/anchor";
import { PublicKey } from "@solana/web3.js";
import { Message, MessageEmbed } from "discord.js";
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

export const getMarkets = async (token: string, message: Message) => {
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));
    const marketsResponse: ClientResponse<MarketAccounts> =
        await getMarketAccountsByStatusAndMintAccount(
            program,
            marketsStatus,
            new PublicKey(token)
        );

    const embed = new MessageEmbed();
    embed.setColor('#ff0062')
        .setTitle('Market Outcomes')
        .setDescription(`These are the latest market outcomes of **${getKeyByValue(TOKENLIST, token)}**`)
        .setTimestamp()
    message.edit({ embeds: [embed] });
    if (marketsResponse.success && marketsResponse.data?.markets?.length) {

        const marketsWithOutcomes = marketsResponse.data.markets.filter(
            (market) => market.account.marketOutcomesCount > 0
        ).filter((market) => market.account.marketLockTimestamp.toNumber() > new Date())

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
            const formattedString = `For Outcome Price: \`${marketData.prices.forOutcomePrice}\`\nTo Outcome Price: \`${marketData.prices.againstOutcomePrice}\`\nAddress: \`${marketData.pk}\`\n[View on Solscan](https://solscan.io/account/${marketData.pk})`;
            embed.addField(
                `${marketData.prices.marketOutcome} vs ${marketData.prices.marketOutcomeAgainst}`,
                formattedString
            )
            await message.edit({ embeds: [embed] });
        }
    } else {
        await message.edit({ embeds: [embed.setDescription('No markets found')] })
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


export const placeBet = async (
    marketPk: PublicKey,
    type: "for" | "against",
    amount: number,
    marketData: any,
) => {
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));
    const mintInfo = await getMintInfo(program, marketData.marketData.account.mintAccount)
    const stakeInteger = new BN(amount * 10 ** mintInfo.data.decimals);

    console.log(
        marketPk,
        marketData.prices.marketOutcomeIndex,
        type == "for" ? true : false,
        marketData.prices.forOutcomePrice,
        stakeInteger
    )
    try {
        const createOrderResponse = await createOrder(
            program,
            new PublicKey(marketPk),
            marketData.prices.marketOutcomeIndex,
            type == "for" ? true : false,
            marketData.prices.forOutcomePrice,
            stakeInteger
        );
        return createOrderResponse
    } catch (e) {
        console.error("Error: ", e);
    }
};