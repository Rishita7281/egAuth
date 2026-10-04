const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const allscans = require('../database/schemas/PastScanSchema');
const Employee = require('../database/schemas/EmployeeSchema');
const User = require('../database/schemas/UserSchema'); 
const { logAudit } = require('../functions/audit');
const { sendErrorResponse } = require('../../shared/http/errors');

const pastScan = async (req, res) => {
    try {
        const UserID = req.user.id;

        const data = await allscans.find({ UserID }).lean();
        const employeeIds = [...new Set(data.map((scan) => scan.EmpID).filter(Boolean))];
        const employees = employeeIds.length
            ? await Employee.find({ EmpID: { $in: employeeIds } }, { EmpID: 1, EmpName: 1, EmpDeptName: 1, EmpDeptID: 1 }).lean()
            : [];
        const employeeMap = new Map(employees.map((employee) => [employee.EmpID, employee]));
        const scans = data.map((scan) => {
            const employee = employeeMap.get(scan.EmpID) || {};
            return {
                ...scan,
                EmpName: scan.EmpName || employee.EmpName || '',
                EmpDeptName: scan.EmpDeptName || employee.EmpDeptName || '',
                EmpDeptID: scan.EmpDeptID || employee.EmpDeptID || '',
            };
        });

        return res.status(200).json({ scans: scans || [] }); 
    } catch (err) {
        console.error('Error fetching scans:', err);
        return sendErrorResponse(res, err);
    }
};

const userProfile = async (req, res) => {
    try {
       
        const UserID = req.user.id;
        // Intentionally no logging of user identifiers.
        
        const user = await User.findOne({ UserID }).select('-Password');
      
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Return the user details
        res.status(200).json({ user });
    } catch (err) {
        console.error('Error fetching user profile:', err);
        return sendErrorResponse(res, err);
    }
};

const updateUser = async (req, res) => {
    try {
        const UserID = req.user.id;
        const { UserName, UserAdhar, Password, CurrentPassword } = req.body;

        if (!CurrentPassword) {
            return res.status(400).json({ error: 'CurrentPassword is required' });
        }

        const user = await User.findOne({ UserID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(CurrentPassword, user.Password);
        if (!isMatch) {
            return res.status(403).json({ error: 'Current password is incorrect' });
        }

        const update = {};
        if (UserName) update.UserName = UserName;
        if (UserAdhar) update.UserAdhar = UserAdhar;
        if (Password) {
            const hashedPassword = await bcrypt.hash(Password, 10);
            update.Password = hashedPassword;
        }

        if (!Object.keys(update).length) {
            return res.status(400).json({ error: 'No fields provided for update' });
        }

        if (UserAdhar) {
            const existing = await User.findOne({ UserAdhar, UserID: { $ne: UserID } });
            if (existing) {
                return res.status(400).json({ error: 'User with this Aadhar already exists' });
            }
        }

        const updatedUser = await User.findOneAndUpdate(
            { UserID },
            { $set: update },
            { new: true }
        ).select('-Password');

        return res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (err) {
        console.error('Error updating user:', err);
        return sendErrorResponse(res, err);
    }
};

const deleteUser = async (req, res) => {
    try {
        const UserID = req.user.id;
        const { Password } = req.body;

        if (!Password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const user = await User.findOne({ UserID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const isMatch = await bcrypt.compare(Password, user.Password);
        if (!isMatch) {
            return res.status(403).json({ error: 'Password is incorrect' });
        }

        await User.deleteOne({ UserID });

        await logAudit({
            action: 'delete_user',
            targetType: 'User',
            targetId: UserID,
            actorId: UserID,
        });
        return res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        console.error('Error deleting user:', err);
        return sendErrorResponse(res, err);
    }
};

module.exports = {
    pastScan,
    userProfile,
    updateUser,
    deleteUser
};
