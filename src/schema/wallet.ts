import mongoose from 'mongoose'

const Schema = new mongoose.Schema({
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

const Wallet = mongoose.model('Wallet', Schema)

export { Wallet }