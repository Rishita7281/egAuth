import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Panel } from '../../components/Ui';
import { loginDepartment } from '../../utils/apiClient';
import { isTokenValidForRole, setTokenForRole } from '../../utils/auth';

export default function DepartmentAuthPage() {
  const navigate = useNavigate();
  const [login, setLogin] = useState({ DeptID: '', DeptPass: '' });
  const [loginStatus, setLoginStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('deptToken') || '';
    if (isTokenValidForRole(token, 'department')) {
      navigate('/department/employees', { replace: true });
    }
  }, [navigate]);

  const onField = (setter, key) => (event) => setter((prev) => ({ ...prev, [key]: event.target.value }));

  const handleLogin = async (event) => {
    event.preventDefault();
    setLoginStatus('Logging in...');
    try {
      const data = await loginDepartment(login);
      if (!isTokenValidForRole(data.token, 'department')) {
        setTokenForRole('department', '');
        throw new Error('Invalid department session token');
      }
      setTokenForRole('department', data.token || '');
      setLoginStatus('Department logged in');
      navigate('/department/employees', { replace: true });
    } catch (err) {
      setLoginStatus(err.message);
    }
  };

  return (
    <div className="grid compact-grid">
      <Panel title="Department Login" subtitle="Open employee management">
        <form className="form" onSubmit={handleLogin}>
          <Field label="Department ID" value={login.DeptID} onChange={onField(setLogin, 'DeptID')} />
          <Field label="Department Pass" type="password" value={login.DeptPass} onChange={onField(setLogin, 'DeptPass')} />
          <div className="actions">
            <Button type="submit">Login</Button>
          </div>
          {loginStatus && <p className="note">{loginStatus}</p>}
        </form>
      </Panel>
    </div>
  );
}
