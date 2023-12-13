<template>
  <v-app-bar>
    <v-app-bar-title> Recipe Calculator </v-app-bar-title>
    <theme-toggle></theme-toggle>
    <v-btn v-if="!user" :append-icon="mdiLogin" @click="login"> Sign In </v-btn>
    <v-menu v-else>
      <template #activator="{ props }">
        <v-btn v-bind="props" icon>
          <v-avatar>
            <v-icon :icon="mdiAccount" class="position-absolute" />
            <v-img :src="user.photoURL ?? ''" class="position-absolute" />
          </v-avatar>
        </v-btn>
      </template>
      <v-list>
        <v-list-item>
          <v-list-item-title>{{ user.displayName }}</v-list-item-title>
          <v-list-item-subtitle>{{ user.email }}</v-list-item-subtitle>
        </v-list-item>
        <v-divider class="flex-grow-1" />
        <div class="w-100 d-flex justify-center">
          <v-btn variant="text" @click="logout"> Sign Out </v-btn>
        </div>
      </v-list>
    </v-menu>
  </v-app-bar>
</template>

<script setup lang="ts">
import ThemeToggle from "@/components/ThemeToggle.vue";
import { signInWithPrompt, signInWithRedirect } from "@/utils/auth";
import { mdiAccount, mdiLogin } from "@mdi/js";
import { signOut } from "firebase/auth";
import { useRoute } from "vue-router";
import { useCurrentUser, useFirebaseAuth } from "vuefire";

// const drawer = ref(false);
// const version = APP_VERSION;

const user = useCurrentUser();
const auth = useFirebaseAuth()!;

// const authorized = computedAsync(async () => {
//   if (!user.value) return false;
//   const token = await user.value.getIdTokenResult();
//   return token.claims.authorized as boolean;
// });
const currentRoute = useRoute();
function login() {
  signInWithPrompt((notification) => {
    if (notification.isNotDisplayed()) signInWithRedirect(currentRoute);
  });
}
function logout() {
  signOut(auth);
}
</script>
<style>
.g-btn {
  overflow: hidden;
}

#credential_picker_container {
  color-scheme: light !important;
}
</style>
