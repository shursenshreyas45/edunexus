import * as crypto from 'crypto';

const SALT_LENGTH = 16;
const KEY_LENGTH = 64;

export async function hashPassword(password: string): Promise<string> {
    if (!password) {
        throw new Error('Password cannot be empty');
    }

    return new Promise((resolve, reject) => {
        const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
        crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(`${salt}:${derivedKey.toString('hex')}`);
        });
    });
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    if (!password || !hash) return false;

    const parts = hash.split(':');
    if (parts.length !== 2) return false;

    const [salt, key] = parts;
    if (!salt || !key) return false;

    return new Promise((resolve, reject) => {
        crypto.scrypt(password, salt, KEY_LENGTH, (err, derivedKey) => {
            if (err) {
                reject(err);
                return;
            }

            const keyBuffer = Buffer.from(key, 'hex');

            // CRITICAL FIX: Ensure buffers are the exact same length to prevent timingSafeEqual from throwing
            if (keyBuffer.length !== derivedKey.length) {
                resolve(false);
                return;
            }

            resolve(crypto.timingSafeEqual(keyBuffer, derivedKey));
        });
    });
}
