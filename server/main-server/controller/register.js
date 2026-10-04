const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const User = require('../database/schemas/UserSchema'); 
const Department = require('../database/schemas/DeptSchema');
const { sendErrorResponse } = require('../../shared/http/errors');

const userRegister = async (req, res) => {
    try {
        const { UserID,UserAdhar, UserName, Password, userConfirmPass } = req.body;
        // Intentionally no logging of sensitive credentials.

        if (!UserID || !UserAdhar || !UserName || !Password || !userConfirmPass) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        if (Password !== userConfirmPass) {
            return res.status(400).json({ error: 'Passwords do not match' });
        }

        const isAlready = await User.findOne({ 
           UserAdhar 
          });
            
        if (isAlready) {
            return res.status(400).json({ error: 'User with this Aadhar already exists' });
        }
        const isAlread= await User.findOne({ 
            UserID 
           });

        if (isAlread) {
            return res.status(400).json({ error: 'User with this ID already exists' });
        }
        
        const hashedPassword = await bcrypt.hash(Password, 10);

        
        const newUser = new User({
            UserID,
            UserAdhar,
            UserName,
            Password: hashedPassword,
            Role: 'user',
        });

        await newUser.save();

        return res.status(201).json({
            message: 'User registered successfully',
            user: {
                UserID: newUser.UserID,
                UserName: newUser.UserName,
                UserAdhar: newUser.UserAdhar,
                Role: newUser.Role,
            },
        });
    } catch (err) {
        console.error('Error during user registration:', err);
        return sendErrorResponse(res, err);
    }
};

const deptRegister = async (req, res) => {
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
            DeptCreatedBy: 'self',
        });

        await newDepartment.save();

        return res.status(201).json({
            message: 'Department registered successfully',
            department: {
                DeptID: newDepartment.DeptID,
                DeptName: newDepartment.DeptName,
                DeptCreatedBy: newDepartment.DeptCreatedBy,
            },
        });
    } catch (err) {
        console.error('Error during department registration:', err);
        return sendErrorResponse(res, err);
    }
};

module.exports = { userRegister, deptRegister };
