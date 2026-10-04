const crypto = require('crypto');

const encryptWithRSA = (plaintext) => {
    try {
        const rawKey = process.env.RSAPUBLIC;
        const publicKey = rawKey ? rawKey.replace(/\\n/g, '\n') : null;
        if (!publicKey) {
            throw new Error('RSA public key is missing');
        }

        const encrypted = crypto.publicEncrypt(
            {
                key: publicKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING, // Using OAEP padding
            },
            Buffer.from(plaintext, 'utf-8')
        );

        return encrypted.toString('base64'); // Convert to Base64 for safe transmission
    } catch (err) {
        console.error('Error encrypting data:', err.message);
        throw new Error('Encryption failed');
    }

};




module.exports = { encryptWithRSA };
