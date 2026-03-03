import layout from "@/layout/index.vue";
import home from "@/views/WordBook/Home/index.vue";

export default [
  {
    path: "/",
    component: () => layout,
    children: [
      {
        path: "/",
        component: home,
      },
    ],
  },
];
