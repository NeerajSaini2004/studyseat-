import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Login() {
  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Initialize Google Identity Services if Client ID exists
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) return;

    // Load Google GSI Script dynamically
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleCredentialResponse,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError('Failed to retrieve Google credentials.');
      return;
    }
    setGoogleLoading(true);
    setError('');

    const result = await loginWithGoogle(response.credential);
    setGoogleLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.message);
    }
  };

  const handleGoogleButtonClick = () => {
    setError('');
    if (!googleClientId) {
      // Guide developer if client ID not configured yet in .env
      setError('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID in frontend/.env to enable live Google popup.');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          // If One Tap is skipped or blocked, fall back or notify user
          console.warn('Google prompt was dismissed or not displayed.');
        }
      });
    }
  };

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

  // Quick Demo account auto-fill for testing / interview demos
  const setDemoCredentials = (role) => {
    setError('');
    if (role === 'student') {
      setEmail('student@studyseat.com');
      setPassword('password123');
    } else if (role === 'owner') {
      setEmail('owner@studyseat.com');
      setPassword('password123');
    } else if (role === 'admin') {
      setEmail('admin@studyseat.com');
      setPassword('password123');
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
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Welcome back
            </h2>
            <p className="text-sm text-textMuted font-medium">
              Enter your credentials to access your account.
            </p>
          </div>

          {/* Quick Demo Credentials Bar */}
          <div className="mb-6 p-3 rounded-xl bg-white/5 border border-white/10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-textMuted uppercase tracking-wider">⚡ Quick Demo Login:</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDemoCredentials('student')}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-primary/20 hover:text-primary hover:border-primary/40 border border-white/10 transition-all text-center"
              >
                Student
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('owner')}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-secondary/20 hover:text-secondary hover:border-secondary/40 border border-white/10 transition-all text-center"
              >
                Owner
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials('admin')}
                className="py-1.5 px-2 text-xs font-semibold rounded-lg bg-white/5 hover:bg-amber-500/20 hover:text-amber-400 hover:border-amber-400/40 border border-white/10 transition-all text-center"
              >
                Admin
              </button>
            </div>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            onClick={handleGoogleButtonClick}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-all duration-200 hover:border-white/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {googleLoading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connecting Google...
              </span>
            ) : (
              <>
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-darkBg px-3 text-textMuted tracking-wider font-semibold">Or continue with email</span>
            </div>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm mb-6 flex items-start gap-3 animate-shake">
              <span className="text-lg leading-none">⚠️</span>
              <p className="font-semibold text-xs leading-relaxed">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">
                Email Address
              </label>
              <div className="relative group">
                <input
                  type="email"
                  required
                  className="w-full px-5 py-3.5 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all group-hover:border-white/20 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1 flex justify-between">
                <span>Password</span>
                <span className="text-primary/70 hover:text-primary lowercase tracking-normal cursor-pointer transition-colors text-xs">
                  Forgot?
                </span>
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full pl-5 pr-12 py-3.5 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all group-hover:border-white/20 text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? (
                    /* Eye-off icon */
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                    </svg>
                  ) : (
                    /* Eye icon */
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-2 rounded-xl bg-gradient-to-r from-primary to-indigo-500 hover:to-indigo-400 text-white font-black text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Sign In'
              )}
            </button>
          </form>

          <p className="text-center text-sm text-textMuted mt-8 font-medium">
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
