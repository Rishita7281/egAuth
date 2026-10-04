const crypto = require('crypto');
const Employee = require('../../database/schemas/EmployeeSchema');
const { ensureKeyBundleReady, getKey, getIV, getKeyId } = require('../retriveKey');
const { encrypt } = require('../aes/crypt');
const { generateQR } = require('./qr');

const QR_TTL_MS = 5 * 60 * 1000;

async function buildEmployeeQr(empId) {
    const keyReady = await ensureKeyBundleReady();
    if (!keyReady) {
        const err = new Error('Encryption key not ready yet');
        err.status = 503;
        throw err;
    }

    const key = getKey();
    const iv = getIV();
    const keyId = getKeyId();
    if (!key || !iv) {
        const err = new Error('Encryption key not ready yet');
        err.status = 503;
        throw err;
    }
    if (!keyId) {
        const err = new Error('Key identifier not available');
        err.status = 503;
        throw err;
    }

    const employeeData = await Employee.findOne({ EmpID: empId });
    if (!employeeData) {
        const err = new Error('Employee not found');
        err.status = 404;
        throw err;
    }
    if (employeeData.EmpActive === false) {
        const err = new Error('Employee account is inactive');
        err.status = 403;
        throw err;
    }

    const currentTime = new Date().toISOString();
    const safeEmployee = {
        EmpID: employeeData.EmpID,
        EmpName: employeeData.EmpName,
        EmpDeptID: employeeData.EmpDeptID,
        EmpDeptName: employeeData.EmpDeptName,
        EmpSignature: employeeData.EmpSignature,
        EmpDesignation: employeeData.EmpDesignation,
        EmpPosting: employeeData.EmpPosting,
    };

    const qrId = crypto.randomUUID();
    const payloadBase = { keyId, qrId, emp: safeEmployee, ts: currentTime };
    const signature = crypto.createHmac('sha256', key).update(JSON.stringify(payloadBase)).digest('hex');
    const payload = JSON.stringify({ ...payloadBase, sig: signature });
    const qrData = encrypt(payload, key, iv);
    const qrCode = await generateQR(qrData);

    return {
        qrCode,
        qrData,
        expiresAt: new Date(Date.parse(currentTime) + QR_TTL_MS).toISOString(),
        qrId,
        keyId,
    };
}

module.exports = { buildEmployeeQr, QR_TTL_MS };
