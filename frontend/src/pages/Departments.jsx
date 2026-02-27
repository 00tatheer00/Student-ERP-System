import { useState, useEffect } from 'react';
import api from '../utils/api';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/departments').then((res) => {
      setDepartments(res.data);
      setLoading(false);
    });
  }, []);

  const names = {
    CS: 'Computer Science',
    SE: 'Software Engineering',
    AI: 'Artificial Intelligence',
    CY: 'Cybersecurity',
    DS: 'Data Science',
    IT: 'Information Technology',
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Departments</h1>
      <p className="text-slate-600">
        University of Computer Sciences - Six departments under the Faculty of Computer Science
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center text-slate-500">Loading...</div>
        ) : (
          departments.map((d) => (
            <div
              key={d._id}
              className="bg-white rounded-xl shadow p-6 border border-slate-100 hover:shadow-lg transition"
            >
              <div className="text-3xl font-bold text-blue-600 mb-2">{d.code}</div>
              <h3 className="text-lg font-semibold text-slate-800">{d.name || names[d.code]}</h3>
              <p className="text-slate-500 text-sm mt-1">{d.description || 'Computer Science Faculty'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
