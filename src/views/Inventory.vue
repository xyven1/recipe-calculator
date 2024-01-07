<template>
  <div class="d-flex h-100 flex-column pa-4 ga-4">
    <v-card max-width="1000" class="align-self-center">
      <v-card-actions>
        <v-btn @click="resetInventory">Reset</v-btn>
      </v-card-actions>
      <v-list density="compact">
        <v-list-item
          v-for="item in ingredients
            .toSorted((a, b) => {
              if (a.name < b.name) return -1;
              if (a.name > b.name) return 1;
              return 0;
            })
            .map((ingredient) => ({
              ingredient,
              inventoryItem: inventory.find(
                (i) => i.ingredient === ingredient.id,
              ),
            }))"
          :key="item.ingredient.id"
        >
          <div class="inventory-item">
            <span>
              {{ item.ingredient.name }} ({{
                item.ingredient.asPurchased.unit
              }})
            </span>
            <v-text-field
              density="compact"
              hide-details="auto"
              :model-value="item.inventoryItem?.amount.value"
              @update:model-value="
                (e) => {
                  updateItem(item.inventoryItem?.id, item.ingredient.id, {
                    value: Number(e),
                  });
                }
              "
              type="number"
              label="Quantity"
            />
            <!-- <v-autocomplete
              auto-select-first
              density="compact"
              hide-details="auto"
              :model-value="item.inventoryItem?.amount.unit"
              @update:model-value="
                (e) => {
                  updateItem(item.inventoryItem?.id, item.ingredient.id, {
                    unit: e ?? undefined,
                  });
                }
              "
              label="Unit"
              :items="UNITS"
            /> -->
          </div>
        </v-list-item>
      </v-list>
    </v-card>
  </div>
</template>
<script setup lang="ts">
import { Amount, Ingredient, InventoryItem } from "@/types/recipe";
import { ref as dbRef, push, remove, update } from "firebase/database";
import { useDatabase, useDatabaseList } from "vuefire";

const db = useDatabase();
const inventory = useDatabaseList<InventoryItem>(dbRef(db, "inventory"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

async function updateItem(
  inventoryId: string | undefined,
  ingredientId: string,
  item: Partial<Amount>,
) {
  console.log(inventoryId, ingredientId, item);
  if (!inventoryId) {
    const newItem = InventoryItem(ingredientId);
    newItem.amount.unit =
      ingredients.value.find((i) => i.id === ingredientId)?.asPurchased.unit ??
      "";
    inventoryId = (await push(dbRef(db, "inventory"), newItem)).key ?? "";
  }
  if (!inventoryId) return;
  await update(dbRef(db, `inventory/${inventoryId}/amount`), item);
}
async function resetInventory() {
  await remove(dbRef(db, "inventory"));
}
</script>

<style></style>
