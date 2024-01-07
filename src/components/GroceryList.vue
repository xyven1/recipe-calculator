<template>
  <v-list>
    <template
      v-for="(item, index) in normalized"
      :key="item.ingredientDetails?.id"
    >
      <v-divider v-show="index !== 0"></v-divider>
      <v-list-item
        @click="$emit('cycleStatus', item.ingredient, next(item.status))"
        style="touch-action: manipulation"
      >
        <v-list-item-title class="text-wrap" style="font-weight: 700">
          {{ item.ingredientDetails?.name }}
          <i> (${{ item.purchasePrice.toFixed(2) }}) </i>
        </v-list-item-title>
        {{ item.purchaseQuantity }} x {{ item.purchaseUnit }} ({{
          item.ingredientAmount.value.toFixed(2)
        }}
        {{ item.ingredientAmount.unit }})
        <v-list-item-subtitle class="text-wrap">
          {{ ingredients.find((i) => i.id === item.ingredient)?.store }}
        </v-list-item-subtitle>
        <template #append>
          <v-btn
            v-if="props.showStatus"
            :color="statusMap.get(item.status)"
            variant="tonal"
            :icon="
              {
                [GroceryListStatus.ToDo]: mdiClose,
                [GroceryListStatus.InProgress]: mdiMinus,
                [GroceryListStatus.Done]: mdiCheck,
              }[item.status] || 'mdi-close'
            "
          />
        </template>
      </v-list-item>
    </template>
  </v-list>
</template>

<script lang="ts" setup>
import {
GroceryListItem,
GroceryListStatus,
Ingredient,
IngredientID,
} from "@/types/recipe";
import { mdiCheck, mdiClose, mdiMinus } from "@mdi/js";
import { ref as dbRef } from "firebase/database";
import { computed } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";

const props = withDefaults(
  defineProps<{
    groceryListID?: string;
    items: GroceryListItem[];
    showStatus: boolean;
  }>(),
  {
    showStatus: true,
  },
);
defineEmits<{
  (
    e: "cycleStatus",
    ingredientId: IngredientID,
    newStatus: GroceryListStatus,
  ): void;
}>();

const db = useDatabase();
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

const normalized = computed(() =>
  props.items
    .map((i) => ({
      ...i,
      ingredientDetails: ingredients.value.find(
        (ing) => ing.id === i.ingredient,
      ),
    }))
    .toSorted((a, b) => {
      if (!a.ingredientDetails || !b.ingredientDetails) return 0;
      return a.ingredientDetails.name.localeCompare(b.ingredientDetails.name);
    }),
);

const statusMap = new Map<string, string>([
  [GroceryListStatus.ToDo, "red"],
  [GroceryListStatus.InProgress, "yellow"],
  [GroceryListStatus.Done, "green"],
]);
const statusOrder = [
  GroceryListStatus.ToDo,
  GroceryListStatus.InProgress,
  GroceryListStatus.Done,
];

function next(status: GroceryListStatus): GroceryListStatus {
  const index = statusOrder.indexOf(status);
  if (index === -1) return GroceryListStatus.ToDo;
  return statusOrder[(index + 1) % statusOrder.length];
}
</script>
