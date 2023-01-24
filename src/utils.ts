import { PublicKey, Connection } from "@solana/web3.js";
import { AnchorProvider, setProvider, Program, utils, web3, Wallet } from "@project-serum/anchor";
import {
    ProtocolAddresses,
    MarketStatus,
    OrderStatus,
    ClientResponse
} from "@monaco-protocol/client";

export async function getProgram(protocolAddress: PublicKey) {
    const provider = AnchorProvider.env();
    setProvider(provider);
    const program = await Program.at(protocolAddress, provider);
    return program
}

export function log(log: any) {
    console.log(log);
}

export function logJson(json: object) {
    console.log(JSON.stringify(json, null, 2));
}

export function logResponse(response: ClientResponse<{}>) {
    if (!response.success) {
        log(response.errors);
    } else {
        logJson(response);
    }
}

export const getKeyByValue = (object: any, value: any) => {
    return Object.keys(object).find(key => object[key] === value);
}

export function marketStatusFromString(status: string) {
    switch (status) {
        case "open":
            return MarketStatus.Open;
        case "locked":
            return MarketStatus.Locked;
        case "settled":
            return MarketStatus.Settled;
        case "complete":
            return MarketStatus.Complete;
        case "readyForSettlement":
            return MarketStatus.ReadyForSettlement;
        case "initializing":
            return MarketStatus.Initializing;
        default:
            throw "Available market statuses: open, locked, settled, complete, readyForSettlement, initializing";
    }
}

export function orderStatusFromString(status: string) {
    switch (status) {
        case "open":
            return OrderStatus.Open;
        case "matched":
            return OrderStatus.Matched;
        case "settledWin":
            return OrderStatus.SettledWin;
        case "settledLose":
            return OrderStatus.SettledLose;
        case "cancelled":
            return OrderStatus.Cancelled;
        default:
            throw "Available order statuses: open, matched, settledWin, settledLose, cancelled";
    }
}