import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// 环境变量配置
dotenv.config();

// 创建Express应用
const application = express();
const APPLICATION_PORT = process.env.PORT || 3002;

// 中间件配置
application.use(cors());
application.use(express.json());

// MongoDB连接
let dbConnection;
const mongoClientInstance = new MongoClient(process.env.MONGODB_URI || 'mongodb://localhost:27017');

async function initializeDatabaseConnection() {
  try {
    await mongoClientInstance.connect();
    dbConnection = mongoClientInstance.db('cat_management');
    console.log('✅ MongoDB连接成功');
  } catch (error) {
    console.error('❌ MongoDB连接失败:', error);
  }
}

initializeDatabaseConnection();

// JWT认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, error: '访问被拒绝，请先登录' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, error: '令牌无效' });
    }
    req.user = user;
    next();
  });
};

// 用户注册API
application.post('/api/auth/register', async (req, res) => {
  try {
    const { username, email, password, role = 'user', reason } = req.body;
    
    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: '请填写所有必填字段' });
    }

    // 检查用户是否已存在
    const existingUser = await dbConnection.collection('users').findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({ success: false, error: '用户名或邮箱已存在' });
    }

    // 密码加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 创建用户
    const newUser = {
      username,
      email,
      password: hashedPassword,
      role: role === 'admin' ? 'admin' : 'user',
      reason: role === 'admin' ? reason : null,
      isActive: role === 'user' ? true : false,
      status: role === 'admin' ? 'pending' : 'approved',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await dbConnection.collection('users').insertOne(newUser);
    
    res.json({
      success: true,
      message: role === 'admin' ? '管理员申请已提交，等待超级管理员审批' : '注册成功',
      userId: result.insertedId
    });

  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 用户登录API
application.post('/api/auth/login', async (req, res) => {
  try {
    console.log('🔍 登录请求:', req.body); // 调试日志
    
    const { username, email, password } = req.body;

    if ((!username && !email) || !password) {
      return res.status(400).json({ success: false, error: '请填写所有必填字段' });
    }

    // 查找用户 - 添加更详细的查询信息
    const query = {
      $or: [{ email: email || '' }, { username: username || '' }]
    };
    console.log('🔍 查询条件:', query);
    
    const user = await dbConnection.collection('users').findOne(query);

    console.log('🔍 找到的用户:', user); // 调试日志

    if (!user) {
      console.log('❌ 用户不存在，查询条件:', query);
      return res.status(400).json({ success: false, error: '用户不存在' });
    }

    // 检查用户状态
    if (!user.isActive) {
      console.log('❌ 用户未激活:', user.username, '状态:', user.status);
      return res.status(400).json({ success: false, error: '账号未激活，请联系管理员' });
    }

    // 验证密码 - 添加更详细的调试信息
    console.log('🔍 输入的密码:', password);
    console.log('🔍 数据库密码长度:', user.password ? user.password.length : 'null');
    console.log('🔍 数据库密码前缀:', user.password ? user.password.substring(0, 20) + '...' : 'null');
    
    // 检查密码格式
    if (!user.password || user.password.length < 10) {
      console.log('❌ 数据库密码格式异常');
      return res.status(400).json({ success: false, error: '密码格式错误' });
    }
    
    const validPassword = await bcrypt.compare(password, user.password);
    console.log('🔍 密码验证结果:', validPassword);
    
    if (!validPassword) {
      console.log('❌ 密码验证失败详细信息:');
      console.log('   - 输入的用户名:', username);
      console.log('   - 输入的邮箱:', email);
      console.log('   - 数据库用户名:', user.username);
      console.log('   - 数据库邮箱:', user.email);
      console.log('   - 数据库角色:', user.role);
      console.log('   - 数据库状态:', user.status);
      return res.status(400).json({ success: false, error: '密码错误' });
    }

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        userId: user._id, 
        username: user.username, 
        role: user.role 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });

  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 获取待审批的管理员申请
application.get('/api/admin/applications', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: '无权访问此资源' });
    }

    const applications = await dbConnection.collection('users').find({
      role: 'admin',
      status: 'pending'
    }).toArray();

    res.json({
      success: true,
      data: applications.map(app => ({
        id: app._id,
        username: app.username,
        email: app.email,
        reason: app.reason,
        createdAt: app.createdAt
      }))
    });
  } catch (error) {
    console.error('获取申请列表错误:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 审批管理员申请
application.put('/api/admin/applications/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.role !== 'superadmin') {
      return res.status(403).json({ success: false, error: '无权访问此资源' });
    }

    const { action } = req.body;
    const { id } = req.params;

    if (!['approve', 'reject'].includes(action)) {
      return res.status(400).json({ success: false, error: '无效的操作' });
    }

    const updateData = {
      status: action === 'approve' ? 'approved' : 'rejected',
      isActive: action === 'approve',
      updatedAt: new Date()
    };

    const result = await dbConnection.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, error: '申请未找到' });
    }

    res.json({ 
      success: true,
      message: action === 'approve' ? '申请已批准' : '申请已拒绝'
    });

  } catch (error) {
    console.error('审批错误:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 获取用户信息
application.get('/api/auth/user', authenticateToken, async (req, res) => {
  try {
    const user = await dbConnection.collection('users').findOne({ _id: new ObjectId(req.user.userId) });
    
    if (!user) {
      return res.status(404).json({ success: false, error: '用户不存在' });
    }

    res.json({
      success: true,
      data: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ success: false, error: '服务器错误' });
  }
});

// 启动服务器
application.listen(APPLICATION_PORT, () => {
  console.log(`🚀 服务器运行在端口 ${APPLICATION_PORT}`);
});