<template>
  <v-container class="fill-height flex-column align-start ga-4" fluid>
    <v-btn @click="addNew" color="primary"> Add Recipe </v-btn>
    <v-data-table :items="recipes" :headers="headers">
      <template v-slot:item.pricePerPortion="{ item }">
        {{ recipeToPriceString(item) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="d-flex">
          <v-btn
            variant="text"
            @click="editRecipe(item)"
            color="primary"
            :icon="mdiPencil"
          />
          <v-btn
            variant="text"
            @click="removeRecipe(item)"
            :icon="mdiTrashCan"
            color="error"
          />
        </div>
      </template>
    </v-data-table>
    <v-dialog
      v-model="editingRecipe"
      persistent
      scrollable
      contained
      @keydown.esc="cancelEdit"
    >
      <v-form @submit.prevent="saveCurrentRecipe">
        <v-card color="background">
          <v-card-text class="d-flex flex-column ga-2">
            <v-text-field
              density="compact"
              hide-details="auto"
              v-model="currentRecipe.name"
              label="Recipe Name"
              autofocus
              :rules="[(v) => !!v || 'Name is required']"
            />
            <v-text-field
              hide-details="auto"
              density="compact"
              type="number"
              v-model="currentRecipe.portions"
              label="Portions"
              :rules="[
                (v) => !!v || 'Portions is required',
                (v) => v > 0 || 'Portions must be greater than 0',
              ]"
            />
            <v-text-field
              density="compact"
              hide-details="auto"
              v-model="currentRecipe.link"
              label="Link"
            />
            {{ recipeToPriceString(currentRecipe) }}
            <div class="d-flex overflow-y-auto flex-wrap">
              <v-card
                v-for="(ingredient, i) in currentRecipe.ingredients"
                :key="i"
                class="ma-2 d-flex flex-wrap"
                elevation="3"
              >
                <v-card-text class="d-flex flex-column ga-2">
                  {{
                    ingredientPrices.ok
                      ? `$${ingredientPrices.value
                          .get(ingredient.ingredientID)
                          ?.toFixed(2)}`
                      : ingredientPrices.error
                  }}
                  <v-autocomplete
                    density="compact"
                    autofocus
                    hide-details="auto"
                    auto-select-first
                    label="Ingredient"
                    v-model="ingredient.ingredientID"
                    item-title="name"
                    item-value="id"
                    :items="ingredients"
                    :rules="[(v) => !!v || 'Ingredient is required']"
                  >
                    <template #no-data>
                      <v-list-item>
                        <v-btn
                          variant="text"
                          color="primary"
                          @click="$emit('addIngredient', '')"
                        >
                          Add Ingredient
                        </v-btn>
                      </v-list-item>
                    </template>
                  </v-autocomplete>
                  <v-text-field
                    density="compact"
                    hide-details="auto"
                    type="number"
                    v-model="ingredient.amount.value"
                    label="Quantity"
                    :rules="[
                      (v) => !!v || 'Quantity is required',
                      (v) => v > 0 || 'Quantity must be greater than 0',
                    ]"
                  />
                  <v-autocomplete
                    auto-select-first
                    density="compact"
                    hide-details="auto"
                    v-model="ingredient.amount.unit"
                    label="Unit"
                    :items="UNITS"
                    :rules="[(v) => !!v || 'Unit is required']"
                  />
                </v-card-text>
                <v-card-actions>
                  <v-btn
                    @click="deleteIngredient(i)"
                    variant="text"
                    color="error"
                    :icon="mdiTrashCan"
                  />
                </v-card-actions>
              </v-card>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn color="primary" @click="addIngredient">Add Ingredient</v-btn>
            <v-spacer />
            <v-btn @click="cancelEdit" color="warning" variant="tonal">
              Cancel
            </v-btn>
            <v-btn type="submit" color="success" variant="tonal"> Save </v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import {
  DatabaseData,
  Ingredient,
  Recipe,
  RecipeIngredient,
  UNITS,
  getInPurchasedUnits,
} from "@/types/recipe";
import { mdiPencil, mdiTrashCan } from "@mdi/js";
import { ref as dbRef, push, remove, set } from "firebase/database";
import { Ref, computed, ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
import { SubmitEventPromise } from "vuetify/lib/framework.mjs";
const db = useDatabase();
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

const emit = defineEmits<{
  (e: "addIngredient", name: string): void;
}>();

const nth = (d: number) => {
  if (d > 3 && d < 21) return "th";
  switch (d % 10) {
    case 1:
      return "st";
    case 2:
      return "nd";
    case 3:
      return "rd";
    default:
      return "th";
  }
};

function recipePrice(recipe: Recipe):
  | {
      ok: true;
      value: Map<string, number>;
    }
  | {
      ok: false;
      error: string;
    } {
  if (!recipe.ingredients || recipe.ingredients.length === 0)
    return {
      ok: false,
      error: "No Ingredients",
    };
  if (recipe.portions === 0)
    return {
      ok: false,
      error: "No Portions",
    };
  try {
    const prices = new Map<string, number>();
    for (const [index, i] of recipe.ingredients.entries()) {
      const ingredientDetails = ingredients.value.find(
        (v) => v.id === i.ingredientID
      );
      if (!ingredientDetails)
        throw new Error(`${index + 1 + nth(index + 1)} ingredient not found`);
      const amount = getInPurchasedUnits(ingredientDetails, i.amount);
      const pricePerUnit =
        ingredientDetails.price / ingredientDetails.asPurchased.value;
      prices.set(
        ingredientDetails.id,
        (pricePerUnit * amount.value) / recipe.portions
      );
    }
    return {
      ok: true,
      value: prices,
    };
  } catch (e) {
    return {
      ok: false,
      error: e as string,
    };
  }
}
function recipeToPriceString(recipe: Recipe) {
  const recipePrices = recipePrice(recipe);
  if (recipePrices.ok) {
    const price = Array.from(recipePrices.value.values()).reduce(
      (a, b) => a + b,
      0
    );
    return `$${price.toFixed(2)}`;
  } else return recipePrices.error;
}
const headers = [
  { title: "Name", key: "name" },
  { title: "Portions", key: "portions" },
  { title: "Price per Portion", key: "pricePerPortion" },
  { title: "Actions", key: "actions", sortable: false },
];

// Recipe Dialog
const editingRecipe = ref(false);
const currentRecipe: Ref<Recipe | DatabaseData<Recipe>> = ref(Recipe());
function addNew() {
  currentRecipe.value = Recipe();
  editingRecipe.value = true;
}
function addIngredient() {
  if (!currentRecipe.value.ingredients) currentRecipe.value.ingredients = [];
  currentRecipe.value.ingredients.push(RecipeIngredient());
}
function deleteIngredient(index: number) {
  currentRecipe.value.ingredients.splice(index, 1);
}
function editRecipe(recipe: DatabaseData<Recipe>) {
  currentRecipe.value = {
    ...JSON.parse(JSON.stringify(recipe)),
    id: recipe.id,
  };
  editingRecipe.value = true;
}
function cancelEdit() {
  editingRecipe.value = false;
}
async function saveCurrentRecipe(event: SubmitEventPromise) {
  const results = await event;
  if (!results.valid) return;
  await updateRecipe(currentRecipe.value);
  editingRecipe.value = false;
}
const ingredientPrices = computed(() => recipePrice(currentRecipe.value));

async function removeRecipe(recipe: DatabaseData<Recipe>) {
  await remove(dbRef(db, "recipes/" + recipe.id));
}
async function updateRecipe(recipe: DatabaseData<Recipe> | Recipe) {
  if ("id" in recipe) await set(dbRef(db, "recipes/" + recipe.id), recipe);
  else await push(dbRef(db, "recipes"), recipe);
}
</script>
