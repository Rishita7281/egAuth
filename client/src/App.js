import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminDepartments from './pages/admin/AdminDepartments';
import AdminUsers from './pages/admin/AdminUsers';
import AdminAuth from './pages/auth/AdminAuth';
import DepartmentAuthPage from './pages/auth/DepartmentAuthPage';
import EmployeeAuth from './pages/auth/EmployeeAuth';
import UserLogin from './pages/auth/UserLogin';
import UserRegister from './pages/auth/UserRegister';
import DepartmentEmployeeEdit from './pages/department/DepartmentEmployeeEdit';
import DepartmentEmployeesList from './pages/department/DepartmentEmployeesList';
import EmployeeProfile from './pages/employee/EmployeeProfile';
import EmployeeQr from './pages/employee/EmployeeQr';
import EmployeeSecurity from './pages/employee/EmployeeSecurity';
import Home from './pages/Home';
import UserHistory from './pages/user/UserHistory';
import UserProfile from './pages/user/UserProfile';
import UserVerify from './pages/user/UserVerify';

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />

          <Route path="/auth/admin" element={<AdminAuth />} />
          <Route path="/auth/department" element={<DepartmentAuthPage />} />
          <Route path="/auth/employee" element={<EmployeeAuth />} />
          <Route path="/auth/user/login" element={<UserLogin />} />
          <Route path="/auth/user/register" element={<UserRegister />} />

          <Route element={<ProtectedRoute role="admin" redirectTo="/auth/admin" />}>
            <Route path="/admin/departments" element={<AdminDepartments />} />
            <Route path="/admin/users" element={<AdminUsers />} />
          </Route>

          <Route element={<ProtectedRoute role="department" redirectTo="/auth/department" />}>
            <Route path="/department/employees" element={<DepartmentEmployeesList />} />
            <Route path="/department/employees/:empId/edit" element={<DepartmentEmployeeEdit />} />
          </Route>

          <Route element={<ProtectedRoute role="employee" redirectTo="/auth/employee" />}>
            <Route path="/employee/profile" element={<EmployeeProfile />} />
            <Route path="/employee/security" element={<EmployeeSecurity />} />
            <Route path="/employee/qr" element={<EmployeeQr />} />
          </Route>

          <Route element={<ProtectedRoute role="user" redirectTo="/auth/user/login" />}>
            <Route path="/user/profile" element={<UserProfile />} />
            <Route path="/user/verify" element={<UserVerify />} />
            <Route path="/user/history" element={<UserHistory />} />
          </Route>

          <Route path="/admin" element={<Navigate to="/admin/departments" replace />} />
          <Route path="/department" element={<Navigate to="/auth/department" replace />} />
          <Route path="/employee" element={<Navigate to="/auth/employee" replace />} />
          <Route path="/user" element={<Navigate to="/auth/user/login" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
