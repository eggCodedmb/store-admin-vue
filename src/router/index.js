import { createRouter, createWebHashHistory } from "vue-router";
import Layout from "../layout/index.vue";

export const constantRoutes = [
  {
    path: "/login",
    component: () => import("../views/login/index.vue"),
  },
  {
    path: "/404",
    component: () => import("../views/error-page/404.vue"),
  },
  {
    path: "/",
    component: Layout,
    redirect: "/dashboard",
    children: [
      {
        path: "dashboard",
        component: () => import("../views/dashboard/index.vue"),
        name: "Dashboard",
        meta: { title: "控制台", icon: "Odometer" },
      },
      {
        path: "profile",
        component: () => import("../views/profile/index.vue"),
        name: "Profile",
        meta: { title: "个人中心", icon: "User", hidden: true },
      },
    ],
  },
];

export const asyncRoutes = [
  {
    path: "/store_manage",
    component: Layout,
    meta: { title: "门店管理", icon: "Shop" },
    children: [
      {
        path: "",
        component: () => import("../views/store/index.vue"),
        name: "StoreManage",
        meta: { title: "门店列表", icon: "Shop" },
      },
    ],
  },
  {
    path: "/user_manage",
    component: Layout,
    meta: { title: "用户管理", icon: "User" },
    children: [
      {
        path: "",
        component: () => import("../views/user/index.vue"),
        name: "UserManage",
        meta: { title: "用户列表", icon: "User" },
      },
    ],
  },
  {
    path: "/category_manage",
    component: Layout,
    meta: { title: "分类管理", icon: "Menu" },
    children: [
      {
        path: "",
        component: () => import("../views/category/index.vue"),
        name: "CategoryManage",
        meta: { title: "分类列表", icon: "Menu" },
      },
    ],
  },
  {
    path: "/goods_manage",
    component: Layout,
    meta: { title: "商品管理", icon: "Goods" },
    children: [
      {
        path: "",
        component: () => import("../views/goods/index.vue"),
        name: "GoodsManage",
        meta: { title: "商品列表", icon: "Goods" },
      },
      {
        path: "add",
        component: () => import("../views/goods/AddGoods.vue"),
        name: "AddGoods",
        meta: { title: "添加商品", icon: "Plus" },
      },
      {
        path: "edit/:id",
        component: () => import("../views/goods/AddGoods.vue"),
        name: "EditGoods",
        meta: { title: "编辑商品", icon: "Edit", hidden: true },
      },
      {
        path: "spec",
        component: () => import("../views/goods/SpecManage.vue"),
        name: "SpecManage",
        meta: { title: "规格管理", icon: "Operation" },
      },
    ],
  },
  {
    path: "/order_manage",
    component: Layout,
    meta: { title: "订单管理", icon: "List" },
    children: [
      {
        path: "",
        component: () => import("../views/order/index.vue"),
        name: "OrderManage",
        meta: { title: "订单列表", icon: "List" },
      },
    ],
  },
  {
    path: "/address_manage",
    component: Layout,
    meta: { title: "地址管理", icon: "Location" },
    children: [
      {
        path: "",
        component: () => import("../views/address/index.vue"),
        name: "AddressManage",
        meta: { title: "地址列表", icon: "Location" },
      },
    ],
  },
  {
    path: "/coupon_manage",
    component: Layout,
    meta: { title: "优惠券管理", icon: "Ticket" },
    children: [
      {
        path: "",
        component: () => import("../views/coupon/index.vue"),
        name: "CouponManage",
        meta: { title: "优惠券列表", icon: "Ticket" },
      },
    ],
  },
  {
    path: "/checkin_manage",
    component: Layout,
    meta: { title: "活动管理", icon: "Calendar" },
    children: [
      {
        path: "",
        component: () => import("../views/checkin/index.vue"),
        name: "CheckinManage",
        meta: { title: "签到配置", icon: "Calendar" },
      },
    ],
  },
  {
    path: "/system",
    component: Layout,
    meta: { title: "系统管理", icon: "Setting" },
    children: [
      {
        path: "role",
        component: () => import("../views/system/role/index.vue"),
        name: "RoleManage",
        meta: { title: "角色管理", icon: "Avatar" },
      },
      {
        path: "menu",
        component: () => import("../views/system/menu/index.vue"),
        name: "MenuManage",
        meta: { title: "菜单管理", icon: "Operation" },
      },
      {
        path: "notice",
        component: () => import("../views/system/notice/index.vue"),
        name: "NoticeManage",
        meta: { title: "公告管理", icon: "Bell" },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes: constantRoutes,
});

export default router;

