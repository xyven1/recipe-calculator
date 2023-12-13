<template>
  <v-tabs v-model="tab">
    <v-tab v-for="tab in tabs" :key="tab.name">{{ tab.name }}</v-tab>
  </v-tabs>
  <v-window v-model="tab">
    <v-window-item v-for="({ component }, i) in tabs" :key="i">
      <component :is="component" />
    </v-window-item>
  </v-window>
</template>

<script lang="ts" setup>
import Ingredients from "@/components/Ingredients.vue";
import Recipes from "@/components/Recipes.vue";
import { ref } from "vue";

const tab = ref(0);

const tabs = [
  { name: "Ingredients", component: Ingredients },
  { name: "Recipes", component: Recipes },
];
</script>
