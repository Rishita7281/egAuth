import { useEffect, useState } from 'react';
import { DataTable, Panel, StatusPill } from '../../components/Ui';
import { empProfile } from '../../utils/apiClient';
import { getTokenForRole } from '../../utils/auth';

const emptyProfile = { EmpID: '', EmpName: '', EmpDeptID: '', EmpDeptName: '' };

function normalizeProfileData(data) {
  const profileData = data.data || emptyProfile;
  return {
    EmpID: profileData.EmpID || '',
    EmpName: profileData.EmpName || '',
    EmpDeptID: profileData.EmpDeptID || '',
    EmpDeptName: profileData.EmpDeptName || '',
  };
}

export default function EmployeeProfile() {
  const [token] = useState(() => getTokenForRole('employee'));
  const [profile, setProfile] = useState(emptyProfile);
  const [status, setStatus] = useState({ tone: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus({ tone: 'error', message: 'Employee session missing.' });
      return;
    }

    let cancelled = false;

    const loadProfile = async () => {
      setLoading(true);
      setStatus({ tone: '', message: 'Loading profile...' });
      try {
        const data = await empProfile(token);
        if (cancelled) {
          return;
        }
        setProfile(normalizeProfileData(data));
        setStatus({ tone: 'success', message: 'Profile synced.' });
      } catch (err) {
        if (cancelled) {
          return;
        }
        setStatus({ tone: 'error', message: err.message });
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="grid compact-grid">
      <Panel
        title="Employee Profile"
        subtitle="Read-only account details. The profile loads automatically when the page opens."
        right={
          <StatusPill tone={status.tone === 'error' ? 'danger' : profile.EmpID ? 'success' : 'neutral'}>
            {loading ? 'Syncing profile...' : profile.EmpID ? 'Profile ready' : 'Waiting for data'}
          </StatusPill>
        }
      >
        <DataTable
          columns={[
            { key: 'EmpID', label: 'Emp ID' },
            { key: 'EmpName', label: 'Name' },
            { key: 'EmpDeptID', label: 'Dept ID' },
            { key: 'EmpDeptName', label: 'Dept Name' },
          ]}
          rows={[{ id: 'profile', ...profile }].filter((row) => row.EmpID)}
          emptyText={loading ? 'Loading profile...' : 'Profile unavailable'}
        />
        {status.message && <p className={`note ${status.tone}`}>{status.message}</p>}
      </Panel>
    </div>
  );
}
