import { inject, ref } from "vue";
import { IS_SHOW_LOGIN } from "@/components/Login/type";
import { useUserStore } from "@/stores/user";

export const useLogin = () => {
  const isShowLogin = inject(IS_SHOW_LOGIN, ref(false)); // 注入登录状态
  const userStore = useUserStore();

  const login = () => {
    return new Promise((resolve, reject) => {
      if (userStore.getUser) {
        resolve(true);
      } else {
        isShowLogin.value = true; // 显示登录组件
        reject(false);
      }
    });
  };
  const hide = () => {
    isShowLogin.value = false; // 隐藏登录组件
  };
  return {
    login,
    hide,
  };
};
