<template>
  <div class="login-container">
    <el-card class="login-card">
      <h2>后台管理系统</h2>
      <el-form :model="loginForm" @keyup.enter="handleLogin">
        <el-form-item>
          <el-input v-model="loginForm.user_name" placeholder="用户名" prefix-icon="User" />
        </el-form-item>
        <el-form-item>
          <el-input v-model="loginForm.password" type="password" placeholder="密码" prefix-icon="Lock" show-password />
        </el-form-item>
        <el-form-item>
          <div class="captcha-container">
            <el-input v-model="loginForm.code" placeholder="验证码" prefix-icon="CircleCheck" style="flex: 1" />
            <div class="captcha-img" v-html="captchaSvg" @click="fetchCaptcha"></div>
          </div>
        </el-form-item>
        <el-button type="primary" :loading="loading" style="width: 100%" @click="handleLogin">登录</el-button>
      </el-form>
    </el-card>
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
    // 登录失败通常需要刷新验证码
    fetchCaptcha();
  } finally {
    loading.value = false;
  }
};

onMounted(() => {
  fetchCaptcha();
});
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background-color: var(--el-bg-color);
}
.login-card {
  width: 400px;
  text-align: center;
}
.captcha-container {
  display: flex;
  align-items: center;
  width: 100%;
}
.captcha-img {
  margin-left: 10px;
  cursor: pointer;
  height: 40px;
  display: flex;
  align-items: center;
}
:deep(.captcha-img svg) {
  height: 100%;
  width: auto;
}
</style>
