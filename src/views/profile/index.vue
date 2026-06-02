<template>
  <div class="profile-container">
    <el-row :gutter="20">
      <el-col :span="8">
        <el-card class="user-card" shadow="hover">
          <template #header>
            <div class="card-header">
              <span>关于我</span>
            </div>
          </template>
          <div class="user-profile">
            <div class="avatar-container">
              <el-upload
                class="avatar-uploader"
                :action="baseURL + '/upload'"
                :headers="uploadHeaders"
                :show-file-list="false"
                :on-success="handleAvatarSuccess"
                :before-upload="beforeAvatarUpload"
              >
                <el-avatar :size="100" :src="userStore.userInfo?.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
                <div class="avatar-edit">
                  <el-icon><Camera /></el-icon>
                </div>
              </el-upload>
            </div>
            <div class="user-info">
              <h3 class="username">{{ userStore.userInfo?.nick_name || userStore.userInfo?.user_name || 'Admin' }}</h3>
              <p class="role">{{ userStore.roles.join(' | ') || '管理员' }}</p>
            </div>
            <el-divider />
            <div class="user-details">
              <div class="detail-item">
                <el-icon><Calendar /></el-icon>
                <span>注册时间：{{ formatTime(userStore.userInfo?.createdAt) }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Message /></el-icon>
                <span>电子邮箱：{{ userStore.userInfo?.email || '未设置' }}</span>
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      
      <el-col :span="16">
        <el-card shadow="hover">
          <el-tabs v-model="activeTab" class="profile-tabs">
            <el-tab-pane label="基本资料" name="basic">
              <el-form :model="userForm" label-width="100px" class="profile-form">
                <el-form-item label="用户账号">
                  <el-input v-model="userForm.user_name" disabled />
                </el-form-item>
                <el-form-item label="用户昵称">
                  <el-input v-model="userForm.nick_name" placeholder="请输入昵称" />
                </el-form-item>
                <el-form-item label="电子邮箱">
                  <el-input v-model="userForm.email" placeholder="请输入电子邮箱" />
                </el-form-item>
                <el-form-item>
                  <el-button type="primary" @click="handleUpdateProfile">更新资料</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
            
            <el-tab-pane label="账号安全" name="security">
              <el-form :model="passwordForm" :rules="passwordRules" ref="passwordFormRef" label-width="100px" class="profile-form">
                <el-form-item label="当前密码" prop="old_password">
                  <el-input v-model="passwordForm.old_password" type="password" show-password placeholder="请输入当前密码" />
                </el-form-item>
                <el-form-item label="新密码" prop="password">
                  <el-input v-model="passwordForm.password" type="password" show-password placeholder="请输入新密码" />
                </el-form-item>
                <el-form-item label="确认密码" prop="confirmPassword">
                  <el-input v-model="passwordForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
                </el-form-item>
                <el-form-item>
                  <el-button type="danger" @click="handleUpdatePassword">修改密码</el-button>
                </el-form-item>
              </el-form>
            </el-tab-pane>
          </el-tabs>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '../../store/user';
import { ElMessage } from 'element-plus';
import { updateUser } from '../../api/user';
import { baseURL } from '../../utils/request';

const userStore = useUserStore();
const activeTab = ref('basic');

const uploadHeaders = {
  Authorization: `Bearer ${localStorage.getItem('token')}`,
};

const userForm = reactive({
  user_name: '',
  nick_name: '',
  email: '',
});

const passwordForm = reactive({
  old_password: '',
  password: '',
  confirmPassword: ''
});

const passwordFormRef = ref(null);

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'));
  } else if (value !== passwordForm.password) {
    callback(new Error('两次输入密码不一致!'));
  } else {
    callback();
  }
};

const passwordRules = {
  old_password: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  password: [
    { required: true, message: '请输入新密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能小于6位', trigger: 'blur' }
  ],
  confirmPassword: [{ validator: validateConfirmPassword, trigger: 'blur' }]
};

onMounted(() => {
  if (userStore.userInfo) {
    userForm.user_name = userStore.userInfo.user_name;
    userForm.nick_name = userStore.userInfo.nick_name || '';
    userForm.email = userStore.userInfo.email || '';
  }
});

const handleUpdateProfile = async () => {
  try {
    await updateUser({
      id: userStore.userInfo.id,
      nick_name: userForm.nick_name,
      email: userForm.email,
    });
    ElMessage.success('资料更新成功');
    // 重新获取用户信息以更新全局状态
    await userStore.getPermissions();
  } catch (error) {
    // 错误信息已由拦截器处理
  }
};

const handleUpdatePassword = async () => {
  passwordFormRef.value.validate(async (valid) => {
    if (valid) {
      try {
        await updateUser({
          id: userStore.userInfo.id,
          password: passwordForm.password,
          old_password: passwordForm.old_password
        });
        ElMessage.success('密码修改成功');
        passwordForm.old_password = '';
        passwordForm.password = '';
        passwordForm.confirmPassword = '';
      } catch (error) {
        // 错误信息已由拦截器处理
      }
    }
  });
};

const handleAvatarSuccess = async (response) => {
  if (response.code === 0) {
    const avatarUrl = response.result.url;
    try {
      await updateUser({
        id: userStore.userInfo.id,
        avatar: avatarUrl
      });
      ElMessage.success('头像更新成功');
      await userStore.getPermissions();
    } catch (error) {
      // 错误信息已由拦截器处理
    }
  } else {
    ElMessage.error(response.message || '图片上传失败');
  }
};

const beforeAvatarUpload = (file) => {
  const isJPGorPNG = file.type === 'image/jpeg' || file.type === 'image/png';
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPGorPNG) {
    ElMessage.error('上传头像图片只能是 JPG 或 PNG 格式!');
  }
  if (!isLt2M) {
    ElMessage.error('上传头像图片大小不能超过 2MB!');
  }
  return isJPGorPNG && isLt2M;
};

const handleAvatarEdit = () => {
  // el-upload will handle the click
};

const formatTime = (timeStr) => {
  if (!timeStr) return '未知';
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
}

.user-card {
  text-align: center;
}

.card-header {
  font-weight: bold;
  text-align: left;
}

.user-profile {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
}

.avatar-container {
  position: relative;
  cursor: pointer;
  margin-bottom: 15px;
}

.avatar-edit {
  position: absolute;
  bottom: 0;
  right: 0;
  background: var(--el-color-primary);
  color: #fff;
  border-radius: 50%;
  width: 30px;
  height: 30px;
  display: flex;
  justify-content: center;
  align-items: center;
  border: 2px solid #fff;
  transition: transform 0.3s;
}

.avatar-container:hover .avatar-edit {
  transform: scale(1.1);
}

.user-info .username {
  margin: 10px 0 5px;
  font-size: 22px;
  color: var(--el-text-color-primary);
}

.user-info .role {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 20px;
}

.user-details {
  width: 100%;
  text-align: left;
}

.detail-item {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  font-size: 14px;
  color: var(--el-text-color-regular);
}

.detail-item .el-icon {
  margin-right: 10px;
  color: var(--el-color-primary);
}

.profile-tabs {
  padding: 10px;
}

.profile-form {
  max-width: 600px;
  margin-top: 20px;
}

:deep(.el-tabs__item) {
  font-size: 16px;
  height: 50px;
  line-height: 50px;
}
</style>
