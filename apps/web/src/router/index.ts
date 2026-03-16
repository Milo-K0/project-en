import { createRouter, createWebHistory } from "vue-router";
import homeRoutes from "./home/index";
import workBookRoutes from "./word-book/index";
import settingRoutes from "./setting/index";
import chatRoutes from "./chat/index";
import courseRoutes from "./course/index";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...homeRoutes, // 主页
    ...workBookRoutes, // 词库
    ...settingRoutes, // 设置
    ...chatRoutes, // 聊天
    ...courseRoutes, // 课程
  ],
});

export default router;
