import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Results() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    studentId: '',
    semester: 1,
    courses: [{ courseCode: '', marks: 0, grade: 'A', creditHours: 3 }],
  });

  useEffect(() => {
    api.get('/students').then((res) => setStudents(res.data));
    api.get('/courses').then((res) => setCourses(res.data));
    api.get('/results').then((res) => {
      setResults(res.data);
      setLoading(false);
    });
  }, []);

  const marksToGrade = (marks) => {
    if (marks >= 85) return 'A';
    if (marks >= 70) return 'B';
    if (marks >= 55) return 'C';
    if (marks >= 40) return 'D';
    return 'F';
  };

  const addCourse = () => {
    setForm({
      ...form,
      courses: [...form.courses, { courseCode: '', marks: 0, grade: 'A', creditHours: 3 }],
    });
  };

  const updateCourse = (i, field, value) => {
    const updated = [...form.courses];
    updated[i] = { ...updated[i], [field]: value };
    if (field === 'marks') {
      updated[i].grade = marksToGrade(parseInt(value) || 0);
    }
    if (field === 'courseCode') {
      const c = courses.find((co) => co.courseCode === value);
      if (c) updated[i].creditHours = c.creditHours;
    }
    setForm({ ...form, courses: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/results', form);
      alert('Results saved successfully');
      setShowModal(false);
      setForm({ studentId: '', semester: 1, courses: [{ courseCode: '', marks: 0, grade: 'A', creditHours: 3 }] });
      api.get('/results').then((res) => setResults(res.data));
    } catch (err) {
      alert(err.response?.data?.message || 'Error saving results');
    }
  };

  const downloadTranscript = async (studentId) => {
    try {
      const res = await api.get(`/results/transcript/${studentId}`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `transcript-${studentId}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to download transcript');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Results</h1>
        <button
          onClick={() => {
            setForm({
              studentId: '',
              semester: 1,
              courses: [{ courseCode: '', marks: 0, grade: 'A', creditHours: 3 }],
            });
            setShowModal(true);
          }}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
        >
          Enter Results
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-4">Student</th>
                <th className="text-left p-4">Semester</th>
                <th className="text-left p-4">GPA</th>
                <th className="text-left p-4">CGPA</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r) => (
                <tr key={r._id} className="border-t hover:bg-slate-50">
                  <td className="p-4">
                    {r.studentId?.studentId || r.studentId} - {r.studentId?.fullName || '-'}
                  </td>
                  <td className="p-4">{r.semester}</td>
                  <td className="p-4">{r.GPA?.toFixed(2) || '-'}</td>
                  <td className="p-4">{r.CGPA?.toFixed(2) || '-'}</td>
                  <td className="p-4">
                    <button
                      onClick={() => downloadTranscript(r.studentId?._id || r.studentId)}
                      className="text-blue-600 hover:underline text-sm"
                    >
                      Transcript PDF
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
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <h2 className="text-xl font-bold mb-4">Enter Results</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Student</label>
                <select
                  value={form.studentId}
                  onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Student</option>
                  {students.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.studentId} - {s.fullName}
                    </option>
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
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium">Courses</label>
                <button type="button" onClick={addCourse} className="text-blue-600 text-sm">
                  + Add Course
                </button>
              </div>
              {form.courses.map((c, i) => (
                <div key={i} className="grid grid-cols-4 gap-2 p-2 bg-slate-50 rounded">
                  <select
                    value={c.courseCode}
                    onChange={(e) => updateCourse(i, 'courseCode', e.target.value)}
                    className="px-2 py-1 border rounded"
                    required
                  >
                    <option value="">Course</option>
                    {courses.map((co) => (
                      <option key={co._id} value={co.courseCode}>
                        {co.courseCode}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    placeholder="Marks"
                    value={c.marks}
                    onChange={(e) => updateCourse(i, 'marks', e.target.value)}
                    className="px-2 py-1 border rounded"
                  />
                  <input
                    type="text"
                    value={c.grade}
                    readOnly
                    className="px-2 py-1 border rounded bg-slate-100"
                  />
                  <input
                    type="number"
                    min="1"
                    value={c.creditHours}
                    onChange={(e) => updateCourse(i, 'creditHours', parseInt(e.target.value))}
                    className="px-2 py-1 border rounded"
                  />
                </div>
              ))}
              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg"
                >
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
