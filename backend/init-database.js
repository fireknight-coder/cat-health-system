import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './src/models/User.js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 连接MongoDB
async function initializeDatabase() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cat-health-system');
    console.log('✅ MongoDB连接成功');

    // 检查是否已有超级管理员
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (existingSuperAdmin) {
      console.log('ℹ️  超级管理员已存在，用户名:', existingSuperAdmin.username);
      return;
    }

    // 创建默认超级管理员 fireknight
    const superAdmin = new User({
      username: 'fireknight',
      email: 'fireknight@cat-system.com',
      password: 'letusenjoytheworld', 
      role: 'superadmin'
    });

    await superAdmin.save();
    console.log('✅ 默认超级管理员创建成功');
    console.log('📋 登录信息:');
    console.log('   用户名: fireknight');
    console.log('   邮箱: fireknight@cat-system.com');
    console.log('   密码: letusenjoytheworld');
    console.log('⚠️  请在生产环境中修改默认密码！');

  } catch (error) {
    console.error('❌ 数据库初始化失败:', error);
  } finally {
    await mongoose.connection.close();
  }
}

// 运行初始化
initializeDatabase();