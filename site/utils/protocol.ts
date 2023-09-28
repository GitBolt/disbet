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
    createOrderUiStake,
} from "@monaco-protocol/client";
import { PublicKey } from "@solana/web3.js";
import { TOKENLIST } from "./constants";
import { getKeyByValue, getProgram } from "./utils";
import { BN } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Program as SerumProgram } from '@project-serum/anchor'

export const getMarketOutcomePriceData = async (
    program: SerumProgram,
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
    wallet: NodeWallet
) => {

    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'), wallet);

    const marketData = await getMarket(program, new PublicKey(marketPk))
    const mintInfo = await getMintInfo(program, marketData.data.account.mintAccount)
    const stakeInteger = new BN(amount * 10 ** mintInfo.data.decimals);
    let marketPricesData = await getMarketOutcomePriceData(program, new PublicKey(marketPk));

    if (!marketPricesData || !marketData.success) {
        return undefined
    }

    try {
        const data = await createOrderUiStake(
            program,
            new PublicKey(marketPk),
            marketPricesData.marketOutcomeIndex,
            type == "for" ? true : false,
            marketPricesData.forOutcomePrice,
            stakeInteger
        );
        return { data, marketPricesData }
    } catch (e: any) {
        console.log("Error creating order: ", e.toString())
        return { error: true, data: e.toString() }
    }
};

