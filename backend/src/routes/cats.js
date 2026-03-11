import express from 'express';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';
import { User } from '../models/User.js';

const router = express.Router();

// 猫咪路由根路径（不需要认证）
router.get('/', (req, res) => {
  res.json({
    success: true,
    message: '猫咪管理API',
    version: '1.0.0',
    endpoints: {
      getCats: 'GET /api/cats/list (需要认证)',
      requires: '需要Authorization头部的Bearer token'
    }
  });
});

// 获取所有猫咪（需要认证和权限）
router.get('/list', authenticateToken, async (req, res) => {
  try {
    // 获取当前用户信息
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({
        success: false,
        error: '访问令牌缺失'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: '用户不存在'
      });
    }

    // 检查权限：只有管理员和特定居民可以查看猫咪列表
    if (user.role !== 'admin') {
      // 这里可以添加更复杂的权限逻辑
      // 比如检查用户是否是特定猫咪的饲养者
      // 目前先允许所有认证用户查看，后续可以扩展
      console.log(`用户 ${user.username} (${user.role}) 访问猫咪列表`);
    }

    // 猫咪数据
    const cats = [
      { 
        id: 1, 
        name: '小花', 
        age: 2, 
        breed: '橘猫', 
        location: '小区花园', 
        healthStatus: 'healthy',
        caretaker: '张阿姨',
        caretakerId: 'user123'
      },
      { 
        id: 2, 
        name: '小黑', 
        age: 3, 
        breed: '黑猫', 
        location: '停车场', 
        healthStatus: 'needs_care',
        caretaker: '李大爷',
        caretakerId: 'user456'
      },
      { 
        id: 3, 
        name: '小白', 
        age: 1, 
        breed: '白猫', 
        location: '楼道', 
        healthStatus: 'healthy',
        caretaker: '王奶奶',
        caretakerId: 'user789'
      }
    ];

    // 如果是普通用户，只返回基本信息
    // 如果是管理员，返回完整信息
    let filteredCats = cats;
    if (user.role !== 'admin') {
      filteredCats = cats.map(cat => ({
        id: cat.id,
        name: cat.name,
        age: cat.age,
        breed: cat.breed,
        location: cat.location,
        healthStatus: cat.healthStatus
        // 隐藏饲养者信息
      }));
    }
    
    res.json({
      success: true,
      data: filteredCats,
      total: filteredCats.length,
      userRole: user.role,
      message: user.role === 'admin' ? '管理员视图：显示完整信息' : '居民视图：显示基本信息'
    });
  } catch (error) {
    console.error('获取猫咪列表错误:', error);
    res.status(500).json({
      success: false,
      error: '获取猫咪列表失败: ' + error.message
    });
  }
});

export const catRouter = router;