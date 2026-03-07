import defaultAvatar from "@/assets/images/avatar/avatar-default.png";
import { uploadUrl } from "@/apis/index";
import { computed } from "vue";
import { useUserStore } from "@/stores/user";

export const useAvatar = () => {
  const userStore = useUserStore();
  const avatar = computed(() => {
    if (userStore.getUpdateUser.avatar) {
      return uploadUrl + userStore.getUpdateUser.avatar;
    }
    return defaultAvatar;
  });
  const customAvatar = (avatar: string) => {
    if (avatar) {
      return uploadUrl + avatar;
    }
    return defaultAvatar;
  };
  return {
    avatar,
    customAvatar,
  };
};
