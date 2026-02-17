const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 7002;

app.use(cors());
app.use(express.json());

// ============ Mock Data ============

const mockUsers = [
  { _id: 'u1', email: 'alice@test.com', nickname: 'Alice', avatar: '', role: 'vip', status: 'active', coins: 500, createdAt: '2025-12-01' },
  { _id: 'u2', email: 'bob@test.com', nickname: 'Bob', avatar: '', role: 'user', status: 'active', coins: 120, createdAt: '2025-12-15' },
  { _id: 'u3', email: 'carol@test.com', nickname: 'Carol', avatar: '', role: 'user', status: 'banned', coins: 0, createdAt: '2026-01-05' },
];

const mockCategories = [
  { _id: 'c1', name: 'Romance', slug: 'romance', dramaCount: 24 },
  { _id: 'c2', name: 'Suspense', slug: 'suspense', dramaCount: 18 },
  { _id: 'c3', name: 'Comedy', slug: 'comedy', dramaCount: 12 },
  { _id: 'c4', name: 'Fantasy', slug: 'fantasy', dramaCount: 9 },
];

const mockDramas = [
  { _id: 'd1', title: 'Love in the City', category: 'Romance', status: 'published', episodes: 20, views: 158000, rating: 4.8, coverUrl: '', createdAt: '2025-11-20' },
  { _id: 'd2', title: 'Dark Secrets', category: 'Suspense', status: 'published', episodes: 16, views: 92000, rating: 4.5, coverUrl: '', createdAt: '2025-12-01' },
  { _id: 'd3', title: 'Campus Days', category: 'Comedy', status: 'draft', episodes: 8, views: 0, rating: 0, coverUrl: '', createdAt: '2026-01-10' },
];

const mockEpisodes = [
  { _id: 'e1', dramaId: 'd1', title: 'First Meeting', episodeNumber: 1, duration: 180, isFree: true, unlockPrice: 0, videoUrl: '' },
  { _id: 'e2', dramaId: 'd1', title: 'The Confession', episodeNumber: 2, duration: 200, isFree: false, unlockPrice: 50, videoUrl: '' },
  { _id: 'e3', dramaId: 'd1', title: 'Heartbreak', episodeNumber: 3, duration: 190, isFree: false, unlockPrice: 50, videoUrl: '' },
];

const mockComments = [
  { _id: 'cm1', userId: 'u1', userName: 'Alice', dramaId: 'd1', content: 'Amazing drama!', status: 'approved', createdAt: '2026-01-15' },
  { _id: 'cm2', userId: 'u2', userName: 'Bob', dramaId: 'd2', content: 'So thrilling', status: 'pending', createdAt: '2026-01-16' },
];

const mockTransactions = [
  { _id: 't1', userId: 'u1', userName: 'Alice', type: 'recharge', amount: 9.99, coins: 100, status: 'completed', createdAt: '2026-01-10' },
  { _id: 't2', userId: 'u2', userName: 'Bob', type: 'subscription', amount: 19.99, plan: 'monthly', status: 'completed', createdAt: '2026-01-12' },
];

// ============ Auth Routes ============

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = mockUsers.find(u => u.email === email);
  if (user && password) {
    res.json({ data: { token: 'mock-jwt-token-' + user._id, user } });
  } else {
    res.status(401).json({ error: { message: 'Invalid credentials' } });
  }
});

app.post('/api/auth/register', (req, res) => {
  const { email, password, nickname } = req.body;
  const newUser = { _id: 'u' + Date.now(), email, nickname, avatar: '', role: 'user', status: 'active', coins: 0, createdAt: new Date().toISOString() };
  mockUsers.push(newUser);
  res.json({ data: { token: 'mock-jwt-token-' + newUser._id, user: newUser } });
});

app.get('/api/auth/me', (req, res) => {
  res.json({ data: mockUsers[0] });
});

// ============ Client Routes ============

app.get('/api/dramas', (req, res) => {
  res.json({ data: { dramas: mockDramas, total: mockDramas.length } });
});

app.get('/api/dramas/:id', (req, res) => {
  const drama = mockDramas.find(d => d._id === req.params.id);
  if (drama) {
    const episodes = mockEpisodes.filter(e => e.dramaId === drama._id);
    res.json({ data: { ...drama, episodes } });
  } else {
    res.status(404).json({ error: { message: 'Drama not found' } });
  }
});

app.get('/api/featured', (req, res) => {
  res.json({ data: { banners: mockDramas.slice(0, 2), trending: mockDramas, newReleases: mockDramas.slice(0, 1) } });
});

app.get('/api/featured/rankings', (req, res) => {
  res.json({ data: mockDramas });
});

app.get('/api/featured/trending', (req, res) => {
  res.json({ data: mockDramas });
});

app.get('/api/categories', (req, res) => {
  res.json({ data: mockCategories });
});

app.get('/api/comments', (req, res) => {
  res.json({ data: mockComments });
});

app.post('/api/comments', (req, res) => {
  const comment = { _id: 'cm' + Date.now(), ...req.body, status: 'pending', createdAt: new Date().toISOString() };
  mockComments.push(comment);
  res.json({ data: comment });
});

app.get('/api/coins/balance', (req, res) => {
  res.json({ data: { balance: 500 } });
});

