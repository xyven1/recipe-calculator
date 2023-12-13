<template>
  <router-view />
</template>

<script lang="ts" setup>
import { useThemeStore } from "@/store/theme";
import { watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useCurrentUser } from "vuefire";

useThemeStore();
const user = useCurrentUser();
const router = useRouter();
const route = useRoute();

watch(user, async (currentUser, previousUser) => {
  if (!currentUser && previousUser && route.meta.auth) {
    return router.push({ path: "/" });
  }
  if (currentUser && typeof route.query.redirect === "string") {
    return router.push(route.query.redirect);
  }
});
</script>
