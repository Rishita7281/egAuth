import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Panel } from '../../components/Ui';
import { loginEmployee } from '../../utils/apiClient';
import { isTokenValidForRole, setTokenForRole } from '../../utils/auth';

export default function EmployeeAuth() {
  const navigate = useNavigate();
  const [login, setLogin] = useState({ EmpID: '', EmpPassword: '' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('empToken') || '';
    if (isTokenValidForRole(token, 'employee')) {
      navigate('/employee/profile', { replace: true });
    }
  }, [navigate]);

  const onField = (key) => (event) => setLogin((prev) => ({ ...prev, [key]: event.target.value }));

  const finishLogin = (data) => {
    if (!isTokenValidForRole(data.token, 'employee')) {
      setTokenForRole('employee', '');
      throw new Error('Invalid employee session token');
    }
    setTokenForRole('employee', data.token || '');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus('Logging in...');
    try {
      const data = await loginEmployee(login);
      finishLogin(data);
      setStatus('Employee logged in');
      navigate('/employee/profile', { replace: true });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid compact-grid">
      <Panel title="Employee Login" subtitle="Sign in to access profile and QR.">
        <form className="form" onSubmit={handleLogin}>
          <Field label="Emp ID" value={login.EmpID} onChange={onField('EmpID')} />
          <Field label="Password" type="password" value={login.EmpPassword} onChange={onField('EmpPassword')} />
          <div className="actions">
            <Button type="submit" disabled={busy}>Login</Button>
          </div>
          {status && <p className={`note ${status.toLowerCase().includes('invalid') || status.toLowerCase().includes('not') || status.toLowerCase().includes('incorrect') ? 'error' : ''}`}>{status}</p>}
        </form>
      </Panel>
    </div>
  );
}
