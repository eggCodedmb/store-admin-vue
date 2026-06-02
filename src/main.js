import { createApp } from "vue";
import App from "./App.vue";
import router, { asyncRoutes } from "./router";
import { createPinia } from "pinia";
import ElementPlus from 'element-plus';
import zhCn from 'element-plus/es/locale/lang/zh-cn'
import "element-plus/dist/index.css";
import "element-plus/theme-chalk/dark/css-vars.css";
import * as ElementPlusIconsVue from "@element-plus/icons-vue";
import { useUserStore } from "./store/user";
import baiduMapInit from 'vue3-baidu-map-gl'

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(ElementPlus, { locale: zhCn });
app.use(baiduMapInit, {
  ak: 'YeUx4XZ5alsFPBLCpRK00x9doJ2jdn1J',
  apiUrl: 'https://api.map.baidu.com/api?type=webgl&v=1.0&ak=YeUx4XZ5alsFPBLCpRK00x9doJ2jdn1J&'
});

for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component);
}

router.beforeEach(async (to) => {
  const userStore = useUserStore();
  const token = localStorage.getItem("token");

  if (token) {
    if (to.path === "/login") {
      return "/";
    } else {
      // 只有在没获取过权限且没添加过路由时执行
      if (userStore.menus.length === 0 && !userStore.isRoutesAdded) {
        try {
          const { menus } = await userStore.getPermissions();
          console.log("Backend Menus:", menus);
          
          const routesToAdd = new Set();
          menus.forEach(menuPath => {
            // 找到匹配的顶级路由（或者是包含该子路径的顶级路由）
            const route = asyncRoutes.find(r => 
              r.path === menuPath || menuPath.startsWith(r.path + '/')
            );
            if (route) {
              routesToAdd.add(route);
            }
          });

          routesToAdd.forEach(route => {
            console.log("Adding Route:", route.path);
            router.addRoute(route);
          });
          
          // 添加通配符路由作为最后的补退方案，必须在所有动态路由之后添加
          router.addRoute({ path: "/:pathMatch(.*)*", redirect: "/404" });
          
          userStore.isRoutesAdded = true;
          // 关键：必须 return 一个新的目标，强制重新匹配
          return { ...to, replace: true };
        } catch (error) {
          console.error("Auth error:", error);
          userStore.logout();
          return "/login?redirect=" + to.path;
        }
      }
    }
  } else {
    if (to.path !== "/login") {
      return "/login?redirect=" + to.path;
    }
  }
});

app.use(router);
app.mount("#app");

