import { callApi } from './api';
import { MAIN_API, SECONDARY_API } from './config';

/**
 * @typedef {Object} AuthResponse
 * @property {string} token
 * @property {string} message
 */

/**
 * @param {{UserID: string, Password: string}} body
 * @returns {Promise<AuthResponse>}
 */
export const loginUser = (body) => callApi({ base: MAIN_API, path: '/login/userLogin', method: 'POST', body });
export const guestLoginUser = () => callApi({ base: MAIN_API, path: '/login/userGuest', method: 'POST' });

/**
 * @param {{EmpID: string, EmpPassword: string}} body
 * @returns {Promise<AuthResponse>}
 */
export const loginEmployee = (body) => callApi({ base: MAIN_API, path: '/login/empLogin', method: 'POST', body });
export const guestLoginEmployee = () => callApi({ base: MAIN_API, path: '/login/empGuest', method: 'POST' });

/**
 * @param {{DeptID: string, DeptPass: string}} body
 * @returns {Promise<AuthResponse>}
 */
export const loginDepartment = (body) => callApi({ base: MAIN_API, path: '/login/deptLogin', method: 'POST', body });
export const guestLoginDepartment = () => callApi({ base: MAIN_API, path: '/login/deptGuest', method: 'POST' });

export const registerUser = (body) => callApi({ base: MAIN_API, path: '/register/userRegister', method: 'POST', body });
export const registerDepartment = (body) => callApi({ base: MAIN_API, path: '/register/deptRegister', method: 'POST', body });

export const adminAddDept = (token, body) => callApi({ base: MAIN_API, path: '/admin/addDept', method: 'POST', token, body });
export const adminUpdateDept = (token, body) => callApi({ base: MAIN_API, path: '/admin/updateDept', method: 'PUT', token, body });
export const adminDeleteDept = (token, body) => callApi({ base: MAIN_API, path: '/admin/deleteDept', method: 'DELETE', token, body });
export const adminListDepts = (token) => callApi({ base: MAIN_API, path: '/admin/viewDept', token });
export const adminListUsers = (token) => callApi({ base: MAIN_API, path: '/admin/users', token });
export const adminUpdateUserRole = (token, body) => callApi({ base: MAIN_API, path: '/admin/users/role', method: 'PUT', token, body });

export const deptAddEmployee = (token, body) => callApi({ base: MAIN_API, path: '/dept/addEmp', method: 'POST', token, body });
export const deptUpdateEmployee = (token, body) => callApi({ base: MAIN_API, path: '/dept/updateEmp', method: 'PUT', token, body });
export const deptDeleteEmployee = (token, body) => callApi({ base: MAIN_API, path: '/dept/deleteEmp', method: 'DELETE', token, body });
export const deptSetEmployeeStatus = (token, body) => callApi({ base: MAIN_API, path: '/dept/setEmpStatus', method: 'PUT', token, body });
export const deptListEmployees = (token) => callApi({ base: MAIN_API, path: '/dept/viewEmp', token });

export const empProfile = (token) => callApi({ base: MAIN_API, path: '/emp', token });
export const empChangePassword = (token, body) => callApi({ base: MAIN_API, path: '/emp/changePassword', method: 'PUT', token, body });
export const empGenerateQr = (token) => callApi({ base: SECONDARY_API, path: '/emp/gen', method: 'POST', token });

export const userProfile = (token) => callApi({ base: MAIN_API, path: '/user', token });
export const userUpdate = (token, body) => callApi({ base: MAIN_API, path: '/user/update', method: 'PUT', token, body });
export const userDelete = (token, body) => callApi({ base: MAIN_API, path: '/user/delete', method: 'DELETE', token, body });
export const userPastScans = (token) => callApi({ base: MAIN_API, path: '/user/pastScan', token });
export const userVerifyScan = (token, body) => callApi({ base: SECONDARY_API, path: '/user/scan', method: 'POST', token, body });
