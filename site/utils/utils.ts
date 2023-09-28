import { AnchorProvider, BN, setProvider } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { Program } from '@project-serum/anchor';

export async function getProgram(protocolAddress: PublicKey, wallet: NodeWallet) {
    const RPC_URL = "https://solana-mainnet.g.alchemy.com/v2/DBttxukNil1Us0M605rbiUwEnG9zRW4G"
    const connection = new Connection(RPC_URL)
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


export const truncatedPublicKey = (publicKey: string, length?: number) => {
    if (!publicKey) return;
    if (!length) {
      length = 5;
    }
    return publicKey.replace(publicKey.slice(length, 44 - length), '...');
  };