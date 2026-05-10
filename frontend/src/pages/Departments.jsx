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
      <div>
        <h1 className="erp-h1">Departments</h1>
        <p className="erp-muted mt-1 max-w-2xl">
          Six departments under the Faculty of Computer Science — University of Computer Sciences.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="erp-card-pad col-span-full erp-empty">Loading…</div>
        ) : (
          departments.map((d) => (
            <div
              key={d._id}
              className="erp-card group relative overflow-hidden p-6 transition-all duration-300 hover:border-emerald-200/80 hover:shadow-md"
            >
              <div className="pointer-events-none absolute -right-8 -top-10 h-28 w-28 rounded-full bg-emerald-500/[0.06] blur-2xl transition-opacity group-hover:opacity-100" />
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold tracking-tight text-emerald-700">{d.code}</span>
                <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Dept.</span>
              </div>
              <h3 className="mt-3 text-lg font-semibold text-zinc-900">{d.name || names[d.code]}</h3>
              <p className="erp-muted mt-2">{d.description || 'Computer Science Faculty'}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
