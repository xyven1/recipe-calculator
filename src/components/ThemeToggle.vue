<template>
  <v-switch
    v-model="darkMode"
    :true-icon="mdiWeatherNight"
    :false-icon="mdiWeatherSunny"
    inset
    hide-details="auto"
  />
</template>
<script lang="ts" setup>
import { useThemeStore } from "@/store/theme";
import { mdiWeatherNight, mdiWeatherSunny } from "@mdi/js";
import { storeToRefs } from "pinia";

const { darkMode } = storeToRefs(useThemeStore());
</script>
