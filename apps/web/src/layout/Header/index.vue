<template>
  <header
    class="flex items-center h-20 border-b border-gray-200 justify-center sticky top-0 bg-white z-10"
  >
    <div class="w-300 mx-auto flex items-center justify-between">
      <div
        class="text-2xl font-bold bg-indigo-700 text-white rounded-[10px] px-2 py-1 w-10 flex items-center justify-center h-10"
      >
        E
      </div>
      <div class="text-2xl font-bold">English App</div>
      <template v-for="route in routes" :key="route.path">
        <div
          @click="gotoPath(route.path)"
          :class="isActive(route.path)"
          class="flex items-center gap-2 cursor-pointer rounded-[10px] px-2 py-1"
        >
          <el-icon>
            <component :is="route.icon" />
          </el-icon>
          <span>{{ route.name }}</span>
        </div>
      </template>
      <div
        class="flex items-center gap-2 bg-blue-200 text-blue-700 rounded-full px-2 py-1"
      >
        <el-icon>
          <Sunny />
        </el-icon>
        <span class="font-bold text-sm">{{
          userStore.getUser?.wordNumber ?? 0
        }}</span>
      </div>
      <div
        class="flex items-center gap-2 bg-amber-200 text-amber-700 rounded-full px-2 py-1"
      >
        <el-icon>
          <Star />
        </el-icon>
        <span class="font-bold text-sm">{{
          userStore.getUser?.dayNumber ?? 0
        }}</span>
      </div>
      <el-popover placement="bottom" width="340">
        <template #reference>
          <div
            class="flex items-center gap-2 border-l cursor-pointer border-gray-200 pl-4"
          >
            <img class="w-10 h-10 rounded-full ml-2 mr-2" :src="avatar" />
            <span class="text-sm font-bold">{{
              userStore.getUser?.name ? userStore.getUser.name : "游客"
            }}</span>
          </div>
        </template>
        <Profile />
      </el-popover>
    </div>
  </header>
</template>

<script setup lang="ts">
import Profile from "@/layout/Profile/index.vue";
import { useAvatar } from "@/hooks/useAvatar";
const { avatar } = useAvatar();
import {
  Sunny,
  Star,
  HomeFilled,
  Notebook,
  MagicStick,
  Reading,
  Setting,
} from "@element-plus/icons-vue";
import { useRouter } from "vue-router";
import { watch, ref } from "vue";
import { useUserStore } from "@/stores/user";
import { useLogin } from "@/hooks/useLogin";

const { login } = useLogin();
const userStore = useUserStore();
const router = useRouter();
const currentPath = ref("");
const routes = [
  { path: "/", name: "主页", icon: HomeFilled, isAuth: false },
  { path: "/chat/index", name: "AI", icon: MagicStick, isAuth: true },
  { path: "/word-book/index", name: "词库", icon: Notebook, isAuth: false },
  { path: "/courses/index", name: "课程", icon: Reading, isAuth: false },
  { path: "/setting/index", name: "设置", icon: Setting, isAuth: true },
];

const gotoPath = (path: string) => {
  const isAuth = routes.find((route) => route.path === path)?.isAuth ?? false;
  if (isAuth) {
    login().then(() => {
      router.push(path);
    });
  } else {
    router.push(path);
  }
};

const isActive = (path: string) => {
  return currentPath.value === path
    ? "bg-blue-200 text-blue-700"
    : "text-gray-500 hover:bg-blue-200 hover:text-blue-700";
};
watch(
  () => router.currentRoute.value,
  (newVal) => {
    currentPath.value = newVal.path;
  },
  {
    immediate: true,
  },
);
</script>
