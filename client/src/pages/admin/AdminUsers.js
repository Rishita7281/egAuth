import { useEffect, useState } from 'react';
import { Button, Field, Panel, SectionHeader, StatusPill } from '../../components/Ui';
import { adminListUsers, adminUpdateUserRole } from '../../utils/apiClient';
import { getTokenForRole } from '../../utils/auth';

async function loadUsers(token) {
  const data = await adminListUsers(token);
  return (data.users || []).map((user) => ({
    id: user._id,
    UserID: user.UserID,
    UserName: user.UserName,
    Role: user.Role,
  }));
}

export default function AdminUsers() {
  const [token] = useState(() => getTokenForRole('admin'));
  const [users, setUsers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [roleForm, setRoleForm] = useState({ UserID: '', Role: 'user' });
  const [listStatus, setListStatus] = useState({ tone: '', message: '' });
  const [updateStatus, setUpdateStatus] = useState({ tone: '', message: '' });

  const onField = (key) => (event) => setRoleForm((prev) => ({ ...prev, [key]: event.target.value }));

  const selectedUser = users.find((user) => user.UserID === selectedUserId) || null;

  const selectUser = (user) => {
    setSelectedUserId(user.UserID);
    setRoleForm({ UserID: user.UserID, Role: user.Role });
    setUpdateStatus({ tone: '', message: '' });
  };

  const onUserSelectionChange = (event) => {
    const nextUserId = event.target.value;
    if (!nextUserId) {
      setSelectedUserId('');
      setRoleForm((prev) => ({ ...prev, UserID: '', Role: 'user' }));
      setUpdateStatus({ tone: '', message: '' });
      return;
    }

    const match = users.find((user) => user.UserID === nextUserId);
    if (match) {
      selectUser(match);
      return;
    }

    setSelectedUserId('');
    setRoleForm((prev) => ({ ...prev, UserID: nextUserId }));
    setUpdateStatus({ tone: '', message: '' });
  };

  const syncSelectedUser = (rows, preferredUserId = '') => {
    const targetUserId = preferredUserId || selectedUserId;

    if (!rows.length) {
      setSelectedUserId('');
      setRoleForm({ UserID: '', Role: 'user' });
      return;
    }

    if (!targetUserId) {
      return;
    }

    const match = rows.find((user) => user.UserID === targetUserId);
    if (match) {
      selectUser(match);
      return;
    }

    setSelectedUserId('');
    setRoleForm({ UserID: '', Role: 'user' });
  };

  const fetchUsers = async (preferredUserId = '') => {
    setListStatus({ tone: '', message: 'Loading users...' });
    try {
      const rows = await loadUsers(token);
      setUsers(rows);
      syncSelectedUser(rows, preferredUserId);
      setListStatus({
        tone: 'success',
        message: `Users loaded. ${rows.length} account${rows.length === 1 ? '' : 's'} in view.`,
      });
    } catch (err) {
      setListStatus({ tone: 'error', message: err.message });
    }
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadInitialUsers = async () => {
      setListStatus({ tone: '', message: 'Loading users...' });
      try {
        const rows = await loadUsers(token);
        if (cancelled) return;
        setUsers(rows);
        setListStatus({
          tone: 'success',
          message: `Users loaded. ${rows.length} account${rows.length === 1 ? '' : 's'} in view.`,
        });
      } catch (err) {
        if (cancelled) return;
        setListStatus({ tone: 'error', message: err.message });
      }
    };

    loadInitialUsers();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const updateRole = async () => {
    const UserID = roleForm.UserID.trim();
    const Role = roleForm.Role.trim();

    if (!UserID || !Role) {
      setUpdateStatus({ tone: 'error', message: 'User ID and role are required.' });
      return;
    }

    setUpdateStatus({ tone: '', message: 'Updating role...' });
    try {
      await adminUpdateUserRole(token, { UserID, Role });
      setUpdateStatus({ tone: 'success', message: 'Role updated.' });
      await fetchUsers(UserID);
    } catch (err) {
      setUpdateStatus({ tone: 'error', message: err.message });
    }
  };

  return (
    <div className="page-stack user-role-page">
      <div className="grid user-role-grid">
        <Panel
          title="Update User Role"
          subtitle="Select a user from the registry, then switch between admin and user with one control."
          right={<StatusPill tone={selectedUser ? 'success' : 'neutral'}>{selectedUser ? `Selected: ${selectedUser.UserID}` : 'No user selected'}</StatusPill>}
        >
        <div className="stack">
            <SectionHeader title="Role assignment" subtitle="Click any user row on the right to prefill this editor." />
            {selectedUser && (
              <div className="admin-metric-card user-role-summary">
                <p className="label">Selected user</p>
                <strong>{selectedUser.UserID}</strong>
                <span>
                  {selectedUser.UserName} currently has the <b>{selectedUser.Role}</b> role.
                </span>
              </div>
            )}
          <div className="form two-col">
              <Field label="User ID" as="select" value={roleForm.UserID} onChange={onUserSelectionChange}>
                <option value="">Select a user</option>
                {users.map((user) => (
                  <option key={user.id} value={user.UserID}>
                    {user.UserID}
                  </option>
                ))}
              </Field>
              <Field label="Role" as="select" value={roleForm.Role} onChange={onField('Role')}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </Field>
          </div>
          <div className="actions">
            <Button type="button" onClick={updateRole}>
              Update role
            </Button>
          </div>
          {updateStatus.message && <p className={`note ${updateStatus.tone}`}>{updateStatus.message}</p>}
        </div>
      </Panel>

      <Panel
        title="Users"
        subtitle="User accounts and roles"
        right={
          <StatusPill tone={listStatus.tone === 'error' ? 'danger' : listStatus.tone === 'success' ? 'success' : 'neutral'}>
            {listStatus.message || 'Ready'}
          </StatusPill>
        }
      >
            <div className="user-registry-list">
              <div className="table-head user-registry-head">
                <div className="table-cell">User ID</div>
                <div className="table-cell">Name</div>
                <div className="table-cell">Role</div>
                <div className="table-cell">Action</div>
              </div>
              {users.length === 0 ? (
                <div className="table-empty">No users yet.</div>
              ) : (
                users.map((user) => {
                  const isSelected = user.UserID === selectedUserId;
                  return (
                    <article
                      key={user.id}
                      className={`user-registry-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => selectUser(user)}
                    >
                      <div className="table-cell">{user.UserID}</div>
                      <div className="table-cell">{user.UserName}</div>
                      <div className="table-cell">
                        <StatusPill tone={user.Role === 'admin' ? 'success' : 'neutral'}>{user.Role}</StatusPill>
                      </div>
                      <div className="table-cell">
                        <Button
                          type="button"
                          variant={isSelected ? 'primary' : 'ghost'}
                          onClick={(event) => {
                            event.stopPropagation();
                            selectUser(user);
                          }}
                        >
                          {isSelected ? 'Loaded' : 'Select'}
                        </Button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>
          </Panel>
        </div>
    </div>
  );
}
