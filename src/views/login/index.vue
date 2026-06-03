<template>
  <div class="login-container">
    <!-- 动态渐变背景 -->
    <div class="gradient-bg"></div>

    <!-- 浮动几何装饰 -->
    <div class="shapes">
      <div class="shape shape-1"></div>
      <div class="shape shape-2"></div>
      <div class="shape shape-3"></div>
      <div class="shape shape-4"></div>
      <div class="shape shape-5"></div>
      <div class="shape shape-6"></div>
    </div>

    <!-- 登录卡片 -->
    <div class="login-card" :class="{ loaded }">
      <!-- 顶部光晕 -->
      <div class="card-glow"></div>

      <!-- 标题区域 -->
      <div class="login-header">
        <div class="logo-icon">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2L2 7L12 12L22 7L12 2Z" fill="currentColor" opacity="0.8" />
            <path d="M2 17L12 22L22 17" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
            <path d="M2 12L12 17L22 12" stroke="currentColor" stroke-width="2" stroke-linecap="round"
              stroke-linejoin="round" />
          </svg>
        </div>
        <h1 class="login-title">后台管理系统</h1>
        <p class="login-subtitle">欢迎回来，请登录您的账户</p>
      </div>

      <!-- 表单区域 -->
      <el-form :model="loginForm" @keyup.enter="handleLogin" class="login-form">
        <div class="form-item-wrap" style="--delay: 0.15s">
          <el-form-item>
            <el-input v-model="loginForm.user_name" placeholder="请输入用户名" prefix-icon="User" size="large" />
          </el-form-item>
        </div>

        <div class="form-item-wrap" style="--delay: 0.25s">
          <el-form-item>
            <el-input v-model="loginForm.password" type="password" placeholder="请输入密码" prefix-icon="Lock"
              show-password size="large" />
          </el-form-item>
        </div>

        <div class="form-item-wrap" style="--delay: 0.35s">
          <el-form-item>
            <div class="captcha-container">
              <el-input v-model="loginForm.code" placeholder="验证码" prefix-icon="CircleCheck" size="large"
                style="flex: 1" />
              <div class="captcha-img" v-html="captchaSvg" @click="fetchCaptcha" title="点击刷新验证码"></div>
            </div>
          </el-form-item>
        </div>

        <div class="form-item-wrap" style="--delay: 0.45s">
          <el-button type="primary" :loading="loading" size="large" class="login-btn" @click="handleLogin">
            <span v-if="!loading">登 录</span>
            <span v-else>登录中...</span>
          </el-button>
        </div>
      </el-form>

      <!-- 底部装饰线 -->
      <div class="footer-line"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from "vue";
import { useUserStore } from "../../store/user";
import { useRouter } from "vue-router";
import request from "../../utils/request";
import { ElMessage } from "element-plus";

const userStore = useUserStore();
const router = useRouter();

const loginForm = reactive({
  user_name: "",
  password: "",
  code: "",
  codeKey: "",
});
const captchaSvg = ref("");
const loading = ref(false);
const loaded = ref(false);

const fetchCaptcha = async () => {
  try {
    const res = await request.get("/captcha/code");
    captchaSvg.value = res.result.code;
    loginForm.codeKey = res.result.codeKey;
  } catch (error) {
    console.error("Failed to fetch captcha:", error);
  }
};

const handleLogin = async () => {
  if (!loginForm.user_name || !loginForm.password || !loginForm.code) {
    return ElMessage.warning("请填写完整登录信息");
  }

  loading.value = true;
  try {
    await userStore.login(loginForm);
    router.push("/");
  } catch (error) {
    fetchCaptcha();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCaptcha();
  // 触发入场动画
  requestAnimationFrame(() => {
    loaded.value = true;
  });
});
</script>

<style scoped>
/* ========== 容器 ========== */
.login-container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  overflow: hidden;
}

