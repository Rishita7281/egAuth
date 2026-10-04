const crypto = require('crypto');
const { createCanvas, loadImage } = require('canvas');
const jsQR = require('jsqr');
const { decrypt } = require('../functions/aes/crypt');
const Employee = require('../database/schemas/EmployeeSchema');
const { ensureKeyBundleReady, getKeyBundle } = require('../functions/retriveKey');
const bcrypt = require('bcrypt');
const Scans = require('../database/schemas/PastScanSchema');
const { QR_TTL_MS } = require('../functions/qr/employeeQr');
const { sendErrorResponse } = require('../../shared/http/errors');

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function createHttpError(message, status) {
    const error = new Error(message);
    error.status = status;
    return error;
}

async function extractQrDataFromImage(imageData) {
    if (!imageData) {
        throw createHttpError('imageData is required', 400);
    }

    const normalized = imageData.trim();
    const dataUriMatch = normalized.match(/^data:image\/[a-zA-Z0-9+.-]+;base64,(.+)$/);
    const base64Payload = dataUriMatch ? dataUriMatch[1] : normalized;
    const imageBuffer = Buffer.from(base64Payload, 'base64');

    if (!imageBuffer.length) {
        throw createHttpError('Uploaded image is empty or invalid.', 400);
    }

    if (imageBuffer.length > MAX_IMAGE_BYTES) {
        throw createHttpError('Uploaded image is too large. Use an image smaller than 5 MB.', 413);
    }

    let image;
    try {
        image = await loadImage(imageBuffer);
    } catch (error) {
        throw createHttpError('Uploaded file is not a readable image.', 400);
    }

    const canvas = createCanvas(image.width, image.height);
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0, image.width, image.height);

    const pixels = context.getImageData(0, 0, image.width, image.height);
    const qrResult = jsQR(new Uint8ClampedArray(pixels.data), image.width, image.height, {
        inversionAttempts: 'attemptBoth',
    });

    const qrData = qrResult?.data?.trim();
    if (!qrData) {
        throw createHttpError('No QR code found in the uploaded image.', 400);
    }

    return qrData;
}

async function resolveQrData(body) {
    if (body.qrData) {
        return body.qrData.trim();
    }

    if (body.imageData) {
        return extractQrDataFromImage(body.imageData);
    }

    throw createHttpError('Either qrData or imageData is required.', 400);
}

async function verifyQrData(qrData, UserID) {
    const keyReady = await ensureKeyBundleReady();
    if (!keyReady) {
        throw createHttpError('Encryption key not ready yet', 503);
    }

    const bundles = getKeyBundle();

    if (!bundles.length) {
        throw createHttpError('Encryption key not ready yet', 503);
    }

    let payload = null;
    let usedKeyId = null;
    let usedKey = null;

    for (const bundle of bundles) {
        try {
            const decrypted = await decrypt(qrData, bundle.key, bundle.iv);
            const parsed = JSON.parse(decrypted);
            if (parsed?.keyId && parsed.keyId === bundle.keyId) {
                payload = parsed;
                usedKeyId = bundle.keyId;
                usedKey = bundle.key;
                break;
            }
        } catch (err) {
            // Try next key bundle
        }
    }

    if (!payload) {
        throw createHttpError('Invalid or expired QR code', 400);
    }

    if (!payload.emp || !payload.ts || !payload.qrId || !payload.sig) {
        throw createHttpError('Invalid QR payload', 400);
    }
    if (payload.keyId !== usedKeyId || !usedKey) {
        throw createHttpError('Invalid QR key', 400);
    }

    const payloadBase = { keyId: payload.keyId, qrId: payload.qrId, emp: payload.emp, ts: payload.ts };
    const expectedSig = crypto.createHmac('sha256', usedKey)
        .update(JSON.stringify(payloadBase))
        .digest('hex');
    if (expectedSig !== payload.sig) {
        throw createHttpError('Invalid QR signature', 400);
    }

    const empData = payload.emp;
    const currentTime = new Date();
    const qrTime = new Date(payload.ts);
    if (Number.isNaN(qrTime.getTime())) {
        throw createHttpError('Invalid QR timestamp', 400);
    }

    const ageMs = currentTime.getTime() - qrTime.getTime();
    const allowedSkewMs = 2 * 60 * 1000;
    if (qrTime.getTime() > currentTime.getTime() + allowedSkewMs) {
        throw createHttpError('QR timestamp is in the future', 400);
    }
    if (ageMs > QR_TTL_MS) {
        throw createHttpError('QR code expired', 400);
    }

    const existingScan = await Scans.findOne({ qrId: payload.qrId });
    if (existingScan) {
        throw createHttpError('QR code already used', 409);
    }

    const emp = await Employee.findOne({ EmpID: empData.EmpID });
    if (!emp) {
        throw createHttpError('Employee not found', 404);
    }
    if (emp.EmpActive === false) {
        throw createHttpError('Employee account is inactive', 403);
    }

    const scanID = bcrypt.hashSync(UserID + empData.EmpID + currentTime.toISOString(), 10);

    const scanRecord = new Scans({
        ScanID: scanID,
        qrId: payload.qrId,
        keyId: usedKeyId,
        UserID,
        scannerId: UserID,
        EmpID: empData.EmpID,
        EmpName: empData.EmpName || emp.EmpName || '',
        EmpDeptID: emp.EmpDeptID,
        EmpDeptName: empData.EmpDeptName || emp.EmpDeptName || '',
        EmpSignature: empData.EmpSignature,
        expiresAt: new Date(qrTime.getTime() + QR_TTL_MS),
        usedAt: currentTime,
    });

    try {
        await scanRecord.save();
    } catch (err) {
        if (err && err.code === 11000) {
            throw createHttpError('QR code already used', 409);
        }
        throw err;
    }

    return scanRecord;
}

const userScan = async (req, res) => {
    try {
        const { id: UserID } = req.user;
        const qrData = await resolveQrData(req.body);
        const scanRecord = await verifyQrData(qrData, UserID);
        return res.status(200).json({ scanRecord, qrData });
    } catch (error) {
        console.error('Error in userScan:', error);
        return sendErrorResponse(res, error);
    }
};

module.exports = { userScan };
