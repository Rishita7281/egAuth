import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Panel } from '../../components/Ui';
import { loginUser } from '../../utils/apiClient';
import { isTokenValidForRole, setTokenForRole } from '../../utils/auth';

export default function AdminAuth() {
  const navigate = useNavigate();
  const [login, setLogin] = useState({ UserID: '', Password: '' });
  const [status, setStatus] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('adminToken') || '';
    if (isTokenValidForRole(token, 'admin')) {
      navigate('/admin/departments', { replace: true });
    }
  }, [navigate]);

  const onField = (key) => (event) => setLogin((prev) => ({ ...prev, [key]: event.target.value }));

  const handleLogin = async (event) => {
    event.preventDefault();
    setStatus('Logging in...');
    try {
      const data = await loginUser(login);
      if (!isTokenValidForRole(data.token, 'admin')) {
        setTokenForRole('admin', '');
        throw new Error('Admin privileges required for this portal');
      }
      setTokenForRole('admin', data.token || '');
      setStatus('Admin logged in');
      navigate('/admin/departments', { replace: true });
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="grid compact-grid">
      <Panel title="Admin Login" subtitle="Sign in with an admin account">
        <form className="form" onSubmit={handleLogin}>
          <Field label="Admin UserID" value={login.UserID} onChange={onField('UserID')} />
          <Field label="Password" type="password" value={login.Password} onChange={onField('Password')} />
          <div className="actions">
            <Button type="submit">Login</Button>
          </div>
          {status && <p className="note">{status}</p>}
        </form>
      </Panel>
    </div>
  );
}
