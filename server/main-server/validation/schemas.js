const Joi = require('joi');

const userLogin = Joi.object({
  UserID: Joi.string().required(),
  Password: Joi.string().required(),
});

const empLogin = Joi.object({
  EmpID: Joi.string().required(),
  EmpPassword: Joi.string().required(),
});

const deptLogin = Joi.object({
  DeptID: Joi.string().required(),
  DeptPass: Joi.string().required(),
});

const userRegister = Joi.object({
  UserID: Joi.string().required(),
  UserAdhar: Joi.string().required(),
  UserName: Joi.string().required(),
  Password: Joi.string().required(),
  userConfirmPass: Joi.string().required(),
});

const deptRegister = Joi.object({
  DeptName: Joi.string().required(),
  DeptPass: Joi.string().required(),
  DeptID: Joi.string().required(),
});

const addDept = Joi.object({
  DeptName: Joi.string().required(),
  DeptPass: Joi.string().required(),
  DeptID: Joi.string().required(),
});

const updateDept = Joi.object({
  DeptID: Joi.string().required(),
  DeptName: Joi.string().optional(),
  DeptPass: Joi.string().optional(),
});

const deleteDept = Joi.object({
  DeptID: Joi.string().required(),
});

const addEmployee = Joi.object({
  EmpID: Joi.string().required(),
  EmpName: Joi.string().required(),
  EmpPassword: Joi.string().required(),
  EmpContact: Joi.string().required(),
  EmpDesignation: Joi.string().required(),
  EmpPosting: Joi.string().required(),
});

const updateEmployee = Joi.object({
  EmpID: Joi.string().required(),
  EmpName: Joi.string().optional(),
  EmpContact: Joi.string().optional(),
  EmpDesignation: Joi.string().optional(),
  EmpPosting: Joi.string().optional(),
  EmpSignature: Joi.string().optional(),
});

const deleteEmployee = Joi.object({
  EmpID: Joi.string().required(),
});

const setEmpStatus = Joi.object({
  EmpID: Joi.string().required(),
  EmpActive: Joi.boolean().required(),
});

const updateUser = Joi.object({
  CurrentPassword: Joi.string().required(),
  UserName: Joi.string().optional(),
  UserAdhar: Joi.string().optional(),
  Password: Joi.string().optional(),
});

const deleteUser = Joi.object({
  Password: Joi.string().required(),
});

const changeEmpPassword = Joi.object({
  CurrentPassword: Joi.string().required(),
  NewPassword: Joi.string().required(),
});

const updateUserRole = Joi.object({
  UserID: Joi.string().required(),
  Role: Joi.string().valid('admin', 'user').required(),
});

module.exports = {
  userLogin,
  empLogin,
  deptLogin,
  userRegister,
  deptRegister,
  addDept,
  updateDept,
  deleteDept,
  addEmployee,
  updateEmployee,
  deleteEmployee,
  setEmpStatus,
  updateUser,
  deleteUser,
  changeEmpPassword,
  updateUserRole,
};
