export const sendPlaceBetURL = async (
    marketPk: string,
    type: "for" | "against",
    amount: number,
    id: string,
) => {

    const data = {
        marketPk,
        type,
        amount,
        transaction_type: "placeBet",
        id
    }

    const encoded = Buffer.from(JSON.stringify(data)).toString('base64')

    return "https://disbet.vercel.app/sign/"  + encoded
}

export const cancelBetURL = async (
    bet_address: string,
) => {

    const data = {
        betAddress: bet_address,
        transaction_type: "cancelBet"
    }

    const encoded = Buffer.from(JSON.stringify(data)).toString('base64')

    return "https://disbet.vercel.app/sign/"  + encoded
}

