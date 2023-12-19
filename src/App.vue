<template>
  <router-view />
</template>

<script lang="ts" setup>
import { useThemeStore } from "@/store/theme";
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { canAccessRoute, useUserWithToken } from "./utils/auth";

useThemeStore();
const {user, token} = useUserWithToken();
const router = useRouter();
const route = useRoute();

watch(user, async (currentUser, previousUser) => {
  if (!currentUser && previousUser && !canAccessRoute(route.meta, { user: user.value, token: token.value})) {
    return router.push({ path: "/" });
  }
  if (currentUser && typeof route.query.redirect === "string") {
    return router.push(route.query.redirect);
  }
});
</script>
