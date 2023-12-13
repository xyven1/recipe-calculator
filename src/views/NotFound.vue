<template>
  <v-app>
    <v-main class="fill-height">
      <v-container
        class="fill-height flex-column align-center justify-center"
        fluid
      >
        <p class="text-h4 ma-3">Page Not Found</p>
        <v-btn href="/" :prepend-icon="mdiHome" variant="outlined">
          Go Home
        </v-btn>
      </v-container>
    </v-main>
  </v-app>
</template>
<script setup lang="ts">
import { mdiHome } from "@mdi/js";
</script>
