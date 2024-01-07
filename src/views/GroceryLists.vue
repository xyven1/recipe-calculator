<template>
  <div class="d-flex h-100 flex-column pa-4 ga-4">
    <v-card>
      <v-card-title> Grocery Lists </v-card-title>
      <v-list>
        <v-list-item v-if="groceryLists.length === 0">
          <v-list-item-title>No grocery lists</v-list-item-title>
        </v-list-item>
        <v-list-item
          v-for="list in groceryLists"
          color="primary"
          :key="list.id"
          :active="list.id === selectedList?.id"
          @click="selectedListID = list.id"
        >
          <template #prepend>
            <v-icon :icon="list.purchaseDate ? mdiCartCheck : mdiCartOutline" />
          </template>
          <v-list-item-title>
            {{ list.name }}
          </v-list-item-title>
          <v-list-item-subtitle>
            {{ list.description }}
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Calculated Price: ${{
              list.items?.reduce((a, v) => a + v.purchasePrice, 0).toFixed(2)
            }}
          </v-list-item-subtitle>
          <v-list-item-subtitle>
            Created: {{ new Date(list.created).toLocaleDateString() }}
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="list.purchaseDate">
            Purchased:
            {{
              list.purchaseDate
                ? new Date(list.purchaseDate).toLocaleDateString()
                : "Not Purchased"
            }}
          </v-list-item-subtitle>
          <v-list-item-subtitle v-if="list.purchaseDate">
            Actual Price: ${{ list.actualPrice.toFixed(2) }}
          </v-list-item-subtitle>
          <template #append>
            <v-btn
              variant="text"
              color="error"
              :icon="mdiTrashCan"
              density="comfortable"
              @click.stop="deleteGroceryList(list.id)"
            />
          </template>
        </v-list-item>
      </v-list>
      <v-card-actions class="justify-end">
        <v-btn color="success" variant="tonal" @click="addingNewList = true">
          New List
        </v-btn>
      </v-card-actions>
    </v-card>
    <v-card>
      <v-card-actions class="flex-column" v-if="selectedList">
        <div class="d-flex flex-wrap align-center justify-center mb-2">
          <v-text-field
            v-if="!selectedList.purchaseDate"
            type="number"
            label="Actual Price"
            hide-details="auto"
            density="compact"
            @update:model-value="
              (e) => selectedList && (selectedList.actualPrice = Number(e))
            "
            :model-value="selectedList.actualPrice"
          />
          <v-btn
            variant="text"
            @click="
              () => {
                if (!selectedList) return;
                if (selectedList.purchaseDate)
                  remove(
                    dbRef(db, `grocery_lists/${selectedList.id}/purchaseDate`),
                  );
                else {
                  selectedList.purchaseDate = new Date().toISOString();
                  update(
                    dbRef(db, `grocery_lists/${selectedList.id}`),
                    selectedList,
                  );
                }
              }
            "
          >
            {{
              selectedList.purchaseDate
                ? "Mark as Unpurchased"
                : "Mark as Purchased"
            }}
          </v-btn>
        </div>
        <v-divider class="w-100" />
        <v-chip-group filter color="primary" multiple v-model="storeFilters">
          <v-chip
            v-for="store in selectedList?.items
              ?.reduce((a, v) => {
                const ingredient = ingredients.find(
                  (i) => i.id === v.ingredient,
                );
                if (!ingredient) return a;
                if (ingredient.store) a.add(ingredient.store);
                return a;
              }, new Set<string>())
              .values()"
            :key="store"
            :value="store"
            >{{ store }}</v-chip
          >
        </v-chip-group>
      </v-card-actions>
      <v-card-text>
        <grocery-list
          :items="selectedListFiltered ?? []"
          :showStatus="true"
          @cycle-status="cycleStatus"
        />
      </v-card-text>
    </v-card>
    <v-dialog
      v-model="addingNewList"
      scrollable
      persistent
      @keypress.esc="addingNewList = false"
    >
      <v-card color="background">
        <v-card-title> Create New List </v-card-title>
        <v-card-text class="d-flex flex-column ga-2">
          <v-range-slider
            color="primary"
            v-model="range"
            show-ticks="always"
            hide-details
            :step="1"
            :min="0"
            :max="uniqueDates.length - 1"
            tick-size="4"
          >
          </v-range-slider>
          <span class="text-center">
            {{ uniqueDates[range[0]]?.toLocaleDateString() }} -
            {{ uniqueDates[range[1]]?.toLocaleDateString() }}
          </span>
          <v-text-field label="Name" v-model="name" hide-details />
          <v-switch
            label="Subtract Current Inventory"
            v-model="subtractInventory"
            color="primary"
            hide-details
          />
          <span class="text-subtitle-1">
            ${{ totalPrice.toFixed(2) }}
            <i> (${{ (totalPrice * 1.07).toFixed(2) }} with tax) </i>
          </span>
          <v-divider />
          <div class="overflow-y-auto">
            <grocery-list
              :items="[...groceryList.values()]"
              :showStatus="false"
            />
          </div>
        </v-card-text>
        <v-card-actions class="justify-end">
          <v-btn @click="addingNewList = false" color="warning" variant="tonal">
            Cancel
          </v-btn>
          <v-btn color="success" variant="tonal" @click="saveGroceryList(name)"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-dialog>
    <confirm ref="confirmation" />
  </div>
</template>

