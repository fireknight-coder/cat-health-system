import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import { MongoClient } from 'mongodb'
import jwt from 'jsonwebtoken'

// 加载环境变量
dotenv.config()

const app = express()
const PORT = process.env.PORT || 3002

// 中间件
app.use(cors())
app.use(express.json())

// 连接MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cat-health-system')
  .then(async () => {
    console.log('MongoDB连接成功');
    
    // 检查并创建默认超级管理员 fireknight
    const { User } = await import('./src/models/User.js');
    const existingSuperAdmin = await User.findOne({ role: 'superadmin' });
    
    if (!existingSuperAdmin) {
      const superAdmin = new User({
        username: 'fireknight',
        email: 'fireknight@cat-system.com',
        password: 'letusenjoytheworld',
        role: 'superadmin'
      });
      
      await superAdmin.save();
      console.log('✅ 默认超级管理员创建成功');
      console.log('📋 登录信息: 用户名: fireknight, 密码:letusenjoytheworld ');
    } else {
      console.log('ℹ️  超级管理员已存在');
    }
  })
  .catch(err => console.error('MongoDB连接失败:', err))
  .catch(err => console.error('MongoDB连接失败:', err))

// 路由导入
import authRoutes from './src/routes/auth.js'           
import { catRouter as catRoutes } from './src/routes/cats.js'
import adoptionRoutes from './src/routes/adoption.js'
import interventionRoutes from './src/routes/intervention.js'
import reportRoutes from './src/routes/report.js'
import dashboardRoutes from './src/routes/dashboard.js'
import observationRoutes from './src/routes/observation.js'
// 路由注册
app.use('/api/auth', authRoutes)
app.use('/api/cats', catRoutes)
app.use('/api/adoption', adoptionRoutes)
app.use('/api/intervention', interventionRoutes)
app.use('/api/report', reportRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/observations', observationRoutes)

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: '猫咪健康系统API运行正常' })
})

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ message: '服务器内部错误' })
})

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

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`)
})

export default app