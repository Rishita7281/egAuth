const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Employee = require('../database/schemas/EmployeeSchema'); 
const { logAudit } = require('../functions/audit');
const { sendErrorResponse } = require('../../shared/http/errors');


const addEmployee = async (req, res) => {
    try {
        const { 
            EmpID, 
            EmpName, 
            EmpPassword, 
            EmpContact, 
            EmpDesignation, 
            EmpPosting 
        } = req.body;
        
         const { EmpDeptID, 
            EmpDeptName } = req.user;
      
        if (!EmpID || !EmpName || !EmpPassword || !EmpContact || !EmpDesignation || !EmpPosting) {
            return res.status(400).json({ error: 'All fields are required except EmpSignature' });
        }

        
        const existingEmployee = await Employee.findOne({ EmpID });
        if (existingEmployee) {
            return res.status(400).json({ error: 'Employee ID already exists' });
        }

        
        const hashedPass = await bcrypt.hash(EmpPassword, 10);

         
        const newEmployee = new Employee({
            EmpID,
            EmpName,
            EmpDeptID,
            EmpDeptName,
            EmpSignature: '', 
            EmpPassword: hashedPass,
            EmpContact,
            EmpDesignation,
            EmpPosting,
            EmpActive: true,
            EmpCreatedBy: EmpDeptID,
        });

        await newEmployee.save();

        return res.status(201).json({
            message: 'Employee added successfully',
            employee: {
                EmpID: newEmployee.EmpID,
                EmpName: newEmployee.EmpName,
                EmpDeptID: newEmployee.EmpDeptID,
                EmpDeptName: newEmployee.EmpDeptName,
                EmpSignature: newEmployee.EmpSignature,
                EmpContact: newEmployee.EmpContact,
                EmpDesignation: newEmployee.EmpDesignation,
                EmpPosting: newEmployee.EmpPosting,
                EmpActive: newEmployee.EmpActive,
                EmpCreatedBy: newEmployee.EmpCreatedBy,
            },
        });
    } catch (error) {
        console.error('Error adding employee:', error);
        return sendErrorResponse(res, error);
    }
};

// View Employees
const viewEmployee = async (req, res) => {
    try {
        // Fetch all employees from the database
        const {EmpDeptID}=req.user
        const allEmployees = await Employee.find({ EmpDeptID }, { EmpPassword: 0 });
        
        res.status(200).json({ employees: allEmployees });
    } catch (err) {
        console.error('Error fetching employees:', err);
        return sendErrorResponse(res, err);
    }
};

const updateEmployee = async (req, res) => {
    try {
        const { EmpDeptID } = req.user;
        const {
            EmpID,
            EmpName,
            EmpContact,
            EmpDesignation,
            EmpPosting,
            EmpSignature
        } = req.body;

        if (!EmpID) {
            return res.status(400).json({ error: 'EmpID is required' });
        }

        const update = {};
        if (EmpName) update.EmpName = EmpName;
        if (EmpContact) update.EmpContact = EmpContact;
        if (EmpDesignation) update.EmpDesignation = EmpDesignation;
        if (EmpPosting) update.EmpPosting = EmpPosting;
        if (EmpSignature !== undefined) update.EmpSignature = EmpSignature;

        const employee = await Employee.findOneAndUpdate(
            { EmpID, EmpDeptID },
            { $set: update },
            { new: true }
        ).select('-EmpPassword');

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.status(200).json({ message: 'Employee updated successfully', employee });
    } catch (error) {
        console.error('Error updating employee:', error);
        return sendErrorResponse(res, error);
    }
};

const deleteEmployee = async (req, res) => {
    try {
        const { EmpDeptID } = req.user;
        const { EmpID } = req.body;

        if (!EmpID) {
            return res.status(400).json({ error: 'EmpID is required' });
        }

        const employee = await Employee.findOneAndDelete({ EmpID, EmpDeptID });
        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        await logAudit({
            action: 'delete_employee',
            targetType: 'Employee',
            targetId: EmpID,
            actorId: EmpDeptID,
        });

        return res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        console.error('Error deleting employee:', error);
        return sendErrorResponse(res, error);
    }
};

const setEmployeeStatus = async (req, res) => {
    try {
        const { EmpDeptID } = req.user;
        const { EmpID, EmpActive } = req.body;

        if (!EmpID || EmpActive === undefined) {
            return res.status(400).json({ error: 'EmpID and EmpActive are required' });
        }

        const employee = await Employee.findOneAndUpdate(
            { EmpID, EmpDeptID },
            { $set: { EmpActive: Boolean(EmpActive) } },
            { new: true }
        ).select('-EmpPassword');

        if (!employee) {
            return res.status(404).json({ error: 'Employee not found' });
        }

        return res.status(200).json({ message: 'Employee status updated', employee });
    } catch (error) {
        console.error('Error updating employee status:', error);
        return sendErrorResponse(res, error);
    }
};

module.exports = { addEmployee, viewEmployee, updateEmployee, deleteEmployee, setEmployeeStatus };
