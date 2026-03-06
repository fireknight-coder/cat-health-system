<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import type { Role } from '@/stores/auth'
import { ElForm, ElFormItem, ElInput, ElButton, ElRadioGroup, ElRadio } from 'element-plus'

const router = useRouter()
const route = useRoute()
const auth = useAuthStore()
const role = ref<Role>('user')
const submitting = ref(false)

function doLogin() {
  submitting.value = true
  auth.login('mock-token', role.value, 'user-1')
  const redirect = (route.query.redirect as string) || (role.value === 'admin' ? '/admin' : '/')
  router.replace(redirect)
  submitting.value = false
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
          <img src="E:\EdithKirkland\Desktop\前端网页搭建\public\picuter\R.jpg" alt="可爱猫咪" class="login-image" />
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
                <el-button type="primary" :loading="submitting" @click="doLogin" style="width: 100%">
                  进入系统（演示登录）
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </div>
      </div>
    </div>
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