const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Department=require('../database/schemas/DeptSchema')
const User = require('../database/schemas/UserSchema');
const Employee = require('../database/schemas/EmployeeSchema');
const Scans = require('../database/schemas/PastScanSchema');
const { logAudit } = require('../functions/audit');
const { sendErrorResponse } = require('../../shared/http/errors');


const addDept = async (req, res) => {
    try {
        const { DeptName, DeptPass, DeptID } = req.body;

        if (!DeptName || !DeptPass || !DeptID) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        const existingDept = await Department.findOne({ DeptID });
        if (existingDept) {
            return res.status(400).json({ error: 'Department ID already exists' });
        }

       
        const hashedPass = await bcrypt.hash(DeptPass, 10);

       
        const newDepartment = new Department({
            DeptName,
            DeptPass: hashedPass,
            DeptID,
            DeptCreatedBy: req.user?.id || '',
        });

        await newDepartment.save();

        return res.status(201).json({
            message: 'Department added successfully',
            department: {
                DeptID: newDepartment.DeptID,
                DeptName: newDepartment.DeptName,
                DeptCreatedBy: newDepartment.DeptCreatedBy,
            },
        });
    } catch (error) {
        console.error('Error adding department:', error);
        return sendErrorResponse(res, error);
    }
};


const viewDept = async (req, res) => {
    try {
        
        const allDept = await Department.find({}, { DeptPass: 0 });
        
        
        res.status(200).json({ departments: allDept });
    } catch (err) {
        console.error('Error fetching departments:', err);
        return sendErrorResponse(res, err);
    }
};

 


const updateDept = async (req, res) => {
    try {
        const { DeptID, DeptName, DeptPass } = req.body;
        if (!DeptID) {
            return res.status(400).json({ error: 'DeptID is required' });
        }

        const update = {};
        if (DeptName) update.DeptName = DeptName;
        if (DeptPass) {
            const hashedPass = await bcrypt.hash(DeptPass, 10);
            update.DeptPass = hashedPass;
        }

        if (!Object.keys(update).length) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        const department = await Department.findOneAndUpdate(
            { DeptID },
            { $set: update },
            { new: true }
        ).select('-DeptPass');

        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        return res.status(200).json({ message: 'Department updated successfully', department });
    } catch (error) {
        console.error('Error updating department:', error);
        return sendErrorResponse(res, error);
    }
};

const deleteDept = async (req, res) => {
    try {
        const { DeptID } = req.body;
        if (!DeptID) {
            return res.status(400).json({ error: 'DeptID is required' });
        }

        const department = await Department.findOneAndDelete({ DeptID });
        if (!department) {
            return res.status(404).json({ error: 'Department not found' });
        }

        const employeeResult = await Employee.deleteMany({ EmpDeptID: DeptID });
        const scanResult = await Scans.deleteMany({ EmpDeptID: DeptID });

        await logAudit({
            action: 'delete_department',
            targetType: 'Department',
            targetId: DeptID,
            actorId: req.user?.id || 'admin',
            metadata: { employeesDeleted: employeeResult.deletedCount, scansDeleted: scanResult.deletedCount },
        });

        return res.status(200).json({ message: 'Department deleted successfully' });
    } catch (error) {
        console.error('Error deleting department:', error);
        return sendErrorResponse(res, error);
    }
};

const listUsers = async (req, res) => {
    try {
        const users = await User
            .find({}, { Password: 0 })
            .sort({ createdAt: -1 });
        return res.status(200).json({ users });
    } catch (error) {
        console.error('Error listing users:', error);
        return sendErrorResponse(res, error);
    }
};

const updateUserRole = async (req, res) => {
    try {
        const { UserID, Role } = req.body;
        if (!UserID || !Role) {
            return res.status(400).json({ error: 'UserID and Role are required' });
        }
        if (!['admin', 'user'].includes(Role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const user = await User.findOneAndUpdate(
            { UserID },
            { $set: { Role } },
            { new: true }
        ).select('-Password');

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({ message: 'User role updated', user });
    } catch (error) {
        console.error('Error updating user role:', error);
        return sendErrorResponse(res, error);
    }
};

module.exports = { addDept, viewDept, updateDept, deleteDept, listUsers, updateUserRole };
