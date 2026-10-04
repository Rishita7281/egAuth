import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Field, Panel, SectionHeader } from '../../components/Ui';
import { deptDeleteEmployee, deptUpdateEmployee } from '../../utils/apiClient';
import { getTokenForRole } from '../../utils/auth';

export default function DepartmentEmployeeEdit() {
  const { empId } = useParams();
  const [token] = useState(() => getTokenForRole('department'));
  const [updateForm, setUpdateForm] = useState({
    EmpID: '',
    EmpName: '',
    EmpContact: '',
    EmpDesignation: '',
    EmpPosting: '',
    EmpSignature: '',
  });
  const [deleteEmpId, setDeleteEmpId] = useState('');
  const [updateStatus, setUpdateStatus] = useState('');
  const [deleteStatus, setDeleteStatus] = useState('');

  useEffect(() => {
    const decodedEmpId = decodeURIComponent(empId || '');
    setUpdateForm((prev) => ({ ...prev, EmpID: decodedEmpId }));
    setDeleteEmpId(decodedEmpId);
  }, [empId]);

  const onField = (setter, key) => (event) => setter((prev) => ({ ...prev, [key]: event.target.value }));

  const handleUpdate = async () => {
    setUpdateStatus('Updating employee...');
    try {
      await deptUpdateEmployee(token, updateForm);
      setUpdateStatus('Employee updated');
    } catch (err) {
      setUpdateStatus(err.message);
    }
  };

  const handleDelete = async () => {
    setDeleteStatus('Deleting employee...');
    try {
      await deptDeleteEmployee(token, { EmpID: deleteEmpId });
      setDeleteStatus('Employee deleted');
    } catch (err) {
      setDeleteStatus(err.message);
    }
  };

  return (
    <div className="grid compact-grid">
      <Panel title="Edit Employee" subtitle="Update employee details or remove the account">
        <div className="stack">
          <SectionHeader title="Update fields" right={<Button as={Link} to="/department/employees" variant="ghost">Back to list</Button>} />
          <div className="form two-col">
            <Field label="Emp ID" value={updateForm.EmpID} onChange={onField(setUpdateForm, 'EmpID')} />
            <Field label="Emp Name" value={updateForm.EmpName} onChange={onField(setUpdateForm, 'EmpName')} />
            <Field label="Emp Contact" value={updateForm.EmpContact} onChange={onField(setUpdateForm, 'EmpContact')} />
            <Field label="Designation" value={updateForm.EmpDesignation} onChange={onField(setUpdateForm, 'EmpDesignation')} />
            <Field label="Location" value={updateForm.EmpPosting} onChange={onField(setUpdateForm, 'EmpPosting')} />
            <Field label="Signature URL" value={updateForm.EmpSignature} onChange={onField(setUpdateForm, 'EmpSignature')} />
          </div>
          <div className="actions">
            <Button type="button" onClick={handleUpdate}>
              Save update
            </Button>
          </div>
          {updateStatus && <p className="note">{updateStatus}</p>}
        </div>

        <div className="stack">
          <SectionHeader title="Delete employee" subtitle="Removes employee from this department" />
          <div className="form">
            <Field label="Emp ID" value={deleteEmpId} onChange={(event) => setDeleteEmpId(event.target.value)} />
          </div>
          <div className="actions">
            <Button type="button" variant="ghost" onClick={handleDelete}>
              Delete employee
            </Button>
          </div>
          {deleteStatus && <p className="note">{deleteStatus}</p>}
        </div>
      </Panel>
    </div>
  );
}
