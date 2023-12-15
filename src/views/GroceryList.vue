<template>
  <div class="d-flex h-100 flex-column pa-4 ga-4">
    <v-card class="w-100">
      <v-card-text class="text-center ga-1 d-flex flex-column">
        <v-range-slider
          color="primary"
          v-model="range"
          show-ticks="always"
          hide-details
          :step="1"
          :min="0"
          :max="sortedSchedule.length - 1"
          tick-size="4"
        >
        </v-range-slider>
        {{ new Date(sortedSchedule[range[0]]?.date).toLocaleDateString() }} -
        {{ new Date(sortedSchedule[range[1]]?.date).toLocaleDateString() }}
        <v-divider />
        <span>
          ${{ totalPrice.toFixed(2) }}
          <i> (${{ (totalPrice * 1.07).toFixed(2) }} with tax) </i></span
        >
      </v-card-text>
    </v-card>
    <v-data-table-virtual
      :height="0"
      :headers="headers"
      fixed-header
      :items="[...groceryList.values()]"
      :group-by="[
        {
          key: 'ingredientDetails.store',
          order: 'asc',
        },
      ]"
      class="flex-grow-1"
    >
      <template #data-table-group="{ item, count, props: { icon, onClick } }">
        <td class="text-no-wrap pa-0">
          <v-btn
            variant="flat"
            class="w-100 h-100 justify-start text-none"
            @click="onClick"
            :rounded="0"
            :append-icon="(icon as any)"
          >
            {{ item.value }} | {{ count }}
          </v-btn>
        </td>
      </template>
      <template #[`item.price`]="{ item }">
        ${{ item.price.toFixed(2) }}
      </template>
      <template #[`item.quantity`]="{ item }">
        {{ item.quantity }} x {{ item.unit }} ({{
          item.amount.value.toFixed(2)
        }}
        {{ item.amount.unit }})
      </template>
      <template #[`item.status`]="{ item }">
        <v-btn
          :color="
            statusMap.get(
              statuses.find((s) => s.ingredientId === item.ingredientDetails.id)
                ?.status ?? 'To Do'
            )
          "
          @click="cycleStatus(IngredientID(item.ingredientDetails.id))"
        >
        </v-btn>
      </template>
    </v-data-table-virtual>
  </div>
</template>

<script lang="ts" setup>
import { useAppStore } from "@/store/app";
import {
  Amount,
  DatabaseData,
  Ingredient,
  IngredientID,
  Recipe,
  ScheduleItem,
  Status,
  getInPurchasedUnits,
} from "@/types/recipe";
import { ref as dbRef, push, set } from "firebase/database";
import { storeToRefs } from "pinia";
import { computed } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
const { range } = storeToRefs(useAppStore());

const db = useDatabase();
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));
const schedule = useDatabaseList<ScheduleItem>(dbRef(db, "schedule"));
const statuses = useDatabaseList<Status>(dbRef(db, "statuses"));
const statusOrder: ["To Do", "In Progress", "Done"] = [
  "To Do",
  "In Progress",
  "Done",
];
const statusMap = new Map<string, string>([
  ["To Do", "red"],
  ["In Progress", "yellow"],
  ["Done", "green"],
]);

const headers = [
  { title: "Name", key: "ingredientDetails.name" },
  { title: "Price", key: "price" },
  { title: "Quantity", key: "quantity" },
  { title: "Status", key: "status" },
];

async function cycleStatus(ingredientId: IngredientID) {
  let currStatus = statuses.value.find((s) => s.ingredientId === ingredientId);
  if (currStatus === undefined)
    await push(dbRef(db, "statuses"), {
      ingredientId: ingredientId,
      status: statusOrder[1],
    });
  else {
    let currentIndex = statusOrder.indexOf(currStatus.status);
    currentIndex = (currentIndex + 1) % statusOrder.length;
    currStatus.status = statusOrder[currentIndex];
    await set(dbRef(db, `statuses/${currStatus.id}`), currStatus);
  }
}

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
  const map = new Map<
    string,
    {
      amount: Amount;
      ingredientDetails: DatabaseData<Ingredient>;
      quantity: number;
      unit: string;
      price: number;
    }
  >();
  // Add up all the ingredients
  for (const r of selectedRecipes.value) {
    const numberOfRecipes = Math.ceil(r.people / r.portions);
    for (const ingredient of r.ingredients) {
      if (!ingredient.ingredientID) continue;
      const ingredientDetails = ingredients.value.find(
        (i) => i.id === ingredient.ingredientID
      );
      if (!ingredientDetails) continue;
      try {
        const recipeQuantity = getInPurchasedUnits(
          ingredientDetails,
          ingredient.amount
        ).value;
        const value = recipeQuantity * numberOfRecipes;
        const existing = map.get(ingredient.ingredientID);
        if (existing) existing.amount.value += value;
        else
          map.set(ingredient.ingredientID, {
            amount: {
              value,
              unit: ingredientDetails.asPurchased.unit,
            },
            quantity: 0,
            unit: "",
            price: 0,
            ingredientDetails: ingredientDetails,
          });
      } catch (e) {
        continue;
      }
    }
  }
  // Round up to nearest whole unit that can be purchased
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
const totalPrice = computed(() =>
  Array.from(groceryList.value.values()).reduce((a, v) => a + v.price, 0)
);
</script>
