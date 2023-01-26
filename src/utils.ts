import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { AnchorProvider, setProvider, Program } from "@project-serum/anchor";
import { BN } from "@project-serum/anchor"
import CustomWallet from "./wallet";

export async function getProgram(protocolAddress: PublicKey, sk?: Uint8Array) {

    const wallet = CustomWallet.with_private_key(sk || new Keypair().secretKey)
    const connection = new Connection(process.env.RPC_URL as string)
    const provider = new AnchorProvider(connection, wallet, AnchorProvider.defaultOptions())
    setProvider(provider);
    const program = await Program.at(protocolAddress, provider);
    return program
}

export const parseProtocolNumber = (protocolNumber: BN) =>
    new BN(protocolNumber).toNumber() / 10 ** 9;


export const getKeyByValue = (object: any, value: any) => {
    return Object.keys(object).find(key => object[key] === value);
}
