import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const PAGE_SIZE = 25;

const formatDate = (date) =>
  date
    ? new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(date))
    : '—';

const StatCard = ({ label, value, detail, accent }) => (
  <div className="glass-card rounded-2xl p-5">
    <p className="text-sm text-textMuted">{label}</p>
    <p className={`mt-3 text-3xl font-bold ${accent}`}>{value ?? '—'}</p>
    <p className="mt-2 text-xs text-textMuted">{detail}</p>
  </div>
);

const EmptyState = ({ children }) => (
  <div className="rounded-xl border border-white/5 bg-white/[0.02] px-5 py-12 text-center text-sm text-textMuted">
    {children}
  </div>
);

function AdminPanel() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [libraries, setLibraries] = useState([]);
  const [users, setUsers] = useState([]);
  const [libraryPage, setLibraryPage] = useState(1);
  const [userPage, setUserPage] = useState(1);
  const [libraryPagination, setLibraryPagination] = useState(null);
  const [userPagination, setUserPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busyAction, setBusyAction] = useState('');
  const [search, setSearch] = useState('');

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [statsResponse, librariesResponse, usersResponse] = await Promise.all([
        axios.get('/admin/stats'),
        axios.get('/admin/libraries', { params: { page: libraryPage, limit: PAGE_SIZE } }),
        axios.get('/admin/users', { params: { page: userPage, limit: PAGE_SIZE } })
      ]);

      setStats(statsResponse.data.data);
      setLibraries(librariesResponse.data.data.libraries);
      setLibraryPagination(librariesResponse.data.data.pagination);
      setUsers(usersResponse.data.data.users);
      setUserPagination(usersResponse.data.data.pagination);
    } catch (error) {
      const message = error.response?.data?.message || 'Could not load the admin dashboard.';
      setLoadError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [libraryPage, userPage]);

  useEffect(() => {
    Promise.resolve().then(loadDashboard);
  }, [loadDashboard]);

  const handleVerification = async (library) => {
    const libraryId = library._id;
    setBusyAction(`library-${libraryId}`);
    try {
      const response = await axios.patch(`/admin/libraries/${libraryId}/verify`, {
        isVerified: !library.isVerified
      });
      setLibraries((current) =>
        current.map((item) => item._id === libraryId ? response.data.data.library : item)
      );
      toast.success(response.data.message || 'Branch verification updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update branch verification.');
    } finally {
      setBusyAction('');
    }
  };

  const handleUserBlock = async (account) => {
    const userId = account._id;
    setBusyAction(`user-${userId}`);
    try {
      const response = await axios.patch(`/admin/users/${userId}/block`, {
        isBlocked: !account.isBlocked
      });
      setUsers((current) =>
        current.map((item) => item._id === userId ? response.data.data.user : item)
      );
      toast.success(response.data.message || 'User status updated.');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update the user status.');
    } finally {
      setBusyAction('');
    }
  };

  const filteredUsers = users.filter((account) => {
    const term = search.trim().toLowerCase();
    return !term || [account.name, account.email, account.role, account.city]
      .some((value) => value?.toLowerCase().includes(term));
  });

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'branches', label: 'Branches' },
    { id: 'users', label: 'Users' }
  ];

  return (
    <div className="min-h-screen bg-darkBg text-textMain">
      <header className="border-b border-white/5 bg-black/20">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 font-heading text-lg font-bold text-primary">
              S
            </div>
            <div className="min-w-0">
              <p className="font-heading text-lg font-bold text-white">StudySeat Admin</p>
              <p className="truncate text-xs text-textMuted">Signed in as {user?.name || 'Admin'}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-textMuted transition hover:border-white/20 hover:bg-white/5 hover:text-white"
          >
            Log out
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">Control center</p>
          <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">Admin dashboard</h1>
          <p className="mt-2 text-sm text-textMuted">
            Monitor platform activity, verify library branches, and manage user access.
          </p>
        </div>

        <nav className="mb-8 flex gap-2 overflow-x-auto border-b border-white/10" aria-label="Admin sections">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-semibold transition ${
                activeTab === item.id
                  ? 'border-primary text-white'
                  : 'border-transparent text-textMuted hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {loading ? (
          <div className="flex min-h-64 items-center justify-center">
            <div className="text-center">
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
              <p className="text-sm text-textMuted">Loading admin dashboard…</p>
            </div>
          </div>
        ) : loadError ? (
          <div className="glass-card rounded-2xl p-8 text-center">
            <p className="font-semibold text-white">Dashboard data could not be loaded</p>
            <p className="mt-2 text-sm text-textMuted">{loadError}</p>
            <button
              onClick={loadDashboard}
              className="mt-5 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/80"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {(activeTab === 'overview' || activeTab === 'branches') && (
              <section aria-label="Platform statistics">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {activeTab === 'overview' ? 'Platform overview' : 'Branch overview'}
                    </h2>
                    <p className="mt-1 text-sm text-textMuted">A snapshot of activity across StudySeat.</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="Registered users" value={stats?.totalUsers} detail="All user accounts" accent="text-primary" />
                  <StatCard label="Library branches" value={stats?.totalLibraries} detail="Branches registered on the platform" accent="text-secondary" />
                  <StatCard label="Bookings" value={stats?.totalBookings} detail="Bookings created to date" accent="text-success" />
                </div>
              </section>
            )}

            {(activeTab === 'overview' || activeTab === 'branches') && (
              <section className="mt-8">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">Library branches</h2>
                    <p className="mt-1 text-sm text-textMuted">Review branches and update their verification status.</p>
                  </div>
                  {activeTab === 'overview' && (
                    <button
                      onClick={() => setActiveTab('branches')}
                      className="text-sm font-semibold text-primary transition hover:text-white"
                    >
                      Manage branches →
                    </button>
                  )}
                </div>
                {libraries.length === 0 ? (
                  <EmptyState>No library branches have been registered yet.</EmptyState>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-textMuted">
                          <tr>
                            <th className="px-5 py-4 font-semibold">Branch</th>
                            <th className="px-5 py-4 font-semibold">City</th>
                            <th className="px-5 py-4 font-semibold">Seats</th>
                            <th className="px-5 py-4 font-semibold">Added</th>
                            <th className="px-5 py-4 font-semibold">Status</th>
                            <th className="px-5 py-4 text-right font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {libraries.map((library) => (
                            <tr key={library._id} className="transition hover:bg-white/[0.025]">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-white">{library.name}</p>
                                <p className="mt-1 max-w-xs truncate text-xs text-textMuted">{library.address}</p>
                              </td>
                              <td className="px-5 py-4 text-textMuted">{library.city || '—'}</td>
                              <td className="px-5 py-4 text-textMuted">{library.totalSeats ?? '—'}</td>
                              <td className="px-5 py-4 text-textMuted">{formatDate(library.createdAt)}</td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  library.isVerified
                                    ? 'bg-success/10 text-success'
                                    : 'bg-warning/10 text-warning'
                                }`}>
                                  {library.isVerified ? 'Verified' : 'Pending'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                <button
                                  onClick={() => handleVerification(library)}
                                  disabled={busyAction === `library-${library._id}`}
                                  className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${
                                    library.isVerified
                                      ? 'border-white/10 text-textMuted hover:bg-white/5 hover:text-white'
                                      : 'border-success/20 bg-success/10 text-success hover:bg-success/20'
                                  }`}
                                >
                                  {busyAction === `library-${library._id}`
                                    ? 'Saving…'
                                    : library.isVerified ? 'Unverify' : 'Verify branch'}
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {activeTab === 'branches' && (
                      <Pagination
                        page={libraryPagination?.page || libraryPage}
                        totalPages={libraryPagination?.totalPages || 1}
                        onChange={setLibraryPage}
                      />
                    )}
                  </div>
                )}
              </section>
            )}

            {(activeTab === 'overview' || activeTab === 'users') && (
              <section className="mt-8">
                <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-white">User accounts</h2>
                    <p className="mt-1 text-sm text-textMuted">Search accounts and manage platform access.</p>
                  </div>
                  {activeTab === 'overview' && (
                    <button
                      onClick={() => setActiveTab('users')}
                      className="text-sm font-semibold text-primary transition hover:text-white"
                    >
                      Manage users →
                    </button>
                  )}
                </div>
                {activeTab === 'users' && (
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search name, email, role, or city"
                    className="input-field mb-4 max-w-md"
                    aria-label="Search users"
                  />
                )}
                {filteredUsers.length === 0 ? (
                  <EmptyState>{search ? 'No users match your search.' : 'No user accounts found.'}</EmptyState>
                ) : (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[700px] text-left text-sm">
                        <thead className="bg-white/[0.04] text-xs uppercase tracking-wider text-textMuted">
                          <tr>
                            <th className="px-5 py-4 font-semibold">User</th>
                            <th className="px-5 py-4 font-semibold">Role</th>
                            <th className="px-5 py-4 font-semibold">City</th>
                            <th className="px-5 py-4 font-semibold">Joined</th>
                            <th className="px-5 py-4 font-semibold">Status</th>
                            <th className="px-5 py-4 text-right font-semibold">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {filteredUsers.slice(0, activeTab === 'overview' ? 5 : undefined).map((account) => (
                            <tr key={account._id} className="transition hover:bg-white/[0.025]">
                              <td className="px-5 py-4">
                                <p className="font-semibold text-white">{account.name}</p>
                                <p className="mt-1 text-xs text-textMuted">{account.email}</p>
                              </td>
                              <td className="px-5 py-4">
                                <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold capitalize text-primary">
                                  {account.role}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-textMuted">{account.city || '—'}</td>
                              <td className="px-5 py-4 text-textMuted">{formatDate(account.createdAt)}</td>
                              <td className="px-5 py-4">
                                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                  account.isBlocked
                                    ? 'bg-error/10 text-error'
                                    : 'bg-success/10 text-success'
                                }`}>
                                  {account.isBlocked ? 'Blocked' : 'Active'}
                                </span>
                              </td>
                              <td className="px-5 py-4 text-right">
                                {account.role === 'admin' ? (
                                  <span className="text-xs text-textMuted">
                                    {account._id === user?._id ? 'Your account' : 'Admin protected'}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleUserBlock(account)}
                                    disabled={busyAction === `user-${account._id}`}
                                    className={`rounded-lg border px-3 py-2 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-50 ${
                                      account.isBlocked
                                        ? 'border-success/20 bg-success/10 text-success hover:bg-success/20'
                                        : 'border-error/20 bg-error/10 text-error hover:bg-error/20'
                                    }`}
                                  >
                                    {busyAction === `user-${account._id}`
                                      ? 'Saving…'
                                      : account.isBlocked ? 'Unblock' : 'Block user'}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    {activeTab === 'users' && (
                      <Pagination
                        page={userPagination?.page || userPage}
                        totalPages={userPagination?.totalPages || 1}
                        onChange={setUserPage}
                      />
                    )}
                  </div>
                )}
              </section>
            )}
          </>
        )}
      </main>
    </div>
  );
}

function Pagination({ page, totalPages, onChange }) {
  return (
    <div className="flex items-center justify-between border-t border-white/5 px-5 py-3">
      <p className="text-xs text-textMuted">Page {page} of {totalPages}</p>
      <div className="flex gap-2">
        <button
          onClick={() => onChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-textMuted transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>
        <button
          onClick={() => onChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-xs font-semibold text-textMuted transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminPanel;
