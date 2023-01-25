import crypto from 'crypto';
import util from 'util';

const randomBytes = util.promisify(crypto.randomBytes);
const pbkdf2 = util.promisify(crypto.pbkdf2);

const cryptAlgo = 'aes-256-gcm';
const digestAlgo = 'sha512';
const iterations = 2000;
const keyLength = 32;
const ivLength = 16;
const saltLength = 64;
const tagLength = 16;
const tagIndex = saltLength + ivLength;
const ciphertextIndex = tagIndex + tagLength;

const getKey = (secret: Buffer, salt: Buffer): Promise<Buffer> => (
    pbkdf2(secret, salt, iterations, keyLength, digestAlgo)
);

export const encrypt = async (plaintext: Buffer, secret: Buffer): Promise<Buffer> => {
    if (!Buffer.isBuffer(plaintext)) throw new TypeError('plaintext must be a buffer');
    if (!Buffer.isBuffer(secret)) throw new TypeError('secret must be a buffer');
    const iv = await randomBytes(ivLength);
    const salt = await randomBytes(saltLength);
    const key = await getKey(secret, salt);
    const cipher = crypto.createCipheriv(cryptAlgo, key, iv);
    const encrypted = Buffer.concat([cipher.update(plaintext), cipher.final()]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]);
}

export const decrypt = async (encrypted: Buffer, secret: Buffer): Promise<Buffer> => {
    if (!Buffer.isBuffer(encrypted)) throw new TypeError('encrypted must be a buffer');
    if (!Buffer.isBuffer(secret)) throw new TypeError('secret must be a buffer');
    const salt = encrypted.slice(0, saltLength);
    const iv = encrypted.slice(saltLength, tagIndex);
    const tag = encrypted.slice(tagIndex, ciphertextIndex);
    const ciphertext = encrypted.slice(ciphertextIndex);
    const key = await getKey(secret, salt);
    const decipher = crypto.createDecipheriv(cryptAlgo, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
}