/**
 * 数据库初始化脚本
 * 创建所有表并插入模拟数据
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const DATABASE_URL = 'postgresql://admin:nba_integrity_2025_secure@localhost:5432/nba_integrity';

async function initDatabase() {
  const pool = new Pool({ connectionString: DATABASE_URL });

  try {
    console.log('🚀 开始初始化数据库...\n');

    // 1. 读取并执行所有 schema
    console.log('📦 创建数据库表...');

    const schemas = [
      '../database/schema.sql',
      '../database/payment-schema.sql'
    ];

    for (const schemaFile of schemas) {
      const schemaPath = path.join(__dirname, schemaFile);
      if (fs.existsSync(schemaPath)) {
        const sql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(sql);
        console.log(`   ✅ ${path.basename(schemaFile)}`);
      }
    }

    console.log('\n📊 插入模拟数据...\n');

    // 2. 插入模拟市场数据
    console.log('   插入市场数据...');
    await pool.query(`
      INSERT INTO markets (slug, question, outcomes, end_date, volume, liquidity, active, created_at)
      VALUES
        ('will-trump-win-2024', 'Will Trump win the 2024 election?', '["YES", "NO"]', '2024-11-05', '15234567.89', '8500000', true, NOW() - INTERVAL '30 days'),
        ('btc-above-100k-2024', 'Will Bitcoin reach $100k in 2024?', '["YES", "NO"]', '2024-12-31', '8923456.12', '4200000', true, NOW() - INTERVAL '20 days'),
        ('eth-merge-success', 'Will Ethereum 2.0 launch successfully?', '["YES", "NO"]', '2024-06-30', '5432198.45', '2800000', true, NOW() - INTERVAL '15 days'),
        ('lakers-win-championship', 'Will Lakers win NBA Championship 2024?', '["YES", "NO"]', '2024-06-15', '3218765.90', '1500000', true, NOW() - INTERVAL '10 days'),
        ('ai-replace-jobs', 'Will AI replace 50% jobs by 2030?', '["YES", "NO"]', '2030-01-01', '2156789.34', '1200000', true, NOW() - INTERVAL '5 days')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // 3. 插入模拟用户数据
    console.log('   插入用户数据...');
    await pool.query(`
      INSERT INTO users (email, password_hash, wallet_address, email_verified, created_at)
      VALUES
        ('trader1@example.com', '$2b$10$abcdefghijklmnopqrstuv', '0x1234567890123456789012345678901234567890', true, NOW() - INTERVAL '90 days'),
        ('trader2@example.com', '$2b$10$bcdefghijklmnopqrstuvw', '0x2345678901234567890123456789012345678901', true, NOW() - INTERVAL '75 days'),
        ('trader3@example.com', '$2b$10$cdefghijklmnopqrstuvwx', '0x3456789012345678901234567890123456789012', true, NOW() - INTERVAL '60 days'),
        ('trader4@example.com', '$2b$10$defghijklmnopqrstuvwxy', '0x4567890123456789012345678901234567890123', true, NOW() - INTERVAL '45 days'),
        ('trader5@example.com', '$2b$10$efghijklmnopqrstuvwxyz', '0x5678901234567890123456789012345678901234', true, NOW() - INTERVAL '30 days')
      ON CONFLICT (email) DO NOTHING;
    `);

    // 4. 插入模拟交易数据
    console.log('   插入交易数据...');
    const traders = [
      '0x1234567890123456789012345678901234567890',
      '0x2345678901234567890123456789012345678901',
      '0x3456789012345678901234567890123456789012',
      '0x4567890123456789012345678901234567890123',
      '0x5678901234567890123456789012345678901234'
    ];

    const markets = ['will-trump-win-2024', 'btc-above-100k-2024', 'eth-merge-success', 'lakers-win-championship', 'ai-replace-jobs'];
    const outcomes = ['YES', 'NO'];
    const tradeTypes = ['BUY', 'SELL'];

    // 生成 100 条交易记录
    for (let i = 0; i < 100; i++) {
      const trader = traders[Math.floor(Math.random() * traders.length)];
      const market = markets[Math.floor(Math.random() * markets.length)];
      const outcome = outcomes[Math.floor(Math.random() * outcomes.length)];
      const tradeType = tradeTypes[Math.floor(Math.random() * tradeTypes.length)];
      const price = (Math.random() * 0.8 + 0.1).toFixed(4); // 0.1 - 0.9
      const size = (Math.random() * 50000 + 1000).toFixed(2); // $1,000 - $51,000
      const daysAgo = Math.floor(Math.random() * 30);

      await pool.query(`
        INSERT INTO trades (market_slug, outcome, trade_type, price, size, trader, timestamp)
        VALUES ($1, $2, $3, $4, $5, $6, NOW() - INTERVAL '${daysAgo} days')
      `, [market, outcome, tradeType, price, size, trader]);
    }

    // 5. 插入交易者档案
    console.log('   插入交易者档案...');
    await pool.query(`
      INSERT INTO trader_profiles (trader_address, total_trades, total_volume, win_rate, trading_style, risk_score, reputation_score, profile_completeness, created_at)
      VALUES
        ('0x1234567890123456789012345678901234567890', 45, '850000', 0.73, 'aggressive', 78, 85, 95, NOW() - INTERVAL '90 days'),
        ('0x2345678901234567890123456789012345678901', 32, '520000', 0.68, 'balanced', 72, 78, 88, NOW() - INTERVAL '75 days'),
        ('0x3456789012345678901234567890123456789012', 28, '380000', 0.62, 'balanced', 65, 70, 82, NOW() - INTERVAL '60 days'),
        ('0x4567890123456789012345678901234567890123', 18, '145000', 0.55, 'conservative', 58, 62, 75, NOW() - INTERVAL '45 days'),
        ('0x5678901234567890123456789012345678901234', 12, '95000', 0.48, 'conservative', 52, 55, 68, NOW() - INTERVAL '30 days')
      ON CONFLICT (trader_address) DO NOTHING;
    `);

    // 6. 插入徽章数据
    console.log('   插入徽章数据...');
    await pool.query(`
      INSERT INTO trader_badges (trader_address, badge_type, criteria_met, earned_at)
      VALUES
        ('0x1234567890123456789012345678901234567890', 'Oracle', 'Win rate > 70%', NOW() - INTERVAL '10 days'),
        ('0x1234567890123456789012345678901234567890', 'Whale', 'Volume > $500k', NOW() - INTERVAL '15 days'),
        ('0x1234567890123456789012345678901234567890', 'Early Trader', 'Account age > 90 days', NOW() - INTERVAL '1 day'),
        ('0x2345678901234567890123456789012345678901', 'Big Player', 'Volume > $100k', NOW() - INTERVAL '20 days'),
        ('0x2345678901234567890123456789012345678901', 'Sharp Trader', 'Win rate > 60%', NOW() - INTERVAL '12 days'),
        ('0x3456789012345678901234567890123456789012', 'Sharp Trader', 'Win rate > 60%', NOW() - INTERVAL '8 days'),
        ('0x3456789012345678901234567890123456789012', 'Big Player', 'Volume > $100k', NOW() - INTERVAL '5 days')
      ON CONFLICT (trader_address, badge_type) DO NOTHING;
    `);

    // 7. 插入订阅计划（payment service）
    console.log('   插入订阅计划...');
    await pool.query(`
      INSERT INTO subscription_plans (name, description, duration, price, currency, features, active)
      VALUES
        ('Starter', 'Basic analytics and market insights', 30, '49', 'USDC', '["Basic Analytics", "API Access (1K calls/month)", "Email Support"]', true),
        ('Pro', 'Advanced analytics with custom reports', 30, '149', 'USDC', '["Advanced Analytics", "API Access (10K calls/month)", "Priority Support", "Custom Reports"]', true),
        ('Enterprise', 'Full platform access with dedicated support', 30, '499', 'USDC', '["Premium Analytics", "Unlimited API Access", "24/7 Support", "Dedicated Account Manager", "Custom Integrations"]', true)
      ON CONFLICT DO NOTHING;
    `);

    // 8. 插入服务费配置
    console.log('   插入服务费配置...');
    await pool.query(`
      INSERT INTO service_fee_config (api_call_fee, data_access_fee, advanced_analytics_fee, currency, active)
      VALUES ('0.001', '9.99', '0.1', 'USDC', true)
      ON CONFLICT DO NOTHING;
    `);

    console.log('\n✅ 数据库初始化完成！\n');

    // 验证数据
    console.log('📊 数据统计：');
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM markets) as markets,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM trades) as trades,
        (SELECT COUNT(*) FROM trader_profiles) as profiles,
        (SELECT COUNT(*) FROM trader_badges) as badges,
        (SELECT COUNT(*) FROM subscription_plans) as plans
    `);

    console.log(`   市场数据: ${stats.rows[0].markets} 个`);
    console.log(`   用户数据: ${stats.rows[0].users} 个`);
    console.log(`   交易记录: ${stats.rows[0].trades} 条`);
    console.log(`   交易者档案: ${stats.rows[0].profiles} 个`);
    console.log(`   徽章数据: ${stats.rows[0].badges} 个`);
    console.log(`   订阅计划: ${stats.rows[0].plans} 个`);

    console.log('\n🎉 所有数据准备完毕！可以启动服务了。\n');

  } catch (error) {
    console.error('❌ 初始化失败:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 运行初始化
initDatabase().catch(console.error);
