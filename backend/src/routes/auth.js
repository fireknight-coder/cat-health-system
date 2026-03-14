import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';

const router = express.Router();

// 生成JWT令牌
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'fallback-secret',
    { expiresIn: '7d' }
  );
};

// 用户注册
router.post('/register', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('注册请求:', { username, email });

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名、邮箱和密码是必需的'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '用户名或邮箱已被使用'
      });
    }

    // 创建新用户
    const user = new User({
      username,
      email,
      password
    });

    await user.save();
    console.log('用户创建成功:', user._id);

    // 生成令牌
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      },
      message: '注册成功'
    });
  } catch (error) {
    console.error('注册错误:', error);
    res.status(500).json({
      success: false,
      error: '注册失败: ' + error.message
    });
  }
});

// 用户登录
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;

    console.log('登录请求:', { username, email });

    if ((!username && !email) || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名/邮箱和密码是必需的'
      });
    }

    // 查找用户：支持用户名或邮箱登录
    let user;
    if (username) {
      // 使用用户名登录
      user = await User.findOne({ username });
    } else {
      // 使用邮箱登录
      user = await User.findOne({ email });
    }
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户名/邮箱或密码错误'
      });
    }

    // 验证密码
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: '邮箱或密码错误'
      });
    }

    // 检查账户状态
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        error: '账户已被禁用'
      });
    }

    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成令牌
    const token = generateToken(user._id);

    console.log('登录成功:', user._id);

    res.json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      },
      message: '登录成功'
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({
      success: false,
      error: '登录失败: ' + error.message
    });
  }
});

// 获取当前用户信息（需要认证）
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    console.log('获取用户信息请求，token:', token ? '存在' : '缺失');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: '访问令牌缺失'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在'
      });
    }

    res.json({
      success: true,
      data: {
        user
      }
    });
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(403).json({
      success: false,
      error: '无效的访问令牌'
    });
  }
});

// 健康检查端点
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: '认证服务正常',
    timestamp: new Date().toISOString()
  });
});

router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '认证服务API',
    version: '1.0.0',
    endpoints: {
      register: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me',
      health: 'GET /api/auth/health'
    }
  });
});

// 管理员注册（需要管理员密钥）
router.post('/register-admin', async (req, res) => {
  try {
    const { username, email, password, adminKey } = req.body;

    console.log('管理员注册请求:', { username, email });

    // 验证管理员密钥
    if (adminKey !== 'ADMIN_SECRET_2024') {
      return res.status(403).json({
        success: false,
        error: '无权限创建管理员账户'
      });
    }

    // 验证必填字段
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: '用户名、邮箱和密码是必需的'
      });
    }

    // 检查用户是否已存在
    const existingUser = await User.findOne({
      $or: [{ email }, { username }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: '用户名或邮箱已被使用'
      });
    }

    // 创建管理员用户
    const user = new User({
      username,
      email,
      password,
      role: 'admin'  // 设置为管理员角色
    });

    await user.save();

    // 生成令牌
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        token
      },
      message: '管理员注册成功'
    });
  } catch (error) {
    console.error('管理员注册错误:', error);
    res.status(500).json({
      success: false,
      error: '管理员注册失败: ' + error.message
    });
  }
});

// 用户申请成为管理员
router.post('/apply-admin', async (req, res) => {
  try {
    const { userId, reason } = req.body;

    console.log('管理员申请请求:', { userId, reason });

    if (!userId || !reason) {
      return res.status(400).json({
        success: false,
        error: '用户ID和申请理由是必需的'
      });
    }

    // 查找用户
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 检查是否已经是管理员或已申请
    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        error: '您已经是管理员'
      });
    }

    if (user.role === 'pending_admin') {
      return res.status(400).json({
        success: false,
        error: '您已提交过申请，请等待审核'
      });
    }

    // 更新用户信息
    user.role = 'pending_admin';
    user.adminApplication = {
      appliedAt: new Date(),
      reason: reason,
      status: 'pending'
    };

    await user.save();

    res.json({
      success: true,
      message: '管理员申请已提交，请等待1-2个工作日审核',
      data: {
        appliedAt: user.adminApplication.appliedAt,
        reason: user.adminApplication.reason
      }
    });
  } catch (error) {
    console.error('管理员申请错误:', error);
    res.status(500).json({
      success: false,
      error: '申请失败: ' + error.message
    });
  }
});

// 管理员审核接口（需要管理员权限）
router.post('/review-admin', async (req, res) => {
  try {
    const { applicantId, action, comment } = req.body; // action: 'approve' 或 'reject'
    const reviewerId = req.user?.id; // 从认证中间件获取审核人ID

    console.log('管理员审核请求:', { applicantId, action, comment, reviewerId });

    if (!applicantId || !action) {
      return res.status(400).json({
        success: false,
        error: '申请人ID和审核动作是必需的'
      });
    }

    // 查找申请人
    const applicant = await User.findById(applicantId);
    if (!applicant) {
      return res.status(404).json({
        success: false,
        error: '申请人不存在'
      });
    }

    // 检查申请人是否在待审核状态
    if (applicant.role !== 'pending_admin') {
      return res.status(400).json({
        success: false,
        error: '该用户没有待审核的管理员申请'
      });
    }

    // 执行审核
    if (action === 'approve') {
      applicant.role = 'admin';
      applicant.adminApplication.status = 'approved';
      applicant.adminApplication.reviewedAt = new Date();
      applicant.adminApplication.reviewedBy = reviewerId;
      applicant.adminApplication.reviewComment = comment || '申请已批准';
    } else if (action === 'reject') {
      applicant.role = 'user';
      applicant.adminApplication.status = 'rejected';
      applicant.adminApplication.reviewedAt = new Date();
      applicant.adminApplication.reviewedBy = reviewerId;
      applicant.adminApplication.reviewComment = comment || '申请被拒绝';
    } else {
      return res.status(400).json({
        success: false,
        error: '无效的审核动作，请使用 approve 或 reject'
      });
    }

    await applicant.save();

    res.json({
      success: true,
      message: action === 'approve' ? '申请已批准' : '申请已拒绝',
      data: {
        applicant: {
          id: applicant._id,
          username: applicant.username,
          role: applicant.role
        },
        review: applicant.adminApplication
      }
    });
  } catch (error) {
    console.error('管理员审核错误:', error);
    res.status(500).json({
      success: false,
      error: '审核失败: ' + error.message
    });
  }
});

// 获取待审核的管理员申请列表（需要管理员权限）
router.get('/pending-admins', async (req, res) => {
  try {
    const pendingAdmins = await User.find({ 
      role: 'pending_admin',
      'adminApplication.status': 'pending'
    }).select('username email adminApplication');

    res.json({
      success: true,
      data: {
        count: pendingAdmins.length,
        applicants: pendingAdmins
      }
    });
  } catch (error) {
    console.error('获取待审核申请错误:', error);
    res.status(500).json({
      success: false,
      error: '获取申请列表失败: ' + error.message
    });
  }
});

export default router;