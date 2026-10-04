import { useState } from 'react';
import { Button, Field, Panel } from '../../components/Ui';
import { registerUser } from '../../utils/apiClient';

export default function UserRegister() {
  const [registerForm, setRegisterForm] = useState({
    UserID: '',
    UserAdhar: '',
    UserName: '',
    Password: '',
    userConfirmPass: '',
  });
  const [status, setStatus] = useState('');

  const onField = (key) => (event) => setRegisterForm((prev) => ({ ...prev, [key]: event.target.value }));

  const handleRegister = async (event) => {
    event.preventDefault();
    setStatus('Registering...');
    try {
      await registerUser(registerForm);
      setRegisterForm({ UserID: '', UserAdhar: '', UserName: '', Password: '', userConfirmPass: '' });
      setStatus('User registered');
    } catch (err) {
      setStatus(err.message);
    }
  };

  return (
    <div className="grid compact-grid">
      <Panel title="User Registration" subtitle="Create a new user account">
        <form className="form" onSubmit={handleRegister}>
          <Field label="User ID" value={registerForm.UserID} onChange={onField('UserID')} />
          <Field label="User Name" value={registerForm.UserName} onChange={onField('UserName')} />
          <Field label="User Aadhar" value={registerForm.UserAdhar} onChange={onField('UserAdhar')} />
          <Field label="Password" type="password" value={registerForm.Password} onChange={onField('Password')} />
          <Field
            label="Confirm Password"
            type="password"
            value={registerForm.userConfirmPass}
            onChange={onField('userConfirmPass')}
          />
          <div className="actions">
            <Button type="submit">Register</Button>
          </div>
          {status && <p className="note">{status}</p>}
        </form>
      </Panel>
    </div>
  );
}
