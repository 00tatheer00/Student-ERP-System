import { useState, useEffect } from 'react';
import api from '../utils/api';

const DEPARTMENTS = ['CS', 'SE', 'AI', 'CY', 'DS', 'IT'];
const PROGRAMS = ['BS', 'MS'];

export default function Students() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filters, setFilters] = useState({ department: '', semester: '', program: '', search: '' });
  const [form, setForm] = useState({
    fullName: '',
    fatherName: '',
    CNIC: '',
    phone: '',
    email: '',
    address: '',
    department: 'CS',
    program: 'BS',
    semester: 1,
    batch: new Date().getFullYear(),
    status: 'active',
  });

  const fetchStudents = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.semester) params.append('semester', filters.semester);
    if (filters.program) params.append('program', filters.program);
    if (filters.search) params.append('search', filters.search);
    api.get(`/students?${params}`)
      .then((res) => {
        setStudents(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudents();
  }, [filters.department, filters.semester, filters.program, filters.search]);


  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/students/${editing._id}`, form);
      } else {
        await api.post('/students', form);
      }
      setShowModal(false);
      setEditing(null);
      resetForm();
      fetchStudents();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving student');
    }
  };

  const resetForm = () => {
    setForm({
      fullName: '',
      fatherName: '',
      CNIC: '',
      phone: '',
      email: '',
      address: '',
      department: 'CS',
      program: 'BS',
      semester: 1,
      batch: new Date().getFullYear(),
      status: 'active',
    });
  };

  const handleEdit = (s) => {
    setEditing(s);
    setForm({
      fullName: s.fullName,
      fatherName: s.fatherName,
      CNIC: s.CNIC,
      phone: s.phone,
      email: s.email,
      address: s.address,
      department: s.department,
      program: s.program,
      semester: s.semester,
      batch: s.batch,
      status: s.status,
    });
    setShowModal(true);
  };

  const handleExport = async () => {
    const params = new URLSearchParams();
    if (filters.department) params.append('department', filters.department);
    if (filters.semester) params.append('semester', filters.semester);
    const res = await api.get(`/students/export?${params}`, { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const openIdCard = async (id) => {
    try {
      const res = await api.get(`/students/${id}/id-card`, { responseType: 'blob' });
      const blob = new Blob([res.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(url), 120000);
    } catch (err) {
      let msg = 'Could not load ID card';
      const data = err.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const j = JSON.parse(text);
          if (j.message) msg = j.message;
        } catch {
          /* ignore */
        }
      } else if (data?.message) msg = data.message;
      alert(msg);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="erp-h1">Students</h1>
          <p className="erp-muted mt-1">Manage records, ID cards, and bulk CSV import/export.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={handleExport} className="erp-btn-secondary">
            Export CSV
          </button>
          <label className="erp-btn-secondary cursor-pointer">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                const fd = new FormData();
                fd.append('file', file);
                try {
                  const res = await api.post('/students/import', fd, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                  });
                  alert(res.data.message);
                  fetchStudents();
                } catch (err) {
                  alert(err.response?.data?.message || 'Import failed');
                }
                e.target.value = '';
              }}
            />
          </label>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              resetForm();
              setShowModal(true);
            }}
            className="erp-btn-accent"
          >
            Add Student
          </button>
        </div>
      </div>

      <div className="erp-toolbar flex-wrap gap-3">
        <input
          type="text"
          placeholder="Search…"
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          className="erp-input w-full min-w-[200px] max-w-xs sm:w-48"
        />
        <select
          value={filters.department}
          onChange={(e) => setFilters({ ...filters, department: e.target.value })}
          className="erp-select w-auto min-w-[140px]"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filters.semester}
          onChange={(e) => setFilters({ ...filters, semester: e.target.value })}
          className="erp-select w-auto min-w-[140px]"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
        <select
          value={filters.program}
          onChange={(e) => setFilters({ ...filters, program: e.target.value })}
          className="erp-select w-auto min-w-[140px]"
        >
          <option value="">All Programs</option>
          {PROGRAMS.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </div>

      <div className="erp-table-shell">
        {loading ? (
          <div className="erp-empty">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Program</th>
                  <th>Sem</th>
                  <th>Batch</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s) => (
                  <tr key={s._id}>
                    <td className="font-mono text-xs font-medium text-zinc-600">{s.studentId}</td>
                    <td className="font-medium text-zinc-900">{s.fullName}</td>
                    <td>{s.department}</td>
                    <td>{s.program}</td>
                    <td>{s.semester}</td>
                    <td>{s.batch}</td>
                    <td>
                      <span className={s.status === 'active' ? 'erp-badge-ok' : 'erp-badge-bad'}>{s.status}</span>
                    </td>
                    <td>
                      <div className="flex flex-wrap gap-3">
                        <button type="button" onClick={() => openIdCard(s._id)} className="erp-link">
                          ID Card
                        </button>
                        <button type="button" onClick={() => handleEdit(s)} className="erp-link text-zinc-600 hover:text-zinc-900">
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="erp-modal-backdrop">
          <div className="erp-modal max-h-[90vh]">
            <div className="p-6 sm:p-8">
              <h2 className="erp-h1 mb-6">{editing ? 'Edit student' : 'Add student'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="erp-label">Full name</label>
                    <input
                      type="text"
                      value={form.fullName}
                      onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="erp-label">Father name</label>
                    <input
                      type="text"
                      value={form.fatherName}
                      onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="erp-label">CNIC</label>
                    <input
                      type="text"
                      value={form.CNIC}
                      onChange={(e) => setForm({ ...form, CNIC: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>
                  <div>
                    <label className="erp-label">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="erp-input"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="erp-label">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="erp-input"
                    required
                  />
                </div>
                <div>
                  <label className="erp-label">Address</label>
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="erp-input"
                    required
                  />
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="erp-label">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="erp-select"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>{d}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Program</label>
                    <select
                      value={form.program}
                      onChange={(e) => setForm({ ...form, program: e.target.value })}
                      className="erp-select"
                    >
                      {PROGRAMS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="erp-label">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                      className="erp-input"
                    />
                  </div>
                  <div>
                    <label className="erp-label">Batch</label>
                    <input
                      type="number"
                      min="2020"
                      max="2030"
                      value={form.batch}
                      onChange={(e) => setForm({ ...form, batch: parseInt(e.target.value) })}
                      className="erp-input"
                    />
                  </div>
                </div>
                {editing && (
                  <div>
                    <label className="erp-label">Status</label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="erp-select"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                )}
                <div className="flex justify-end gap-2 border-t border-zinc-100 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn-accent">
                    {editing ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
