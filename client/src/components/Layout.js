import { useEffect, useRef, useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { guestLoginDepartment, guestLoginEmployee, guestLoginUser } from '../utils/apiClient';
import { clearTokenForRole, getPrimaryRole, getSessionForRole, isTokenValidForRole, setTokenForRole } from '../utils/auth';

const publicLinks = [{ to: '/', label: 'Home' }];

const authLinks = [
  { to: '/auth/admin', label: 'Admin Login' },
  { to: '/auth/department', label: 'Dept Auth' },
  { to: '/auth/employee', label: 'Emp Login' },
  { to: '/auth/user/login', label: 'User Login' },
  { to: '/auth/user/register', label: 'User Register' },
];

const roleLinks = {
  admin: [
    { to: '/admin/departments', label: 'Departments' },
    { to: '/admin/users', label: 'User Roles' },
  ],
  department: [{ to: '/department/employees', label: 'Employees' }],
  employee: [
    { to: '/employee/profile', label: 'Profile' },
    { to: '/employee/security', label: 'Security' },
    { to: '/employee/qr', label: 'QR' },
  ],
  user: [
    { to: '/user/profile', label: 'Profile' },
    { to: '/user/verify', label: 'Verify' },
    { to: '/user/history', label: 'History' },
  ],
};

const roleTitles = {
  admin: 'Admin Session',
  department: 'Department Session',
  employee: 'Employee Session',
  user: 'User Session',
};

const roleLogoutTarget = {
  admin: '/auth/admin',
  department: '/auth/department',
  employee: '/auth/employee',
  user: '/auth/user/login',
};

function getProfileSubtitle(activeRole, session) {
  if (!activeRole) {
    return 'Continue to select role';
  }

  if (activeRole === 'department') {
    if (session?.EmpDeptName && session?.EmpDeptID) {
      return `${session.EmpDeptName} / ${session.EmpDeptID}`;
    }
    if (session?.EmpDeptID) {
      return `Department ID ${session.EmpDeptID}`;
    }
  }

  if (activeRole === 'employee') {
    if (session?.EmpName && session?.EmpID) {
      return `${session.EmpName} / ${session.EmpID}`;
    }
    if (session?.EmpID) {
      return `Employee ID ${session.EmpID}`;
    }
  }

  if (activeRole === 'user' && session?.id) {
    return `User ID ${session.id}`;
  }

  if (activeRole === 'admin' && session?.id) {
    return `Signed in as ${session.id}`;
  }

  return 'Access granted';
}

export default function Layout({ children }) {
  const navigate = useNavigate();
  const activeRole = getPrimaryRole();
  const activeSession = activeRole ? getSessionForRole(activeRole) : null;
  const links = activeRole ? [...publicLinks, ...roleLinks[activeRole]] : [...publicLinks, ...authLinks];
  const guestPanelRef = useRef(null);
  const [guestChooserOpen, setGuestChooserOpen] = useState(false);
  const [guestBusy, setGuestBusy] = useState(false);
  const [guestStatus, setGuestStatus] = useState({ tone: '', message: '' });

  useEffect(() => {
    if (!guestChooserOpen) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      if (guestPanelRef.current && !guestPanelRef.current.contains(event.target)) {
        setGuestChooserOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setGuestChooserOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [guestChooserOpen]);

  const onLogout = () => {
    if (!activeRole) return;
    clearTokenForRole(activeRole);
    navigate(roleLogoutTarget[activeRole], { replace: true });
  };

  const handleGuestAccess = async (guestRole) => {
    setGuestBusy(true);
    setGuestStatus({ tone: '', message: 'Opening guest session...' });

    try {
      if (guestRole === 'employee') {
        const data = await guestLoginEmployee();
        if (!isTokenValidForRole(data.token, 'employee')) {
          setTokenForRole('employee', '');
          throw new Error('Invalid guest employee session token');
        }
        setTokenForRole('employee', data.token || '');
        setGuestChooserOpen(false);
        navigate('/employee/profile', { replace: true });
        return;
      }

      if (guestRole === 'department') {
        const data = await guestLoginDepartment();
        if (!isTokenValidForRole(data.token, 'department')) {
          setTokenForRole('department', '');
          throw new Error('Invalid guest department session token');
        }
        setTokenForRole('department', data.token || '');
        setGuestChooserOpen(false);
        navigate('/department/employees', { replace: true });
        return;
      }

      if (guestRole === 'user') {
        const data = await guestLoginUser();
        if (!isTokenValidForRole(data.token, 'user')) {
          setTokenForRole('user', '');
          throw new Error('Invalid guest user session token');
        }
        setTokenForRole('user', data.token || '');
        setGuestChooserOpen(false);
        navigate('/user/profile', { replace: true });
        return;
      }

      throw new Error('Unsupported guest role');
    } catch (error) {
      setGuestStatus({ tone: 'error', message: error.message });
    } finally {
      setGuestBusy(false);
    }
  };

  return (
    <div className="layout">
      <header className="navbar">
        <div className="brand">
          <span className="brand-mark">eG</span>
          <div>
            <p className="brand-title">eGAuth</p>
            <p className="brand-subtitle">Digital ID platform</p>
          </div>
        </div>

        <nav className="tabs">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              className={({ isActive }) => `tab ${isActive ? 'active' : ''}`}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className={`profile ${activeRole ? '' : 'guest-profile'}`} ref={!activeRole ? guestPanelRef : null}>
          <div className="avatar">EG</div>
          {activeRole ? (
            <>
              <div>
                <p className="profile-title">{roleTitles[activeRole]}</p>
                <p className="profile-subtitle">{getProfileSubtitle(activeRole, activeSession)}</p>
              </div>
              <button type="button" className="tab logout-tab" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <div className="guest-profile-body">
              <button
                type="button"
                className={`guest-profile-trigger ${guestChooserOpen ? 'open' : ''}`}
                onClick={() => {
                  if (guestBusy) return;
                  setGuestChooserOpen((current) => !current);
                  setGuestStatus({ tone: '', message: '' });
                }}
                disabled={guestBusy}
                aria-expanded={guestChooserOpen}
              >
                <span className="guest-profile-copy">
                  <span className="profile-title">Guest Login</span>
                  <span className="profile-subtitle">{getProfileSubtitle(activeRole, activeSession)}</span>
                </span>
              </button>
              {guestChooserOpen && (
                <div className="guest-floating-panel">
                  <div className="guest-choice-grid">
                    <button
                      type="button"
                      className="guest-choice"
                      onClick={() => handleGuestAccess('employee')}
                      disabled={guestBusy}
                    >
                      <span>Employee guest</span>
                      <small>Generate QR ID</small>
                    </button>
                    <button
                      type="button"
                      className="guest-choice"
                      onClick={() => handleGuestAccess('department')}
                      disabled={guestBusy}
                    >
                      <span>Department guest</span>
                      <small>Manage employee records</small>
                    </button>
                    <button
                      type="button"
                      className="guest-choice"
                      onClick={() => handleGuestAccess('user')}
                      disabled={guestBusy}
                    >
                      <span>User guest</span>
                      <small>Scan QR ID</small>
                    </button>
                  </div>
                  {guestStatus.message && <p className={`guest-status ${guestStatus.tone}`}>{guestStatus.message}</p>}
                </div>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="page">{children}</main>
    </div>
  );
}
