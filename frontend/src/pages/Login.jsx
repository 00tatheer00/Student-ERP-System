import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const userData = await login(email, password);
      if (userData.role === 'student') navigate('/portal/student');
      else if (userData.role === 'parent') navigate('/portal/parent');
      else navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-zinc-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_20%_-10%,rgba(16,185,129,0.22),transparent),radial-gradient(ellipse_60%_50%_at_90%_110%,rgba(99,102,241,0.18),transparent)]" />

      <div className="relative hidden w-[46%] flex-col justify-between border-r border-white/[0.06] bg-zinc-950 p-10 lg:flex xl:w-[44%]">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 text-white shadow-lg shadow-emerald-900/50">
            <Sparkles className="h-6 w-6" strokeWidth={2} />
          </div>
          <div>
            <p className="text-sm font-bold tracking-tight text-white">UCS ERP</p>
            <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-zinc-500">
              University Suite
            </p>
          </div>
        </div>

        <div className="max-w-md space-y-6">
          <h2 className="text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-[2.75rem]">
            Operations, academics, and finance — unified.
          </h2>
          <p className="text-base leading-relaxed text-zinc-400">
            Secure access for faculty, staff, students, and guardians. Built for clarity, auditability, and
            day-to-day campus workflows.
          </p>
          <div className="flex gap-6 border-t border-white/[0.08] pt-8">
            <div>
              <p className="text-2xl font-semibold text-emerald-400">99.9%</p>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Uptime target</p>
            </div>
            <div>
              <p className="text-2xl font-semibold text-white">Role-based</p>
              <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">Access control</p>
            </div>
          </div>
        </div>

        <p className="text-xs text-zinc-600">© {new Date().getFullYear()} University of Computer Sciences</p>
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center p-6 sm:p-10 lg:w-auto">
        <div className="absolute inset-0 bg-zinc-50/95 backdrop-blur-xl lg:bg-white/90" />
        <div className="relative w-full max-w-[440px]">
          <div className="mb-8 lg:hidden">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md">
                <Sparkles className="h-5 w-5" />
              </div>
              <span className="text-lg font-bold text-zinc-900">UCS ERP</span>
            </div>
          </div>

          <div className="erp-card-pad border-zinc-200/95 shadow-[0_20px_40px_-16px_rgba(15,23,42,0.12)]">
            <div className="mb-8">
              <h1 className="erp-h1">Sign in</h1>
              <p className="erp-muted mt-2">Use your institutional email to access the workspace.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="rounded-xl border border-red-200/80 bg-red-50 px-4 py-3 text-sm font-medium text-red-800">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="erp-label">
                  Email
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="erp-input pl-11"
                    placeholder="you@institution.edu.pk"
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="erp-label">
                  Password
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="erp-input pl-11"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    required
                  />
                </div>
              </div>

              <button type="submit" disabled={loading} className="erp-btn-primary mt-2 w-full !py-3">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Signing in…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    Continue
                    <ArrowRight className="h-4 w-4" />
                  </span>
                )}
              </button>
            </form>

            <p className="erp-muted mt-8 rounded-xl bg-zinc-50 px-4 py-3 text-center text-xs">
              Demo access: <span className="font-semibold text-zinc-700">admin@uop.edu.pk</span> /{' '}
              <span className="font-mono text-zinc-600">admin123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
