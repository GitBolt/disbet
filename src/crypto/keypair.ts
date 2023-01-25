import * as bip39 from 'bip39';
import * as ed25519 from 'ed25519-hd-key';
import { Keypair } from '@solana/web3.js';

export const generateKeyPair = () => {
    const derivePath = "m/44'/501'/0'/0'";
    const generatedMnemonic = bip39.generateMnemonic();
    const seed = bip39.mnemonicToSeedSync(generatedMnemonic);
    const derivedSeed = ed25519.derivePath(derivePath, seed.toString('hex')).key;
    const keypair = Keypair.fromSeed(derivedSeed);
    return {
        publicKey: keypair.publicKey.toBase58(),
        privateKey: keypair.secretKey,
        generatedMnemonic,
    };
};