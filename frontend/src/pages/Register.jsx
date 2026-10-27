import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('student');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleBtnContainerRef = useRef(null);
  const roleRef = useRef(role);

  // Keep roleRef in sync so Google callback always gets the latest selected role
  useEffect(() => {
    roleRef.current = role;
  }, [role]);

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!googleClientId) return;

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

        if (googleBtnContainerRef.current) {
          window.google.accounts.id.renderButton(googleBtnContainerRef.current, {
            theme: 'outline',
            size: 'large',
            width: googleBtnContainerRef.current.offsetWidth || 380,
            text: 'signup_with',
            shape: 'rectangular',
          });
        }
      }
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {
        // ignore unmount cleanup
      }
    };
  }, [googleClientId]);

  const handleGoogleCredentialResponse = async (response) => {
    if (!response?.credential) {
      setError('Failed to retrieve Google credentials.');
      return;
    }
    setGoogleLoading(true);
    setError('');

    // Pass the currently selected role ('student' or 'owner')
    const result = await loginWithGoogle(response.credential, roleRef.current);
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
      setError('Google Client ID not configured. Add VITE_GOOGLE_CLIENT_ID in frontend/.env to enable live Google popup.');
      return;
    }

    if (window.google?.accounts?.id) {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
          console.warn('Google prompt was dismissed or not displayed.');
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    const result = await register(fullName, email, password, role, phone, city);
    setLoading(false);

    if (result.success) {
      setSuccess('Account created successfully! Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="min-h-screen flex bg-darkBg text-white">
      {/* LEFT SIDE - VISUAL BRANDING (Hidden on Mobile) */}
      <div className="hidden lg:flex w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-black border-r border-white/10">
        <div className="absolute top-0 left-0 w-full h-full opacity-30">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-secondary rounded-full blur-[120px] mix-blend-screen animate-pulse duration-10000"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary rounded-full blur-[120px] mix-blend-screen"></div>
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')] opacity-40"></div>
        </div>

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2 text-2xl font-black tracking-tighter hover:opacity-80 transition-opacity">
            <span className="text-secondary text-3xl">✦</span>
            FocusDesk
          </Link>
        </div>

        <div className="relative z-10 mb-20">
          <h1 className="text-5xl lg:text-6xl font-black tracking-tight leading-[1.1] mb-6">
            Join the network.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-blue-400 to-primary">
              Elevate your work.
            </span>
          </h1>
          <p className="text-lg text-textMuted max-w-md leading-relaxed border-l-2 border-secondary/50 pl-4">
            Whether you are searching for the perfect study spot or managing your own library, FocusDesk is your platform.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs font-semibold text-textMuted uppercase tracking-widest">
          <span>Discover</span>
          <span className="w-1 h-1 rounded-full bg-secondary"></span>
          <span>Book</span>
          <span className="w-1 h-1 rounded-full bg-primary"></span>
          <span>Manage</span>
        </div>
      </div>

      {/* RIGHT SIDE - FORM */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 relative overflow-y-auto">
        <Link to="/" className="lg:hidden absolute top-8 left-8 flex items-center gap-2 text-xl font-black tracking-tighter">
          <span className="text-secondary">✦</span> FocusDesk
        </Link>

        <div className="w-full max-w-md animate-fade-in-up my-auto py-12">
          <div className="mb-6">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Create an account
            </h2>
            <p className="text-sm text-textMuted font-medium">
              Join thousands of users discovering better workspaces.
            </p>
          </div>

          {/* Role Selector */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2.5 ml-1">
              Select Your Role:
            </label>
            <div className="flex bg-darkSurface/50 p-1.5 rounded-xl border border-white/10 relative">
              <div 
                className="absolute inset-y-1.5 bg-gradient-to-r from-primary to-secondary rounded-lg transition-all duration-300 shadow-glow"
                style={{
                  width: 'calc(50% - 6px)',
                  left: role === 'student' ? '6px' : 'calc(50%)'
                }}
              ></div>
              
              <button
                type="button"
                onClick={() => setRole('student')}
                className={`w-1/2 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors flex items-center justify-center gap-2 ${role === 'student' ? 'text-white' : 'text-textMuted hover:text-white'}`}
              >
                <span>🎓</span> Student
              </button>
              <button
                type="button"
                onClick={() => setRole('owner')}
                className={`w-1/2 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors flex items-center justify-center gap-2 ${role === 'owner' ? 'text-white' : 'text-textMuted hover:text-white'}`}
              >
                <span>🏢</span> Library Owner
              </button>
            </div>
            <p className="text-xs text-textMuted/70 mt-2 ml-1">
              {role === 'student' 
                ? 'Sign up to find, reserve, and manage study desks near you.' 
                : 'Sign up to list your library, manage seat layouts, and approve bookings.'}
            </p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm mb-6 flex items-start gap-3 animate-shake">
              <span className="text-lg leading-none">⚠️</span>
              <p className="font-semibold text-xs leading-relaxed">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
              <span className="text-lg leading-none">✅</span>
              <p className="font-semibold text-xs leading-relaxed">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:bg-white/5 transition-all text-sm"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:bg-white/5 transition-all text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Password</label>
                <div className="relative group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full pl-4 pr-12 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:bg-white/5 transition-all text-sm"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors"
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">City / Region</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:bg-white/5 transition-all text-sm"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. New Delhi"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Mobile Number</label>
                <input
                  type="tel"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-secondary focus:bg-white/5 transition-all text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 mt-6 rounded-xl bg-gradient-to-r from-secondary to-blue-500 hover:to-blue-400 text-white font-black text-sm uppercase tracking-wider transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-[0_0_20px_rgba(56,189,248,0.4)] hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                `Register as ${role === 'student' ? 'Student' : 'Library Owner'}`
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-darkBg px-3 text-textMuted tracking-wider font-semibold">Or sign up with</span>
            </div>
          </div>

          {/* Google Sign Up Section */}
          <div className="w-full flex flex-col items-center justify-center">
            <div ref={googleBtnContainerRef} className="w-full flex justify-center min-h-[44px]"></div>
            {!googleClientId && (
              <button
                type="button"
                onClick={handleGoogleButtonClick}
                disabled={googleLoading}
                className="w-full flex items-center justify-center gap-3 py-3.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-white font-semibold text-sm transition-all duration-200 hover:border-white/30 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <svg className="w-5 h-5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z"/>
                  <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.15C3.25 21.36 7.34 24 12 24z"/>
                  <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.26C.46 8.16 0 9.94 0 12s.46 3.84 1.26 5.42l4.02-3.15z"/>
                  <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.25 2.64 1.26 6.58l4.02 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
                </svg>
                <span>Sign up as {role === 'student' ? 'Student' : 'Owner'} with Google</span>
              </button>
            )}
          </div>

          <p className="text-center text-sm text-textMuted mt-8 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-white hover:text-secondary font-bold transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;
