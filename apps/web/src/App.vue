<template>
  <RouterView />
  <Search />
  <Login />
</template>

<script setup lang="ts">
import { RouterView } from "vue-router";
import Search from "@/components/Search/index.vue";
import Login from "@/components/Login/index.vue";
import { IS_SHOW_LOGIN } from "@/components/Login/type";
import { provide, ref } from "vue";

provide(IS_SHOW_LOGIN, ref(false)); // 默认值为 false
</script>
