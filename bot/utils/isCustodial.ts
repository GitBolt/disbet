import { Wallet } from "../schema/wallet"

export const isCustodial = async (id: string) => {
    const wallet = await Wallet.findOne({ discord_id: id })
    return wallet!.custodial
}