app.get('/api/coins/packages', (req, res) => {
  res.json({ data: [
    { _id: 'p1', coins: 60, price: 0.99, bonus: 0 },
    { _id: 'p2', coins: 300, price: 4.99, bonus: 30 },
    { _id: 'p3', coins: 680, price: 9.99, bonus: 80 },
    { _id: 'p4', coins: 1500, price: 19.99, bonus: 200 },
  ]});
});

app.post('/api/coins/recharge', (req, res) => {
  res.json({ data: { success: true, balance: 800 } });
});

app.post('/api/coins/unlock', (req, res) => {
  res.json({ data: { success: true, balance: 450 } });
});

app.get('/api/user/favorites', (req, res) => {
  res.json({ data: [mockDramas[0]] });
});

app.post('/api/user/favorites', (req, res) => {
  res.json({ data: { success: true } });
});

app.delete('/api/user/favorites/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/user/history', (req, res) => {
  res.json({ data: [{ ...mockDramas[0], lastEpisode: 3, watchedAt: '2026-01-15' }] });
});

app.put('/api/user/profile', (req, res) => {
  res.json({ data: { success: true } });
});

app.put('/api/user/password', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/user/purchases', (req, res) => {
  res.json({ data: { purchases: mockTransactions, total: mockTransactions.length } });
});

app.get('/api/subscriptions/plans', (req, res) => {
  res.json({ data: [
    { _id: 'sp1', name: 'Monthly', price: 9.99, duration: 30 },
    { _id: 'sp2', name: 'Quarterly', price: 24.99, duration: 90 },
    { _id: 'sp3', name: 'Yearly', price: 79.99, duration: 365 },
  ]});
});

app.post('/api/auth/reset-password', (req, res) => {
  res.json({ data: { success: true } });
});

app.post('/api/auth/verify-code', (req, res) => {
  res.json({ data: { valid: true } });
});

app.post('/api/auth/reset-password/confirm', (req, res) => {
  res.json({ data: { success: true } });
});

// ============ Admin Routes ============

app.get('/api/admin/stats', (req, res) => {
  res.json({ data: { totalUsers: 12580, totalDramas: 63, totalRevenue: 285600, activeSubscriptions: 3420, todayNewUsers: 86, todayRevenue: 4280 } });
});

app.get('/api/admin/stats/charts', (req, res) => {
  res.json({ data: { revenue: [1200, 1800, 1500, 2200, 1900, 2800, 2400], users: { vip: 3420, free: 9160 }, topDramas: mockDramas } });
});

app.get('/api/admin/dramas', (req, res) => {
  res.json({ data: { dramas: mockDramas, total: mockDramas.length } });
});

app.get('/api/admin/dramas/:id', (req, res) => {
  const drama = mockDramas.find(d => d._id === req.params.id) || mockDramas[0];
  res.json({ data: drama });
});

app.post('/api/admin/dramas', (req, res) => {
  const drama = { _id: 'd' + Date.now(), ...req.body, createdAt: new Date().toISOString() };
  mockDramas.push(drama);
  res.json({ data: drama });
});

app.put('/api/admin/dramas/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.delete('/api/admin/dramas/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/episodes', (req, res) => {
  const { dramaId } = req.query;
  const episodes = dramaId ? mockEpisodes.filter(e => e.dramaId === dramaId) : mockEpisodes;
  res.json({ data: { episodes } });
});

app.post('/api/admin/episodes', (req, res) => {
  const ep = { _id: 'e' + Date.now(), ...req.body };
  mockEpisodes.push(ep);
  res.json({ data: ep });
});

app.put('/api/admin/episodes/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.delete('/api/admin/episodes/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/users', (req, res) => {
  res.json({ data: { users: mockUsers, total: mockUsers.length } });
});

app.get('/api/admin/users/:id', (req, res) => {
  const user = mockUsers.find(u => u._id === req.params.id) || mockUsers[0];
  res.json({ data: { user } });
});

app.put('/api/admin/users/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.get('/api/admin/categories', (req, res) => {
  res.json({ data: mockCategories });
});

app.post('/api/admin/categories', (req, res) => {
  const cat = { _id: 'c' + Date.now(), ...req.body, dramaCount: 0 };
  mockCategories.push(cat);
  res.json({ data: cat });
});

app.put('/api/admin/categories/:id', (req, res) => {
  res.json({ data: { _id: req.params.id, ...req.body } });
});

app.delete('/api/admin/categories/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/featured', (req, res) => {
  res.json({ data: mockDramas.slice(0, 2) });
});

app.post('/api/admin/featured', (req, res) => {
  res.json({ data: { _id: 'f' + Date.now(), ...req.body } });
});

app.delete('/api/admin/featured/:id', (req, res) => {
  res.json({ data: { success: true } });
});

app.get('/api/admin/transactions', (req, res) => {
  res.json({ data: { transactions: mockTransactions, total: mockTransactions.length } });
});

app.get('/api/admin/comments', (req, res) => {
  res.json({ data: { comments: mockComments, total: mockComments.length } });
});

app.post('/api/admin/comments/:id/approve', (req, res) => {
  res.json({ data: { success: true } });
});

app.post('/api/admin/comments/:id/reject', (req, res) => {
  res.json({ data: { success: true } });
});

app.delete('/api/admin/comments/:id', (req, res) => {
  res.json({ data: { success: true } });
});

// ============ Start Server ============

app.listen(PORT, () => {
  console.log(`[Backend] Mock API server running on http://localhost:${PORT}`);
  console.log(`  Client API:  http://localhost:${PORT}/api/*`);
  console.log(`  Admin API:   http://localhost:${PORT}/api/admin/*`);
});
