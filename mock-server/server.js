const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 模拟市场数据
const markets = [
  {
    id: 1,
    slug: 'will-trump-win-2024',
    question: 'Will Trump win the 2024 election?',
    outcomes: ['YES', 'NO'],
    endDate: '2024-11-05',
    volume: 15234567.89,
    liquidity: 8500000,
    yesPrice: 0.72,
    noPrice: 0.28
  },
  {
    id: 2,
    slug: 'btc-above-100k-2024',
    question: 'Will Bitcoin reach $100k in 2024?',
    outcomes: ['YES', 'NO'],
    endDate: '2024-12-31',
    volume: 8923456.12,
    liquidity: 4200000,
    yesPrice: 0.65,
    noPrice: 0.35
  },
  {
    id: 3,
    slug: 'eth-merge-success',
    question: 'Will Ethereum 2.0 launch successfully?',
    outcomes: ['YES', 'NO'],
    endDate: '2024-06-30',
    volume: 5432198.45,
    liquidity: 2800000,
    yesPrice: 0.92,
    noPrice: 0.08
  },
  {
    id: 4,
    slug: 'lakers-win-championship',
    question: 'Will Lakers win NBA Championship 2024?',
    outcomes: ['YES', 'NO'],
    endDate: '2024-06-15',
    volume: 3218765.90,
    liquidity: 1500000,
    yesPrice: 0.48,
    noPrice: 0.52
  },
  {
    id: 5,
    slug: 'ai-replace-jobs',
    question: 'Will AI replace 50% jobs by 2030?',
    outcomes: ['YES', 'NO'],
    endDate: '2030-01-01',
    volume: 2156789.34,
    liquidity: 1200000,
    yesPrice: 0.58,
    noPrice: 0.42
  }
];

// 模拟交易者数据
const traders = [
  {
    address: '0x1234567890123456789012345678901234567890',
    totalTrades: 45,
    totalVolume: 850000,
    winRate: 0.73,
    tradingStyle: 'Aggressive',
    riskScore: 78,
    reputationScore: 85,
    badges: ['Oracle', 'Whale', 'Early Trader']
  },
  {
    address: '0x2345678901234567890123456789012345678901',
    totalTrades: 32,
    totalVolume: 520000,
    winRate: 0.68,
    tradingStyle: 'Balanced',
    riskScore: 72,
    reputationScore: 78,
    badges: ['Big Player', 'Sharp Trader']
  },
  {
    address: '0x3456789012345678901234567890123456789012',
    totalTrades: 28,
    totalVolume: 380000,
    winRate: 0.62,
    tradingStyle: 'Balanced',
    riskScore: 65,
    reputationScore: 70,
    badges: ['Sharp Trader', 'Big Player']
  },
  {
    address: '0x4567890123456789012345678901234567890123',
    totalTrades: 18,
    totalVolume: 145000,
    winRate: 0.55,
    tradingStyle: 'Conservative',
    riskScore: 58,
    reputationScore: 62,
    badges: []
  },
  {
    address: '0x5678901234567890123456789012345678901234',
    totalTrades: 12,
    totalVolume: 95000,
    winRate: 0.48,
    tradingStyle: 'Conservative',
    riskScore: 52,
    reputationScore: 55,
    badges: []
  }
];

// 排序后的排行榜
const leaderboard = [...traders].sort((a, b) => b.reputationScore - a.reputationScore);

// API 端点

// 1. 获取所有市场
app.get('/api/markets', (req, res) => {
  res.json({
    success: true,
    data: markets
  });
});

// 2. 获取单个市场
app.get('/api/markets/:slug', (req, res) => {
  const market = markets.find(m => m.slug === req.params.slug);
  if (!market) {
    return res.status(404).json({ success: false, error: 'Market not found' });
  }
  res.json({ success: true, data: market });
});

// 3. 获取市场分析
app.get('/api/analytics/sentiment/:slug', (req, res) => {
  res.json({
    success: true,
    data: {
      market: req.params.slug,
      buyVolume: Math.random() * 50000000,
      sellVolume: Math.random() * 50000000,
      buyCount: Math.floor(Math.random() * 5000),
      sellCount: Math.floor(Math.random() * 5000),
      confidence: (Math.random() * 0.3 + 0.7).toFixed(2)
    }
  });
});

