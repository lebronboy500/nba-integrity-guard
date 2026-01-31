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
      INSERT INTO markets (slug, condition_id, question_id, oracle, collateral_token, yes_token_id, no_token_id, question, status, created_at)
      VALUES
        ('will-trump-win-2024', '0x0000000000000000000000000000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000000000000000000000000000001', '0x1234567890123456789012345678901234567890', '0xusdc_address', '0x1111111111111111111111111111111111111111111111111111111111111111', '0x2222222222222222222222222222222222222222222222222222222222222222', 'Will Trump win the 2024 election?', 'active', NOW() - INTERVAL '30 days'),
        ('btc-above-100k-2024', '0x0000000000000000000000000000000000000000000000000000000000000002', '0x0000000000000000000000000000000000000000000000000000000000000002', '0x1234567890123456789012345678901234567890', '0xusdc_address', '0x3333333333333333333333333333333333333333333333333333333333333333', '0x4444444444444444444444444444444444444444444444444444444444444444', 'Will Bitcoin reach $100k in 2024?', 'active', NOW() - INTERVAL '20 days'),
        ('eth-merge-success', '0x0000000000000000000000000000000000000000000000000000000000000003', '0x0000000000000000000000000000000000000000000000000000000000000003', '0x1234567890123456789012345678901234567890', '0xusdc_address', '0x5555555555555555555555555555555555555555555555555555555555555555', '0x6666666666666666666666666666666666666666666666666666666666666666', 'Will Ethereum 2.0 launch successfully?', 'active', NOW() - INTERVAL '15 days'),
        ('lakers-win-championship', '0x0000000000000000000000000000000000000000000000000000000000000004', '0x0000000000000000000000000000000000000000000000000000000000000004', '0x1234567890123456789012345678901234567890', '0xusdc_address', '0x7777777777777777777777777777777777777777777777777777777777777777', '0x8888888888888888888888888888888888888888888888888888888888888888', 'Will Lakers win NBA Championship 2024?', 'active', NOW() - INTERVAL '10 days'),
        ('ai-replace-jobs', '0x0000000000000000000000000000000000000000000000000000000000000005', '0x0000000000000000000000000000000000000000000000000000000000000005', '0x1234567890123456789012345678901234567890', '0xusdc_address', '0x9999999999999999999999999999999999999999999999999999999999999999', '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', 'Will AI replace 50% jobs by 2030?', 'active', NOW() - INTERVAL '5 days')
      ON CONFLICT (slug) DO NOTHING;
    `);

    // 3. 插入模拟用户数据
    console.log('   插入用户数据...');
    await pool.query(`
      INSERT INTO users (email, username, password_hash, wallet_address, is_verified, created_at)
      VALUES
        ('trader1@example.com', 'trader1', '$2b$10$abcdefghijklmnopqrstuv', '0x1234567890123456789012345678901234567890', true, NOW() - INTERVAL '90 days'),
        ('trader2@example.com', 'trader2', '$2b$10$bcdefghijklmnopqrstuvw', '0x2345678901234567890123456789012345678901', true, NOW() - INTERVAL '75 days'),
        ('trader3@example.com', 'trader3', '$2b$10$cdefghijklmnopqrstuvwx', '0x3456789012345678901234567890123456789012', true, NOW() - INTERVAL '60 days'),
        ('trader4@example.com', 'trader4', '$2b$10$defghijklmnopqrstuvwxy', '0x4567890123456789012345678901234567890123', true, NOW() - INTERVAL '45 days'),
        ('trader5@example.com', 'trader5', '$2b$10$efghijklmnopqrstuvwxyz', '0x5678901234567890123456789012345678901234', true, NOW() - INTERVAL '30 days')
      ON CONFLICT (email) DO NOTHING;
    `);

    console.log('\n✅ 数据库初始化完成！\n');

    // 验证数据
    console.log('📊 数据统计：');
    const stats = await pool.query(`
      SELECT
        (SELECT COUNT(*) FROM markets) as markets,
        (SELECT COUNT(*) FROM users) as users,
        (SELECT COUNT(*) FROM subscription_plans) as plans
    `);

    console.log(`   市场数据: ${stats.rows[0].markets} 个`);
    console.log(`   用户数据: ${stats.rows[0].users} 个`);
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
