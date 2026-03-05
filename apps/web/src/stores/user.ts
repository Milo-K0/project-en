import { ref, computed } from "vue";
import { defineStore } from "pinia";
import type { WebResultUser, Token } from "@en/common/user";

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
    };

    return {
      user,
      setUser,
      logout,
      getUser,
      getAccessToken,
      getRefreshToken,
      updateToken,
    };
  },
  { persist: true }, // 持久化缓存 localStorage
);
