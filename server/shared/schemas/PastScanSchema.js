const mongoose = require('mongoose');

const ScanSchema = new mongoose.Schema({
    ScanID: { type: String, required: true, unique: true },
    qrId: { type: String, required: true, unique: true },
    keyId: { type: String, required: true },
    UserID: { type: String, required: true },
    scannerId: { type: String, required: true },
    EmpID: { type: String, required: true },
    EmpName: { type: String, default: '' },
    EmpDeptID: { type: String, required: true },
    EmpDeptName: { type: String, default: '' },
    EmpSignature: { type: String, default: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
}, { timestamps: true });

module.exports=mongoose.model('Scans', ScanSchema);
