const express = require('express');
const { buildEmployeeQr } = require('../functions/qr/employeeQr');
const { sendErrorResponse } = require('../../shared/http/errors');

const genEmp = async (req, res) => {
    try {
        const { EmpID } = req.user;
        const qrPayload = await buildEmployeeQr(EmpID);
        return res.status(200).json(qrPayload);
    } catch (error) {
        console.error('Error in genEmp:', error);
        return sendErrorResponse(res, error);
    }
};

module.exports = { genEmp };
