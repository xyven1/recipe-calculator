<template>
  <v-container
    fluid
    class="fill-height flex-column align-stretch justify-start"
  >
    <v-range-slider
      color="primary"
      class="pb-12 pr-14 flex-grow-0 w-100"
      :ticks="
        Object.fromEntries(
          sortedSchedule.map((s, idx) => [
            idx,
            new Date(s.date).toLocaleDateString(),
          ])
        )
      "
      v-model="range"
      show-ticks="always"
      :step="1"
      :min="0"
      :max="sortedSchedule.length - 1"
      tick-size="4"
    >
      <template #tick-label="{ tick }">
        <div
          style="transform-origin: 0 0; transform: rotate(45deg); width: 0px"
        >
          {{ tick.label }}
        </div>
      </template>
    </v-range-slider>

    <v-list lines="two" class="w-100">
      <v-list-item class="my-4" elevation="4">
        <v-list-item-title>
          Total: ${{
            Array.from(groceryList.values())
              .reduce((a, v) => a + v.price, 0)
              .toFixed(2)
          }}
        </v-list-item-title>
      </v-list-item>
      <v-list-item
        v-for="[id, details] of groceryList"
        :key="id"
        class="my-4"
        elevation="4"
      >
        <v-list-item-title>
          {{ ingredients.find((i) => i.id === id)?.name }} (${{
            details.price
          }})
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ details.quantity }} x {{ details.unit }} ({{
            details.amount.value.toFixed(2)
          }}
          {{ details.amount.unit }})
        </v-list-item-subtitle>
      </v-list-item>
    </v-list>
  </v-container>
</template>

<script lang="ts" setup>
import { useAppStore } from "@/store/app";
import {
  Amount,
  GroceryStatus,
  Ingredient,
  Recipe,
  ScheduleItem,
  getInPurchasedUnits,
} from "@/types/recipe";
import { ref as dbRef } from "firebase/database";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
const { range } = storeToRefs(useAppStore());

const db = useDatabase();
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));
const schedule = useDatabaseList<ScheduleItem>(dbRef(db, "schedule"));
const groceryStatus = useDatabaseList<GroceryStatus>(
  dbRef(db, "groceryStatus")
);

const sortedSchedule = computed(() =>
  schedule.value.toSorted(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
);
const selectedRecipes = computed(() => {
  return sortedSchedule.value
    .slice(range.value[0], range.value[1] + 1)
    .reduce((a, s) => {
      const recipe = recipes.value.find((r) => r.id === s.recipeID);
      if (!recipe) return a;
      a.push({
        ...recipe,
        date: s.date,
        people: s.people,
      });
      return a;
    }, [] as (Recipe & { date: string; people: number })[]);
});

const groceryList = computed(() => {
  const map = selectedRecipes.value.reduce(
    (a, r) => {
      const numberOfRecipes = Math.ceil(r.people / r.portions);
      for (const ingredient of r.ingredients) {
        if (!ingredient.ingredientID) continue;
        const ingredientDetails = ingredients.value.find(
          (i) => i.id === ingredient.ingredientID
        );
        if (!ingredientDetails) continue;
        const recipeQuantity = getInPurchasedUnits(
          ingredientDetails,
          ingredient.amount
        ).value;
        const value = recipeQuantity * numberOfRecipes;
        const existing = a.get(ingredient.ingredientID);
        if (existing) existing.amount.value += value;
        else
          a.set(ingredient.ingredientID, {
            amount: {
              value,
              unit: ingredientDetails.asPurchased.unit,
            },
            quantity: 0,
            unit: "",
            price: 0,
          });
      }
      return a;
    },
    new Map() as Map<
      string,
      {
        amount: Amount;
        quantity: number;
        unit: string;
        price: number;
      }
    >
  );
  for (const [id, obj] of map.entries()) {
    const ingredientDetails = ingredients.value.find((i) => i.id === id);
    if (!ingredientDetails) continue;
    obj.quantity = Math.ceil(
      obj.amount.value / ingredientDetails.asPurchased.value
    );
    obj.unit = `${ingredientDetails.asPurchased.value} ${ingredientDetails.asPurchased.unit}`;
    obj.price = ingredientDetails.price * obj.quantity;
  }
  return map;
});
</script>
