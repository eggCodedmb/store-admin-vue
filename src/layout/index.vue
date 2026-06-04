<template>
  <el-container class="layout-container">
    <el-aside :width="isCollapse ? '64px' : '220px'" class="aside">
      <div class="logo-container">
        <el-icon v-if="isCollapse" size="24" class="logo-icon"><Shop /></el-icon>
        <span v-else class="logo-text">商城后台管理</span>
      </div>
      <el-scrollbar>
        <el-menu
          :default-active="route.path"
          :collapse="isCollapse"
          :collapse-transition="false"
          class="el-menu-vertical"
          router
        >
          <el-menu-item index="/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>控制台</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.menus.includes('/user_manage')" index="/user_manage">
            <el-icon><User /></el-icon>
            <span>用户管理</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.menus.includes('/category_manage')" index="/category_manage">
            <el-icon><Menu /></el-icon>
            <span>分类管理</span>
          </el-menu-item>
          <el-sub-menu v-if="userStore.menus.includes('/goods_manage')" index="/goods_manage">
            <template #title>
              <el-icon><Goods /></el-icon>
              <span>商品管理</span>
            </template>
            <el-menu-item index="/goods_manage">
              <el-icon><List /></el-icon>
              <span>商品列表</span>
            </el-menu-item>
            <el-menu-item index="/goods_manage/spec">
              <el-icon><Operation /></el-icon>
              <span>规格管理</span>
            </el-menu-item>
          </el-sub-menu>
          <el-menu-item v-if="userStore.menus.includes('/order_manage')" index="/order_manage">
            <el-icon><List /></el-icon>
            <span>订单管理</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.menus.includes('/address_manage')" index="/address_manage">
            <el-icon><Location /></el-icon>
            <span>地址管理</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.menus.includes('/store_manage')" index="/store_manage">
            <el-icon><Shop /></el-icon>
            <span>门店管理</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.menus.includes('/coupon_manage')" index="/coupon_manage">
            <el-icon><Ticket /></el-icon>
            <span>优惠券管理</span>
          </el-menu-item>
          <el-menu-item v-if="userStore.menus.includes('/checkin_manage')" index="/checkin_manage">
            <el-icon><Calendar /></el-icon>
            <span>活动管理</span>
          </el-menu-item>
          <el-sub-menu v-if="userStore.menus.includes('/system')" index="/system">
            <template #title>
              <el-icon><Setting /></el-icon>
              <span>系统管理</span>
            </template>
            <el-menu-item v-if="userStore.menus.includes('/system/role')" index="/system/role">
              <el-icon><Avatar /></el-icon>
              <span>角色管理</span>
            </el-menu-item>
            <el-menu-item v-if="userStore.menus.includes('/system/menu')" index="/system/menu">
              <el-icon><Operation /></el-icon>
              <span>菜单管理</span>
            </el-menu-item>
            <el-menu-item v-if="userStore.menus.includes('/system/notice')" index="/system/notice">
              <el-icon><Bell /></el-icon>
              <span>公告管理</span>
            </el-menu-item>
          </el-sub-menu>
        </el-menu>
      </el-scrollbar>
    </el-aside>
    <el-container class="content-container">
      <el-header class="header">
        <div class="header-left">
          <div class="collapse-btn" @click="toggleCollapse">
            <el-icon size="20">
              <component :is="isCollapse ? 'Expand' : 'Fold'" />
            </el-icon>
          </div>
          <el-breadcrumb separator="/" class="breadcrumb">
            <el-breadcrumb-item v-for="(item, index) in breadcrumbs" :key="index" :to="item.path">
              {{ item.title }}
            </el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <div class="header-action-item header-search">
            <el-icon size="18" class="search-icon-trigger"><Search /></el-icon>
            <el-select
              v-model="searchQuery"
              filterable
              remote
              placeholder="功能搜索"
              :remote-method="handleSearch"
              @change="handleJump"
              class="search-input"
            >
              <el-option
                v-for="item in searchOptions"
                :key="item.path"
                :label="item.title"
                :value="item.path"
              >
                <div class="search-option">
                  <el-icon style="margin-right: 8px"><component :is="item.icon" /></el-icon>
                  <span>{{ item.title }}</span>
                </div>
              </el-option>
            </el-select>
          </div>

          <div class="header-action-item theme-switch">
            <el-dropdown trigger="click" @command="handleThemeChange">
              <span class="el-dropdown-link" style="display: flex; align-items: center; height: 100%;">
                <el-icon size="18">
                  <Moon v-if="colorMode === 'dark'" />
                  <Sunny v-else-if="colorMode === 'light'" />
                  <Monitor v-else />
                </el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="light" :class="{ 'is-active': colorMode === 'light' }">
                    <el-icon><Sunny /></el-icon>浅色
                  </el-dropdown-item>
                  <el-dropdown-item command="dark" :class="{ 'is-active': colorMode === 'dark' }">
                    <el-icon><Moon /></el-icon>深色
                  </el-dropdown-item>
                  <el-dropdown-item command="auto" :class="{ 'is-active': colorMode === 'auto' }">
                    <el-icon><Monitor /></el-icon>跟随系统
                  </el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>

          <div class="header-action-item" @click="toggleFullScreen">
            <el-tooltip content="全屏" placement="bottom">
              <el-icon size="18"><FullScreen /></el-icon>
            </el-tooltip>
          </div>

          <div class="header-action-item">
            <el-popover
              placement="bottom-end"
              :width="300"
              trigger="click"
              popper-class="notification-popper"
            >
              <template #reference>
                <el-badge :value="unreadCount" :max="99" class="notice-badge" :hidden="unreadCount === 0">
                  <el-icon size="18"><Bell /></el-icon>
                </el-badge>
              </template>
              <div class="notification-container">
                <div class="notification-header">
                  <span>系统公告</span>
                  <el-button type="primary" link size="small" @click="handleMarkAllRead">全部已读</el-button>
                </div>
                <el-scrollbar max-height="350px">
                  <div v-for="item in announcements" :key="item.id" class="notification-item" :class="{ 'is-read': item.isRead }">
                    <div class="notification-item-icon" :class="item.type">
                      <el-icon><component :is="item.icon" /></el-icon>
                    </div>
                    <div class="notification-item-content">
                      <div class="notification-item-title">{{ item.title }}</div>
                      <div class="notification-item-time">{{ item.time }}</div>
                      <div class="notification-item-desc">{{ item.content }}</div>
                    </div>
                  </div>
                </el-scrollbar>
                <div class="notification-footer">
                  <el-button type="primary" link style="width: 100%" @click="$router.push('/system/notice')">查看更多</el-button>
                </div>
              </div>
            </el-popover>
          </div>

          <el-dropdown trigger="click" class="user-dropdown">
            <div class="user-info">
              <el-avatar :size="32" :src="userStore.userInfo?.avatar || 'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'" />
              <span class="username">{{ userStore.userInfo?.nick_name || userStore.userInfo?.user_name || 'Admin' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item icon="User" @click="$router.push('/profile')">个人中心</el-dropdown-item>
                <el-dropdown-item icon="Setting">系统设置</el-dropdown-item>
                <el-dropdown-item divided icon="SwitchButton" @click="handleLogout">退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content">
        <div class="page-wrapper">
          <router-view v-slot="{ Component }">
            <transition name="fade-transform" mode="out-in">
              <component :is="Component" />
            </transition>
          </router-view>
        </div>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useUserStore } from '../store/user';
import { useRouter, useRoute } from 'vue-router';
import { useColorMode } from '@vueuse/core';
import { getNoticeList } from '../api/notice';

const userStore = useUserStore();
const router = useRouter();
const route = useRoute();

const colorMode = useColorMode({
  emitAuto: true,
});

const handleThemeChange = (mode) => {
  colorMode.value = mode;
};

const isCollapse = ref(false);
const toggleCollapse = () => {
  isCollapse.value = !isCollapse.value;
};

const toggleFullScreen = () => {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }
  }
};

