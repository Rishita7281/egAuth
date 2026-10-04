import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Field, Panel, SectionHeader, StatusPill } from '../../components/Ui';
import { userDelete, userProfile, userUpdate } from '../../utils/apiClient';
import { clearTokenForRole, getTokenForRole } from '../../utils/auth';

const emptyProfile = { UserID: '', UserName: '', UserAdhar: '' };
const emptyUpdateSecrets = { Password: '', CurrentPassword: '' };

function normalizeProfile(data) {
  const user = data.user || emptyProfile;
  return {
    UserID: user.UserID || '',
    UserName: user.UserName || '',
    UserAdhar: user.UserAdhar || '',
  };
}

function maskAadhar(value) {
  if (!value) {
    return 'Not available';
  }

  if (value.length <= 4) {
    return value;
  }

  return `${'*'.repeat(value.length - 4)}${value.slice(-4)}`;
}

export default function UserProfile() {
  const navigate = useNavigate();
  const [token] = useState(() => getTokenForRole('user'));
  const [profile, setProfile] = useState(emptyProfile);
  const [updateForm, setUpdateForm] = useState({
    UserName: '',
    UserAdhar: '',
    Password: '',
    CurrentPassword: '',
  });
  const [deletePassword, setDeletePassword] = useState('');

  const [profileStatus, setProfileStatus] = useState({ tone: '', message: '' });
  const [updateStatus, setUpdateStatus] = useState({ tone: '', message: '' });
  const [deleteStatus, setDeleteStatus] = useState({ tone: '', message: '' });
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);

  const onField = (setter, key) => (event) => setter((prev) => ({ ...prev, [key]: event.target.value }));

  const applyProfile = (nextProfile) => {
    setProfile(nextProfile);
    setUpdateForm({
      UserName: nextProfile.UserName,
      UserAdhar: nextProfile.UserAdhar,
      ...emptyUpdateSecrets,
    });
  };

  useEffect(() => {
    if (!token) {
      setProfileStatus({ tone: 'error', message: 'User session missing.' });
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoadingProfile(true);
      setProfileStatus({ tone: '', message: 'Loading profile...' });
      try {
        const data = await userProfile(token);
        if (cancelled) {
          return;
        }
        const nextProfile = normalizeProfile(data);
        applyProfile(nextProfile);
        setProfileStatus({ tone: 'success', message: 'Account dashboard ready.' });
      } catch (err) {
        if (cancelled) {
          return;
        }
        setProfileStatus({ tone: 'error', message: err.message });
      } finally {
        if (!cancelled) {
          setLoadingProfile(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateProfile = async () => {
    const nextName = updateForm.UserName.trim();
    const nextAadhar = updateForm.UserAdhar.trim();
    const nextPassword = updateForm.Password.trim();
    const currentPassword = updateForm.CurrentPassword.trim();

    if (!currentPassword) {
      setUpdateStatus({ tone: 'error', message: 'Current password is required to save changes.' });
      return;
    }

    const payload = { CurrentPassword: currentPassword };
    let changeCount = 0;

    if (nextName && nextName !== profile.UserName) {
      payload.UserName = nextName;
      changeCount += 1;
    }

    if (nextAadhar && nextAadhar !== profile.UserAdhar) {
      payload.UserAdhar = nextAadhar;
      changeCount += 1;
    }

    if (nextPassword) {
      payload.Password = nextPassword;
      changeCount += 1;
    }

    if (!changeCount) {
      setUpdateStatus({ tone: 'error', message: 'No profile changes to save.' });
      return;
    }

    setSavingProfile(true);
    setUpdateStatus({ tone: '', message: 'Saving profile changes...' });
    try {
      const data = await userUpdate(token, payload);
      const nextProfile = normalizeProfile({ user: data.user });
      applyProfile(nextProfile);
      setUpdateStatus({ tone: 'success', message: 'Profile updated successfully.' });
      setProfileStatus({ tone: 'success', message: 'Account dashboard synced.' });
    } catch (err) {
      setUpdateStatus({ tone: 'error', message: err.message });
    } finally {
      setSavingProfile(false);
    }
  };

  const deleteUserAccount = async () => {
    const password = deletePassword.trim();

    if (!password) {
      setDeleteStatus({ tone: 'error', message: 'Enter your password before deleting the account.' });
      return;
    }

    setDeletingAccount(true);
    setDeleteStatus({ tone: '', message: 'Deleting account...' });
    try {
      await userDelete(token, { Password: password });
      clearTokenForRole('user');
      navigate('/auth/user/login', { replace: true });
    } catch (err) {
      setDeleteStatus({ tone: 'error', message: err.message });
      setDeletingAccount(false);
    }
  };

  const profileTone = profileStatus.tone === 'error' ? 'danger' : profile.UserID ? 'success' : 'neutral';

  return (
    <div className="page-stack user-account-page">
      <Panel
        title="Account Dashboard"
        subtitle="Profile summary, updates, and account deletion in one workspace."
        right={
          <StatusPill tone={profileTone}>
            {loadingProfile ? 'Loading account...' : profile.UserID ? 'Account ready' : 'Waiting for profile'}
          </StatusPill>
        }
      >
        <div className="user-account-grid">
          <div className="user-account-summary">
            <SectionHeader title="Profile snapshot" subtitle="Your account data is loaded automatically when this page opens." />
            <div className="admin-metrics-grid user-account-metrics">
              <div className="admin-metric-card user-account-primary">
                <p className="label">User ID</p>
                <strong>{profile.UserID || '--'}</strong>
                <span>Stable account identifier used for your session.</span>
              </div>
              <div className="admin-metric-card">
                <p className="label">Name</p>
                <strong>{profile.UserName || '--'}</strong>
                <span>Displayed identity linked to verified scans.</span>
              </div>
              <div className="admin-metric-card">
                <p className="label">Aadhar</p>
                <strong>{maskAadhar(profile.UserAdhar)}</strong>
                <span>Masked here for quick reading. Full value stays editable in the form.</span>
              </div>
              <div className="admin-metric-card">
                <p className="label">Security</p>
                <strong>{updateForm.Password ? 'Pending' : 'Stable'}</strong>
                <span>{updateForm.Password ? 'A password rotation is queued in the current form.' : 'No password change staged right now.'}</span>
              </div>
            </div>
            {profileStatus.message && <p className={`note ${profileStatus.tone}`}>{profileStatus.message}</p>}
          </div>

          <div className="admin-action-card update user-account-editor">
            <SectionHeader title="Update profile" subtitle="The form is prefilled from your live profile. Only changed fields are submitted." />
            <div className="form user-account-editor-form">
              <Field label="User ID" value={profile.UserID} disabled />
              <Field label="User Name" value={updateForm.UserName} onChange={onField(setUpdateForm, 'UserName')} />
              <Field label="User Aadhar" value={updateForm.UserAdhar} onChange={onField(setUpdateForm, 'UserAdhar')} />
              <Field label="New Password" type="password" value={updateForm.Password} onChange={onField(setUpdateForm, 'Password')} />
              <Field
                label="Current Password"
                type="password"
                value={updateForm.CurrentPassword}
                onChange={onField(setUpdateForm, 'CurrentPassword')}
                placeholder="Required to confirm changes"
              />
            </div>
            <div className="actions">
              <Button type="button" onClick={updateProfile} disabled={savingProfile || loadingProfile}>
                {savingProfile ? 'Saving...' : 'Save changes'}
              </Button>
            </div>
            {updateStatus.message && <p className={`note ${updateStatus.tone}`}>{updateStatus.message}</p>}
          </div>

          <div className="admin-action-card delete user-account-danger">
            <SectionHeader title="Delete account" subtitle="This action is permanent and signs you out immediately." />
            <div className="form">
              <Field
                label="Confirm password"
                type="password"
                value={deletePassword}
                onChange={(event) => setDeletePassword(event.target.value)}
                placeholder="Enter your password to delete this account"
              />
            </div>
            <div className="actions">
              <Button type="button" variant="danger" onClick={deleteUserAccount} disabled={deletingAccount}>
                {deletingAccount ? 'Deleting...' : 'Delete account'}
              </Button>
            </div>
            {deleteStatus.message && <p className={`note ${deleteStatus.tone}`}>{deleteStatus.message}</p>}
          </div>
        </div>
      </Panel>
    </div>
  );
}
