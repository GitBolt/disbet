import { PublicKey } from "@solana/web3.js";
import { AnchorProvider, setProvider, Program } from "@project-serum/anchor";
import { BN } from "@project-serum/anchor"

export async function getProgram(protocolAddress: PublicKey) {
    const provider = AnchorProvider.env();
    setProvider(provider);
    const program = await Program.at(protocolAddress, provider);
    return program
}

export const parseProtocolNumber = (protocolNumber: BN) =>
    new BN(protocolNumber).toNumber() / 10 ** 9;


export const getKeyByValue = (object: any, value: any) => {
    return Object.keys(object).find(key => object[key] === value);
}
