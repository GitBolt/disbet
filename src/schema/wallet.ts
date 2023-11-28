import mongoose from 'mongoose'

const WalletScheme = new mongoose.Schema({
    custodial: {
        type: Boolean,
        required: true,
        default: true,
    },
    discord_id: {
        type: Number,
        required: true,
        unique: true,
    },
    publicKey: {
        type: String,
        required: false,
        unique: false
    },
    privateKey: {
        type: Buffer,
        required: false,
        unique: false
    },
})

const Wallet = mongoose.model('Wallet', WalletScheme)

const BetScheme = new mongoose.Schema({
    stake_amount: {
        type: Number,
        required: true,
    },
    type: {
        type: String,
        required: true,
        unique: false,
    },
    market_address: {
        type: String,
        required: true,
        unique: false
    },
    user_id: {
        type: String,
        required: true,
        unique: false
    },
    date_added: {
        type: Date,
        default: Date.now 
    }
});

const Bet = mongoose.model('Bet', BetScheme)


export { Wallet, Bet }