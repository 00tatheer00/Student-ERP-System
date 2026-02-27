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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Courses</h1>
        <button
          onClick={() => {
            setEditing(null);
            setForm({ courseCode: '', courseName: '', department: 'CS', semester: 1, creditHours: 3 });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          Add Course
        </button>
      </div>

      <div className="bg-white rounded-xl shadow p-4 flex gap-4">
        <select
          value={filter.department}
          onChange={(e) => setFilter({ ...filter, department: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          value={filter.semester}
          onChange={(e) => setFilter({ ...filter, semester: e.target.value })}
          className="px-3 py-2 border rounded-lg"
        >
          <option value="">All Semesters</option>
          {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
            <option key={s} value={s}>Semester {s}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4">Code</th>
                <th className="text-left p-4">Name</th>
                <th className="text-left p-4">Department</th>
                <th className="text-left p-4">Semester</th>
                <th className="text-left p-4">Credits</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c._id} className="border-t hover:bg-slate-50">
                  <td className="p-4 font-mono">{c.courseCode}</td>
                  <td className="p-4">{c.courseName}</td>
                  <td className="p-4">{c.department}</td>
                  <td className="p-4">{c.semester}</td>
                  <td className="p-4">{c.creditHours}</td>
                  <td className="p-4">
                    <button
                      onClick={() => handleEdit(c)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <h2 className="text-xl font-bold mb-4">{editing ? 'Edit Course' : 'Add Course'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Course Code</label>
                <input
                  type="text"
                  value={form.courseCode}
                  onChange={(e) => setForm({ ...form, courseCode: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  disabled={!!editing}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Course Name</label>
                <input
                  type="text"
                  value={form.courseName}
                  onChange={(e) => setForm({ ...form, courseName: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Department</label>
                  <select
                    value={form.department}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Semester</label>
                  <input
                    type="number"
                    min="1"
                    max="8"
                    value={form.semester}
                    onChange={(e) => setForm({ ...form, semester: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credit Hours</label>
                <input
                  type="number"
                  min="1"
                  max="6"
                  value={form.creditHours}
                  onChange={(e) => setForm({ ...form, creditHours: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  {editing ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
