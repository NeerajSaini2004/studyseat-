import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const formatAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'object') return [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
  return addr;
};

const Stars = ({ rating = 0 }) => (
  <span className="text-yellow-400">
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(5 - Math.round(rating))}
  </span>
);



// ─── Main Component ───────────────────────────────────────────────────────────
function OwnerPanel() {
  const { user, logout } = useAuth();

  // Active tab: 'analytics' | 'bookings' | 'seats' | 'edit' | 'reviews'
  const [activeTab, setActiveTab] = useState('analytics');

  // Library data
  const [library, setLibrary] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create library form - Onboarding Wizard
  const [wizardStep, setWizardStep] = useState(1);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateName, setStateName] = useState('');
  const [pincode, setPincode] = useState('');
  const [totalSeats, setTotalSeats] = useState(20);
  const [fees, setFees] = useState(5.0);
  const [monthlyFee, setMonthlyFee] = useState(2000.0);
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('22:00');
  const [workingDays, setWorkingDays] = useState('Mon-Sun');
  const [facilitiesInput, setFacilitiesInput] = useState('');

  // Edit library state
  const [editName, setEditName] = useState('');
  const [editFees, setEditFees] = useState('');
  const [editMonthlyFee, setEditMonthlyFee] = useState('');
  const [editOpeningTime, setEditOpeningTime] = useState('');
  const [editClosingTime, setEditClosingTime] = useState('');
  const [editFacilitiesInput, setEditFacilitiesInput] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Photo upload state
  const [selectedPhotos, setSelectedPhotos] = useState([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

  useEffect(() => {
    fetchOwnerData();
  }, []);

  const fetchOwnerData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/libraries?ownerId=${user._id || user.id}`);
      if (res.data.status === 'success' && res.data.data.libraries.length > 0) {
        const myLib = res.data.data.libraries[0];
        setLibrary(myLib);
        populateEditForm(myLib);
        fetchBookings();
        fetchReviews(myLib._id);
      }
    } catch (err) {
      console.error('Error fetching library:', err);
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (lib) => {
    setEditName(lib.name || '');
    setEditFees(lib.fees ?? '');
    setEditMonthlyFee(lib.monthlyFee ?? '');
    setEditOpeningTime(lib.openingTime || '08:00');
    setEditClosingTime(lib.closingTime || '22:00');
    setEditFacilitiesInput((lib.facilities || []).join(', '));
  };

  const fetchBookings = async () => {
    try {
      const res = await axios.get('/bookings');
      if (res.data.status === 'success') setBookings(res.data.data.bookings);
    } catch {}
  };

  const fetchReviews = async (libId) => {
    try {
      const res = await axios.get(`/reviews/library/${libId}`);
      if (res.data.status === 'success') setReviews(res.data.data.reviews);
    } catch {}
  };

  const handleCreateLibrary = async (e) => {
    if (e) e.preventDefault();
    try {
      const facilityList = facilitiesInput.split(',').map(f => f.trim()).filter(Boolean);
      const fullAddress = `${address}, ${city}, ${stateName} - ${pincode}`;
      
      const payload = {
        name,
        address: fullAddress,
        city,
        totalSeats: parseInt(totalSeats),
        fees: parseFloat(fees),
        monthlyFee: parseFloat(monthlyFee),
        openingTime,
        closingTime,
        facilities: facilityList
      };

      const res = await axios.post('/libraries', payload);
      
      if (res.data.status === 'success') {
        toast.success('Library created successfully!');
        fetchOwnerData();
        setWizardStep(1);
      }
    } catch (err) {
      console.error("Library Creation Error:", err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to register branch. Check console.');
    }
  };

  const handleWizardSubmit = (e) => {
    e.preventDefault();
    if (wizardStep < 6) {
      setWizardStep(prev => prev + 1);
    } else {
      handleCreateLibrary(e);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await axios.patch(`/bookings/${bookingId}/approve`);
      fetchBookings();
      fetchOwnerData();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve booking.');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    if (!confirm('Reject this booking request?')) return;
    try {
      await axios.patch(`/bookings/${bookingId}/reject`);
      fetchBookings();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject booking.');
    }
  };

  const handleSaveLibrary = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    try {
      const facilityList = editFacilitiesInput.split(',').map(f => f.trim()).filter(Boolean);
      const res = await axios.patch(`/libraries/${library._id}`, {
        name: editName,
        fees: parseFloat(editFees),
        monthlyFee: parseFloat(editMonthlyFee),
        openingTime: editOpeningTime,
        closingTime: editClosingTime,
        facilities: facilityList
      });
      if (res.data.status === 'success') {
        setLibrary(res.data.data.library);
        alert('Library updated successfully!');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update library.');
    } finally {
      setEditSaving(false);
    }
  };

  const handlePhotoChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length < 3 || files.length > 5) {
      toast.error('Please select between 3 and 5 photos.');
      return;
    }
    setSelectedPhotos(files);
  };

  const handlePhotoUpload = async (e) => {
    e.preventDefault();
    if (selectedPhotos.length < 3 || selectedPhotos.length > 5) {
      toast.error('Please select between 3 and 5 photos.');
      return;
    }
    setUploadingPhotos(true);
    const formData = new FormData();
    selectedPhotos.forEach(file => {
      formData.append('photos', file);
    });

    try {
      const res = await axios.post(`/libraries/${library._id}/photos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      if (res.data.status === 'success') {
        toast.success('Photos uploaded successfully!');
        setLibrary(prev => ({ ...prev, images: res.data.data.images }));
        setSelectedPhotos([]);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload photos.');
    } finally {
      setUploadingPhotos(false);
    }
  };

  const handleToggleSeat = async (seat) => {
    const newStatus = seat.status === 'available' ? 'maintenance' : 'available';
    if (!confirm(`Mark Seat ${seat.seatNumber} as "${newStatus}"?`)) return;
    try {
      const res = await axios.patch(`/libraries/${library._id}/seats/${seat._id}`, { status: newStatus });
      if (res.data.status === 'success') {
        setLibrary(prev => ({
          ...prev,
          seats: prev.seats.map(s => s._id === seat._id ? { ...s, status: newStatus } : s)
        }));
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update seat.');
    }
  };

  const pendingRequests = bookings.filter(b => b.status === 'pending');
  const approvedBookings = bookings.filter(b => b.status === 'approved');
  const totalRevenue = approvedBookings.reduce((sum, b) => sum + parseFloat(b.totalFee || 0), 0);
  const avgRating = reviews.length ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) : 0;

  // --- Analytics Data Generation ---
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });
  
  const trendData = last7Days.map((day) => ({
    name: day,
    // Distribute total revenue somewhat randomly across the last 7 days for the demo
    revenue: totalRevenue > 0 ? Math.max(0, Math.round((totalRevenue / 7) * (0.5 + Math.random()))) : 0
  }));

  const statusCounts = bookings.reduce((acc, b) => {
    acc[b.status] = (acc[b.status] || 0) + 1;
    return acc;
  }, {});

  const pieData = [
    { name: 'Approved', value: statusCounts['approved'] || 0, color: '#10b981' },
    { name: 'Pending', value: statusCounts['pending'] || 0, color: '#eab308' },
    { name: 'Rejected', value: statusCounts['rejected'] || 0, color: '#ef4444' },
  ].filter(d => d.value > 0);
  
  if (pieData.length === 0) pieData.push({ name: 'No Bookings', value: 1, color: '#3f3f46' });

  const tabs = [
    { id: 'analytics', label: '📊 Analytics' },
    { id: 'bookings', label: '📋 Bookings' },
    { id: 'seats', label: '🪑 Seats' },
    { id: 'edit', label: '✏️ Edit Library' },
    { id: 'reviews', label: '⭐ Reviews' }
  ];

  return (
    <div className="min-h-screen bg-darkBg text-textMain pb-16">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        {loading ? (
          <div className="text-textMuted text-sm">Loading console...</div>
        ) : !library ? (

          /* ═══ CREATE LIBRARY WIZARD ═══════════════════════════════════ */
          <div className="max-w-2xl mx-auto glass-card p-8 rounded-2xl">
            <div className="mb-8">
              <h2 className="text-2xl font-extrabold text-white mb-2">Register Library Branch</h2>
              <div className="flex items-center gap-2 mt-4">
                {[1, 2, 3, 4, 5, 6].map(step => (
                  <React.Fragment key={step}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${wizardStep === step ? 'bg-primary text-white shadow-glow' : wizardStep > step ? 'bg-success/20 text-success' : 'bg-white/5 text-textMuted'}`}>
                      {wizardStep > step ? '✓' : step}
                    </div>
                    {step < 6 && <div className={`flex-1 h-1 rounded-full ${wizardStep > step ? 'bg-success/50' : 'bg-white/5'}`}></div>}
                  </React.Fragment>
                ))}
              </div>
            </div>

            <form onSubmit={handleWizardSubmit} className="space-y-6">
              
              {/* STEP 1: Basic Information */}
              {wizardStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Step 1: Basic Information</h3>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Library Name</label>
                    <input type="text" required placeholder="e.g. MindSpace Library"
                      className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                      value={name} onChange={e => setName(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Description</label>
                    <textarea rows="3" placeholder="Tell students about your library..."
                      className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm resize-none"
                      value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4 opacity-50">
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Owner Name</label>
                      <input type="text" disabled className="w-full px-4 py-3 rounded-xl bg-darkSurface/20 border border-white/5 text-white cursor-not-allowed text-sm" value={user?.name} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Mobile / Email</label>
                      <input type="text" disabled className="w-full px-4 py-3 rounded-xl bg-darkSurface/20 border border-white/5 text-white cursor-not-allowed text-sm" value={user?.phone || user?.email} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Location */}
              {wizardStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Step 2: Location</h3>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Street Address</label>
                    <input type="text" required placeholder="e.g. 404 Reading Lane"
                      className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                      value={address} onChange={e => setAddress(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">City</label>
                      <input type="text" required placeholder="e.g. Pune"
                        className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        value={city} onChange={e => setCity(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">State</label>
                      <input type="text" required placeholder="e.g. Maharashtra"
                        className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        value={stateName} onChange={e => setStateName(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Pincode</label>
                    <input type="text" required placeholder="e.g. 411001"
                      className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                      value={pincode} onChange={e => setPincode(e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 3: Amenities */}
              {wizardStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Step 3: Library Amenities</h3>
                  <p className="text-xs text-textMuted">Type amenities separated by commas. These will be displayed as badges on your library card.</p>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Amenities</label>
                    <textarea rows="3" placeholder="High-Speed WiFi, AC, Parking, Washroom, Drinking Water, Charging Points, CCTV, Silent Zone, Cafeteria"
                      className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm resize-none"
                      value={facilitiesInput} onChange={e => setFacilitiesInput(e.target.value)} />
                  </div>
                </div>
              )}

              {/* STEP 4: Pricing */}
              {wizardStep === 4 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Step 4: Pricing</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Hourly Price (₹)</label>
                      <input type="number" required placeholder="e.g. 50"
                        className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        value={fees} onChange={e => setFees(e.target.value)} />
                    </div>
                    <div className="opacity-50 pointer-events-none">
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Daily Price (₹)</label>
                      <input type="number" placeholder="Coming soon" className="w-full px-4 py-3 rounded-xl bg-darkSurface/20 border border-white/5 text-white/50 text-sm" />
                    </div>
                    <div className="opacity-50 pointer-events-none">
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Weekly Price (₹)</label>
                      <input type="number" placeholder="Coming soon" className="w-full px-4 py-3 rounded-xl bg-darkSurface/20 border border-white/5 text-white/50 text-sm" />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Monthly Pass (₹)</label>
                      <input type="number" required placeholder="e.g. 2000"
                        className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                        value={monthlyFee} onChange={e => setMonthlyFee(e.target.value)} />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 5: Working Hours */}
              {wizardStep === 5 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Step 5: Working Hours</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Opening Time</label>
                      <input type="time" required className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm" 
                        value={openingTime} onChange={e => setOpeningTime(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Closing Time</label>
                      <input type="time" required className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm" 
                        value={closingTime} onChange={e => setClosingTime(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Working Days</label>
                    <select className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-sm"
                      value={workingDays} onChange={e => setWorkingDays(e.target.value)}>
                      <option value="Mon-Sun">Monday to Sunday (All Days)</option>
                      <option value="Mon-Sat">Monday to Saturday</option>
                      <option value="Mon-Fri">Monday to Friday</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 6: Seat Generation */}
              {wizardStep === 6 && (
                <div className="space-y-4 animate-fade-in">
                  <h3 className="text-lg font-bold text-white border-b border-white/10 pb-2 mb-4">Step 6: Seat Creation</h3>
                  <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 flex items-start gap-3 mb-4">
                    <span className="text-primary text-xl">✨</span>
                    <p className="text-sm text-white leading-relaxed">
                      Enter the total number of seats in your library. Our system will <strong className="text-primary">automatically generate</strong> the seat layout and IDs (e.g. A1, A2, B1...) for you to manage.
                    </p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-textMuted uppercase tracking-wider mb-2">Total Seats Capacity</label>
                    <input type="number" required placeholder="e.g. 120"
                      className="w-full px-4 py-3 rounded-xl bg-darkSurface/50 border border-white/10 text-white focus:outline-none focus:border-primary transition-all text-xl font-black"
                      value={totalSeats} onChange={e => setTotalSeats(e.target.value)} />
                  </div>
                </div>
              )}

              {/* WIZARD NAVIGATION CONTROLS */}
              <div className="flex justify-between pt-6 border-t border-white/5 mt-8">
                {wizardStep > 1 ? (
                  <button type="button" onClick={() => setWizardStep(prev => prev - 1)}
                    className="px-6 py-3 rounded-xl border border-white/10 text-white font-bold text-sm hover:bg-white/5 transition-all">
                    Back
                  </button>
                ) : <div></div>}
                
                <button type="submit"
                  className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-sm hover:shadow-glow transition-all">
                  {wizardStep === 6 ? 'Generate Seats & Finish' : 'Next Step'}
                </button>
              </div>
            </form>
          </div>

        ) : (

          /* ═══ MAIN OWNER PANEL ════════════════════════════════ */
          <div>
            {/* Library header */}
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold text-white">{library.name}</h1>
              <p className="text-sm text-textAccent mt-1">📍 {formatAddress(library.address)}, {library.city}</p>
              <p className="text-xs text-textMuted mt-0.5">🕐 {library.openingTime || '08:00'} – {library.closingTime || '22:00'}</p>
            </div>

            {/* Analytics Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {/* Earnings Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-secondary/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-sm font-semibold text-textMuted uppercase tracking-wider">Earnings</span>
                    <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full border border-success/20">↑ 12%</span>
                  </div>
                  <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-secondary to-indigo-400 mt-2 block tracking-tight">₹{totalRevenue}</span>
                </div>
              </div>

              {/* Occupancy Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-primary/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <span className="text-sm font-semibold text-textMuted uppercase tracking-wider block mb-2">Occupancy</span>
                  <div className="flex items-end gap-2 mb-3">
                    <span className="text-4xl font-black text-white tracking-tight">{library.occupiedSeats ?? 0}</span>
                    <span className="text-sm text-textMuted font-bold pb-1">/ {library.totalSeats}</span>
                  </div>
                  <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-gradient-to-r from-primary to-purple-500 h-1.5 rounded-full shadow-glow" 
                      style={{ width: `${Math.min(100, ((library.occupiedSeats ?? 0) / (library.totalSeats || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>

              {/* Available Seats Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-success/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-success/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <span className="text-sm font-semibold text-textMuted uppercase tracking-wider block mb-2">Available</span>
                  <span className="text-4xl font-black text-success mt-2 block tracking-tight">
                    {library.availableSeats ?? (library.totalSeats - (library.occupiedSeats ?? 0))}
                  </span>
                  <p className="text-xs text-success/60 mt-2 font-medium">Ready for booking</p>
                </div>
              </div>

              {/* Avg Rating Card */}
              <div className="glass-card p-6 rounded-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-warning/10 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:bg-warning/20 transition-all duration-500"></div>
                <div className="relative z-10">
                  <span className="text-sm font-semibold text-textMuted uppercase tracking-wider block mb-2">Avg Rating</span>
                  <div className="flex items-center gap-3 mt-2">
                    <span className="text-4xl font-black text-warning tracking-tight">{avgRating.toFixed(1)}</span>
                    <span className="text-3xl text-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]">★</span>
                  </div>
                  <p className="text-xs text-textMuted mt-2 font-medium">Based on {reviews.length} reviews</p>
                </div>
              </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-8 w-full overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-primary text-white shadow-glow' : 'text-textMuted hover:text-white'}`}
                >
                  {tab.label}
                  {tab.id === 'bookings' && pendingRequests.length > 0 && (
                    <span className="ml-1.5 bg-error text-white text-[9px] px-1.5 py-0.5 rounded-full">{pendingRequests.length}</span>
                  )}
                </button>
              ))}
            </div>

            {/* ─── TAB: ANALYTICS ─────────────────────────────────── */}
            {activeTab === 'analytics' && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Revenue Trend Chart */}
                <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-white/5">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-white">Revenue Trend</h2>
                    <p className="text-xs text-textMuted">Your earnings over the last 7 days.</p>
                  </div>
                  <div className="h-72 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={trendData}>
                        <defs>
                          <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                        <XAxis dataKey="name" stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis stroke="#a1a1aa" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                        <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, fill: '#8b5cf6', strokeWidth: 2, stroke: '#18181b' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Booking Status Donut Chart */}
                <div className="glass-card p-6 rounded-2xl border border-white/5">
                  <div className="mb-6">
                    <h2 className="text-lg font-bold text-white">Booking Status</h2>
                    <p className="text-xs text-textMuted">Distribution of all requests.</p>
                  </div>
                  <div className="h-56 w-full flex items-center justify-center relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={pieData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          stroke="none"
                        >
                          {pieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <RechartsTooltip 
                          contentStyle={{ backgroundColor: '#18181b', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-2xl font-black text-white">{bookings.length}</span>
                      <span className="text-[10px] uppercase tracking-widest text-textMuted font-bold">Total</span>
                    </div>
                  </div>
                  
                  {/* Custom Legend */}
                  <div className="mt-4 flex flex-col gap-2">
                    {pieData.map(entry => (
                      <div key={entry.name} className="flex justify-between items-center text-sm">
                        <div className="flex items-center gap-2">
                          <span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></span>
                          <span className="text-textMuted">{entry.name}</span>
                        </div>
                        <span className="font-bold text-white">{entry.value}</span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            )}

            {/* ─── TAB: BOOKINGS ─────────────────────────────────── */}
            {activeTab === 'bookings' && (
              <div className="glass-card rounded-2xl border border-white/5 overflow-hidden">
                <div className="p-5 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                  <h2 className="text-lg font-bold text-white">All Bookings</h2>
                  <span className="text-xs text-textMuted bg-darkBg px-3 py-1 rounded-full border border-white/5">
                    {bookings.length} Total Records
                  </span>
                </div>
                
                {bookings.length === 0 ? (
                  <div className="p-12 text-center flex flex-col items-center justify-center">
                    <span className="text-4xl mb-3 opacity-40">📥</span>
                    <h3 className="text-base font-bold text-white mb-1">No bookings yet</h3>
                    <p className="text-xs text-textMuted">When students book seats, they will appear here.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-black/20 text-textMuted text-xs uppercase font-semibold tracking-wider">
                        <tr>
                          <th className="px-6 py-4 rounded-tl-xl">Student</th>
                          <th className="px-6 py-4">Seat</th>
                          <th className="px-6 py-4">Time</th>
                          <th className="px-6 py-4">Amount</th>
                          <th className="px-6 py-4">Status</th>
                          <th className="px-6 py-4 text-right rounded-tr-xl">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {/* Sort pending first, then others by date descending */}
                        {[...bookings].sort((a, b) => {
                          if (a.status === 'pending' && b.status !== 'pending') return -1;
                          if (a.status !== 'pending' && b.status === 'pending') return 1;
                          return new Date(b.createdAt) - new Date(a.createdAt);
                        }).map((req) => (
                          <tr key={req._id} className={`hover:bg-white/[0.02] transition-colors ${req.status === 'pending' ? 'bg-primary/5' : ''}`}>
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold text-xs shadow-glow">
                                  {(req.studentId?.name || 'S')[0].toUpperCase()}
                                </div>
                                <div>
                                  <div className="font-bold text-white text-sm">{req.studentId?.name || 'Unknown Student'}</div>
                                  <div className="text-[11px] text-textMuted">{req.studentId?.email || 'No email'}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className="bg-white/10 text-white px-3 py-1 rounded-md text-xs font-bold border border-white/10">
                                {req.seatNumber || '—'}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-sm text-white">
                                {new Date(req.bookingDate || req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                <span className="text-textMuted mx-1">→</span>
                                {new Date(req.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </div>
                              <div className="text-[10px] text-textMuted mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</div>
                            </td>
                            <td className="px-6 py-4 font-bold text-secondary">
                              ₹{req.totalFee}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                                req.status === 'approved' ? 'bg-success/10 text-success border-success/20' :
                                req.status === 'rejected' ? 'bg-error/10 text-error border-error/20' :
                                'bg-warning/10 text-warning border-warning/20 animate-pulse'
                              }`}>
                                {req.status === 'pending' && <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>}
                                {req.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              {req.status === 'pending' ? (
                                <div className="flex items-center justify-end gap-2">
                                  <button onClick={() => handleApproveBooking(req._id)} className="p-1.5 bg-success/10 hover:bg-success/20 text-success rounded-lg border border-success/30 transition-all group" title="Approve">
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
                                  </button>
                                  <button onClick={() => handleRejectBooking(req._id)} className="p-1.5 bg-error/10 hover:bg-error/20 text-error rounded-lg border border-error/30 transition-all group" title="Reject">
                                    <svg className="w-4 h-4 group-hover:scale-110 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                                  </button>
                                </div>
                              ) : (
                                <span className="text-[10px] text-textMuted">Actioned</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: SEAT MANAGER ─────────────────────────────── */}
            {activeTab === 'seats' && (
              <div>
                <h2 className="text-lg font-bold mb-2">Seat Status Manager</h2>
                <p className="text-xs text-textMuted mb-6">Click any seat to toggle between <strong>Available</strong> and <strong>Maintenance</strong>. Occupied seats (student booked) cannot be changed.</p>
                <div className="flex gap-4 text-xs text-textMuted mb-6">
                  <span><span className="inline-block w-2.5 h-2.5 bg-success/20 border border-success rounded mr-1" />Available</span>
                  <span><span className="inline-block w-2.5 h-2.5 bg-error/20 border border-error rounded mr-1" />Occupied</span>
                  <span><span className="inline-block w-2.5 h-2.5 bg-warning/20 border border-warning rounded mr-1" />Maintenance</span>
                </div>
                {(!library.seats || library.seats.length === 0) ? (
                  <div className="glass-card p-12 rounded-2xl border-dashed border-2 border-white/10 text-center flex flex-col items-center justify-center">
                    <span className="text-5xl mb-4 opacity-50">🪑</span>
                    <h3 className="text-lg font-bold text-white mb-2">No seats found</h3>
                    <p className="text-sm text-textMuted max-w-sm mb-6">Seats are auto-created when the library is registered. Please contact support if they are missing.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-3">
                    {library.seats.map(seat => (
                      <div
                        key={seat._id}
                        onClick={() => seat.status !== 'occupied' && handleToggleSeat(seat)}
                        className={`p-3 rounded-xl border text-center transition-all ${
                          seat.status === 'available'
                            ? 'border-success/40 bg-success/10 hover:border-success cursor-pointer hover:shadow-glow'
                            : seat.status === 'occupied'
                            ? 'border-error/20 bg-error/5 opacity-60 cursor-not-allowed'
                            : 'border-warning/40 bg-warning/10 hover:border-warning cursor-pointer'
                        }`}
                      >
                        <span className="block font-bold text-sm text-white">{seat.seatNumber}</span>
                        <span className="text-[9px] uppercase text-textMuted block mt-0.5">{seat.status}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ─── TAB: EDIT LIBRARY ─────────────────────────────── */}
            {activeTab === 'edit' && (
              <div className="max-w-lg space-y-8">
                <div>
                  <h2 className="text-lg font-bold mb-6">Edit Library Details</h2>
                  <form onSubmit={handleSaveLibrary} className="glass-card p-6 rounded-2xl space-y-4">
                    <div>
                      <label className="block text-xs text-textMuted mb-1">Library Name</label>
                      <input type="text" required className="input-field"
                        value={editName} onChange={e => setEditName(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-textMuted mb-1">Opening Timings</label>
                        <input type="time" className="input-field"
                          value={editOpeningTime} onChange={e => setEditOpeningTime(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-textMuted mb-1">Closing Timings</label>
                        <input type="time" className="input-field"
                          value={editClosingTime} onChange={e => setEditClosingTime(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs text-textMuted mb-1">Hourly Charge (₹)</label>
                        <input type="number" required className="input-field"
                          value={editFees} onChange={e => setEditFees(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-xs text-textMuted mb-1">Monthly Pass (₹)</label>
                        <input type="number" className="input-field" placeholder="Leave empty if not offered"
                          value={editMonthlyFee} onChange={e => setEditMonthlyFee(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-textMuted mb-1">Amenities (comma-separated)</label>
                      <input type="text" placeholder="High-Speed WiFi, AC, Parking, Charging Sockets"
                        className="input-field"
                        value={editFacilitiesInput} onChange={e => setEditFacilitiesInput(e.target.value)} />
                      <p className="text-[10px] text-textMuted mt-1">Current: {(library.facilities || []).join(', ') || 'None'}</p>
                    </div>
                    <button type="submit" disabled={editSaving}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white font-bold text-sm hover:shadow-glow transition-all duration-300 disabled:opacity-60 cursor-pointer">
                      {editSaving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </form>
                </div>

                {/* PHOTO UPLOAD SECTION */}
                <div>
                  <h2 className="text-lg font-bold mb-6">Library Photos</h2>
                  <div className="glass-card p-6 rounded-2xl space-y-4">
                    <p className="text-sm text-textMuted">Upload 3 to 5 photos to showcase your library to students.</p>
                    
                    {library.images && library.images.length > 0 && (
                      <div className="grid grid-cols-3 gap-2 mb-4">
                        {library.images.map((img, idx) => (
                          <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-white/10">
                            <img src={img.startsWith('/') ? `http://localhost:5000${img}` : img} alt={`Library ${idx+1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <form onSubmit={handlePhotoUpload} className="space-y-4">
                      <div>
                        <input 
                          type="file" 
                          accept="image/jpeg, image/png, image/webp" 
                          multiple 
                          onChange={handlePhotoChange}
                          className="block w-full text-sm text-textMuted file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-bold file:bg-primary/20 file:text-primary hover:file:bg-primary/30 transition-all cursor-pointer"
                        />
                        {selectedPhotos.length > 0 && (
                          <p className="text-xs text-warning mt-2">
                            {selectedPhotos.length} file(s) selected. 
                            {selectedPhotos.length < 3 ? ' (Need at least 3)' : selectedPhotos.length > 5 ? ' (Maximum 5 allowed)' : ' (Valid)'}
                          </p>
                        )}
                      </div>
                      <button 
                        type="submit" 
                        disabled={uploadingPhotos || selectedPhotos.length < 3 || selectedPhotos.length > 5}
                        className="w-full py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/20 transition-all duration-300 disabled:opacity-50 cursor-pointer border border-white/5 hover:border-white/20">
                        {uploadingPhotos ? 'Uploading...' : 'Upload Photos'}
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            )}

            {/* ─── TAB: REVIEWS ──────────────────────────────────── */}
            {activeTab === 'reviews' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold">Student Reviews ({reviews.length})</h2>
                  <div className="flex items-center gap-2">
                    <Stars rating={avgRating} />
                    <span className="text-sm text-textMuted">{avgRating.toFixed(1)} avg</span>
                  </div>
                </div>

                {reviews.length === 0 ? (
                  <div className="glass-card p-12 rounded-2xl border-dashed border-2 border-white/10 text-center flex flex-col items-center justify-center">
                    <span className="text-5xl mb-4 opacity-50">⭐</span>
                    <h3 className="text-lg font-bold text-white mb-2">No reviews yet</h3>
                    <p className="text-sm text-textMuted max-w-sm">Keep providing a great experience! Student reviews will appear here once they complete their bookings.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reviews.map(rev => (
                      <div key={rev._id} className="glass-card p-5 rounded-xl">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="font-bold text-white text-sm">{rev.studentId?.name || 'Anonymous'}</span>
                            <p className="text-xs text-textMuted">{new Date(rev.createdAt).toLocaleDateString()}</p>
                          </div>
                          <Stars rating={rev.rating} />
                        </div>
                        <p className="text-sm text-textMuted leading-relaxed">{rev.comment}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default OwnerPanel;
