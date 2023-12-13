<template>
  <v-main>
    <router-view v-slot="{ Component }">
      <keep-alive>
        <component :is="Component" />
      </keep-alive>
    </router-view>
  </v-main>
  <!-- <v-snackbar
    :model-value="!connected"
    location="top"
    color="error"
    :timeout="0"
    class="d-flex"
    @update:model-value="() => {}"
  >
    <v-icon :icon="mdiLanDisconnect" />
    Disconnected
  </v-snackbar> -->
</template>

<script lang="ts" setup>
// import { useAppStore } from "@/store/app";
// import { mdiLanDisconnect } from "@mdi/js";
// import { storeToRefs } from "pinia";
// const { connected } = storeToRefs(useAppStore());
</script>
