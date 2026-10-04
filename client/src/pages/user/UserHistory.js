import { useEffect, useState } from 'react';
import { DataTable, Panel, StatusPill } from '../../components/Ui';
import { userPastScans } from '../../utils/apiClient';
import { getTokenForRole } from '../../utils/auth';

function shortenId(value, maxLength = 28) {
  if (!value) {
    return '--';
  }

  if (value.length <= maxLength) {
    return value;
  }

  const edge = Math.max(6, Math.floor((maxLength - 3) / 2));
  return `${value.slice(0, edge)}...${value.slice(-edge)}`;
}

function normalizeScans(data) {
  return (data.scans || []).map((scan) => ({
    id: scan._id,
    ScanID: (
      <code className="history-scan-id" title={scan.ScanID}>
        {shortenId(scan.ScanID)}
      </code>
    ),
    Employee: (
      <div className="history-identity-cell">
        <strong>{scan.EmpName || scan.EmpID || '--'}</strong>
        <span>{scan.EmpID ? `ID ${scan.EmpID}` : 'Employee ID unavailable'}</span>
      </div>
    ),
    Department: (
      <div className="history-identity-cell">
        <strong>{scan.EmpDeptName || scan.EmpDeptID || '--'}</strong>
        <span>{scan.EmpDeptID ? `ID ${scan.EmpDeptID}` : 'Department ID unavailable'}</span>
      </div>
    ),
  }));
}

export default function UserHistory() {
  const [token] = useState(() => getTokenForRole('user'));
  const [pastScans, setPastScans] = useState([]);
  const [status, setStatus] = useState({ tone: '', message: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus({ tone: 'error', message: 'User session missing.' });
      return;
    }

    let cancelled = false;

    const loadPastScans = async () => {
      setLoading(true);
      setStatus({ tone: '', message: 'Loading scans...' });
      try {
        const data = await userPastScans(token);
        if (cancelled) {
          return;
        }
        const rows = normalizeScans(data);
        setPastScans(rows);
        setStatus({
          tone: 'success',
          message: rows.length ? `History ready. ${rows.length} scan record${rows.length === 1 ? '' : 's'} loaded.` : 'History ready. No scans recorded yet.',
        });
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

    loadPastScans();

    return () => {
      cancelled = true;
    };
  }, [token]);

  return (
    <div className="grid compact-grid">
      <Panel
        title="Past Scans"
        subtitle="Your verification history loads automatically when this page opens."
        right={
          <StatusPill tone={status.tone === 'error' ? 'danger' : pastScans.length ? 'success' : 'neutral'}>
            {loading ? 'Loading history...' : pastScans.length ? 'History ready' : 'No scans yet'}
          </StatusPill>
        }
      >
        <DataTable
          columns={[
            { key: 'ScanID', label: 'Scan ID' },
            { key: 'Employee', label: 'Employee' },
            { key: 'Department', label: 'Department' },
          ]}
          rows={pastScans}
          emptyText={loading ? 'Loading scans...' : 'No scans yet'}
        />
        {status.message && <p className={`note ${status.tone}`}>{status.message}</p>}
      </Panel>
    </div>
  );
}
