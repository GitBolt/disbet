import { ColorResolvable } from "discord.js"

export const EMOJIS = {
    loading: '<a:Loading:854065859667165235>',
    sol: '<:sol:1068303727234125824>',
}

export const COLORS: { [key: string]: ColorResolvable } = {
    default: "#fc036f",
    success: "#20fc03",
    error: "#fc0303",
    warning: "#fc8403"
}

export const TOKENLIST: {
    [key: string]: string
} = {
    USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    UXD: '7kbnvuGBxxj8AG9qp8Scn56muWGaRaFqxg1FsRp3PaFT',
    RAY: '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R',
    SBR: 'Saber2gLauYim4Mvftnrasomsv6NvAuncvMEZwcLpD1',
    SLND: 'SLNDpmoWTVADgEdndyvWzroNL7zSi1dF9PC3xHGtPwp',
    C98: 'C98A4nkJXhpVZNAZdHUA95RpTF3T4whtQubL3YobiUX9',
    DUST: 'DUSTawucrTsGU8hcqRdHDCbuYhCPADMLM2VcCb8VnFnQ',
    SOL: 'So11111111111111111111111111111111111111112',
    FIDA: 'EchesyfXePKdLtoiZSL8pBe8Myagyy8ZRqsACNCFGnvp',
    ORCA: 'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE'
}

export const TOKENLISTURL = "https://raw.githubusercontent.com/solana-labs/token-list/main/src/tokens/solana.tokenlist.json"

export const SPORTS = [
    "League of Legends",
    "Ice Hockey",
    "Football",
    "Cricket",
    "American Football",
    "DOTA",
    "Baseball",
    "Basketball",
    "Rugby",
    "Tennis",
    "Boxing"
]