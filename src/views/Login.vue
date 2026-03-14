<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/stores/auth'

// 登录成功后，把 token 和 role 存进 auth.ts 的 store
// 这样整个应用的其他组件都能知道用户是谁、角色是什么

import { 
  ElForm, ElFormItem, ElInput, ElButton, ElRadioGroup, ElRadio, 
  ElDialog, ElMessage, ElTabPane, ElTabs 
} from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()

// 状态管理
const role = ref<Role>('user')
const dialogVisible = ref(false)
const activeTab = ref('login')
const submitting = ref(false)

// 表单数据
const loginForm = reactive({
  username: '',
  password: ''
})

const registerForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  phone: '',
  email: '',
  role: 'user',
  reason: ''
})

// 表单验证规则
const loginRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const registerRules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ],
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  reason: [
    {
      required: role.value === 'admin',
      message: '申请管理员账号需要填写申请原因',
      trigger: 'blur'
    },
    {
      min: 10,
      message: '申请原因不能少于10个字符',
      trigger: 'blur'
    }
  ]
}

// 打开弹窗
function openDialog() {
  dialogVisible.value = true
  activeTab.value = 'login'
  // 重置表单
  Object.assign(loginForm, { username: '', password: '' })
  Object.assign(registerForm, { username: '', password: '', confirmPassword: '', phone: '', email: '' })
}

// API基础URL
const API_BASE_URL = 'http://localhost:3002/api'

// 修改注册API调用
async function registerApi(userData: any) {
  // 区分普通用户注册和管理员注册
  const isAdmin = role.value === 'admin'
  const apiUrl = isAdmin ? `${API_BASE_URL}/auth/register-admin` : `${API_BASE_URL}/auth/register`
  
  const requestBody: any = {
    username: userData.username,
    email: userData.email,
    password: userData.password
  }
  
  // 管理员注册需要额外参数
  if (isAdmin) {
    requestBody.adminKey = 'ADMIN_SECRET_2024'
    requestBody.reason = userData.reason
  }
  
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '注册失败')
  }
  
  return await response.json()
}

// 登录API - 智能识别用户名或邮箱
async function loginApi(identifier: string, password: string) {
  const loginData: any = {
    password: password
  };
  
  // 判断是邮箱格式还是用户名
  if (identifier.includes('@')) {
    loginData.email = identifier;  // 如果是邮箱格式
  } else {
    loginData.username = identifier;  // 否则作为用户名
  }
  
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(loginData)
  })
  
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error || '登录失败')
  }
  
  return await response.json()
}

// 登录处理
async function handleLogin() {
  submitting.value = true
  try {
    console.log('🔍 开始登录，输入的用户名:', loginForm.username)
    
    // 调用真实的后端登录API
    const response = await loginApi(loginForm.username, loginForm.password)
    
    console.log('🔍 API响应结果:', response)
    
    if (response && response.success) {
      console.log('🔍 登录成功，响应数据结构:')
      console.log('完整响应:', response)
      console.log('响应data:', response.data)
      
      const { token, user } = response.data
      
      console.log('🔍 登录成功调试信息:')
      console.log('用户信息:', user)
      console.log('用户角色:', user.role)
      console.log('Token:', token)
      
      // 使用真实的用户角色（后端返回的role字段）
      auth.login(token, user.role, user.id)
      ElMessage.success('登录成功')
      dialogVisible.value = false
      
      // 计算跳转路径
      const redirectPath = user.role === 'admin' ? '/admin' : '/'
      console.log('计算跳转路径:', redirectPath)
      
      const redirect = (route.query.redirect as string) || redirectPath
      console.log('最终跳转路径:', redirect)
      
      router.replace(redirect)
    } else {
      console.log('🔍 登录失败，响应:', response)
      throw new Error(response?.error || '登录失败')
    }
  } catch (error: any) {
    console.log('🔍 登录异常:', error)
    ElMessage.error(error.message || '登录失败，请检查用户名和密码')
  } finally {
    submitting.value = false
  }
}

