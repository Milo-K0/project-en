<template>
  <canvas ref="hologramRef"></canvas>
</template>

<script sescriptng="ts">
import * as THREE from "three";
import { useTemplateRef } from "vue";

const hologramRef = useTemplateRef<HTMLCanvasElement>("hologramRef");
</script>
