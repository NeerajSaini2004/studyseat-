import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-darkBg text-white">
      
      {/* LEFT SIDE - VISUAL BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-black border-r border-white/10">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          {/* Abstract ambient glowing orbs */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px] mix-blend-screen animate-pulse duration-10000"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-secondary rounded-full blur-[120px] mix-blend-screen"></div>
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-40"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity">
            <span className="text-primary text-3xl">✦</span>
            FocusDesk
          </Link>
        </div>

        <div className="relative z-10 mb-20">
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Find your focus.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-purple-400 to-secondary">
              Book your space.
            </span>
          </h1>
          <p className="text-lg text-textMuted max-w-md leading-relaxed border-l-2 border-primary/50 pl-4">
            Discover nearby libraries, check real-time availability, and secure your silent workspace in seconds.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs font-semibold text-textMuted uppercase tracking-widest">
          <span>Focus</span>
          <span className="w-1 h-1 rounded-full bg-primary"></span>
          <span>Succeed</span>
          <span className="w-1 h-1 rounded-full bg-secondary"></span>
          <span>Achieve</span>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative">
        {/* Mobile-only logo */}
        <Link to="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-xl font-black tracking-tighter">
          <span className="text-primary">✦</span> FocusDesk
        </Link>

        <div className="w-full max-w-md animate-fade-in-up">
          <div className="mb-10">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-3">
              Welcome back
            </h2>
            <p className="text-sm text-textMuted font-medium">
              Enter your credentials to access your account.
            </p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm mb-6 flex items-start gap-3 animate-shake">
              <span className="text-lg leading-none">⚠️</span>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Email Address</label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  className="w-full px-5 py-3.5 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all group-hover:border-white/20"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1 flex justify-between">
                Password
                {/* Optional: Add forgot password link here in the future */}
                <span className="text-primary/60 hover:text-primary lowercase tracking-normal cursor-pointer transition-colors">Forgot?</span>
              </label>
              <div className="relative group">
                <input
                  type="password"
                  required
                  className="w-full px-5 py-3.5 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all group-hover:border-white/20"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:to-indigo-400 text-white font-black text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-textMuted mt-10 font-medium">
            Don't have an account?{' '}
            <Link to="/register" className="text-white hover:text-primary font-bold transition-colors">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
