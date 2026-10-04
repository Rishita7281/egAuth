const crypto = require('crypto');
const decryptWithRSA = (ciphertext) => {
    try {
        const encryptedBuffer = Buffer.from(ciphertext, 'base64'); // Ensure it's Base64 decoded
        
        const rawKey = process.env.RSAPRIVATE;
        const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : null;
        if (!privateKey) {
            throw new Error('RSA private key is missing');
        }

        const decrypted = crypto.privateDecrypt(
            {
                key: privateKey,
                padding: crypto.constants.RSA_PKCS1_OAEP_PADDING,
            },
            encryptedBuffer
        );

        return decrypted.toString('utf-8'); 
    } catch (err) {
        console.error('Error decrypting data:', err.message);
        throw new Error('Decryption failed');
    }
}; 


module.exports = { decryptWithRSA };
