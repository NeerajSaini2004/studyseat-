import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

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
          <div className="mb-8">
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              Create an account
            </h2>
            <p className="text-sm text-textMuted font-medium">
              Join thousands of users discovering better workspaces.
            </p>
          </div>

          {error && (
            <div className="bg-error/10 border border-error/20 text-error p-4 rounded-xl text-sm mb-6 flex items-start gap-3 animate-shake">
              <span className="text-lg leading-none">⚠️</span>
              <p className="font-semibold">{error}</p>
            </div>
          )}

          {success && (
            <div className="bg-success/10 border border-success/20 text-success p-4 rounded-xl text-sm mb-6 flex items-start gap-3">
              <span className="text-lg leading-none">✅</span>
              <p className="font-semibold">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Custom Role Selector */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-3 ml-1">I am a...</label>
              <div className="flex bg-darkSurface/50 p-1.5 rounded-xl border border-white/10 relative">
                {/* Highlight Pill */}
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
                  className={`w-1/2 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors ${role === 'student' ? 'text-white' : 'text-textMuted hover:text-white'}`}
                >
                  Student
                </button>
                <button
                  type="button"
                  onClick={() => setRole('owner')}
                  className={`w-1/2 py-2.5 text-sm font-bold rounded-lg relative z-10 transition-colors ${role === 'owner' ? 'text-white' : 'text-textMuted hover:text-white'}`}
                >
                  Library Owner
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Full Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Email Address</label>
                <input
                  type="email"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">Password</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 characters"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2 ml-1">City / Region</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all"
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
                  className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-primary focus:bg-white/5 transition-all"
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
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Account...
                </span>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

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