<script lang="ts" setup>
import Confirm from "@/components/Confirm.vue";
import GroceryList from "@/components/GroceryList.vue";
import { useAppStore } from "@/store/app";
import {
GroceryListItem,
GroceryListStatus,
GroceryList as GroceryListType,
Ingredient,
InventoryItem,
Recipe,
ScheduleItem,
getInPurchasedUnits,
} from "@/types/recipe";
import { deleteWithTrash } from "@/utils/firebase";
import { mdiCartCheck, mdiCartOutline, mdiTrashCan } from "@mdi/js";
import { ref as dbRef, push, remove, update } from "firebase/database";
import { storeToRefs } from "pinia";
import { computed, ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
const { range } = storeToRefs(useAppStore());

const confirmation = ref<InstanceType<typeof Confirm> | null>(null);
const addingNewList = ref(false);
const storeFilters = ref<string[]>([]);

const db = useDatabase();
const groceryLists = useDatabaseList<GroceryListType>(
  dbRef(db, "grocery_lists"),
);
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));
const schedule = useDatabaseList<ScheduleItem>(dbRef(db, "schedule"));
const inventory = useDatabaseList<InventoryItem>(dbRef(db, "inventory"));

const name = ref("");
const selectedListID = ref("");
const selectedList = computed(() =>
  groceryLists.value.find((l) => l.id === selectedListID.value),
);
const subtractInventory = ref(false);

const selectedListFiltered = computed(() => {
  if (!selectedList.value) return [];
  return selectedList.value.items?.filter((i) => {
    const ingredient = ingredients.value.find((ing) => ing.id === i.ingredient);
    if (!ingredient) return false;
    if (storeFilters.value.length === 0) return true;
    return storeFilters.value.includes(ingredient.store ?? "");
  });
});

// only unique dates
const uniqueDates = computed(() => {
  const present = new Set<string>();
  return schedule.value
    .map((s) => new Date(s.date))
    .toSorted((a, b) => a.getTime() - b.getTime())
    .filter((d) => {
      const dateStr = d.toDateString();
      if (present.has(dateStr)) return false;
      present.add(dateStr);
      return true;
    });
});
const selectedRecipes = computed(() => {
  return schedule.value
    .filter(
      (s) =>
        new Date(s.date).getTime() >=
          uniqueDates.value[range.value[0]].getTime() &&
        new Date(s.date).getTime() <=
          uniqueDates.value[range.value[1]].getTime(),
    )
    .reduce(
      (a, s) => {
        const recipe = recipes.value.find((r) => r.id === s.recipeID);
        if (!recipe) return a;
        a.push({
          ...recipe,
          date: s.date,
          people: s.people,
        });
        return a;
      },
      [] as (Recipe & { date: string; people: number })[],
    );
});

function cycleStatus(ingredientId: string, newStatus: GroceryListStatus) {
  if (!selectedListID.value) return;
  const index = selectedList.value?.items?.findIndex(
    (i) => i.ingredient === ingredientId,
  );
  if (index === undefined || index === -1) return;
  update(dbRef(db, `grocery_lists/${selectedListID.value}/items/${index}`), {
    status: newStatus,
  });
}

function createGroceryList(name: string) {
  const item = GroceryListType();
  item.name = name;
  item.description = `${uniqueDates.value[
    range.value[0]
  ].toLocaleDateString()} - ${uniqueDates.value[
    range.value[1]
  ].toLocaleDateString()}`;
  item.items = Array.from(groceryList.value.values());
  push(dbRef(db, "grocery_lists"), item);
}
async function deleteGroceryList(id: string) {
  if (
    !(await confirmation.value?.open({
      titleColor: "",
      title: "Delete Grocery List",
      width: 400,
      message: "Are you sure you want to delete this grocery list?",
    }))
  )
    return;
  await deleteWithTrash(db, "grocery_lists", id);
}

function saveGroceryList(name: string) {
  createGroceryList(name);
  addingNewList.value = false;
}

const groceryList = computed(() => {
  const map = new Map<
    string,
    GroceryListItem & {
      ingredientDetails: Ingredient;
    }
  >();
  for (const r of selectedRecipes.value) {
    const numberOfRecipes = Math.ceil(r.people / r.portions);
    for (const ingredient of r.ingredients ?? []) {
      if (!ingredient.ingredientID) continue;
      const ingredientDetails = ingredients.value.find(
        (i) => i.id === ingredient.ingredientID,
      );
      if (!ingredientDetails) continue;
      try {
        const recipeQuantity = getInPurchasedUnits(
          ingredientDetails,
          ingredient.amount,
        ).value;
        const value = recipeQuantity * numberOfRecipes;
        const existing = map.get(ingredient.ingredientID);
        if (existing) existing.ingredientAmount.value += value;
        else
          map.set(ingredient.ingredientID, {
            ingredientAmount: {
              value,
              unit: ingredientDetails.asPurchased.unit,
            },
            purchaseQuantity: 0,
            purchaseUnit: "",
            purchasePrice: 0,
            ingredientDetails,
            ingredient: ingredient.ingredientID,
            status: GroceryListStatus.ToDo,
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
    obj.purchaseQuantity = Math.ceil(
      obj.ingredientAmount.value / ingredientDetails.asPurchased.value,
    );
    if (subtractInventory.value) {
      const inventoryItem = inventory.value.find((i) => i.ingredient === id);
      if (inventoryItem) {
        obj.purchaseQuantity -= inventoryItem.amount.value;
        if (obj.purchaseQuantity < 0) obj.purchaseQuantity = 0;
      }
    }
    obj.purchaseUnit = `${ingredientDetails.asPurchased.value} ${ingredientDetails.asPurchased.unit}`;
    obj.purchasePrice = ingredientDetails.price * obj.purchaseQuantity;
  }
  return map;
});
const totalPrice = computed(() =>
  Array.from(groceryList.value.values()).reduce(
    (a, v) => a + v.purchasePrice,
    0,
  ),
);
</script>
