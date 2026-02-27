import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Attendance() {
  const [students, setStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    studentId: '',
    courseCode: '',
    date: new Date().toISOString().split('T')[0],
  });
  const [scanForm, setScanForm] = useState({
    studentId: '',
    courseCode: '',
    status: 'present',
    method: 'manual',
  });
  const [qrStudent, setQrStudent] = useState(null);

  useEffect(() => {
    api.get('/students').then((res) => setStudents(res.data));
    api.get('/courses').then((res) => setCourses(res.data));
  }, []);

  const fetchAttendance = () => {
    const params = new URLSearchParams();
    if (filters.studentId) params.append('studentId', filters.studentId);
    if (filters.courseCode) params.append('courseCode', filters.courseCode);
    if (filters.date) params.append('date', filters.date);
    api.get(`/attendance?${params}`).then((res) => {
      setAttendance(res.data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAttendance();
  }, [filters]);

  const handleScan = async (e) => {
    e.preventDefault();
    try {
      await api.post('/attendance/scan', scanForm);
      alert('Attendance marked successfully');
      setScanForm({ ...scanForm, studentId: '', courseCode: '' });
      fetchAttendance();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to mark attendance');
    }
  };

  const showQr = async (studentId) => {
    try {
      const res = await api.get(`/attendance/qr/${studentId}`);
      setQrStudent(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to generate QR');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Attendance</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Mark Attendance</h2>
          <form onSubmit={handleScan} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Student</label>
              <select
                value={scanForm.studentId}
                onChange={(e) => setScanForm({ ...scanForm, studentId: e.target.value })}
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
              <label className="block text-sm font-medium mb-1">Course</label>
              <select
                value={scanForm.courseCode}
                onChange={(e) => setScanForm({ ...scanForm, courseCode: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
                required
              >
                <option value="">Select Course</option>
                {courses.map((c) => (
                  <option key={c._id} value={c.courseCode}>
                    {c.courseCode} - {c.courseName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={scanForm.status}
                onChange={(e) => setScanForm({ ...scanForm, status: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg"
              >
                <option value="present">Present</option>
                <option value="absent">Absent</option>
                <option value="late">Late</option>
                <option value="excused">Excused</option>
              </select>
            </div>
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
            >
              Mark Attendance
            </button>
          </form>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Student QR Code</h2>
          <div className="space-y-4">
            <select
              onChange={(e) => e.target.value && showQr(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="">Select Student for QR</option>
              {students.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.studentId} - {s.fullName}
                </option>
              ))}
            </select>
            {qrStudent && (
              <div className="flex flex-col items-center p-4 bg-slate-50 rounded-lg">
                <img src={qrStudent.qrCode} alt="QR" className="w-48 h-48" />
                <p className="mt-2 font-mono">{qrStudent.studentId}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">Attendance Records</h2>
        <div className="flex gap-4 mb-4">
          <select
            value={filters.studentId}
            onChange={(e) => setFilters({ ...filters, studentId: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Students</option>
            {students.map((s) => (
              <option key={s._id} value={s._id}>{s.studentId}</option>
            ))}
          </select>
          <select
            value={filters.courseCode}
            onChange={(e) => setFilters({ ...filters, courseCode: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          >
            <option value="">All Courses</option>
            {courses.map((c) => (
              <option key={c._id} value={c.courseCode}>{c.courseCode}</option>
            ))}
          </select>
          <input
            type="date"
            value={filters.date}
            onChange={(e) => setFilters({ ...filters, date: e.target.value })}
            className="px-3 py-2 border rounded-lg"
          />
        </div>
        {loading ? (
          <div className="text-slate-500">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left p-4">Student</th>
                  <th className="text-left p-4">Course</th>
                  <th className="text-left p-4">Date</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Method</th>
                </tr>
              </thead>
              <tbody>
                {attendance.map((a) => (
                  <tr key={a._id} className="border-t hover:bg-slate-50">
                    <td className="p-4">
                      {a.studentId?.studentId || a.studentId} - {a.studentId?.fullName || '-'}
                    </td>
                    <td className="p-4">{a.courseCode}</td>
                    <td className="p-4">{new Date(a.date).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          a.status === 'present'
                            ? 'bg-green-100 text-green-800'
                            : a.status === 'late'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {a.status}
                      </span>
                    </td>
                    <td className="p-4">{a.method}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
