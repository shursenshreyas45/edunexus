import { test, describe } from 'node:test';
import * as assert from 'node:assert';
import { hashPassword, verifyPassword } from '../src/middleware/authUtils';

describe('Auth Utilities', () => {
    test('successfully hashes and verifies a valid password', async () => {
        const password = 'SuperSecret123!';
        const hash = await hashPassword(password);

        assert.ok(hash.includes(':'), 'Hash should contain a salt separator');

        const isValid = await verifyPassword(password, hash);
        assert.strictEqual(isValid, true, 'Verification should return true for correct password');
    });

    test('fails verification with an incorrect password', async () => {
        const password = 'SuperSecret123!';
        const hash = await hashPassword(password);

        const isValid = await verifyPassword('WrongPassword!', hash);
        assert.strictEqual(isValid, false, 'Verification should return false for incorrect password');
    });

    test('throws error when hashing an empty password string', async () => {
        await assert.rejects(
            async () => await hashPassword(''),
            { message: 'Password cannot be empty' }
        );
    });

    test('fails verification when password string is empty', async () => {
        const hash = await hashPassword('ValidPassword');
        const isValid = await verifyPassword('', hash);
        assert.strictEqual(isValid, false, 'Empty password should fail verification');
    });

    test('fails verification with malformed hash missing colon', async () => {
        const isValid = await verifyPassword('AnyPassword', 'malformedhashwithoutcolon');
        assert.strictEqual(isValid, false, 'Malformed hash should fail verification safely');
    });

    // CRITICAL FIX TEST: Verifies timingSafeEqual length mismatch is handled safely
    test('fails verification cleanly with incorrect key length in hash', async () => {
        const password = 'SuperSecret123!';
        // Construct a fake hash with a 63-byte key instead of 64-byte
        const fakeHash = 'somesalt:' + Buffer.alloc(63, 'a').toString('hex');

        const isValid = await verifyPassword(password, fakeHash);
        assert.strictEqual(isValid, false, 'Should fail safely on mismatched buffer lengths');
    });
});