const announcements = ref([]);
const readNoticeIds = ref(JSON.parse(localStorage.getItem('readNoticeIds') || '[]'));

const unreadCount = computed(() => {
  return announcements.value.filter(item => !readNoticeIds.value.includes(item.id)).length;
});

const fetchAnnouncements = async () => {
  try {
    const res = await getNoticeList({ pageNum: 1, pageSize: 5, status: true });
    announcements.value = res.result.list.map(item => ({
      ...item,
      time: formatTime(item.createdAt),
      type: getTypeTag(item.type),
      isRead: readNoticeIds.value.includes(item.id)
    }));
  } catch (error) {
    console.error('Failed to fetch announcements:', error);
  }
};

const handleMarkAllRead = () => {
  const allIds = announcements.value.map(item => item.id);
  const newReadIds = Array.from(new Set([...readNoticeIds.value, ...allIds]));
  readNoticeIds.value = newReadIds;
  localStorage.setItem('readNoticeIds', JSON.stringify(newReadIds));
  
  // 更新本地数据状态
  announcements.value = announcements.value.map(item => ({
    ...item,
    isRead: true
  }));
};

const formatTime = (timeStr) => {
  if (!timeStr) return '';
  const date = new Date(timeStr);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

const getTypeTag = (type) => {
  const map = { 1: 'primary', 2: 'success', 3: 'warning' };
  return map[type] || 'primary';
};

const searchQuery = ref('');
const searchOptions = ref([]);

// 动态面包屑
const breadcrumbs = computed(() => {
  let matched = route.matched.filter(item => item.meta && item.meta.title);
  
  const breadcrumbList = matched.map(item => ({
    title: item.meta.title,
    path: item.path || '/'
  }));
  
  if (breadcrumbList[0]?.title !== '首页') {
    breadcrumbList.unshift({ title: '首页', path: '/' });
  }
  
  if (route.path.includes('/goods_manage/add') && breadcrumbList.length < 3) {
      const newList = [{ title: '首页', path: '/' }, { title: '商品管理', path: '/goods_manage' }, { title: '添加商品', path: '/goods_manage/add' }];
      return newList;
  }

  return breadcrumbList;
});

const allSearchableRoutes = computed(() => {
  return router.getRoutes()
    .filter(r => r.meta && r.meta.title && !r.meta.hidden)
    .map(r => ({
      title: r.meta.title,
      path: r.path,
      icon: r.meta.icon || 'Menu'
    }));
});

const handleSearch = (query) => {
  if (query !== '') {
    searchOptions.value = allSearchableRoutes.value.filter(item => {
      return item.title.toLowerCase().includes(query.toLowerCase());
    });
  } else {
    searchOptions.value = [];
  }
};

const handleJump = (path) => {
  if (path) {
    router.push(path);
    searchQuery.value = '';
    searchOptions.value = [];
  }
};

const handleLogout = () => {
  userStore.logout();
  router.push('/login');
};

watch(() => route.path, () => {
  searchQuery.value = '';
});

onMounted(() => {
  fetchAnnouncements();
});
</script>

<style scoped>
.layout-container { height: 100vh; width: 100vw; overflow: hidden; background-color: var(--el-bg-color-page); }
.aside { background-color: var(--el-menu-bg-color); transition: width 0.3s cubic-bezier(0.645, 0.045, 0.355, 1); box-shadow: 2px 0 8px rgba(0,0,0,0.05); display: flex; flex-direction: column; z-index: 1001; }
.logo-container { height: 60px; min-height: 60px; display: flex; justify-content: center; align-items: center; background-color: var(--el-bg-color); overflow: hidden; border-bottom: 1px solid var(--el-border-color-light); border-right: 1px solid var(--el-border-color-light); }
.logo-icon { color: var(--el-color-primary); }
.logo-text { color: var(--el-text-color-primary); font-size: 16px; font-weight: 700; letter-spacing: 1px; white-space: nowrap; }
.el-menu-vertical { border-right: none; flex: 1; }
.el-menu-vertical:not(.el-menu--collapse) { width: 220px; }
.content-container { height: 100vh; display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s; }
.header { background-color: var(--el-bg-color); border-bottom: 1px solid var(--el-border-color-light); display: flex; align-items: center; justify-content: space-between; padding: 0 15px; height: 60px; min-height: 60px; z-index: 999; box-shadow: 0 1px 4px rgba(0,0,0,.02); }
.header-left { display: flex; align-items: center; }
.collapse-btn { padding: 0 15px; cursor: pointer; height: 60px; display: flex; align-items: center; transition: background 0.3s; margin-right: 10px; color: var(--el-text-color-regular); }
.collapse-btn:hover { background-color: var(--el-fill-color-light); }
.breadcrumb { font-size: 14px; }
.header-right { display: flex; align-items: center; height: 100%; padding-right: 10px; }
.header-action-item { padding: 0 12px; height: 100%; display: flex; align-items: center; cursor: pointer; transition: background 0.3s; color: var(--el-text-color-regular); }
.header-action-item:hover { background-color: var(--el-fill-color-light); }
.header-search:hover { background-color: transparent; }
.header-search { padding: 0 12px; }
.search-icon-trigger { cursor: pointer; color: var(--el-text-color-regular); }
.search-input { width: 0; overflow: hidden; transition: width 0.3s cubic-bezier(0.645, 0.045, 0.355, 1); background: transparent; }
.header-search:hover .search-input, .search-input:focus-within { width: 210px; margin-left: 8px; }
:deep(.search-input .el-input__wrapper) { background-color: transparent !important; box-shadow: none !important; border-bottom: 1px solid var(--el-border-color) !important; border-radius: 0; padding: 0 4px; }
:deep(.search-input .el-input__inner) { color: var(--el-text-color-regular); }
.notice-badge { display: flex; align-items: center; }
.user-dropdown { margin-left: 10px; }
.user-info { display: flex; align-items: center; cursor: pointer; padding: 0 8px; height: 60px; transition: background 0.3s; }
.user-info:hover { background-color: var(--el-fill-color-light); }
.username { margin: 0 8px; font-size: 14px; color: var(--el-text-color-regular); font-weight: 500; }
.main-content { padding: 0; flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.page-wrapper { flex: 1; overflow: hidden; display: flex; flex-direction: column; }
.fade-transform-enter-active, .fade-transform-leave-active { transition: all .3s; }
.fade-transform-enter-from { opacity: 0; transform: translateX(-30px); }
.fade-transform-leave-to { opacity: 0; transform: translateX(30px); }

/* 通知中心样式 */
.notification-container { padding: 5px 0; background-color: var(--el-bg-color-overlay); }
.notification-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; border-bottom: 1px solid var(--el-border-color-light); font-weight: bold; color: var(--el-text-color-primary); }
.notification-item { display: flex; padding: 12px 15px; cursor: pointer; transition: background 0.3s; border-bottom: 1px solid var(--el-border-color-lighter); }
.notification-item:hover { background-color: var(--el-fill-color-light); }
.notification-item.is-read { opacity: 0.6; filter: grayscale(0.5); }
.notification-item:last-child { border-bottom: none; }
.notification-item-icon { width: 36px; height: 36px; border-radius: 50%; display: flex; justify-content: center; align-items: center; margin-right: 12px; flex-shrink: 0; }
.notification-item-icon.primary { background-color: var(--el-color-primary-light-9); color: var(--el-color-primary); }
.notification-item-icon.success { background-color: var(--el-color-success-light-9); color: var(--el-color-success); }
.notification-item-icon.warning { background-color: var(--el-color-warning-light-9); color: var(--el-color-warning); }
.notification-item-content { flex: 1; overflow: hidden; }
.notification-item-title { font-size: 14px; color: var(--el-text-color-primary); margin-bottom: 4px; font-weight: 500; }
.notification-item-time { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 4px; }
.notification-item-desc { font-size: 13px; color: var(--el-text-color-regular); line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
.notification-footer { padding: 10px 15px; border-top: 1px solid var(--el-border-color-light); text-align: center; }

html.dark .notification-item-icon.primary { background-color: var(--el-color-primary-light-3); color: var(--el-text-color-primary); }
html.dark .notification-item-icon.success { background-color: var(--el-color-success-light-3); color: var(--el-text-color-primary); }
html.dark .notification-item-icon.warning { background-color: var(--el-color-warning-light-3); color: var(--el-text-color-primary); }

.el-dropdown-link {
  outline: none;
}
.is-active {
  color: var(--el-color-primary);
  font-weight: bold;
}
</style>