/* ========== 动态渐变背景 ========== */
.gradient-bg {
  position: absolute;
  inset: 0;
  background: linear-gradient(-45deg,
      #0f0c29,
      #302b63,
      #24243e,
      #1a1a2e,
      #16213e,
      #0f3460);
  background-size: 400% 400%;
  animation: gradientShift 15s ease infinite;
  z-index: 0;
}

@keyframes gradientShift {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

/* ========== 浮动几何形状 ========== */
.shapes {
  position: absolute;
  inset: 0;
  z-index: 1;
  pointer-events: none;
}

.shape {
  position: absolute;
  border-radius: 50%;
  opacity: 0.08;
  filter: blur(1px);
}

.shape-1 {
  width: 300px;
  height: 300px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  top: -80px;
  left: -100px;
  animation: float 8s ease-in-out infinite;
}

.shape-2 {
  width: 200px;
  height: 200px;
  background: linear-gradient(135deg, #f093fb, #f5576c);
  top: 50%;
  right: -60px;
  animation: float 10s ease-in-out infinite reverse;
}

.shape-3 {
  width: 150px;
  height: 150px;
  background: linear-gradient(135deg, #4facfe, #00f2fe);
  bottom: -40px;
  left: 20%;
  animation: float 7s ease-in-out infinite 1s;
}

.shape-4 {
  width: 100px;
  height: 100px;
  background: linear-gradient(135deg, #43e97b, #38f9d7);
  top: 20%;
  right: 15%;
  animation: float 9s ease-in-out infinite 2s;
}

.shape-5 {
  width: 180px;
  height: 180px;
  background: linear-gradient(135deg, #fa709a, #fee140);
  bottom: 10%;
  right: 25%;
  animation: float 11s ease-in-out infinite 0.5s;
  border-radius: 30% 70% 70% 30% / 30% 30% 70% 70%;
}

.shape-6 {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #a18cd1, #fbc2eb);
  top: 60%;
  left: 10%;
  animation: float 8s ease-in-out infinite 3s;
  border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
}

@keyframes float {

  0%,
  100% {
    transform: translateY(0) rotate(0deg) scale(1);
  }

  33% {
    transform: translateY(-20px) rotate(5deg) scale(1.02);
  }

  66% {
    transform: translateY(10px) rotate(-3deg) scale(0.98);
  }
}

/* ========== 登录卡片 ========== */
.login-card {
  position: relative;
  z-index: 10;
  width: 420px;
  max-width: 92vw;
  padding: 48px 40px 36px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.06);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.08);
  /* 入场动画初始状态 */
  opacity: 0;
  transform: translateY(40px) scale(0.96);
  transition: all 0.8s cubic-bezier(0.16, 1, 0.3, 1);
}

.login-card.loaded {
  opacity: 1;
  transform: translateY(0) scale(1);
}

/* 顶部光晕 */
.card-glow {
  position: absolute;
  top: -1px;
  left: 50%;
  transform: translateX(-50%);
  width: 60%;
  height: 2px;
  background: linear-gradient(90deg,
      transparent,
      rgba(102, 126, 234, 0.6),
      rgba(118, 75, 162, 0.6),
      transparent);
  border-radius: 2px;
  animation: glowPulse 3s ease-in-out infinite;
}

@keyframes glowPulse {

  0%,
  100% {
    opacity: 0.6;
    width: 60%;
  }

  50% {
    opacity: 1;
    width: 75%;
  }
}

/* ========== 标题区域 ========== */
.login-header {
  text-align: center;
  margin-bottom: 36px;
  /* 入场动画 */
  opacity: 0;
  transform: translateY(20px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s;
}

.loaded .login-header {
  opacity: 1;
  transform: translateY(0);
}

.logo-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  background: linear-gradient(135deg, #667eea, #764ba2);
  color: #fff;
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.35);
}

.logo-icon svg {
  width: 30px;
  height: 30px;
}

.login-title {
  font-size: 26px;
  font-weight: 700;
  color: #ffffff;
  margin: 0 0 8px;
  letter-spacing: 1px;
}

.login-subtitle {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.5);
  margin: 0;
}

/* ========== 表单区域 ========== */
.login-form {
  width: 100%;
}

.form-item-wrap {
  /* 交错入场动画 */
  opacity: 0;
  transform: translateY(24px);
  transition: all 0.6s cubic-bezier(0.16, 1, 0.3, 1);
  transition-delay: var(--delay, 0s);
}

.loaded .form-item-wrap {
  opacity: 1;
  transform: translateY(0);
}

/* 输入框样式覆盖 */
:deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  box-shadow: none;
  transition: all 0.3s ease;
  padding: 4px 12px;
}

:deep(.el-input__wrapper:hover) {
  border-color: rgba(255, 255, 255, 0.2);
  background: rgba(255, 255, 255, 0.08);
}

:deep(.el-input__wrapper.is-focus) {
  border-color: rgba(102, 126, 234, 0.6);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.15);
}

:deep(.el-input__inner) {
  color: #ffffff;
  font-size: 14px;
}

:deep(.el-input__inner::placeholder) {
  color: rgba(255, 255, 255, 0.35);
}

:deep(.el-input__prefix .el-icon) {
  color: rgba(255, 255, 255, 0.4);
}

/* ========== 验证码 ========== */
.captcha-container {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 12px;
}

.captcha-img {
  flex-shrink: 0;
  cursor: pointer;
  height: 40px;
  display: flex;
  align-items: center;
  border-radius: 8px;
  overflow: hidden;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  padding: 4px;
}

.captcha-img:hover {
  transform: scale(1.05);
  background: rgba(255, 255, 255, 0.1);
  box-shadow: 0 0 16px rgba(102, 126, 234, 0.2);
}

:deep(.captcha-img svg) {
  height: 100%;
  width: auto;
  border-radius: 4px;
}

/* ========== 登录按钮 ========== */
.login-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 4px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  box-shadow: 0 4px 20px rgba(102, 126, 234, 0.35);
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 28px rgba(102, 126, 234, 0.5);
}

.login-btn:active {
  transform: translateY(0);
}

/* 微光扫过效果 */
.login-btn::after {
  content: "";
  position: absolute;
  top: -50%;
  left: -60%;
  width: 40%;
  height: 200%;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.15),
      transparent);
  transform: skewX(-20deg);
  animation: shimmer 3s ease-in-out infinite;
}

@keyframes shimmer {
  0% {
    left: -60%;
  }

  100% {
    left: 160%;
  }
}

/* loading 状态 */
.login-btn.is-loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {

  0%,
  100% {
    box-shadow: 0 4px 20px rgba(102, 126, 234, 0.35);
  }

  50% {
    box-shadow: 0 4px 30px rgba(102, 126, 234, 0.6);
  }
}

/* ========== 底部装饰线 ========== */
.footer-line {
  margin-top: 28px;
  height: 1px;
  background: linear-gradient(90deg,
      transparent,
      rgba(255, 255, 255, 0.1),
      transparent);
  opacity: 0;
  transition: opacity 0.6s ease 0.6s;
}

.loaded .footer-line {
  opacity: 1;
}

/* ========== 响应式 ========== */
@media (max-width: 480px) {
  .login-card {
    padding: 36px 24px 28px;
    border-radius: 16px;
  }

  .login-title {
    font-size: 22px;
  }

  .logo-icon {
    width: 48px;
    height: 48px;
  }
}
</style>
