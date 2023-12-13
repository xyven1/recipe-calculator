<template>
  <v-tabs v-model="tab">
    <v-tab v-for="tab in tabs" :key="tab.name">{{ tab.name }}</v-tab>
  </v-tabs>
  <v-window v-model="tab">
    <v-window-item v-for="{ component } in tabs">
      <component :is="component" />
    </v-window-item>
  </v-window>
</template>

<script lang="ts" setup>
import GroceryList from "@/components/GroceryList.vue";
import Ingredients from "@/components/Ingredients.vue";
import Recipes from "@/components/Recipes.vue";
import Schedule from "@/components/Schedule.vue";
import { ref } from "vue";

const tab = ref(0);

const tabs = [
  { name: "Grocery List", component: GroceryList },
  { name: "Ingredients", component: Ingredients },
  { name: "Recipes", component: Recipes },
  { name: "Schedule", component: Schedule },
];
</script>
