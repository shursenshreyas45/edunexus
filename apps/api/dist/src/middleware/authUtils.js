"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.hashPassword = hashPassword;
exports.verifyPassword = verifyPassword;
const crypto = __importStar(require("crypto"));
const SALT_LENGTH = 16;
const KEY_LENGTH = 64;
async function hashPassword(password) {
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
async function verifyPassword(password, hash) {
    if (!password || !hash)
        return false;
    const parts = hash.split(':');
    if (parts.length !== 2)
        return false;
    const [salt, key] = parts;
    if (!salt || !key)
        return false;
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
