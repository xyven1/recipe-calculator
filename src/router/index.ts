// Composables
import {
  canAccessRoute,
  getUserAndToken,
  handleSignInWithRedirectCode,
} from "@/utils/auth";
import { mdiCalendarEdit, mdiCart, mdiFoodVariant } from "@mdi/js";
import "vue-router";
import { RouteRecordRaw, createRouter, createWebHistory } from "vue-router";

declare module "vue-router" {
  interface RouteMeta {
    nav: boolean;
    user: boolean;
    admin: boolean;
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
          admin: false,
          icon: mdiCart,
          nav: true,
          user: false,
        },
        component: () => import("@/views/GroceryList.vue"),
      },
      {
        path: "/food",
        name: "Food",
        meta: {
          admin: false,
          icon: mdiFoodVariant,
          nav: true,
          user: true,
        },
        component: () => import("@/views/Food.vue"),
      },
      {
        path: "/schedule",
        name: "Schedule",
        meta: {
          admin: false,
          icon: mdiCalendarEdit,
          nav: true,
          user: true,
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
  if (!canAccessRoute(to.meta, await getUserAndToken())) return { path: "/" };
});
export default router;
