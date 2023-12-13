<template>
  <div class="h-100">
    <v-tabs v-model="tab">
      <v-tab>Ingredients</v-tab>
      <v-tab>Recipes</v-tab>
    </v-tabs>
    <v-window v-model="tab" style="height: calc(100% - 48px)">
      <v-window-item>
        <Ingredients ref="ingredients" />
      </v-window-item>
      <v-window-item>
        <Recipes @add-ingredient="addIngredient" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script lang="ts" setup>
import Ingredients from "@/components/Ingredients.vue";
import Recipes from "@/components/Recipes.vue";
import { ref } from "vue";

const tab = ref(0);

const ingredients = ref<InstanceType<typeof Ingredients> | null>(null);
function addIngredient(v: string) {
  ingredients.value?.addNew(v);
  tab.value = 0;
}
</script>

<style>
.v-window__container {
  height: 100%;
}
</style>
