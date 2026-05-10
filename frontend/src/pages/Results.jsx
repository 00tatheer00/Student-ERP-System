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
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="erp-h1">Results</h1>
          <p className="erp-muted mt-1">Semester GPA / CGPA and transcript PDFs.</p>
        </div>
        <button
          type="button"
          onClick={() => {
            setForm({
              studentId: '',
              semester: 1,
              courses: [{ courseCode: '', marks: 0, grade: 'A', creditHours: 3 }],
            });
            setShowModal(true);
          }}
          className="erp-btn-accent"
        >
          Enter results
        </button>
      </div>

      <div className="erp-table-shell">
        {loading ? (
          <div className="erp-empty">Loading…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Semester</th>
                  <th>GPA</th>
                  <th>CGPA</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r) => (
                  <tr key={r._id}>
                    <td className="font-medium">
                      {r.studentId?.studentId || r.studentId} — {r.studentId?.fullName || '-'}
                    </td>
                    <td>{r.semester}</td>
                    <td className="tabular-nums font-medium">{r.GPA?.toFixed(2) || '—'}</td>
                    <td className="tabular-nums font-medium">{r.CGPA?.toFixed(2) || '—'}</td>
                    <td className="text-right">
                      <button type="button" onClick={() => downloadTranscript(r.studentId?._id || r.studentId)} className="erp-link">
                        Transcript PDF
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
          <div className="erp-modal max-h-[90vh] overflow-y-auto">
            <div className="p-6 sm:p-8">
              <h2 className="erp-h1 mb-6">Enter results</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="erp-label">Student</label>
                  <select
                    value={form.studentId}
                    onChange={(e) => setForm({ ...form, studentId: e.target.value })}
                    className="erp-select mt-1"
                    required
                  >
                    <option value="">Select student</option>
                    {students.map((s) => (
                      <option key={s._id} value={s._id}>
                        {s.studentId} — {s.fullName}
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
                <div className="flex items-center justify-between gap-4">
                  <label className="text-sm font-semibold text-zinc-800">Courses</label>
                  <button type="button" onClick={addCourse} className="erp-link text-sm">
                    + Add course
                  </button>
                </div>
                {form.courses.map((c, i) => (
                  <div key={i} className="grid grid-cols-2 gap-2 rounded-xl border border-zinc-100 bg-zinc-50/80 p-3 sm:grid-cols-4">
                    <select
                      value={c.courseCode}
                      onChange={(e) => updateCourse(i, 'courseCode', e.target.value)}
                      className="erp-select text-xs sm:col-span-1"
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
                      className="erp-input text-xs"
                    />
                    <input type="text" value={c.grade} readOnly className="erp-input bg-white text-xs font-semibold" />
                    <input
                      type="number"
                      min="1"
                      value={c.creditHours}
                      onChange={(e) => updateCourse(i, 'creditHours', parseInt(e.target.value))}
                      className="erp-input text-xs"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-2 border-t border-zinc-100 pt-6">
                  <button type="button" onClick={() => setShowModal(false)} className="erp-btn-secondary">
                    Cancel
                  </button>
                  <button type="submit" className="erp-btn-accent">
                    Save
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
