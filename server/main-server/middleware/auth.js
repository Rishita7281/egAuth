const User = require('../database/schemas/UserSchema');
const Employee = require('../database/schemas/EmployeeSchema');
const Department = require('../database/schemas/DeptSchema');
const { readProxyUser } = require('../../shared/proxy/auth');

const authUserJWT = (req, res, next) => {
  (async () => {
    try {
      const user = readProxyUser(req.headers, 'user');
      const dbUser = await User.findOne({ UserID: user.id });
      if (!dbUser) {
        return res.status(401).json({ message: 'User not found.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  })();
  
};
 
const authEmpJWT = (req, res, next) => {
  (async () => {
    try {
      const user = readProxyUser(req.headers, 'employee');
      const dbEmp = await Employee.findOne({ EmpID: user.EmpID });
      if (!dbEmp) {
        return res.status(401).json({ message: 'Employee not found.' });
      }
      if (dbEmp.EmpActive === false) {
        return res.status(403).json({ message: 'Employee account is inactive.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  })();
  
};
const authDeptJWT = (req, res, next) => {
  (async () => {
    try {
      const user = readProxyUser(req.headers, 'department');
      const dbDept = await Department.findOne({ DeptID: user.EmpDeptID });
      if (!dbDept) {
        return res.status(401).json({ message: 'Department not found.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  })();
  
};
const authAdminJWT = (req, res, next) => {
  (async () => {
    try {
      const user = readProxyUser(req.headers, 'admin');
      const dbUser = await User.findOne({ UserID: user.id });
      if (!dbUser || dbUser.Role !== 'admin') {
        return res.status(401).json({ message: 'Admin not found.' });
      }

      req.user = user;
      return next();
    } catch (error) {
      return next(error);
    }
  })();
  
};
module.exports ={ authAdminJWT, authDeptJWT, authEmpJWT, authUserJWT };
 
