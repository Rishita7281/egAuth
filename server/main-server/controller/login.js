const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const Employee = require('../database/schemas/EmployeeSchema');
const User = require('../database/schemas/UserSchema');
const Department = require('../database/schemas/DeptSchema');
const { sendErrorResponse } = require('../../shared/http/errors');


const JWT_USER_SECRET = process.env.JWT_USER_SECRET;
const JWT_EMP_SECRET = process.env.JWT_EMP_SECRET;
const JWT_DEPT_SECRET = process.env.JWT_DEPT_SECRET;
const JWT_ADMIN_SECRET = process.env.JWT_ADMIN_SECRET;

const createUserTokenResponse = (user) => {
  const isAdmin = user.Role === 'admin' || user.UserID === 'Admin';
  if (isAdmin) {
    const token = jwt.sign({ id: user.UserID, role: 'admin' }, JWT_ADMIN_SECRET, { expiresIn: '1h' });
    return { token, message: 'Login successful' };
  }

  const token = jwt.sign({ id: user.UserID, role: 'user' }, JWT_USER_SECRET, { expiresIn: '1h' });
  return { token, message: 'Login successful' };
};

const createEmployeeTokenResponse = (employee, message = 'Login successful') => {
  const token = jwt.sign({ EmpID: employee.EmpID ,EmpName:employee.EmpName}, JWT_EMP_SECRET, { expiresIn: '1h' });
  return { token, message };
};

const createDepartmentTokenResponse = (department, message = 'Login successful') => {
  const token = jwt.sign({ EmpDeptID: department.DeptID, EmpDeptName: department.DeptName }, JWT_DEPT_SECRET, { expiresIn: '1h' });
  return { token, message };
};

const DEMO_USER_IDS = ['user001', 'user002'];
const DEMO_EMPLOYEE_IDS = ['EMP-1001', 'EMP-1002', 'EMP-2001'];
const DEMO_DEPARTMENT_IDS = ['DPT-001', 'DPT-002'];

const findGuestUser = async () => {
  const preferredUser = await User.findOne({ UserID: { $in: DEMO_USER_IDS }, Role: 'user' }).sort({ UserID: 1 });
  if (preferredUser) {
    return preferredUser;
  }

  return User.findOne({ Role: 'user' }).sort({ UserID: 1 });
};

const findGuestEmployee = async () => {
  const preferredEmployee = await Employee.findOne({ EmpID: { $in: DEMO_EMPLOYEE_IDS }, EmpActive: { $ne: false } }).sort({ EmpID: 1 });
  if (preferredEmployee) {
    return preferredEmployee;
  }

  return Employee.findOne({ EmpActive: { $ne: false } }).sort({ EmpID: 1 });
};

const findGuestDepartment = async () => {
  const preferredDepartment = await Department.findOne({ DeptID: { $in: DEMO_DEPARTMENT_IDS } }).sort({ DeptID: 1 });
  if (preferredDepartment) {
    return preferredDepartment;
  }

  return Department.findOne({}).sort({ DeptID: 1 });
};


const userLogin = async (req, res) => {
  const { UserID, Password } = req.body;

  if (!Password) {
    return res.status(400).json({ message: 'Password is required' });
  }

  try {
    const user = await User.findOne({ UserID });
    if (!user) {
      return res.status(400).json({ message: 'User not found' });
    }

    if (!user.Password) {
      return res.status(400).json({ message: 'Password not set for user' });
    }

    const isMatch = await bcrypt.compare(Password, user.Password);

    if (isMatch) {
      return res.status(200).json(createUserTokenResponse(user));
    }

    return res.status(400).json({ message: 'Incorrect password' });
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, error);
  }
};

const empLogin = async (req, res) => {
  const { EmpID, EmpPassword } = req.body;

  try {
    const employee = await Employee.findOne({ EmpID });
    if (!employee) {
      return res.status(400).json({ message: 'Employee not found' });
    }

   
    if (await bcrypt.compare(EmpPassword, employee.EmpPassword)) {
      if (employee.EmpActive === false) {
        return res.status(403).json({ message: 'Employee account is inactive' });
      }
      return res.status(200).json(createEmployeeTokenResponse(employee));
    }

    return res.status(400).json({ message: 'Incorrect password' });
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, error);
  }
};

const deptLogin = async (req, res) => {
  const { DeptID, DeptPass } = req.body;

  try {
    const department = await Department.findOne({ DeptID });
    if (!department) {
      return res.status(400).json({ message: 'Department not found' });
    }

   
    if (await bcrypt.compare(DeptPass, department.DeptPass)) {
      return res.status(200).json(createDepartmentTokenResponse(department));
    }

    return res.status(400).json({ message: 'Incorrect password' });
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, error);
  }
};

const guestUserLogin = async (req, res) => {
  try {
    const user = await findGuestUser();
    if (!user) {
      return res.status(404).json({ message: 'No guest user account is available. Seed a demo user first.' });
    }

    return res.status(200).json(createUserTokenResponse(user));
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, error);
  }
};

const guestEmpLogin = async (req, res) => {
  try {
    const employee = await findGuestEmployee();
    if (!employee) {
      return res.status(404).json({ message: 'No guest employee account is available. Seed a demo employee first.' });
    }

    if (employee.EmpActive === false) {
      return res.status(403).json({ message: 'Guest employee account is inactive' });
    }

    return res.status(200).json(createEmployeeTokenResponse(employee, 'Guest login successful'));
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, error);
  }
};

const guestDeptLogin = async (req, res) => {
  try {
    const department = await findGuestDepartment();
    if (!department) {
      return res.status(404).json({ message: 'No guest department account is available. Seed a demo department first.' });
    }

    return res.status(200).json(createDepartmentTokenResponse(department, 'Guest login successful'));
  } catch (error) {
    console.error(error);
    return sendErrorResponse(res, error);
  }
};


module.exports = {
  userLogin,
  empLogin,
  deptLogin,
  guestUserLogin,
  guestEmpLogin,
  guestDeptLogin,
};
