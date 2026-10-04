import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button, Field, Panel, SectionHeader, StatusPill } from '../../components/Ui';
import { deptAddEmployee, deptListEmployees, deptSetEmployeeStatus } from '../../utils/apiClient';
import { getSessionForRole, getTokenForRole } from '../../utils/auth';

async function loadEmployees(token) {
  const data = await deptListEmployees(token);
  return (data.employees || []).map((emp) => ({
    id: emp._id,
    EmpID: emp.EmpID,
    EmpName: emp.EmpName,
    EmpDesignation: emp.EmpDesignation,
    EmpPosting: emp.EmpPosting,
    EmpContact: emp.EmpContact,
    EmpActive: Boolean(emp.EmpActive),
  }));
}

export default function DepartmentEmployeesList() {
  const [token] = useState(() => getTokenForRole('department'));
  const departmentSession = getSessionForRole('department');
  const [employees, setEmployees] = useState([]);
  const [selectedEmpId, setSelectedEmpId] = useState('');
  const [createForm, setCreateForm] = useState({
    EmpID: '',
    EmpName: '',
    EmpPassword: '',
    EmpContact: '',
    EmpDesignation: '',
    EmpPosting: '',
  });
  const [statusForm, setStatusForm] = useState({ EmpID: '', EmpActive: 'true' });

  const [createStatus, setCreateStatus] = useState({ tone: '', message: '' });
  const [listStatus, setListStatus] = useState({ tone: '', message: '' });
  const [statusUpdateState, setStatusUpdateState] = useState({ tone: '', message: '' });

  const onField = (setter, key) => (event) => setter((prev) => ({ ...prev, [key]: event.target.value }));

  const selectedEmployee = employees.find((emp) => emp.EmpID === selectedEmpId) || null;
  const activeCount = employees.filter((employee) => employee.EmpActive).length;
  const inactiveCount = employees.length - activeCount;
  const uniqueLocations = new Set(employees.map((employee) => employee.EmpPosting).filter(Boolean)).size;

  const setStatus = (setter, tone, message) => setter({ tone, message });

  const selectEmployee = (employee) => {
    setSelectedEmpId(employee.EmpID);
    setStatusForm({ EmpID: employee.EmpID, EmpActive: employee.EmpActive ? 'true' : 'false' });
    setStatus(setStatusUpdateState, '', '');
  };

  const syncSelectedEmployee = (rows, preferredEmpId = '') => {
    const targetEmpId = preferredEmpId || selectedEmpId;

    if (!rows.length) {
      setSelectedEmpId('');
      setStatusForm({ EmpID: '', EmpActive: 'true' });
      return;
    }

    if (!targetEmpId) {
      return;
    }

    const match = rows.find((employee) => employee.EmpID === targetEmpId);
    if (match) {
      selectEmployee(match);
      return;
    }

    setSelectedEmpId('');
    setStatusForm({ EmpID: '', EmpActive: 'true' });
  };

  const onStatusEmployeeChange = (event) => {
    const nextEmpId = event.target.value;
    if (!nextEmpId) {
      setSelectedEmpId('');
      setStatusForm({ EmpID: '', EmpActive: 'true' });
      setStatus(setStatusUpdateState, '', '');
      return;
    }

    const match = employees.find((employee) => employee.EmpID === nextEmpId);
    if (match) {
      selectEmployee(match);
      return;
    }

    setSelectedEmpId('');
    setStatusForm((prev) => ({ ...prev, EmpID: nextEmpId }));
    setStatus(setStatusUpdateState, '', '');
  };

  const fetchEmployees = async (preferredEmpId = '') => {
    setStatus(setListStatus, '', 'Loading employees...');
    try {
      const rows = await loadEmployees(token);
      setEmployees(rows);
      syncSelectedEmployee(rows, preferredEmpId);
      setStatus(setListStatus, 'success', `Employees loaded. ${rows.length} record${rows.length === 1 ? '' : 's'} in directory.`);
    } catch (err) {
      setStatus(setListStatus, 'error', err.message);
    }
  };

  useEffect(() => {
    if (!token) return;

    let cancelled = false;

    const loadInitialEmployees = async () => {
      setStatus(setListStatus, '', 'Loading employees...');
      try {
        const rows = await loadEmployees(token);
        if (cancelled) return;
        setEmployees(rows);
        setStatus(setListStatus, 'success', `Employees loaded. ${rows.length} record${rows.length === 1 ? '' : 's'} in directory.`);
      } catch (err) {
        if (cancelled) return;
        setStatus(setListStatus, 'error', err.message);
      }
    };

    loadInitialEmployees();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const handleCreate = async () => {
    const payload = {
      EmpID: createForm.EmpID.trim(),
      EmpName: createForm.EmpName.trim(),
      EmpPassword: createForm.EmpPassword.trim(),
      EmpContact: createForm.EmpContact.trim(),
      EmpDesignation: createForm.EmpDesignation.trim(),
      EmpPosting: createForm.EmpPosting.trim(),
    };

    if (Object.values(payload).some((value) => !value)) {
      setStatus(setCreateStatus, 'error', 'All employee fields are required.');
      return;
    }

    setStatus(setCreateStatus, '', 'Creating employee...');
    try {
      await deptAddEmployee(token, payload);
      setCreateForm({
        EmpID: '',
        EmpName: '',
        EmpPassword: '',
        EmpContact: '',
        EmpDesignation: '',
        EmpPosting: '',
      });
      setStatus(setCreateStatus, 'success', `${payload.EmpName} added to your department.`);
      await fetchEmployees(payload.EmpID);
    } catch (err) {
      setStatus(setCreateStatus, 'error', err.message);
    }
  };

  const handleStatusUpdate = async () => {
    const EmpID = statusForm.EmpID.trim();
    if (!EmpID) {
      setStatus(setStatusUpdateState, 'error', 'Select an employee first.');
      return;
    }

    setStatus(setStatusUpdateState, '', 'Updating employee status...');
    try {
      await deptSetEmployeeStatus(token, { EmpID, EmpActive: statusForm.EmpActive === 'true' });
      setStatus(setStatusUpdateState, 'success', `${EmpID} status updated.`);
      await fetchEmployees(EmpID);
    } catch (err) {
      setStatus(setStatusUpdateState, 'error', err.message);
    }
  };

  return (
    <div className="page-stack department-employees-page">
      <Panel
        title="Department Dashboard"
        subtitle="Quick session context so you always know which department workspace is open."
      >
        <div className="department-dashboard-grid">
          <div className="admin-metric-card department-session-card">
            <p className="label">Logged in department</p>
            <strong>{departmentSession?.EmpDeptName || 'Unknown department'}</strong>
            <span>{departmentSession?.EmpDeptID ? `Department ID ${departmentSession.EmpDeptID}` : 'Department ID unavailable'}</span>
          </div>
          <div className="admin-metric-card">
            <p className="label">Employees in directory</p>
            <strong>{employees.length}</strong>
            <span>Total employee accounts currently linked to this department.</span>
          </div>
          <div className="admin-metric-card">
            <p className="label">Active access</p>
            <strong>{activeCount}</strong>
            <span>{inactiveCount} employee{inactiveCount === 1 ? '' : 's'} currently inactive.</span>
          </div>
          <div className="admin-metric-card">
            <p className="label">Locations covered</p>
            <strong>{uniqueLocations}</strong>
            <span>Distinct employee locations registered under this department.</span>
          </div>
        </div>
      </Panel>

      <Panel
        title="Employees"
        subtitle="Department employee directory. Select a row to update status or jump into the full editor."
        right={
          <StatusPill tone={listStatus.tone === 'error' ? 'danger' : listStatus.tone === 'success' ? 'success' : 'neutral'}>
            {listStatus.message || 'Ready'}
          </StatusPill>
        }
      >
        <div className="employee-registry-list">
          <div className="table-head employee-registry-head">
            <div className="table-cell">Emp ID</div>
            <div className="table-cell">Name</div>
            <div className="table-cell">Designation</div>
            <div className="table-cell">Location</div>
            <div className="table-cell">Contact</div>
            <div className="table-cell">Status</div>
            <div className="table-cell">Action</div>
          </div>
          {employees.length === 0 ? (
            <div className="table-empty">No employees yet.</div>
          ) : (
            employees.map((employee) => {
              const isSelected = employee.EmpID === selectedEmpId;
              return (
                <article
                  key={employee.id}
                  className={`employee-registry-item ${isSelected ? 'selected' : ''}`}
                  onClick={() => selectEmployee(employee)}
                >
                  <div className="table-cell">{employee.EmpID}</div>
                  <div className="table-cell">{employee.EmpName}</div>
                  <div className="table-cell">{employee.EmpDesignation}</div>
                  <div className="table-cell">{employee.EmpPosting}</div>
                  <div className="table-cell">{employee.EmpContact}</div>
                  <div className="table-cell">
                    <StatusPill tone={employee.EmpActive ? 'success' : 'danger'}>{employee.EmpActive ? 'active' : 'inactive'}</StatusPill>
                  </div>
                  <div className="table-cell employee-registry-actions">
                    <Button
                      type="button"
                      variant={isSelected ? 'primary' : 'ghost'}
                      onClick={(event) => {
                        event.stopPropagation();
                        selectEmployee(employee);
                      }}
                    >
                      {isSelected ? 'Loaded' : 'Select'}
                    </Button>
                    <Button
                      as={Link}
                      to={`/department/employees/${encodeURIComponent(employee.EmpID)}/edit`}
                      variant="ghost"
                      onClick={(event) => event.stopPropagation()}
                    >
                      Edit
                    </Button>
                  </div>
                </article>
              );
            })
          )}
        </div>
      </Panel>

      <div className="grid department-employee-tools">
        <Panel title="Create Employee" subtitle="Add a new employee to your department">
          <div className="form two-col">
            <Field label="Emp ID" value={createForm.EmpID} onChange={onField(setCreateForm, 'EmpID')} />
            <Field label="Emp Name" value={createForm.EmpName} onChange={onField(setCreateForm, 'EmpName')} />
            <Field label="Emp Password" type="password" value={createForm.EmpPassword} onChange={onField(setCreateForm, 'EmpPassword')} />
            <Field label="Emp Contact" value={createForm.EmpContact} onChange={onField(setCreateForm, 'EmpContact')} />
            <Field label="Designation" value={createForm.EmpDesignation} onChange={onField(setCreateForm, 'EmpDesignation')} />
            <Field label="Location" value={createForm.EmpPosting} onChange={onField(setCreateForm, 'EmpPosting')} />
          </div>
          <div className="actions">
            <Button type="button" onClick={handleCreate}>
              Add employee
            </Button>
          </div>
          {createStatus.message && <p className={`note ${createStatus.tone}`}>{createStatus.message}</p>}
        </Panel>

        <Panel
          title="Employee Status"
          subtitle="Activate or deactivate employee access"
          right={<StatusPill tone={selectedEmployee ? 'success' : 'neutral'}>{selectedEmployee ? `Selected: ${selectedEmployee.EmpID}` : 'No employee selected'}</StatusPill>}
        >
          <div className="stack">
            <SectionHeader title="Set status" subtitle="Use the employee list above to preload this editor." />
            <div className="form two-col">
              <Field label="Employee" as="select" value={statusForm.EmpID} onChange={onStatusEmployeeChange}>
                <option value="">Select an employee</option>
                {employees.map((employee) => (
                  <option key={employee.id} value={employee.EmpID}>
                    {employee.EmpID} - {employee.EmpName}
                  </option>
                ))}
              </Field>
              <Field label="Access state" as="select" value={statusForm.EmpActive} onChange={onField(setStatusForm, 'EmpActive')}>
                <option value="true">active</option>
                <option value="false">inactive</option>
              </Field>
            </div>
            {selectedEmployee && (
              <div className="admin-metric-card employee-status-summary">
                <p className="label">Current assignment</p>
                <strong>{selectedEmployee.EmpName}</strong>
                <span>
                  {selectedEmployee.EmpDesignation} in {selectedEmployee.EmpPosting}. Current access is{' '}
                  <b>{selectedEmployee.EmpActive ? 'active' : 'inactive'}</b>.
                </span>
              </div>
            )}
            <div className="actions">
              <Button type="button" onClick={handleStatusUpdate}>
                Update status
              </Button>
            </div>
            {statusUpdateState.message && <p className={`note ${statusUpdateState.tone}`}>{statusUpdateState.message}</p>}
          </div>
        </Panel>
      </div>
    </div>
  );
}
