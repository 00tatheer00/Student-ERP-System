import { useState, useEffect } from 'react';
import api from '../utils/api';

const DEPARTMENTS = ['CS', 'SE', 'AI', 'CY', 'DS', 'IT'];

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filter, setFilter] = useState({ department: '', semester: '' });
  const [form, setForm] = useState({
    courseCode: '',
    courseName: '',
    department: 'CS',
    semester: 1,
    creditHours: 3,
  });

  const fetchCourses = () => {
    const params = new URLSearchParams();
    if (filter.department) params.append('department', filter.department);
    if (filter.semester) params.append('semester', filter.semester);
    api.get(`/courses?${params}`).then((res) => {
      setCourses(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editing) {
        await api.put(`/courses/${editing._id}`, form);
      } else {
        await api.post('/courses', form);
      }
      setShowModal(false);
      setEditing(null);
      setForm({ courseCode: '', courseName: '', department: 'CS', semester: 1, creditHours: 3 });
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving course');
    }
  };

  const handleEdit = (c) => {
    setEditing(c);
    setForm({
      courseCode: c.courseCode,
      courseName: c.courseName,
      department: c.department,
      semester: c.semester,
      creditHours: c.creditHours,
    });
    setShowModal(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="erp-h1">Courses</h1>
          <p className="erp-muted mt-1">Catalog by department and semester.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditing(null);
            setForm({ courseCode: '', courseName: '', department: 'CS', semester: 1, creditHours: 3 });
            setShowModal(true);
          }}
          className="erp-btn-accent"
        >
          Add course
        </button>
      </div>

      <div className="erp-toolbar gap-3">
        <select
          value={filter.department}
          onChange={(e) => setFilter({ ...filter, department: e.target.value })}
          className="erp-select w-auto min-w-[160px]"
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
        <select
          value={filter.semester}
          onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
          className="erp-select w-auto min-w-[160px]"
        >
          <option value="">All semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>
              Semester {s}
            </option>
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
                  <th>Code</th>
                  <th>Name</th>
                  <th>Department</th>
                  <th>Semester</th>
                  <th>Credits</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {courses.map((c) => (
                  <tr key={c._id}>
                    <td className="font-mono text-xs font-semibold">{c.courseCode}</td>
                    <td className="font-medium text-zinc-900">{c.courseName}</td>
                    <td>{c.department}</td>
                    <td>{c.semester}</td>
                    <td>{c.creditHours}</td>
                    <td className="text-right">
                      <button type="button" onClick={() => handleEdit(c)} className="erp-link">
                        Edit
                      </button>
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
          <div className="erp-modal erp-modal-sm">
            <div className="p-6 sm:p-8">
              <h2 className="erp-h1 mb-6">{editing ? 'Edit course' : 'Add course'}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="erp-label">Course code</label>
                  <input
                    type="text"
                    value={form.courseCode}
                    onChange={(e) => setForm({ ...form, courseCode: e.target.value.toUpperCase() })}
                    className="erp-input mt-1"
                    required
                    disabled={!!editing}
                  />
                </div>
                <div>
                  <label className="erp-label">Course name</label>
                  <input
                    type="text"
                    value={form.courseName}
                    onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                    className="erp-input mt-1"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="erp-label">Department</label>
                    <select
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="erp-select mt-1"
                    >
                      {DEPARTMENTS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="erp-label">Semester</label>
                    <input
                      type="number"
                      min="1"
                      max="8"
                      value={form.semester}
                      onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                      className="erp-input mt-1"
                    />
                  </div>
                </div>
                <div>
                  <label className="erp-label">Credit hours</label>
                  <input
                    type="number"
                    min="1"
                    max="6"
                    value={form.creditHours}
                    onChange={(e) => setForm({ ...form, creditHours: parseInt(e.target.value) })}
                    className="erp-input mt-1"
                  />
                </div>
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
