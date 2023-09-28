export const sendPlaceBetURL = async (
    marketPk: string,
    type: "for" | "against",
    amount: number
) => {

    const data = {
        marketPk,
        type,
        amount,
        transaction_type: "placeBet"
    }

    const encoded = Buffer.from(JSON.stringify(data)).toString('base64')

    return "http://localhost:3000/sign/"  + encoded
}