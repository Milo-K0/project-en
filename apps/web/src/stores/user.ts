import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { WebResultUser, Token, UserUpdate } from "@en/common/user";
import router from "@/router";

export const useUserStore = defineStore(
  "user",
  () => {
    const user = ref<WebResultUser | null>(null);
    const setUser = (param: WebResultUser) => {
      console.log("setUser", param);
      user.value = param;
    };

    const getAccessToken = computed(() => user.value?.token.accessToken || "");
    const getRefreshToken = computed(
      () => user.value?.token.refreshToken || "",
    );
    const updateToken = (newToken: Token) => {
      user.value!.token = newToken;
    };
    const getUser = computed(() => user.value);

    const logout = () => {
      user.value = null;
      router.push({ path: "/" });
    };

    const getUpdateUser = computed(() => {
      // 如果用户不存在，返回空对象
      if (!user.value) {
        return {
          name: "",
          email: "",
          address: "",
          avatar: "",
          bio: "",
          isTimingTask: false,
          timingTaskTime: "",
        };
      }

      // 用户存在时返回实际数据
      return {
        name: user.value.name || "",
        email: user.value.email || "",
        address: user.value.address || "",
        avatar: user.value.avatar || "",
        bio: user.value.bio || "",
        isTimingTask: user.value.isTimingTask ?? false, // 使用空值合并运算符
        timingTaskTime: user.value.timingTaskTime || "",
      };
    });

    const updateUser = (param: UserUpdate) => {
      user.value!.name = param.name;
      user.value!.email = param.email;
      user.value!.address = param.address;
      user.value!.avatar = param.avatar;
      user.value!.bio = param.bio;
      user.value!.isTimingTask = param.isTimingTask;
      user.value!.timingTaskTime = param.timingTaskTime;
    };

    return {
      user,
      setUser,
      logout,
      getUser,
      getAccessToken,
      getRefreshToken,
      updateToken,
      updateUser,
      getUpdateUser,
    };
  },
  { persist: true }, // 持久化缓存 localStorage
);
