import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Panel } from '../../components/Ui';
import { loginUser } from '../../utils/apiClient';
import { isTokenValidForRole, setTokenForRole } from '../../utils/auth';

export default function UserLogin() {
  const navigate = useNavigate();
  const [login, setLogin] = useState({ UserID: '', Password: '' });
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('userToken') || '';
    if (isTokenValidForRole(token, 'user')) {
      navigate('/user/profile', { replace: true });
    }
  }, [navigate]);

  const onField = (key) => (event) => setLogin((prev) => ({ ...prev, [key]: event.target.value }));

  const finishLogin = (data) => {
    if (!isTokenValidForRole(data.token, 'user')) {
      setTokenForRole('user', '');
      throw new Error('Use the admin portal for admin accounts');
    }
    setTokenForRole('user', data.token || '');
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setBusy(true);
    setStatus('Logging in...');
    try {
      const data = await loginUser(login);
      finishLogin(data);
      setStatus('User logged in');
      navigate('/user/profile', { replace: true });
    } catch (err) {
      setStatus(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid compact-grid">
      <Panel title="User Login" subtitle="Open your user dashboard.">
        <form className="form" onSubmit={handleLogin}>
          <Field label="User ID" value={login.UserID} onChange={onField('UserID')} />
          <Field label="Password" type="password" value={login.Password} onChange={onField('Password')} />
          <div className="actions">
            <Button type="submit" disabled={busy}>Login</Button>
          </div>
          {status && <p className={`note ${status.toLowerCase().includes('invalid') || status.toLowerCase().includes('not') || status.toLowerCase().includes('incorrect') ? 'error' : ''}`}>{status}</p>}
        </form>
      </Panel>
    </div>
  );
}
