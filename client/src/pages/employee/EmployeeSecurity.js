import { useState } from 'react';
import { Button, Field, Panel } from '../../components/Ui';
import { empChangePassword } from '../../utils/apiClient';
import { getTokenForRole } from '../../utils/auth';

export default function EmployeeSecurity() {
  const [token] = useState(() => getTokenForRole('employee'));
  const [passwordForm, setPasswordForm] = useState({ CurrentPassword: '', NewPassword: '' });
  const [status, setStatus] = useState('');

  const onField = (key) => (event) => setPasswordForm((prev) => ({ ...prev, [key]: event.target.value }));

  const changePassword = async () => {
    setStatus('Updating password...');
    try {
      await empChangePassword(token, passwordForm);
      setPasswordForm({ CurrentPassword: '', NewPassword: '' });
      setStatus('Password updated');
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="grid compact-grid">
      <Panel title="Employee Security" subtitle="Change account password">
        <div className="form two-col">
          <Field
            label="Current Password"
            type="password"
            value={passwordForm.CurrentPassword}
            onChange={onField('CurrentPassword')}
          />
          <Field
            label="New Password"
            type="password"
            value={passwordForm.NewPassword}
            onChange={onField('NewPassword')}
          />
        </div>
        <div className="actions">
          <Button type="button" onClick={changePassword}>
            Update password
          </Button>
        </div>
        {status && <p className="note">{status}</p>}
      </Panel>
    </div>
  );
}
