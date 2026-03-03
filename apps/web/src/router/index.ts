import { createRouter, createWebHistory } from "vue-router";
import homeRoutes from "./home/index";
import workBookRoutes from "./word-book/index";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    ...homeRoutes, // 主页
    ...workBookRoutes, // 词库
  ],
});

export default router;
