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

//游客点击按钮跳转到权限缺失的用户端页面
function handleGuestEntry() {
  const auth = useAuthStore()
  auth.guestLogin()
  ElMessage.success('欢迎游客访问！部分功能需要注册登录后才能使用。')
  router.push('/guest')
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
      auth.login(token, user.role, user.id, user.username)
      ElMessage.success('登录成功')
      dialogVisible.value = false
      
      // 计算跳转路径
      const redirectPath = (user.role === 'admin' || user.role === 'superadmin') ? '/admin' : '/'
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

          <img src="/picuter/R.jpg" alt="可爱猫咪" class="login-image" />
        </div>
        
        <!-- 右侧表单区域 -->
        <div class="right-section">
          <div class="form-content">
            <p id="offscreen-text" class="offscreen-text"></p>
            <div class="title-group">
              <p class="system-cn">社区流浪猫管理系统</p>
              <h2>Cat Health System</h2>
              <p class="system-en">Community Stray Cat Management</p>
            </div>
            <el-form label-width="80px">
              <el-form-item label="身份">
                <el-radio-group v-model="role">
                  <el-radio value="user">居民 / 领养人</el-radio>
                  <el-radio value="admin">管理员</el-radio>
                </el-radio-group>
              </el-form-item>
              <el-form-item class="ma">
                <el-button class="enter-btn" type="primary" @click="openDialog" style="width: 100%">
                  进入
                </el-button>
                <el-button class="enter-btn" type="primary" @click="handleGuestEntry" style="width: 100%">
                  游客进入
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
  --login-accent: #c98649;
  --login-accent-strong: #9b6130;
  --login-accent-soft: #e9c79f;
  --login-ink: #5a422f;
  --login-cool-hint: #9bb0c3;
  min-height: 100vh;
  position: relative;
  overflow: hidden;
}

.login-page::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  background:
    radial-gradient(circle at 8% 12%, rgba(155, 176, 195, 0.42), transparent 34%),
    radial-gradient(circle at 86% 86%, rgba(255, 226, 186, 0.36), transparent 38%);
}

.login-page::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  z-index: 0;
  box-shadow: inset 0 0 120px rgba(136, 101, 66, 0.16);
}

.background-image {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background-image:
    radial-gradient(circle at 10% 10%, rgba(155, 176, 195, 0.36), transparent 35%),
    radial-gradient(circle at 30% 22%, rgba(224, 236, 247, 0.34), transparent 37%),
    linear-gradient(145deg, #d6e2ee 0%, #efe2cf 48%, var(--bg-base) 100%);
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-attachment: fixed;
  filter: saturate(1) contrast(1.01) brightness(1.02);
  z-index: -1;
}

.login-container {
  position: relative;
  z-index: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 22px;
  margin: 0;
}

.login-box {
  position: relative;
  display: flex;
  width: min(920px, 92vw);
  height: min(560px, 86vh);
  border-radius: 20px;
  border: 1px solid rgba(185, 138, 88, 0.48);
  background:
    linear-gradient(150deg, rgba(255, 252, 247, 0.95), rgba(251, 244, 235, 0.93)) padding-box,
    linear-gradient(128deg, rgba(200, 218, 232, 0.52) 0%, rgba(247, 232, 208, 0.76) 45%, rgba(223, 168, 108, 0.66) 100%) border-box;
  box-shadow:
    0 22px 44px rgba(139, 98, 62, 0.2),
    0 10px 24px rgba(74, 103, 127, 0.14),
    0 1px 0 rgba(230, 186, 138, 0.26) inset,
    0 -1px 0 rgba(160, 114, 72, 0.22) inset,
    0 0 16px rgba(229, 183, 132, 0.14);
  backdrop-filter: blur(6px);
  overflow: hidden;
  margin: 0;
  transition: transform 0.24s ease, box-shadow 0.24s ease;
}

.login-box:hover,
.login-box:focus-within {
  transform: translateY(-8px) scale(1.006);
  box-shadow:
    0 36px 58px rgba(139, 98, 62, 0.32),
    0 16px 30px rgba(74, 103, 127, 0.24),
    0 1px 0 rgba(232, 192, 147, 0.44) inset,
    0 -1px 0 rgba(188, 140, 96, 0.3) inset,
    0 0 20px rgba(235, 191, 141, 0.2);
}

.login-box::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  border-radius: inherit;
  background: linear-gradient(120deg, rgba(255, 244, 225, 0.24), transparent 42%);
  mix-blend-mode: soft-light;
}

.login-box::after {
  content: "";
  position: absolute;
  inset: -1px;
  border-radius: inherit;
  padding: 1px;
  pointer-events: none;
  background: conic-gradient(
    from 0deg,
    rgba(153, 109, 66, 0.07) 0deg,
    rgba(153, 109, 66, 0.17) 116deg,
    rgba(208, 156, 102, 0.68) 150deg,
    rgba(245, 212, 169, 0.86) 170deg,
    rgba(208, 156, 102, 0.68) 194deg,
    rgba(153, 109, 66, 0.18) 238deg,
    rgba(153, 109, 66, 0.07) 360deg
  );
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.74;
  animation: track-flow 4.2s linear infinite;
  animation-play-state: paused;
  will-change: transform;
}

.login-page:hover .login-box::after,
.login-box:focus-within::after {
  animation-play-state: running;
}

