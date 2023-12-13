<template>
  <v-app>
    <default-bar />

    <default-view />
  </v-app>
</template>

<script lang="ts" setup>
import DefaultBar from "./AppBar.vue";
import DefaultView from "./View.vue";
</script>
<style>
html {
  overflow: auto;
}
html,
body,
#app {
  height: 100%;
}
</style>