// 4. 获取排行榜
app.get('/api/reputation/leaderboard', (req, res) => {
  res.json({
    success: true,
    data: leaderboard,
    count: leaderboard.length
  });
});

// 5. 获取交易者档案
app.get('/api/reputation/profile/:address', (req, res) => {
  const trader = traders.find(t => t.address.toLowerCase() === req.params.address.toLowerCase());
  if (!trader) {
    return res.status(404).json({ success: false, error: 'Trader not found' });
  }
  res.json({ success: true, data: trader });
});

// 6. 获取交易者统计
app.get('/api/reputation/stats/:address', (req, res) => {
  const trader = traders.find(t => t.address.toLowerCase() === req.params.address.toLowerCase());
  if (!trader) {
    return res.status(404).json({ success: false, error: 'Trader not found' });
  }
  res.json({
    success: true,
    data: {
      address: trader.address,
      totalTrades: trader.totalTrades,
      totalVolume: trader.totalVolume,
      winRate: trader.winRate,
      tradingStyle: trader.tradingStyle,
      riskScore: trader.riskScore,
      profitFactor: (Math.random() * 1.5 + 1).toFixed(2),
      maxWin: Math.floor(Math.random() * 50000 + 10000),
      maxLoss: Math.floor(Math.random() * 20000 + 5000)
    }
  });
});

// 7. 获取交易者评分
app.get('/api/reputation/score/:address', (req, res) => {
  const trader = traders.find(t => t.address.toLowerCase() === req.params.address.toLowerCase());
  if (!trader) {
    return res.status(404).json({ success: false, error: 'Trader not found' });
  }
  res.json({
    success: true,
    data: {
      address: trader.address,
      overallScore: trader.reputationScore,
      tradingReputation: trader.reputationScore * 0.4 + Math.random() * 20,
      socialReputation: trader.reputationScore * 0.3 + Math.random() * 15,
      trustScore: trader.reputationScore * 0.3 + Math.random() * 15,
      tier: trader.reputationScore > 80 ? 'Expert' : trader.reputationScore > 60 ? 'Advanced' : trader.reputationScore > 40 ? 'Intermediate' : 'Novice'
    }
  });
});

// 8. 获取交易者徽章
app.get('/api/reputation/badges/:address', (req, res) => {
  const trader = traders.find(t => t.address.toLowerCase() === req.params.address.toLowerCase());
  if (!trader) {
    return res.status(404).json({ success: false, error: 'Trader not found' });
  }
  res.json({
    success: true,
    data: trader.badges,
    count: trader.badges.length
  });
});

// 9. 获取交易历史
app.get('/api/reputation/history/:address', (req, res) => {
  const limit = parseInt(req.query.limit) || 10;
  const history = [];
  for (let i = 0; i < limit; i++) {
    history.push({
      id: i + 1,
      market: markets[Math.floor(Math.random() * markets.length)].question,
      outcome: Math.random() > 0.5 ? 'YES' : 'NO',
      tradeType: Math.random() > 0.5 ? 'BUY' : 'SELL',
      price: (Math.random() * 0.8 + 0.1).toFixed(4),
      size: (Math.random() * 50000 + 1000).toFixed(2),
      pnl: (Math.random() * 20000 - 5000).toFixed(2),
      timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString()
    });
  }
  res.json({
    success: true,
    data: history,
    count: history.length
  });
});

// 10. 健康检查
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'mock-api-server',
    timestamp: new Date()
  });
});

// 启动服务器
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log('');
  console.log('🚀 Mock API Server 运行中！');
  console.log('');
  console.log(`📡 服务地址: http://localhost:${PORT}`);
  console.log(`💊 健康检查: http://localhost:${PORT}/health`);
  console.log('');
  console.log('📊 可用 API:');
  console.log('  GET /api/markets              - 获取所有市场');
  console.log('  GET /api/markets/:slug        - 获取单个市场');
  console.log('  GET /api/analytics/sentiment/:slug - 市场情绪');
  console.log('  GET /api/reputation/leaderboard    - 排行榜');
  console.log('  GET /api/reputation/profile/:address - 交易者档案');
  console.log('  GET /api/reputation/stats/:address   - 交易者统计');
  console.log('  GET /api/reputation/score/:address   - 评分');
  console.log('  GET /api/reputation/badges/:address  - 徽章');
  console.log('  GET /api/reputation/history/:address - 交易历史');
  console.log('');
});
