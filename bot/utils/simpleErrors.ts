export const simpleErrors = (error: string) => {
    if (error.includes("0x1")) {
        return "You don't have enough balance. Please add more SOL or/and USDT token in your wallet"
    }
    else if (error.includes("0xbc4")) {
        return "A required account is not created yet"
    }
    else if (error.includes("Attempt to debit an account but found no record")) {
        return "You don't have enough SOL"
    } else {
        return error
    }
}