import {
    getMarketAccountsByStatusAndMintAccount,
    ClientResponse,
    MarketAccounts,
    MarketPricesAndPendingOrders,
    createOrder,
    getMintInfo,
    getMarket,
    MarketStatusFilter,
    ResponseFactory,
    getPendingOrdersForMarket,
    getMarketOutcomesByMarket,
    getMarketPricesWithMatchingPoolsFromOrders,
    PendingOrders,
    Orders,
    OrderStatusFilter,
    MarketOutcomes,
} from "@monaco-protocol/client";
import { BN, Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { EmbedBuilder, ChatInputCommandInteraction, ButtonBuilder, ButtonStyle, ActionRowBuilder, Interaction } from "discord.js";
import { TOKENLIST } from "./constants";
import { embedBuilder, getKeyByValue, getProgram } from "./utils";


export async function getMarketPrices(
    program: Program,
    marketPk: PublicKey,
): Promise<ClientResponse<MarketPricesAndPendingOrders>> {
    const response = new ResponseFactory({} as MarketPricesAndPendingOrders);

    console.log("Fetching pending orders...")
    const openOrdersResponse = await new Orders(program)
        .filterByMarket(marketPk)
        .filterByStatus(OrderStatusFilter.Open)
        .fetch()
    console.log("Fetching market outcomes orders...")
    const marketOutcomes = await MarketOutcomes.marketOutcomeQuery(program)
        .filterByMarket(marketPk)
        .fetch();

    console.log("Completed fetching")

    if (!marketOutcomes.success) {
        response.addErrors(marketOutcomes.errors);
        return response.body;
    }

    const pendingOrders = openOrdersResponse.data.orderAccounts
    const marketOutcomeTitles = marketOutcomes.data.marketOutcomeAccounts.map(
        (market) => market.account.title,
    );

    const marketPrices = await getMarketPricesWithMatchingPoolsFromOrders(
        program,
        marketPk,
        pendingOrders,
        marketOutcomeTitles,
    );

    response.addResponseData({
        pendingOrders: pendingOrders,
        marketPrices: marketPrices.data.marketPrices,
        marketOutcomeAccounts: marketOutcomes.data.marketOutcomeAccounts,
    });

    return response.body;
}

export const getMarketOutcomePriceData = async (
    program: Program,
    marketPk: PublicKey
) => {

    console.log("Fetching market prices for ", marketPk.toBase58(), " ...")
    let marketPricesResponse: ClientResponse<MarketPricesAndPendingOrders> =
        await getMarketPrices(program, marketPk);
    console.log("Market price response: ", marketPricesResponse)

    if (!marketPricesResponse.success || marketPricesResponse.data.pendingOrders.length == 0) {
        return null
    }

    if (marketPricesResponse.data) {
        const moreData = getBestMarketOutcomeWithOdd(marketPricesResponse.data);
        return moreData
    }
    return null;
};

const marketsStatus = MarketStatusFilter.Open

export const getMarkets = async (token: string, interaction: ChatInputCommandInteraction) => {
    console.log("Fetching markets...")
    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'));

    const marketsResponse: ClientResponse<MarketAccounts> =
        await getMarketAccountsByStatusAndMintAccount(
            program,
            marketsStatus,
            new PublicKey(token)
        );
    const currentTime = +new Date() / 1000

    const marketsWithOutcomes = marketsResponse.data.markets.filter(
        (market) => market.account.marketOutcomesCount > 0
    ).filter((market) => market.account.marketLockTimestamp.toNumber() > currentTime - 60) // getting one min older


    const embed = new EmbedBuilder();
    embed.setColor('#ff0062')
        .setTitle('Market Outcomes')
        .setDescription(`These are the latest market outcomes of **${getKeyByValue(TOKENLIST, token)}**`)
        .setTimestamp()

    const nextButton = new ButtonBuilder()
        .setCustomId('next')
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary);

    const prevButton = new ButtonBuilder()
        .setCustomId('prev')
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder().addComponents(prevButton, nextButton);

    if (!marketsResponse.success || !marketsResponse.data?.markets?.length) {
        await interaction.editReply({ embeds: [embed.setDescription('Looks empty in here')], content: "No markets found" })
        return
    }
    await interaction.editReply({ embeds: [embed], content: "Loading..." });

    const embeds = []
    let page = 1

    await embedBuilder(embed, interaction, marketsWithOutcomes, row, page)

    embeds.push(embed)

    const collectorFilter = (i: Interaction) => i.user.id === interaction.user.id;
    try {
        const collector = interaction.channel.createMessageComponentCollector({ filter: collectorFilter, time: 120000 });

        collector.on('collect', async (i) => {
            if (i.customId == "next") {
                i.reply({ content: "Fetching next page...", ephemeral: true })
                page += 1
                const newItems = marketsWithOutcomes.slice((page - 1) * 3, marketsWithOutcomes.length)
                console.log("New page: ", page, "Total Length: ", marketsWithOutcomes.length, (page - 1) * 3, marketsWithOutcomes.length)
                if (page > embeds.length) {
                    embed.setFields([])
                    console.log(embed.data)
                    const newEmbed = await embedBuilder(embed, interaction, newItems, row, page)
                    embeds.push(newEmbed)
                } else {
                    await interaction.editReply("Something is sus")
                }
            } else if (i.customId == "prev") {
                console.log("Prev page: ", page - 1, "EM l: ", embeds.length)
                if ((page - 1) > embeds.length) {
                    await interaction.followUp({ content: "You are going too much back! :)", ephemeral: true })
                } else {
                    page -= 1
                    await interaction.editReply({ content:`Page: ${page}`, embeds: [embeds[page-1]] })
                }

            }
        })
    } catch (e) {
        console.log(e)
        await interaction.editReply({ content: 'Confirmation not received within 1 minute, cancelling', components: [] });
    }

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
    sk: Uint8Array
) => {

    const program = await getProgram(new PublicKey('monacoUXKtUi6vKsQwaLyxmXKSievfNWEcYXTgkbCih'), sk);

    const marketData = await getMarket(program, new PublicKey(marketPk))
    const mintInfo = await getMintInfo(program, marketData.data.account.mintAccount)
    const stakeInteger = new BN(amount * 10 ** mintInfo.data.decimals);
    let marketPricesData = await getMarketOutcomePriceData(program, new PublicKey(marketPk));

    if (!marketPricesData || !marketData.success) {
        return undefined
    }

    try {
        console.log({
            pk: new PublicKey(marketPk),
            indx: marketPricesData.marketOutcomeIndex,
            for: type == "for" ? true : false,
            price: type == "for" ? marketPricesData.forOutcomePrice : marketPricesData.againstOutcomePrice,
            stakeInteger: stakeInteger.toNumber()
        })
        const data = await createOrder(
            program,
            new PublicKey(marketPk),
            marketPricesData.marketOutcomeIndex,
            type == "for" ? true : false,
            type == "for" ? marketPricesData.forOutcomePrice : marketPricesData.againstOutcomePrice,
            stakeInteger
        );

        console.log("Order Res: ", data)
        return { data, marketPricesData }
    } catch (e: any) {
        console.log("Error creating order: ", e.errors.toString())
        return { error: true, data: e.toString() }
    }
};