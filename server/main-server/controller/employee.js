const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Employee = require('../database/schemas/EmployeeSchema');
const { sendErrorResponse } = require('../../shared/http/errors');


const viewProfile = async (req, res) => {
  try {
    const { EmpID } = req.user;

    if (!EmpID) {
      return res.status(400).json({ error: "Employee ID is required" });
    }

    const empData = await Employee.findOne({ EmpID }).select('-EmpPassword');

    if (!empData) {
      return res.status(404).json({ error: "User not found" });
    }

  
    return res.status(200).json({ data: empData });

  } catch (err) {
    console.error("Error while fetching profile:", err);
    return sendErrorResponse(res, err);
  }
};

const changePassword = async (req, res) => {
  try {
    const { EmpID } = req.user;
    const { CurrentPassword, NewPassword } = req.body;

    if (!CurrentPassword || !NewPassword) {
      return res.status(400).json({ error: "CurrentPassword and NewPassword are required" });
    }

    const employee = await Employee.findOne({ EmpID });
    if (!employee) {
      return res.status(404).json({ error: "Employee not found" });
    }

    const isMatch = await bcrypt.compare(CurrentPassword, employee.EmpPassword);
    if (!isMatch) {
      return res.status(403).json({ error: "Current password is incorrect" });
    }

    const hashedPass = await bcrypt.hash(NewPassword, 10);
    employee.EmpPassword = hashedPass;
    await employee.save();

    return res.status(200).json({ message: "Password updated successfully" });
  } catch (err) {
    console.error("Error updating employee password:", err);
    return sendErrorResponse(res, err);
  }
};


module.exports = {
  viewProfile,
  changePassword,
};
