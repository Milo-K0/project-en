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
          @click="router.push(route.path)"
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
      <div
        class="flex items-center gap-2 border-l cursor-pointer border-gray-200 pl-4"
      >
        <img
          class="w-10 h-10 rounded-full ml-2 mr-2"
          src="https://gips3.baidu.com/it/u=3493347002,3356558679&fm=3074&app=3074&f=PNG?w=2048&h=2048"
        />
        <span class="text-sm font-bold">{{
          userStore.getUser?.name ? userStore.getUser.name : "未登录"
        }}</span>
      </div>
    </div>
  </header>
</template>

<script setup lang="ts">
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
const userStore = useUserStore();
const router = useRouter();
const currentPath = ref("");
const routes = [
  { path: "/", name: "主页", icon: HomeFilled },
  { path: "/smart/chat", name: "AI", icon: MagicStick },
  { path: "/word-book/index", name: "词库", icon: Notebook },
  { path: "/courses/index", name: "课程", icon: Reading },
  { path: "/setting/index", name: "设置", icon: Setting },
];
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
