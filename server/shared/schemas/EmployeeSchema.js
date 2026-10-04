const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
    EmpID: { type: String, required: true, unique: true },
    EmpName: { type: String, required: true },
    EmpDeptID: { type: String, required: true },
    EmpDeptName: { type: String, required: true },
    EmpSignature: { type: String, default: '' },
    EmpPassword: { type: String, required: true },
    EmpContact: { type: String, required: true },
    EmpDesignation: { type: String, required: true },
    EmpPosting: { type: String, required: true },
    EmpActive: { type: Boolean, default: true },
    EmpCreatedBy: { type: String, default: '' },
}, { timestamps: true });

module.exports= mongoose.model('Employee', EmployeeSchema);
