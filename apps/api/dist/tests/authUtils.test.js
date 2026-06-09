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
const node_test_1 = require("node:test");
const assert = __importStar(require("node:assert"));
const authUtils_1 = require("../src/middleware/authUtils");
(0, node_test_1.describe)('Auth Utilities', () => {
    (0, node_test_1.test)('successfully hashes and verifies a valid password', async () => {
        const password = 'SuperSecret123!';
        const hash = await (0, authUtils_1.hashPassword)(password);
        assert.ok(hash.includes(':'), 'Hash should contain a salt separator');
        const isValid = await (0, authUtils_1.verifyPassword)(password, hash);
        assert.strictEqual(isValid, true, 'Verification should return true for correct password');
    });
    (0, node_test_1.test)('fails verification with an incorrect password', async () => {
        const password = 'SuperSecret123!';
        const hash = await (0, authUtils_1.hashPassword)(password);
        const isValid = await (0, authUtils_1.verifyPassword)('WrongPassword!', hash);
        assert.strictEqual(isValid, false, 'Verification should return false for incorrect password');
    });
    (0, node_test_1.test)('throws error when hashing an empty password string', async () => {
        await assert.rejects(async () => await (0, authUtils_1.hashPassword)(''), { message: 'Password cannot be empty' });
    });
    (0, node_test_1.test)('fails verification when password string is empty', async () => {
        const hash = await (0, authUtils_1.hashPassword)('ValidPassword');
        const isValid = await (0, authUtils_1.verifyPassword)('', hash);
        assert.strictEqual(isValid, false, 'Empty password should fail verification');
    });
    (0, node_test_1.test)('fails verification with malformed hash missing colon', async () => {
        const isValid = await (0, authUtils_1.verifyPassword)('AnyPassword', 'malformedhashwithoutcolon');
        assert.strictEqual(isValid, false, 'Malformed hash should fail verification safely');
    });
    // CRITICAL FIX TEST: Verifies timingSafeEqual length mismatch is handled safely
    (0, node_test_1.test)('fails verification cleanly with incorrect key length in hash', async () => {
        const password = 'SuperSecret123!';
        // Construct a fake hash with a 63-byte key instead of 64-byte
        const fakeHash = 'somesalt:' + Buffer.alloc(63, 'a').toString('hex');
        const isValid = await (0, authUtils_1.verifyPassword)(password, fakeHash);
        assert.strictEqual(isValid, false, 'Should fail safely on mismatched buffer lengths');
    });
});
