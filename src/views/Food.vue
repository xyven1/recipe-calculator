<template>
  <div class="h-100">
    <v-tabs v-model="tab" >
      <v-tab value="ingredients">Ingredients</v-tab>
      <v-tab value="recipes">Recipes</v-tab>
    </v-tabs>
    <v-window
      disabled
      v-model="tab"
      style="height: calc(100% - 48px)"
      class="full-container"
    >
      <v-window-item value="ingredients">
        <Ingredients ref="ingredients" @saved-ingredient="savedIngredient" />
      </v-window-item>
      <v-window-item value="recipes">
        <Recipes @add-ingredient="addIngredient" />
      </v-window-item>
    </v-window>
  </div>
</template>

<script lang="ts" setup>
import Ingredients from "@/components/Ingredients.vue";
import Recipes from "@/components/Recipes.vue";
import { Ingredient } from "@/types/recipe";
import { ref, watch } from "vue";
import { useRoute } from "vue-router";

const tab = ref("ingredients");
const route = useRoute();

const ingredients = ref<InstanceType<typeof Ingredients> | null>(null);
function addIngredient(v: string) {
  ingredients.value?.addNew(v, "recipes");
  tab.value = "ingredients";
}
function savedIngredient(i: Ingredient, source: string) {
  if (source === "recipes") tab.value = "recipes";
}

function setHash(name: string) {
  window.location.hash = "#" + name;
}

tab.value = route.hash.replace("#", "") || "ingredients";
setHash(tab.value);
watch(route, (v) => {
  if (v.path === "/food")
    setHash(tab.value)
});
watch(tab, setHash);
</script>

<style>
.full-container > .v-window__container {
  height: 100%;
}
</style>
