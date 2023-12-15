// Composables
import { handleSignInWithRedirectCode, isAuthorized } from "@/utils/auth";
import { mdiCalendarEdit, mdiCart, mdiFoodVariant } from "@mdi/js";
import "vue-router";
import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";

// To ensure it is treated as a module, add at least one `export` statement
export {};

declare module "vue-router" {
  interface RouteMeta {
    nav: boolean;
    auth: boolean;
    icon: string;
  }
}

const routes: RouteRecordRaw[] = [
  {
    path: "/login",
    redirect: (to) => {
      if (typeof to.query.code === "string") {
        handleSignInWithRedirectCode(to.query.code);
        if (typeof to.query.state === "string")
          return { path: to.query.state, query: {} };
      }
      return { path: "/", query: {} };
    },
  },
  {
    path: "/",
    component: () => import("@/layouts/default/Default.vue"),
    children: [
      {
        path: "",
        name: "Grocery List",
        meta: {
          nav: true,
          auth: false,
          icon: mdiCart,
        },
        component: () => import("@/views/GroceryList.vue"),
      },
      {
        path: "/food",
        name: "Food",
        meta: {
          nav: true,
          auth: false,
          icon: mdiFoodVariant,
        },
        component: () => import("@/views/Food.vue"),
      },
      {
        path: "/schedule",
        name: "Schedule",
        meta: {
          nav: true,
          auth: false,
          icon: mdiCalendarEdit,
        },
        component: () => import("@/views/Schedule.vue"),
      },
      {
        path: "/:pathMatch(.*)*",
        name: "NotFound",
        component: () => import("@/views/NotFound.vue"),
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

router.beforeEach(async (to) => {
  if (to.meta.auth && !(await isAuthorized())) return { path: "/" };
});
export default router;
