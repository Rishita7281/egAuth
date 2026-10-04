import { useEffect, useState } from 'react';
import { Button, Field, Panel, SectionHeader, StatusPill } from '../../components/Ui';
import { adminAddDept, adminDeleteDept, adminListDepts, adminUpdateDept } from '../../utils/apiClient';
import { getTokenForRole } from '../../utils/auth';

async function loadDepartmentRegistry(token) {
  const data = await adminListDepts(token);
  return (data.departments || []).map((dept) => ({
    id: dept._id,
    DeptID: dept.DeptID,
    DeptName: dept.DeptName,
  }));
}

export default function AdminDepartments() {
  const [token] = useState(() => getTokenForRole('admin'));
  const [departments, setDepartments] = useState([]);
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ DeptName: '', DeptID: '', DeptPass: '' });
  const [updateForm, setUpdateForm] = useState({ DeptID: '', DeptName: '', DeptPass: '' });
  const [deleteDeptId, setDeleteDeptId] = useState('');

  const [createStatus, setCreateStatus] = useState({ tone: '', message: '' });
  const [updateStatus, setUpdateStatus] = useState({ tone: '', message: '' });
  const [deleteStatus, setDeleteStatus] = useState({ tone: '', message: '' });
  const [listStatus, setListStatus] = useState({ tone: '', message: '' });

  const onField = (setter, key) => (event) => setter((prev) => ({ ...prev, [key]: event.target.value }));

  const selectedDepartment = departments.find((dept) => dept.DeptID === selectedDeptId) || null;

  const setStatus = (setter, tone, message) => setter({ tone, message });

  const openCreateModal = () => {
    setCreateStatus({ tone: '', message: '' });
    setCreateModalOpen(true);
  };

  const closeCreateModal = () => {
    setCreateModalOpen(false);
  };

  const selectDepartment = (dept) => {
    setSelectedDeptId(dept.DeptID);
    setUpdateForm({ DeptID: dept.DeptID, DeptName: dept.DeptName, DeptPass: '' });
    setDeleteDeptId(dept.DeptID);
  };

  const syncSelectedDepartment = (rows, preferredDeptId = '') => {
    const targetDeptId = preferredDeptId || selectedDeptId;
    if (!rows.length) {
      setSelectedDeptId('');
      setUpdateForm({ DeptID: '', DeptName: '', DeptPass: '' });
      setDeleteDeptId('');
      return;
    }

    if (!targetDeptId) {
      return;
    }

    const match = rows.find((dept) => dept.DeptID === targetDeptId);
    if (match) {
      selectDepartment(match);
      return;
    }

    setSelectedDeptId('');
    setUpdateForm({ DeptID: '', DeptName: '', DeptPass: '' });
    setDeleteDeptId('');
  };

  const fetchDepartments = async (preferredDeptId = '') => {
    setStatus(setListStatus, '', 'Refreshing department registry...');
    try {
      const rows = await loadDepartmentRegistry(token);
      setDepartments(rows);
      syncSelectedDepartment(rows, preferredDeptId);
      setStatus(setListStatus, 'success', `Registry synced. ${rows.length} department${rows.length === 1 ? '' : 's'} available.`);
    } catch (err) {
      setStatus(setListStatus, 'error', err.message);
    }
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadInitialDepartments = async () => {
      setStatus(setListStatus, '', 'Refreshing department registry...');
      try {
        const rows = await loadDepartmentRegistry(token);
        if (cancelled) return;
        setDepartments(rows);
        setStatus(setListStatus, 'success', `Registry synced. ${rows.length} department${rows.length === 1 ? '' : 's'} available.`);
      } catch (err) {
        if (cancelled) return;
        setStatus(setListStatus, 'error', err.message);
      }
    };

    loadInitialDepartments();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const createDept = async () => {
    const DeptName = createForm.DeptName.trim();
    const DeptID = createForm.DeptID.trim();
    const DeptPass = createForm.DeptPass.trim();

    if (!DeptName || !DeptID || !DeptPass) {
      setStatus(setCreateStatus, 'error', 'Dept name, dept ID, and password are all required.');
      return;
    }

    setStatus(setCreateStatus, '', 'Creating department...');
    try {
      await adminAddDept(token, { DeptName, DeptID, DeptPass });
      setCreateForm({ DeptName: '', DeptID: '', DeptPass: '' });
      setStatus(setCreateStatus, 'success', `${DeptName} is ready.`);
      await fetchDepartments(DeptID);
      setCreateModalOpen(false);
    } catch (err) {
      setStatus(setCreateStatus, 'error', err.message);
    }
  };

  const updateDept = async () => {
    const DeptID = updateForm.DeptID.trim();
    const DeptName = updateForm.DeptName.trim();
    const DeptPass = updateForm.DeptPass.trim();

    if (!DeptID) {
      setStatus(setUpdateStatus, 'error', 'Choose a department or enter a department ID.');
      return;
    }

    if (!DeptName && !DeptPass) {
      setStatus(setUpdateStatus, 'error', 'Provide a new department name or a new password.');
      return;
    }

    setStatus(setUpdateStatus, '', 'Updating department...');
    try {
      await adminUpdateDept(token, { DeptID, DeptName, DeptPass });
      setUpdateStatus({ tone: 'success', message: `${DeptID} updated successfully.` });
      setUpdateForm((prev) => ({ ...prev, DeptPass: '' }));
      await fetchDepartments(DeptID);
    } catch (err) {
      setStatus(setUpdateStatus, 'error', err.message);
    }
  };

  const deleteDept = async () => {
    const DeptID = deleteDeptId.trim();
    if (!DeptID) {
      setStatus(setDeleteStatus, 'error', 'Select a department before deleting it.');
      return;
    }

    setStatus(setDeleteStatus, '', 'Deleting department...');
    try {
      await adminDeleteDept(token, { DeptID });
      setDeleteDeptId('');
      setSelectedDeptId((prev) => (prev === DeptID ? '' : prev));
      setUpdateForm((prev) => (prev.DeptID === DeptID ? { DeptID: '', DeptName: '', DeptPass: '' } : prev));
      setStatus(setDeleteStatus, 'success', `${DeptID} deleted.`);
      await fetchDepartments();
    } catch (err) {
      setStatus(setDeleteStatus, 'error', err.message);
    }
  };

  return (
    <div className="page-stack admin-departments-page">
      <Panel
        title="Department Management"
        subtitle="Operate the full department lifecycle from one control surface."
        right={<StatusPill tone={selectedDepartment ? 'success' : 'neutral'}>{selectedDepartment ? `Selected: ${selectedDepartment.DeptID}` : 'No department selected'}</StatusPill>}
      >
        <div className="admin-departments-layout">
          <div className="admin-departments-sidebar">
            <div className="admin-metrics-grid">
              <div className="admin-metric-card">
                <p className="label">Registry</p>
                <strong>{departments.length}</strong>
                <span>departments tracked</span>
              </div>
              <div className="admin-metric-card">
                <p className="label">Active Target</p>
                <strong>{selectedDepartment ? selectedDepartment.DeptID : '--'}</strong>
                <span>{selectedDepartment ? selectedDepartment.DeptName : 'Pick a row to edit fast'}</span>
              </div>
            </div>

            <section className="admin-action-card create">
              <SectionHeader title="Create department" subtitle="Open a focused popup to provision a new department account." />
              <div className="admin-action-copy">
                <p>Keep the workspace clean and use the modal only when you want to add a new department.</p>
              </div>
              <div className="actions">
                <Button type="button" onClick={openCreateModal}>
                  Open creator
                </Button>
              </div>
            </section>

            <section className="admin-action-card update">
              <SectionHeader
                title="Update department"
                subtitle="Rename a department or rotate its password. Select a row to prefill the form."
              />
              <div className="form">
                <Field label="Department ID" value={updateForm.DeptID} placeholder="DPT-001" onChange={onField(setUpdateForm, 'DeptID')} />
                <div className="form two-col admin-inline-fields">
                  <Field label="New department name" value={updateForm.DeptName} placeholder="Public Safety" onChange={onField(setUpdateForm, 'DeptName')} />
                  <Field label="New password" type="password" value={updateForm.DeptPass} placeholder="Leave blank to keep current password" onChange={onField(setUpdateForm, 'DeptPass')} />
                </div>
              </div>
              <div className="actions">
                <Button type="button" onClick={updateDept}>
                  Save changes
                </Button>
              </div>
              {updateStatus.message && <p className={`note ${updateStatus.tone}`}>{updateStatus.message}</p>}
            </section>

            <section className="admin-action-card delete">
              <SectionHeader
                title="Delete department"
                subtitle="Use with care. This also removes employees and related scan history for that department."
              />
              <div className="form">
                <Field label="Department ID" value={deleteDeptId} placeholder="DPT-002" onChange={(event) => setDeleteDeptId(event.target.value)} />
              </div>
              <div className="actions">
                <Button type="button" variant="danger" onClick={deleteDept}>
                  Delete department
                </Button>
              </div>
              {deleteStatus.message && <p className={`note ${deleteStatus.tone}`}>{deleteStatus.message}</p>}
            </section>
          </div>

          <div className="admin-departments-main">
            <Panel
              title="Department Registry"
              subtitle="Browse current departments and click any row to populate the update and delete tools."
              right={
                <StatusPill tone={listStatus.tone === 'error' ? 'danger' : listStatus.tone === 'success' ? 'success' : 'neutral'}>
                  {listStatus.message || 'Ready'}
                </StatusPill>
              }
            >
              <div className="department-registry-list">
                {departments.length === 0 ? (
                  <div className="table-empty">No departments yet.</div>
                ) : (
                  departments.map((dept) => {
                    const isSelected = dept.DeptID === selectedDeptId;
                    return (
                      <article
                        key={dept.id}
                        className={`department-registry-item ${isSelected ? 'selected' : ''}`}
                        onClick={() => selectDepartment(dept)}
                      >
                        <div className="department-registry-copy">
                          <p className="department-registry-id">{dept.DeptID}</p>
                          <h4>{dept.DeptName}</h4>
                          <p>{isSelected ? 'Loaded into update and delete tools.' : 'Click to edit, rotate password, or delete.'}</p>
                        </div>
                        <div className="department-registry-actions">
                          <Button
                            type="button"
                            variant={isSelected ? 'primary' : 'ghost'}
                            onClick={(event) => {
                              event.stopPropagation();
                              selectDepartment(dept);
                            }}
                          >
                            {isSelected ? 'Loaded' : 'Load'}
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
      </Panel>

      {createModalOpen && (
        <div className="admin-modal-backdrop" onClick={closeCreateModal}>
          <div className="admin-modal" role="dialog" aria-modal="true" aria-labelledby="create-department-title" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <p className="label">Department Creator</p>
                <h2 id="create-department-title">Create department</h2>
                <p className="section-subtitle">Provision a fresh department account with an ID and password.</p>
              </div>
              <button type="button" className="admin-modal-close" onClick={closeCreateModal} aria-label="Close create department popup">
                Close
              </button>
            </div>

            <div className="form">
              <Field label="Department name" value={createForm.DeptName} placeholder="Civil Registry" onChange={onField(setCreateForm, 'DeptName')} />
              <div className="form two-col admin-inline-fields">
                <Field label="Department ID" value={createForm.DeptID} placeholder="DPT-003" onChange={onField(setCreateForm, 'DeptID')} />
                <Field label="Department password" type="password" value={createForm.DeptPass} placeholder="Dept@123" onChange={onField(setCreateForm, 'DeptPass')} />
              </div>
            </div>

            <div className="actions">
              <Button type="button" variant="ghost" onClick={closeCreateModal}>
                Cancel
              </Button>
              <Button type="button" onClick={createDept}>
                Create department
              </Button>
            </div>
            {createStatus.message && <p className={`note ${createStatus.tone}`}>{createStatus.message}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