.left-section {
  flex: 1;
  position: relative;
  background: linear-gradient(165deg, #f8f3eb 0%, #efe2d2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  border-right: 1px solid rgba(214, 183, 146, 0.44);
}

.left-section::after {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    linear-gradient(155deg, rgba(255, 248, 238, 0.18), rgba(197, 161, 124, 0.12)),
    radial-gradient(circle at 80% 16%, rgba(255, 255, 255, 0.24), transparent 35%);
}

.login-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  filter: saturate(0.95) contrast(1.03) brightness(1.02);
}


:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px rgba(201, 134, 73, 0.3) inset;
  background: rgba(255, 252, 248, 0.95);
  transition: box-shadow 0.2s ease, background 0.2s ease;
}
:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px rgba(201, 134, 73, 0.55) inset;
}
:deep(.el-input__wrapper.is-focus) {
  box-shadow: 0 0 0 1px rgba(201, 134, 73, 0.8) inset, 0 0 0 3px rgba(201, 134, 73, 0.16);
}
:deep(.el-form-item__label) {
  color: #6b5542;
  margin-right: 40px;
  font-weight: 600;
}
:deep(.el-button--primary) {
  background: linear-gradient(135deg, var(--login-accent) 0%, #b9763f 100%);
  border-color: #b57945;
  color: #f5fbff;
  box-shadow: 0 10px 18px rgba(137, 97, 59, 0.25);
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

.ma {
  margin-right: 50px;
  display: flex;
}

:deep(.el-radio-group) {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

:deep(.el-radio) {
  margin-right: 0;
  padding: 7px 11px;
  border-radius: 12px;
  border: 1px solid rgba(218, 186, 150, 0.78);
  background: linear-gradient(155deg, rgba(255, 250, 243, 0.93), rgba(248, 238, 224, 0.9));
  box-shadow: 0 5px 12px rgba(129, 92, 58, 0.12);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
}

:deep(.el-radio:hover) {
  transform: translateY(-4px);
  border-color: rgba(201, 134, 73, 0.82);
  box-shadow: 0 12px 18px rgba(129, 92, 58, 0.2);
}

:deep(.el-radio.is-checked) {
  border-color: rgba(201, 134, 73, 0.96);
  background: linear-gradient(155deg, rgba(255, 245, 229, 0.97), rgba(248, 228, 203, 0.94));
  box-shadow: 0 14px 20px rgba(148, 101, 57, 0.24), 0 0 0 2px rgba(243, 207, 169, 0.35);
  transform: translateY(-3px);
}

:deep(.el-button--primary:hover) {
  background: linear-gradient(135deg, #d1945f 0%, #c08047 100%);
  border-color: #c28652;
}

:deep(.enter-btn.el-button) {
  transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
}

:deep(.enter-btn.el-button:hover) {
  transform: translateY(-4px) scale(1.012);
  box-shadow: 0 18px 28px rgba(145, 100, 57, 0.36), 0 0 0 2px rgba(247, 215, 180, 0.28);
  filter: saturate(1.08);
}

:deep(.enter-btn.el-button:focus-visible) {
  transform: translateY(-4px) scale(1.012);
  box-shadow: 0 0 0 3px rgba(201, 134, 73, 0.25), 0 16px 24px rgba(145, 100, 57, 0.34);
}

:deep(.el-radio__label) {
  color: #7c6350;
}

:deep(.el-radio__input.is-checked + .el-radio__label) {
  color: var(--login-accent-strong);
  font-weight: 600;
}

:deep(.el-radio__input.is-checked .el-radio__inner) {
  background: var(--login-accent);
  border-color: var(--login-accent);
}

:deep(.el-tabs__item.is-active) {
  color: var(--login-accent-strong);
  font-weight: 600;
}

:deep(.el-tabs__item:hover) {
  color: var(--login-accent);
}

:deep(.el-tabs__active-bar) {
  background: linear-gradient(90deg, var(--login-accent) 0%, #e5b17c 100%);
}

:deep(.el-dialog) {
  border: 1px solid rgba(227, 199, 165, 0.72);
  background: linear-gradient(160deg, rgba(255, 252, 246, 0.96), rgba(247, 238, 225, 0.94));
  box-shadow: 0 18px 34px rgba(109, 78, 49, 0.2);
}

.right-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  background: linear-gradient(170deg, rgba(255, 250, 242, 0.9), rgba(248, 239, 226, 0.84));
}

.form-content {
  width: 100%;
  max-width: 400px;
}

.title-group {
  margin-bottom: 24px;
  text-align: center;
}

.system-cn {
  margin: 0 0 8px;
  color: #674a34;
  font-size: 27px;
  font-weight: 700;
  letter-spacing: 0.06em;
}

h2 {
  margin: 0;
  text-align: center;
  color: #8a6a4f;
  font-size: 24px;
  font-weight: 560;
  letter-spacing: 0.07em;
  text-shadow: 0 1px 0 rgba(255, 255, 255, 0.72);
}

.system-en {
  margin: 6px 0 0;
  color: #d4bea5;
  font-size: 12px;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-shadow: 0 1px 0 rgba(255, 248, 236, 0.35);
}

@keyframes track-flow {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .login-box {
    flex-direction: column;
    width: 90%;
    height: auto;
    min-height: 540px;
  }
  
  .left-section {
    border-right: none;
    border-bottom: 1px solid rgba(127, 162, 181, 0.54);
    min-height: 200px;
  }
  
  .right-section {
    padding: 30px 20px;
  }

  .system-cn {
    font-size: 23px;
  }

  h2 {
    font-size: 20px;
  }
}



</style>
