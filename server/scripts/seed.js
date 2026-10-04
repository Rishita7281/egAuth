const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const User = require('../shared/schemas/UserSchema');
const Department = require('../shared/schemas/DeptSchema');
const Employee = require('../shared/schemas/EmployeeSchema');

const dbUser = process.env.DB_USER;
const dbPassword = process.env.DB_PASSWORD;

if (!dbUser || !dbPassword) {
  console.error('DB_USER/DB_PASSWORD not set in server/.env');
  process.exit(1);
}

const uri = `mongodb+srv://${dbUser}:${dbPassword}@cluster0.dncvi.mongodb.net/eGAuth?retryWrites=true&w=majority`;

const seed = async () => {
  await mongoose.connect(uri);

  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const deptPassword = await bcrypt.hash('Dept@123', 10);
  const empPassword = await bcrypt.hash('Emp@123', 10);
  const userPassword = await bcrypt.hash('User@123', 10);

  const departments = [
    { DeptID: 'DPT-001', DeptName: 'Civil Registry', DeptPass: deptPassword, DeptCreatedBy: 'admin' },
    { DeptID: 'DPT-002', DeptName: 'Public Safety', DeptPass: deptPassword, DeptCreatedBy: 'admin' },
  ];

  const employees = [
    {
      EmpID: 'EMP-1001',
      EmpName: 'Ritika Sen',
      EmpDeptID: 'DPT-001',
      EmpDeptName: 'Civil Registry',
      EmpSignature: '',
      EmpPassword: empPassword,
      EmpContact: '9000000001',
      EmpDesignation: 'Registrar',
      EmpPosting: 'HQ',
      EmpActive: true,
      EmpCreatedBy: 'DPT-001',
    },
    {
      EmpID: 'EMP-1002',
      EmpName: 'Arjun Roy',
      EmpDeptID: 'DPT-001',
      EmpDeptName: 'Civil Registry',
      EmpSignature: '',
      EmpPassword: empPassword,
      EmpContact: '9000000002',
      EmpDesignation: 'Officer',
      EmpPosting: 'City Center',
      EmpActive: true,
      EmpCreatedBy: 'DPT-001',
    },
    {
      EmpID: 'EMP-2001',
      EmpName: 'Maya Das',
      EmpDeptID: 'DPT-002',
      EmpDeptName: 'Public Safety',
      EmpSignature: '',
      EmpPassword: empPassword,
      EmpContact: '9000000003',
      EmpDesignation: 'Inspector',
      EmpPosting: 'North Zone',
      EmpActive: true,
      EmpCreatedBy: 'DPT-002',
    },
  ];

  const users = [
    {
      UserID: 'admin',
      UserName: 'System Admin',
      UserAdhar: 'AAAA11112222',
      Password: adminPassword,
      Role: 'admin',
    },
    {
      UserID: 'user001',
      UserName: 'Priya Sharma',
      UserAdhar: 'BBBB33334444',
      Password: userPassword,
      Role: 'user',
    },
    {
      UserID: 'user002',
      UserName: 'Karan Mehta',
      UserAdhar: 'CCCC55556666',
      Password: userPassword,
      Role: 'user',
    },
  ];

  for (const dept of departments) {
    await Department.updateOne({ DeptID: dept.DeptID }, { $set: dept }, { upsert: true });
  }

  for (const emp of employees) {
    await Employee.updateOne({ EmpID: emp.EmpID }, { $set: emp }, { upsert: true });
  }

  for (const user of users) {
    await User.updateOne({ UserID: user.UserID }, { $set: user }, { upsert: true });
  }

  console.log('Seed complete.');
};

seed()
  .then(() => mongoose.disconnect())
  .catch((err) => {
    console.error('Seed failed:', err.message);
    mongoose.disconnect();
    process.exit(1);
  });
