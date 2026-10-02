import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

function Profile() {
  const { user, logout } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [city, setCity] = useState(user?.city || '');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.patch('/auth/profile', { name, phone, city });
      toast.success('Profile updated successfully!');
      setEditMode(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const initials = (user?.name || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
  const roleColor = user?.role === 'owner' ? 'from-secondary to-cyan-400' : user?.role === 'admin' ? 'from-error to-orange-400' : 'from-primary to-indigo-400';

  return (
    <div className="min-h-screen bg-darkBg text-textMain pb-16">
      <Navbar>
        <div className="flex items-center gap-2">
          <Link to="/" className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold text-textMuted hover:text-white hover:bg-white/5 transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
            Back to Dashboard
          </Link>
        </div>
      </Navbar>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          
          {/* LEFT SIDE: Identity Card */}
          <div className="md:col-span-4">
            <div className="glass-card w-full p-8 rounded-2xl sticky top-24">
              <div className="flex flex-col items-center mb-6">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${roleColor} flex items-center justify-center text-white text-3xl font-extrabold mb-4 shadow-glow`}>
                  {initials}
                </div>
                <h2 className="text-xl font-bold text-white text-center">{user?.name}</h2>
                <span className={`mt-2 px-4 py-1 rounded-full text-xs font-bold capitalize tracking-widest ${
                  user?.role === 'owner' ? 'bg-secondary/15 text-secondary' :
                  user?.role === 'admin' ? 'bg-error/15 text-error' :
                  'bg-primary/15 text-primary'
                }`}>
                  {user?.role}
                </span>
                <p className="text-sm text-textMuted mt-3">{user?.email}</p>
              </div>

              <div className="space-y-2 mt-8">
                <button
                  onClick={() => setEditMode(true)}
                  className="w-full py-3 rounded-xl bg-primary/10 border border-primary/30 hover:bg-primary/20 text-primary text-sm font-bold transition-all cursor-pointer"
                >
                  Edit Profile
                </button>
                <button
                  onClick={logout}
                  className="w-full py-3 rounded-xl bg-error/10 border border-error/20 hover:bg-error/20 text-error text-sm font-bold transition-all cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT SIDE: Settings / Info */}
          <div className="md:col-span-8 space-y-6">
            
            {/* Personal Information */}
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-primary">👤</span> Personal Information
              </h3>
              
              {!editMode ? (
                <div className="space-y-4">
                  {[
                    { label: 'Full Name', value: user?.name },
                    { label: 'Mobile Number', value: user?.phone || '—' },
                    { label: 'City / Region', value: user?.city || '—' },
                    { label: 'Member Since', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—' }
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-3 border-b border-white/5 last:border-0">
                      <span className="text-xs font-bold text-textMuted uppercase tracking-wider">{label}</span>
                      <span className="text-sm font-medium text-white">{value}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <form onSubmit={handleSave} className="space-y-5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Full Name</label>
                      <input type="text" required className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Email Address <span className="opacity-50">(Locked)</span></label>
                      <input type="email" disabled className="w-full px-4 py-3 rounded-xl bg-darkSurface/20 border border-white/5 text-white/50 cursor-not-allowed text-sm"
                        value={user?.email} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Mobile Number</label>
                      <input type="tel" className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        placeholder="e.g. +91 98765 43210"
                        value={phone} onChange={e => setPhone(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">City / Region</label>
                      <input type="text" className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        placeholder="e.g. Noida, Pune"
                        value={city} onChange={e => setCity(e.target.value)} />
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-white/5">
                    <button type="submit" disabled={saving}
                      className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:shadow-glow transition-all disabled:opacity-50">
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <button type="button" onClick={() => setEditMode(false)}
                      className="px-6 py-2.5 rounded-xl bg-white/5 text-white font-bold text-sm hover:bg-white/10 transition-all">
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Security Section */}
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-secondary">🔒</span> Security & Privacy
              </h3>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white">Password</h4>
                  <p className="text-xs text-textMuted mt-0.5">Change your account password.</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors">Update</button>
              </div>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white">Two-Factor Authentication</h4>
                  <p className="text-xs text-textMuted mt-0.5">Add an extra layer of security.</p>
                </div>
                <button className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs font-bold text-white transition-colors">Enable</button>
              </div>
              <div className="flex items-center justify-between pt-3">
                <div>
                  <h4 className="text-sm font-bold text-error">Danger Zone</h4>
                  <p className="text-xs text-textMuted mt-0.5">Permanently delete your account and all data.</p>
                </div>
                <button className="px-4 py-2 bg-error/10 hover:bg-error/20 text-error border border-error/20 rounded-lg text-xs font-bold transition-colors">Delete Account</button>
              </div>
            </div>

            {/* Notifications Section */}
            <div className="glass-card p-6 md:p-8 rounded-2xl border border-white/5">
              <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                <span className="text-yellow-500">🔔</span> Notification Preferences
              </h3>
              <div className="flex items-center justify-between py-3 border-b border-white/5">
                <div>
                  <h4 className="text-sm font-bold text-white">Booking Reminders</h4>
                  <p className="text-xs text-textMuted mt-0.5">Get notified 15 minutes before your slot.</p>
                </div>
                <div className="w-10 h-6 bg-primary rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-white rounded-full absolute right-1 top-1 shadow-sm"></div>
                </div>
              </div>
              <div className="flex items-center justify-between pt-3">
                <div>
                  <h4 className="text-sm font-bold text-white">Promotions & Offers</h4>
                  <p className="text-xs text-textMuted mt-0.5">Receive discounts on library passes.</p>
                </div>
                <div className="w-10 h-6 bg-white/10 rounded-full relative cursor-pointer">
                  <div className="w-4 h-4 bg-textMuted rounded-full absolute left-1 top-1 shadow-sm"></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </main>
    </div>
  );
}

export default Profile;
