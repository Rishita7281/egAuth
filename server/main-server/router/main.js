const express = require("express");
const router = express.Router();

// Import authentication middleware
const { authAdminJWT, authDeptJWT, authEmpJWT, authUserJWT } = require("../middleware/auth");
const { validate } = require("../middleware/validate");
const schemas = require("../validation/schemas");

// Import controllers
const { addDept, viewDept, updateDept, deleteDept, listUsers, updateUserRole } = require("../controller/admin");
const { viewProfile, changePassword } = require("../controller/employee");
const { viewEmployee, addEmployee, updateEmployee, deleteEmployee, setEmployeeStatus } = require("../controller/dept");
const { pastScan, userProfile, updateUser, deleteUser } = require("../controller/user");

// User Routes (Protected)
router.get("/user", authUserJWT, userProfile);
router.get("/user/pastScan", authUserJWT, pastScan);
router.put("/user/update", authUserJWT, validate(schemas.updateUser), updateUser);
router.delete("/user/delete", authUserJWT, validate(schemas.deleteUser), deleteUser);

// Employee Routes (Protected) 
router.get("/emp", authEmpJWT, viewProfile);
router.put("/emp/changePassword", authEmpJWT, validate(schemas.changeEmpPassword), changePassword);

// Admin Routes (Protected)
router.post("/admin/addDept", authAdminJWT, validate(schemas.addDept), addDept);
router.get("/admin/viewDept", authAdminJWT, viewDept); 
router.put("/admin/updateDept", authAdminJWT, validate(schemas.updateDept), updateDept);
router.delete("/admin/deleteDept", authAdminJWT, validate(schemas.deleteDept), deleteDept);
router.get("/admin/users", authAdminJWT, listUsers);
router.put("/admin/users/role", authAdminJWT, validate(schemas.updateUserRole), updateUserRole);

// Department Routes 
router.post("/dept/addEmp", authDeptJWT, validate(schemas.addEmployee), addEmployee); 
router.get("/dept/viewEmp", authDeptJWT, viewEmployee); 
router.put("/dept/updateEmp", authDeptJWT, validate(schemas.updateEmployee), updateEmployee);
router.delete("/dept/deleteEmp", authDeptJWT, validate(schemas.deleteEmployee), deleteEmployee);
router.put("/dept/setEmpStatus", authDeptJWT, validate(schemas.setEmpStatus), setEmployeeStatus);

module.exports = router;
