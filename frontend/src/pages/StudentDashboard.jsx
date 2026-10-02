import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import toast from 'react-hot-toast';

// ─── Helper: format address object or string ──────────────────────────────────
const formatAddress = (addr) => {
  if (!addr) return '';
  if (typeof addr === 'object') {
    return [addr.street, addr.city, addr.state].filter(Boolean).join(', ');
  }
  return addr;
};

// ─── Stars display component ──────────────────────────────────────────────────
const Stars = ({ rating = 0, max = 5 }) => (
  <span className="text-yellow-400 text-sm">
    {'★'.repeat(Math.round(rating))}{'☆'.repeat(max - Math.round(rating))}
  </span>
);


// ─── Main Component ───────────────────────────────────────────────────────────
function StudentDashboard() {
  const { user, logout } = useAuth();

  // Tabs: 'discover' | 'history'
  const [activeTab, setActiveTab] = useState('discover');

  // Library state
  const [libraries, setLibraries] = useState([]);
  const [selectedLibrary, setSelectedLibrary] = useState(null);
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [cityFilter, setCityFilter] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [filterWifi, setFilterWifi] = useState(false);
  const [filterAC, setFilterAC] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [filterCharging, setFilterCharging] = useState(false);
  const [filterAvailable, setFilterAvailable] = useState(false);

  const [bookingModal, setBookingModal] = useState(null);
  const [bookingType, setBookingType] = useState('hourly');
  const [bookingHours, setBookingHours] = useState(2);
  const [customStartTime, setCustomStartTime] = useState('');
  const [activeBooking, setActiveBooking] = useState(null);

  // Booking history
  const [bookingHistory, setBookingHistory] = useState([]);

  // Reviews
  const [reviews, setReviews] = useState([]);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    buildFacilityQuery();
    fetchActiveBooking();
  }, [cityFilter, maxPrice, filterWifi, filterAC, filterParking, filterCharging, filterAvailable]);

  useEffect(() => {
    if (activeTab === 'history') fetchBookingHistory();
  }, [activeTab]);

  const buildFacilityQuery = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (cityFilter) params.append('city', cityFilter);
      if (maxPrice) params.append('maxRate', maxPrice);

      const facilityList = [];
      if (filterWifi) facilityList.push('WiFi');
      if (filterAC) facilityList.push('AC');
      if (filterParking) facilityList.push('Parking');
      if (filterCharging) facilityList.push('Charging Points');
      if (facilityList.length) params.append('facilities', facilityList.join(','));

      const res = await axios.get(`/libraries?${params.toString()}`);
      if (res.data.status === 'success') {
        let libs = res.data.data.libraries;
        if (filterAvailable) libs = libs.filter(l => (l.availableSeats ?? 0) > 0);
        setLibraries(libs);
      }
    } catch (err) {
      console.error('Error fetching libraries:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveBooking = async () => {
    try {
      const res = await axios.get('/bookings');
      if (res.data.status === 'success') {
        const active = res.data.data.bookings.find(b =>
          (b.status === 'pending' || b.status === 'approved') &&
          new Date(b.expiryDate) > new Date()
        );
        setActiveBooking(active || null);
      }
    } catch {}
  };

  const fetchBookingHistory = async () => {
    try {
      const res = await axios.get('/bookings');
      if (res.data.status === 'success') setBookingHistory(res.data.data.bookings);
    } catch {}
  };

  const handleLibrarySelect = async (library) => {
    setSelectedLibrary(library);
    try {
      const res = await axios.get(`/libraries/${library._id || library.id}/seats`);
      if (res.data.status === 'success') setSeats(res.data.data.seats);
      fetchReviews(library._id || library.id);
    } catch {}
  };

  const fetchReviews = async (libraryId) => {
    try {
      const res = await axios.get(`/reviews/library/${libraryId}`);
      if (res.data.status === 'success') setReviews(res.data.data.reviews);
    } catch {}
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!selectedLibrary) return;
    try {
      await axios.post('/reviews', {
        libraryId: selectedLibrary._id || selectedLibrary.id,
        rating: newRating,
        comment: newComment
      });
      setNewComment('');
      fetchReviews(selectedLibrary._id || selectedLibrary.id);
      buildFacilityQuery();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit review.');
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!bookingModal || !selectedLibrary) return;
    try {
      const startTime = customStartTime ? new Date(customStartTime) : new Date();
      let endTime;
      
      if (bookingType === 'monthly') {
        endTime = new Date(startTime.getTime() + 30 * 24 * 60 * 60 * 1000); // +30 days
      } else {
        endTime = new Date(startTime.getTime() + bookingHours * 60 * 60 * 1000); // +N hours
      }

      const res = await axios.post('/bookings', {
        libraryId: selectedLibrary._id || selectedLibrary.id,
        seatId: bookingModal._id,
        bookingType,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString()
      });
      if (res.data.status === 'success') {
        toast.success(`Seat ${bookingModal.seatNumber} booked successfully!`);
        setBookingModal(null);
        handleLibrarySelect(selectedLibrary);
        fetchActiveBooking();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place booking.');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    // We use a custom confirm logic, but for simplicity we keep window.confirm or could use a custom modal
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await axios.patch(`/bookings/${bookingId}/cancel`);
      toast.success('Booking cancelled.');
      fetchActiveBooking();
      if (selectedLibrary) handleLibrarySelect(selectedLibrary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to cancel booking.');
    }
  };

  const statusBadge = (status) => {
    const map = {
      pending: 'bg-warning/15 text-warning',
      approved: 'bg-success/15 text-success',
      cancelled: 'bg-white/10 text-textMuted',
      rejected: 'bg-error/15 text-error',
      expired: 'bg-white/10 text-textMuted'
    };
    return map[status] || 'bg-white/10 text-textMuted';
  };

  return (
    <div className="min-h-screen bg-darkBg text-textMain pb-16">
      {/* ── Header ────────────────────────────────────────────────── */}
      {/* ── Header ────────────────────────────────────────────────── */}
      <Navbar>
        <div className="flex items-center gap-1 bg-white/5 rounded-xl p-1 border border-white/5">
          {['discover', 'history'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all duration-300 ${activeTab === tab ? 'bg-primary text-white shadow-glow scale-[1.02]' : 'text-textMuted hover:text-white'}`}
            >
              {tab === 'discover' ? '🔍 Find Seats' : '📋 My Bookings'}
            </button>
          ))}
        </div>
      </Navbar>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">

        {/* ── Active Booking Banner ──────────────────────────────── */}
        {activeBooking && (
          <div className="glass-card p-5 rounded-2xl border-l-4 border-l-primary mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <span className="text-xs uppercase tracking-widest text-primary font-bold">Current Booking Status</span>
              <h3 className="text-base font-bold text-white mt-0.5">
                Seat {activeBooking.seatNumber} — {activeBooking.libraryId?.name || 'Library Branch'}
              </h3>
              <p className="text-xs text-textMuted mt-0.5">
                Auto-Release at: {new Date(activeBooking.expiryDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                {activeBooking.status === 'approved' 
                  ? <span className="ml-2 text-success font-semibold">🎉 Seat Approved! Enjoy your study session.</span>
                  : <span className="ml-2 text-warning">(Please report at desk to confirm before expiry)</span>
                }
              </p>
              <span className={`inline-block mt-2 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider ${statusBadge(activeBooking.status)}`}>
                {activeBooking.status}
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBookingModal({
                    _id: activeBooking.seatId,
                    seatNumber: activeBooking.seatNumber,
                    seatType: 'standard'
                  });
                  // Use the library object from the active booking (which is populated)
                  setSelectedLibrary(activeBooking.libraryId);
                  
                  // Convert expiryDate to local datetime string format for input
                  const d = new Date(activeBooking.expiryDate);
                  const tzOffset = d.getTimezoneOffset() * 60000;
                  const localIso = new Date(d.getTime() - tzOffset).toISOString().slice(0, 16);
                  setCustomStartTime(localIso);
                }}
                className="px-4 py-2 bg-primary/20 border border-primary/30 hover:bg-primary/30 text-primary rounded-xl text-xs font-bold tracking-wide transition-all"
              >
                Renew / Extend
              </button>
              {activeBooking.status === 'pending' && (
                <button
                  onClick={() => handleCancelBooking(activeBooking._id)}
                  className="px-4 py-2 bg-error/10 border border-error/20 hover:bg-error/20 text-error rounded-xl text-xs font-bold tracking-wide transition-all"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: DISCOVER                                           */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'discover' && (
          <>
            {/* ── Hero Section ──────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-primary/10 to-transparent border border-white/5 p-10 md:p-20 text-center mb-16">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-2xl h-64 bg-primary/20 blur-[100px] rounded-full pointer-events-none"></div>
              <div className="relative z-10">
                <span className="inline-block py-1 px-3 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold tracking-widest uppercase mb-6">
                  Join 10,000+ Focused Students
                </span>
                <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
                  Deep Work Starts <span className="gradient-text">Here.</span>
                </h1>
                <p className="text-textMuted max-w-2xl mx-auto text-base md:text-lg mb-10 leading-relaxed">
                  Discover premium study spaces near you. Check live seat availability, book instantly, and pay securely at the desk. No hidden fees.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button 
                    onClick={() => document.getElementById('search-filters').scrollIntoView({ behavior: 'smooth' })}
                    className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-primary to-purple-600 text-white font-bold text-sm hover:shadow-glow hover:scale-105 transition-all duration-300"
                  >
                    Find Seats Near Me
                  </button>
                  <button className="px-8 py-3.5 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all duration-300">
                    Explore Libraries
                  </button>
                </div>
              </div>
            </div>

            {/* ── Advanced Filter Bar ──────────────────────────── */}
            <div id="search-filters" className="mb-14">
              {/* Pill-shaped Search Bar (Airbnb Style) */}
              <div className="bg-darkSurface/90 backdrop-blur-xl border border-white/10 rounded-3xl p-3 sm:rounded-full sm:p-2 mb-8 shadow-[0_8px_30px_rgb(0,0,0,0.4)] max-w-4xl mx-auto flex flex-col sm:flex-row items-center gap-2 sm:gap-0">
                
                <div className="flex-1 flex flex-col justify-center px-6 py-2 w-full border-b sm:border-b-0 sm:border-r border-white/10 hover:bg-white/5 rounded-2xl sm:rounded-l-full sm:rounded-r-none cursor-text transition-colors">
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">Location</label>
                  <input
                    type="text"
                    placeholder="Where do you want to study?"
                    className="w-full bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 placeholder-white/30 font-medium"
                    value={cityFilter}
                    onChange={(e) => setCityFilter(e.target.value)}
                  />
                </div>

                <div className="flex-1 flex flex-col justify-center px-6 py-2 w-full border-b sm:border-b-0 sm:border-r border-white/10 hover:bg-white/5 rounded-2xl sm:rounded-none cursor-text transition-colors">
                  <label className="text-[10px] font-bold text-textMuted uppercase tracking-widest mb-1">Max Price</label>
                  <input
                    type="number"
                    placeholder="₹ / hour"
                    className="w-full bg-transparent border-none text-sm text-white focus:outline-none focus:ring-0 placeholder-white/30 font-medium"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                  />
                </div>

                <div className="w-full sm:w-auto p-1 pl-4 sm:pl-2">
                  <button className="w-full sm:w-auto bg-gradient-to-r from-primary to-indigo-500 text-white rounded-2xl sm:rounded-full px-8 py-4 font-bold text-sm hover:shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-95 flex items-center justify-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    Search
                  </button>
                </div>
              </div>

              {/* Toggle Chips */}
              <div className="flex flex-wrap items-center justify-center gap-3">
                {[
                  { label: 'High-Speed WiFi', icon: '📶', state: filterWifi, setter: setFilterWifi },
                  { label: 'Air Conditioned', icon: '❄️', state: filterAC, setter: setFilterAC },
                  { label: 'Parking Available', icon: '🅿️', state: filterParking, setter: setFilterParking },
                  { label: 'Power Sockets', icon: '🔌', state: filterCharging, setter: setFilterCharging },
                  { label: 'Seats Available Now', icon: '✅', state: filterAvailable, setter: setFilterAvailable }
                ].map(({ label, icon, state, setter }) => (
                  <button
                    key={label}
                    onClick={() => setter(!state)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-all duration-300 focus:outline-none hover:-translate-y-0.5 ${state ? 'bg-primary/20 border-primary text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'border-white/10 bg-darkSurface/50 text-textMuted hover:border-white/30 hover:text-white'}`}
                  >
                    <span className="text-sm">{icon}</span>
                    {label}
                  </button>
                ))}
                {(cityFilter || maxPrice || filterWifi || filterAC || filterParking || filterCharging || filterAvailable) && (
                  <button
                    onClick={() => { setCityFilter(''); setMaxPrice(''); setFilterWifi(false); setFilterAC(false); setFilterParking(false); setFilterCharging(false); setFilterAvailable(false); }}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-bold text-textMuted hover:text-error transition-all"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            {/* ── Split View ────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Library List */}
              <div className="lg:col-span-5 space-y-4">
                <h2 className="text-lg font-bold border-b border-primary/20 pb-2">
                  Libraries <span className="text-textMuted text-sm font-normal">({libraries.length} found)</span>
                </h2>

                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="glass-card h-40 rounded-2xl animate-pulse opacity-50 bg-zinc-800" />)}
                  </div>
                ) : libraries.length === 0 ? (
                  <div className="glass-card p-12 rounded-2xl border-dashed border-2 border-white/10 text-center flex flex-col items-center justify-center">
                    <span className="text-5xl mb-4 opacity-50">🧭</span>
                    <h3 className="text-lg font-bold text-white mb-2">No libraries found in this area</h3>
                    <p className="text-sm text-textMuted max-w-sm mb-6">We couldn't find any libraries matching your exact filters. Try broadening your search criteria.</p>
                    <button onClick={() => { setCityFilter(''); setMaxPrice(''); setFilterWifi(false); setFilterAC(false); setFilterParking(false); setFilterCharging(false); setFilterAvailable(false); }} className="px-6 py-2 rounded-full bg-primary/20 text-primary font-bold text-sm hover:bg-primary/30 transition-all">Clear All Filters</button>
                  </div>
                ) : (
                  libraries.map((lib) => (
                    <div
                      key={lib._id}
                      onClick={() => handleLibrarySelect(lib)}
                      className={`group relative glass-card p-4 rounded-2xl cursor-pointer transition-all duration-300 hover:border-primary/60 hover:-translate-y-1 ${selectedLibrary?._id === lib._id ? 'border-primary shadow-[0_0_20px_rgba(139,92,246,0.3)] ring-1 ring-primary' : 'border-white/5'}`}
                    >
                      <div className="flex flex-col sm:flex-row gap-4">
                        {/* Image */}
                        <div className="w-full sm:w-32 h-32 rounded-xl overflow-hidden flex-shrink-0 bg-zinc-800 relative">
                          <img 
                            src={`https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=300&q=80`} 
                            alt={lib.name}
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-500 group-hover:scale-105"
                          />
                          {((lib.availableSeats ?? 0) > 0) && (
                            <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded-md text-[9px] font-bold text-success border border-success/30">
                              Open Now
                            </div>
                          )}
                        </div>
                        
                        {/* Content */}
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-start mb-1">
                              <h3 className="font-bold text-white tracking-wide text-base">{lib.name}</h3>
                              <span className="text-primary font-black text-sm bg-primary/10 px-2 py-0.5 rounded-lg border border-primary/20">₹{lib.fees ?? 0}<span className="text-[10px] font-medium text-textMuted">/hr</span></span>
                            </div>
                            <p className="text-xs text-textMuted mb-2 flex items-center gap-1">
                              <span className="text-textAccent">📍 {formatAddress(lib.address)}</span>
                              <span className="text-white/20 px-1">•</span>
                              <span className="text-warning text-[10px] font-bold flex items-center">★ {lib.rating?.toFixed(1) ?? '0.0'}</span>
                            </p>
                          </div>

                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {(lib.facilities || []).slice(0, 3).map((fac, i) => (
                              <span key={i} className="text-[10px] font-semibold bg-white/5 border border-white/5 px-2 py-0.5 rounded-md text-textMuted group-hover:bg-white/10 transition-colors">{fac}</span>
                            ))}
                            {(lib.facilities || []).length > 3 && (
                              <span className="text-[10px] font-semibold text-textMuted bg-transparent px-1 py-0.5">+{lib.facilities.length - 3} more</span>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-xs pt-3 border-t border-white/5 mt-auto">
                            <span className="text-textMuted text-[11px]">
                              🕐 {lib.openingTime || '08:00 AM'} - {lib.closingTime || '10:00 PM'}
                            </span>
                            <span className={`font-bold px-2 py-1 rounded-md text-[10px] ${((lib.availableSeats ?? 0) > 0) ? 'bg-success/10 text-success border border-success/20' : 'bg-error/10 text-error border border-error/20'}`}>
                              {((lib.availableSeats ?? 0) > 0) ? `${lib.availableSeats} of ${lib.totalSeats} seats left` : 'House Full'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Seat Grid + Reviews */}
              <div className="lg:col-span-7">
                <h2 className="text-lg font-bold border-b border-primary/20 pb-2 mb-4">
                  {selectedLibrary ? `${selectedLibrary.name} — Layout` : 'Seating Map'}
                </h2>

                {selectedLibrary ? (
                  <div className="glass-card p-6 rounded-xl">
                    
                    {/* Library Photos Gallery */}
                    {selectedLibrary.images && selectedLibrary.images.length > 0 && (
                      <div className="mb-6 border-b border-white/5 pb-6">
                        <div className="flex items-center gap-2 mb-4">
                          <span className="text-sm text-white font-bold">📸 Photo Gallery</span>
                        </div>
                        <div className="flex overflow-x-auto gap-4 pb-2 snap-x hide-scrollbar">
                          {selectedLibrary.images.map((img, idx) => (
                            <div key={idx} className="flex-none w-64 h-40 rounded-xl overflow-hidden snap-center border border-white/10 relative group">
                              <img 
                                src={img.startsWith('/') ? `http://localhost:5000${img}` : img} 
                                alt={`${selectedLibrary.name} - Photo ${idx + 1}`} 
                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                                <span className="text-white text-xs font-bold shadow-sm">Photo {idx + 1}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Legend */}
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 border-b border-white/5 pb-4 gap-4">
                      <span className="text-sm text-white font-bold flex items-center gap-2">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                        </svg>
                        Floor Plan
                      </span>
                      <div className="flex gap-4 text-xs text-textMuted bg-darkBg px-4 py-2 rounded-full border border-white/5">
                        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 bg-success/20 border border-success rounded-full" /> Available</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 bg-error/20 border border-error rounded-full" /> Occupied</span>
                        <span className="flex items-center gap-1.5"><span className="inline-block w-3 h-3 bg-warning/20 border border-warning rounded-full" /> Maint.</span>
                      </div>
                    </div>

                    {seats.length === 0 ? (
                      <div className="p-12 text-center flex flex-col items-center justify-center border-dashed border-2 border-white/5 rounded-2xl">
                        <span className="text-4xl mb-3 opacity-30">📐</span>
                        <p className="text-textMuted text-sm font-semibold">No seats mapped for this floor plan yet.</p>
                      </div>
                    ) : (
                      <div className="bg-darkSurface/50 p-6 md:p-10 rounded-2xl border border-white/5 relative overflow-hidden">
                        {/* Floor plan decorative elements */}
                        <div className="absolute top-0 left-0 w-full h-full opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
                        
                        <div className="flex flex-wrap justify-center gap-6 md:gap-8 relative z-10">
                          {seats.map((seat) => (
                            <div
                              key={seat._id}
                              onClick={() => {
                                if (seat.status === 'available' && !activeBooking) setBookingModal(seat);
                              }}
                              className={`group relative flex flex-col items-center justify-center w-16 h-20 transition-all duration-300 ${
                                seat.status === 'available'
                                  ? activeBooking
                                    ? 'cursor-not-allowed opacity-40'
                                    : 'cursor-pointer hover:-translate-y-2'
                                  : 'cursor-not-allowed opacity-60 grayscale-[50%]'
                              }`}
                            >
                              {/* Top-down Desk SVG */}
                              <div className={`relative w-14 h-14 rounded-lg flex flex-col items-center justify-between p-1.5 border-2 transition-all duration-300 ${
                                seat.status === 'available' 
                                  ? 'bg-success/5 border-success/40 group-hover:border-success group-hover:bg-success/20 group-hover:shadow-[0_0_15px_rgba(34,197,94,0.4)]' 
                                  : seat.status === 'occupied'
                                  ? 'bg-error/5 border-error/30'
                                  : 'bg-warning/5 border-warning/30'
                              }`}>
                                {/* Desk top line */}
                                <div className={`w-full h-1.5 rounded-full ${seat.status === 'available' ? 'bg-success/60' : seat.status === 'occupied' ? 'bg-error/40' : 'bg-warning/40'}`}></div>
                                
                                {/* Seat Number */}
                                <span className={`font-black text-sm ${seat.status === 'available' ? 'text-white' : 'text-textMuted'}`}>
                                  {seat.seatNumber}
                                </span>
                                
                                {/* Chair indicator */}
                                <div className={`w-6 h-2 rounded-t-full mt-1 ${seat.status === 'available' ? 'bg-success/40 group-hover:bg-success' : seat.status === 'occupied' ? 'bg-error/30' : 'bg-warning/30'}`}></div>
                              </div>
                              
                              {/* Tooltip on hover for available seats */}
                              {seat.status === 'available' && !activeBooking && (
                                <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-white text-black text-[10px] font-bold px-2 py-1 rounded shadow-xl whitespace-nowrap pointer-events-none z-20">
                                  Book {seat.seatNumber}
                                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 border-4 border-transparent border-t-white"></div>
                                </div>
                              )}

                              {/* Status text below */}
                              <span className={`text-[9px] uppercase font-bold tracking-wider mt-2 ${
                                seat.status === 'available' ? 'text-success' : 
                                seat.status === 'occupied' ? 'text-error' : 'text-warning'
                              }`}>
                                {seat.status}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeBooking && (
                      <p className="text-center text-xs text-warning mt-5 bg-warning/5 border border-warning/20 rounded-lg py-2">
                        ⚠️ You already have an active booking. Cancel it to reserve a new seat.
                      </p>
                    )}

                    {/* Reviews */}
                    <div className="mt-8 border-t border-white/5 pt-6">
                      <h3 className="text-base font-bold text-white mb-4">Reviews &amp; Feedback ({reviews.length})</h3>

                      <div className="space-y-4 mb-8">
                        {reviews.length === 0 ? (
                          <div className="p-8 border-dashed border-2 border-white/5 rounded-2xl flex flex-col items-center justify-center text-center">
                            <span className="text-3xl mb-2 opacity-50">✍️</span>
                            <p className="text-sm text-white font-bold mb-1">No reviews yet</p>
                            <p className="text-xs text-textMuted">Be the first to share your experience at {selectedLibrary.name}!</p>
                          </div>
                        ) : reviews.map((rev) => (
                          <div key={rev._id} className="bg-darkSurface/30 p-5 rounded-2xl border border-white/5 flex gap-4">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-primary to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-glow flex-shrink-0">
                              {(rev.studentId?.name || 'A')[0].toUpperCase()}
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-start mb-1.5">
                                <div>
                                  <span className="font-bold text-sm text-white block">{rev.studentId?.name || 'Anonymous'}</span>
                                  <span className="text-[10px] text-textMuted">{new Date(rev.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="bg-white/5 px-2 py-1 rounded-md border border-white/5">
                                  <Stars rating={rev.rating} />
                                </div>
                              </div>
                              <p className="text-sm text-textMuted leading-relaxed">{rev.comment}</p>
                            </div>
                          </div>
                        ))}
                      </div>

                      <form onSubmit={handleReviewSubmit} className="space-y-3">
                        <h4 className="text-sm font-bold text-white">Leave a Review</h4>
                        <div className="grid grid-cols-3 gap-3">
                          <div>
                            <label className="text-xs text-textMuted block mb-1">Rating</label>
                            <select
                              className="w-full bg-gray-900 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none"
                              value={newRating}
                              onChange={(e) => setNewRating(parseInt(e.target.value))}
                            >
                              {[5,4,3,2,1].map(r => <option key={r} value={r}>{r} Star{r !== 1 ? 's' : ''}</option>)}
                            </select>
                          </div>
                          <div className="col-span-2">
                            <label className="text-xs text-textMuted block mb-1">Comment</label>
                            <input
                              type="text"
                              required
                              placeholder="What did you think?"
                              className="w-full bg-gray-900 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary"
                              value={newComment}
                              onChange={(e) => setNewComment(e.target.value)}
                            />
                          </div>
                        </div>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-primary hover:shadow-glow text-white text-xs font-semibold rounded-lg transition-all"
                        >
                          Submit Review
                        </button>
                      </form>
                    </div>
                  </div>
                ) : (
                  <div className="glass-card p-16 rounded-2xl flex flex-col items-center justify-center text-center border-dashed border-2 border-white/5">
                    <span className="text-6xl mb-4 opacity-40">🏢</span>
                    <h3 className="text-xl font-bold text-white mb-2">Select a Library</h3>
                    <p className="text-sm text-textMuted max-w-sm">Choose a library from the list on the left to view its detailed seating arrangement and book your spot.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ═══════════════════════════════════════════════════════ */}
        {/* TAB: BOOKING HISTORY                                    */}
        {/* ═══════════════════════════════════════════════════════ */}
        {activeTab === 'history' && (
          <div>
            <h1 className="text-3xl font-extrabold text-white mb-2">My Bookings</h1>
            <p className="text-textMuted text-sm mb-8">All past and present seat reservations.</p>

            {bookingHistory.length === 0 ? (
              <div className="glass-card p-12 rounded-xl text-center text-textMuted">
                No booking history found. Go to Discover to book your first seat!
              </div>
            ) : (
              <div className="space-y-4">
                {bookingHistory.map(b => (
                  <div key={b._id} className="glass-card p-5 rounded-xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition-all hover:border-white/10">
                    <div>
                      <div className="flex items-center gap-3 mb-1.5">
                        <h4 className="font-bold text-white tracking-wide">{b.libraryId?.name || 'Library Branch'}</h4>
                        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${statusBadge(b.status)}`}>
                          {b.status}
                        </span>
                      </div>
                      <p className="text-xs text-textMuted">Seat Number: <strong className="text-white">{b.seatNumber || '—'}</strong></p>
                      <p className="text-xs text-textMuted mt-1">
                        📅 {new Date(b.bookingDate || b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })} ·{' '}
                        {new Date(b.bookingDate || b.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right flex flex-col items-start sm:items-end">
                      <span className="text-secondary font-extrabold text-lg">₹{b.totalFee}</span>
                      <p className="text-[10px] text-textMuted mt-0.5">Pay Offline (UPI/Cash)</p>
                      {b.status === 'pending' && new Date(b.expiryDate) > new Date() && (
                        <button
                          onClick={() => handleCancelBooking(b._id)}
                          className="mt-2.5 text-xs font-bold text-error border border-error/20 bg-error/5 px-3 py-1.5 rounded-lg hover:bg-error/10 transition-all cursor-pointer"
                        >
                          Cancel Slot
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* ── Booking Modal ──────────────────────────────────────── */}
      {bookingModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="glass-card w-full max-w-sm p-6 rounded-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-5">
              <h3 className="font-bold text-lg text-white">Reserve Seat {bookingModal.seatNumber}</h3>
              <button onClick={() => setBookingModal(null)} className="text-textMuted hover:text-white text-xl">✕</button>
            </div>

            <form onSubmit={handleBookingSubmit} className="space-y-4">
              <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <span className="text-textMuted">Branch Name</span>
                  <span className="font-bold text-white">{selectedLibrary?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Seat Category</span>
                  <span className="text-white font-semibold capitalize">{bookingModal.seatType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-textMuted">Payment Mode</span>
                  <span className="text-warning font-bold text-xs uppercase tracking-wide">Offline UPI / Cash at Desk</span>
                </div>
              </div>

              <div>
                <label className="block text-xs text-textMuted mb-1.5 font-semibold">Pass Type</label>
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setBookingType('hourly')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${bookingType === 'hourly' ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-white/10 text-textMuted hover:border-white/20'}`}
                  >
                    Hourly
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingType('monthly')}
                    disabled={!selectedLibrary?.monthlyFee}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all ${!selectedLibrary?.monthlyFee ? 'opacity-30 cursor-not-allowed' : bookingType === 'monthly' ? 'bg-primary/20 border-primary text-primary' : 'bg-transparent border-white/10 text-textMuted hover:border-white/20'}`}
                  >
                    Monthly {!selectedLibrary?.monthlyFee && '(N/A)'}
                  </button>
                </div>

                <div className="mb-3">
                  <label className="block text-xs text-textMuted mb-1.5 font-semibold">Start Time (Leave blank for 'Now')</label>
                  <input
                    type="datetime-local"
                    className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                    value={customStartTime}
                    onChange={(e) => setCustomStartTime(e.target.value)}
                  />
                </div>

                {bookingType === 'hourly' && (
                  <>
                    <label className="block text-xs text-textMuted mb-1.5 font-semibold">Slot Duration (Max 2 Hours)</label>
                    <select
                      className="w-full bg-gray-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-primary transition-all"
                      value={bookingHours}
                      onChange={(e) => setBookingHours(parseFloat(e.target.value))}
                    >
                      <option value={0.5}>30 Minutes Slot</option>
                      <option value={1}>1 Hour Slot</option>
                      <option value={1.5}>1.5 Hours Slot</option>
                      <option value={2}>2 Hours Slot (Maximum)</option>
                    </select>
                  </>
                )}
                {bookingType === 'monthly' && (
                  <p className="text-xs text-primary bg-primary/10 px-3 py-2 rounded-lg border border-primary/20 font-semibold">
                    ✨ Seat will be reserved for exactly 30 days.
                  </p>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 flex justify-between items-center">
                <span className="text-textMuted text-xs font-semibold">Estimated Total Amount</span>
                <strong className="text-secondary text-xl font-extrabold tracking-wide">
                  ₹{bookingType === 'monthly' ? (selectedLibrary?.monthlyFee || 0) : ((bookingHours || 0) * (selectedLibrary?.fees ?? 0))}
                </strong>
              </div>

              <button
                type="submit"
                className="w-full py-3 rounded-xl bg-gradient-to-r from-primary to-indigo-500 text-white text-sm font-semibold transition-all hover:shadow-glow"
              >
                Confirm Booking Request
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentDashboard;
