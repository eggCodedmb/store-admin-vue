import { defineStore } from "pinia";
import request from "../utils/request";

export const useUserStore = defineStore("user", {
  state: () => ({
    token: localStorage.getItem("token") || "",
    userInfo: null,
    roles: [],
    menus: [],
    buttons: [],
    isRoutesAdded: false, // 是否已动态添加路由
  }),
  actions: {
    async login(loginForm) {
      const res = await request.post("/user/login", loginForm);
      this.token = res.result.accessToken;
      localStorage.setItem("token", this.token);
      this.isRoutesAdded = false; // 登录时重置标识，确保重新加载路由
      return res;
    },
    async getPermissions() {
      const res = await request.get("/user/permissions");
      this.userInfo = res.result.user;
      this.roles = res.result.roles;
      this.menus = res.result.menus;
      this.buttons = res.result.buttons;
      return res.result;
    },
    logout() {
      this.token = "";
      this.userInfo = null;
      this.roles = [];
      this.menus = [];
      this.buttons = [];
      this.isRoutesAdded = false; // 登出时重置标识
      localStorage.removeItem("token");
    },
  },
});