// 注册处理
async function handleRegister() {
  submitting.value = true
  try {
    // 调用真实的后端注册API
    const response = await registerApi(registerForm)
    
    if (response.success) {
      if (role.value === 'admin') {
        // 管理员注册需要超级管理员审核，不能登录
        ElMessage.success('管理员申请已提交，等待超级管理员审批')
        // 停留在登录页，让用户知道需要等待审核
        activeTab.value = 'login'
        loginForm.username = registerForm.username
      } else {
        // 普通用户注册成功，提示登录
        ElMessage.success('注册成功，请登录')
        activeTab.value = 'login'
        loginForm.username = registerForm.username
      }
    } else {
      throw new Error(response.error || '注册失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '注册失败，请稍后重试')
  } finally {
    submitting.value = false
  }
}

// 重置表单
function resetForm() {
  Object.assign(loginForm, { username: '', password: '' })
  Object.assign(registerForm, { username: '', password: '', confirmPassword: '', phone: '', email: '', reason: '' })
}
</script>

<template>
  <div class="login-page">
    <!-- 全屏背景图片 -->
    <div class="background-image"></div>
    
    <!-- 登录框容器 -->
    <div class="login-container">
      <div class="login-box">
        <!-- 左侧图片区域 -->
        <div class="left-section">
          <!-- 方式1: 使用网络图片 -->
          <!-- <img 
            src="https://images.unsplash.com/photo-1543852786-1cf6624b9987?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80" 
            alt="可爱猫咪" 
            class="login-image"
          /> -->
          
          <!-- 方式2: 使用本地图片 (需要将图片放在assets目录) -->
          <img src="/picuter/R.jpg" alt="可爱猫咪" class="login-image" />
        </div>
        
        <!-- 右侧表单区域 -->
        <div class="right-section">
          <div class="form-content">
            <h2>社区猫管理系统</h2>
            <el-form label-width="80px">
              <el-form-item label="身份">
                <el-radio-group v-model="role">
                  <el-radio value="user">居民 / 领养人</el-radio>
                  <el-radio value="admin">管理员</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item>
                <el-button type="primary" @click="openDialog" style="width: 100%">
                  进入系统
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>

    <!-- 登录注册弹窗 -->
    <el-dialog 
      v-model="dialogVisible" 
      :title="role === 'admin' ? '管理员登录/注册' : '居民登录/注册'"
      width="500px"
      :before-close="() => { dialogVisible = false; resetForm() }"
    >
      <el-tabs v-model="activeTab" stretch>
        <!-- 登录标签页 -->
        <el-tab-pane label="登录" name="login">
          <el-form :model="loginForm" :rules="loginRules" label-width="80px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="loginForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="handleLogin" style="width: 100%">
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
        
        <!-- 注册标签页 -->
        <el-tab-pane label="注册" name="register">
          <el-form :model="registerForm" :rules="registerRules" label-width="100px">
            <el-form-item label="用户名" prop="username">
              <el-input v-model="registerForm.username" placeholder="请输入用户名" />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input v-model="registerForm.password" type="password" placeholder="请输入密码" show-password />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input v-model="registerForm.confirmPassword" type="password" placeholder="请再次输入密码" show-password />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input v-model="registerForm.phone" placeholder="请输入手机号" />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input v-model="registerForm.email" placeholder="请输入邮箱" />
            </el-form-item>
            
            <!-- 管理员申请原因 -->
            <el-form-item v-if="role === 'admin'" label="申请原因" prop="reason">
              <el-input
                v-model="registerForm.reason"
                type="textarea"
                :rows="3"
                placeholder="请详细说明申请管理员账号的原因和目的"
                maxlength="200"
                show-word-limit
              />
            </el-form-item>
            
            <el-form-item>
              <el-button type="primary" :loading="submitting" @click="handleRegister" style="width: 100%">
                {{ role === 'admin' ? '提交申请' : '注册' }}
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>
    </el-dialog>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image: url('https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80');
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  filter: brightness(0.8);
  z-index: -1;
}

.login-container {
  position: relative;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  margin: 0;
}

.login-box {
  display: flex;
  width: 800px;
  height: 500px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  margin: 0;
}

.left-section {
  flex: 1;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid #e9ecef;
}

.login-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.right-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.form-content {
  width: 100%;
  max-width: 300px;
}

h2 {
  margin: 0 0 30px 0;
  text-align: center;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-box {
    flex-direction: column;
    width: 90%;
    height: auto;
  }
  
  .left-section {
    border-right: none;
    border-bottom: 1px solid #e9ecef;
    min-height: 200px;
  }
  
  .right-section {
    padding: 30px 20px;
  }
}
</style>