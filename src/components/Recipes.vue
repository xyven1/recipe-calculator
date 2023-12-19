<template>
  <v-container class="fill-height flex-column align-start ga-4" fluid>
    <v-btn @click="addNew" color="primary"> Add Recipe </v-btn>
    <v-data-table :items="recipesWithPrices" :headers="headers">
      <template #[`item.pricePerPortion`]="{ item }">
        {{ item.recipePrice }}
      </template>
      <template
        #[`item.ingredientIssues`]="{
          toggleExpand,
          isExpanded,
          internalItem,
          item,
        }"
      >
        <v-chip
          v-if="item.ingredientIssues.length !== 0"
          color="error"
          variant="tonal"
        >
          <b class="mr-4 flex-grow-1 pl-4">
            {{ item.ingredientIssues.length }}
          </b>
          <v-spacer />
          <v-btn variant="text" @click="() => toggleExpand(internalItem)" icon>
            <v-icon
              :icon="
                isExpanded(internalItem) ? mdiChevronDown : mdiChevronRight
              "
            />
          </v-btn>
        </v-chip>
      </template>
      <template #expanded-row="{ item, columns }">
        <tr>
          <td :colspan="columns.length">
            <div class="w-100 d-flex justify-center">
              <v-chip
                v-for="({ name, error }, i) of item.ingredientIssues"
                :key="i"
                class="ma-1"
              >
                {{ name }}: {{ error }}
              </v-chip>
            </div>
          </td>
        </tr>
      </template>
      <template #[`item.actions`]="{ item }">
        <div class="d-flex">
          <v-btn
            variant="text"
            @click="editRecipe(item.recipe)"
            color="primary"
            :icon="mdiPencil"
          />
          <v-btn
            variant="text"
            @click="removeRecipe(item.recipe)"
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
      @keypress.esc="cancelEdit"
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
            {{ recipeToPriceString(currentRecipePrices) }}
            <div class="d-flex overflow-y-auto flex-wrap">
              <v-card
                v-for="(ingredient, i) in currentRecipe.ingredients"
                :key="i"
                class="ma-2 d-flex flex-wrap"
                elevation="3"
              >
                <v-card-text class="d-flex flex-column ga-2">
                  {{
                    (() => {
                      const price = ingredientPrices.get(
                        ingredient.ingredientID
                      );
                      if (!price) return "$*.**";
                      if (!price.ok) return price.error;
                      return `$${price.value.toFixed(2)}`;
                    })()
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
    <confirm ref="confirmation" />
  </v-container>
</template>

<script lang="ts" setup>
import Confirm from "@/components/Confirm.vue";
import {
DatabaseData,
Ingredient,
Recipe,
RecipeIngredient,
UNITS,
getInPurchasedUnits,
} from "@/types/recipe";
import { Result, resultBoth, resultErr, resultOk } from "@/types/result";
import { deleteWithTrash } from "@/utils/firebase";
import {
mdiChevronDown,
mdiChevronRight,
mdiPencil,
mdiTrashCan,
} from "@mdi/js";
import { ref as dbRef, push, set } from "firebase/database";
import { Ref, computed, ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
import { SubmitEventPromise } from "vuetify/lib/framework.mjs";
const db = useDatabase();
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

const recipesWithPrices = computed(() =>
  recipes.value.map((r) => {
    const prices = recipePrice(r);
    return {
      recipe: r,
      prices,
      recipePrice: recipeToPriceString(prices),
      ingredientIssues: recipeToPriceErrors(prices),
    };
  })
);

defineEmits<{
  addIngredient: [name: string];
}>();

function recipePrice(recipe: Recipe): Map<string, Result<number, string>> {
  const map = new Map();
  if (!recipe.ingredients || recipe.ingredients.length === 0) map;
  for (const i of recipe.ingredients?.values()??[]) {
    try {
      const ingredientDetails = ingredients.value.find(
        (v) => v.id === i.ingredientID
      );
      if (!ingredientDetails) throw new Error(`Ingredient not found`);
      const amount = getInPurchasedUnits(ingredientDetails, i.amount);
      const pricePerUnit =
        ingredientDetails.price / ingredientDetails.asPurchased.value;
      map.set(
        ingredientDetails.id,
        resultOk((pricePerUnit * amount.value) / recipe.portions)
      );
    } catch (e: any) {
      map.set(i.ingredientID, resultErr(e.message));
    }
  }
  return map;
}
function recipeToPriceString(
  recipePrices: Map<string, Result<number, string>>
) {
  const recipePrice = Array.from(recipePrices.values()).reduce(
    (a, b) => resultBoth(a, b, (a, b) => a + b),
    resultOk(0)
  );
  if (recipePrice.ok) {
    return `$${recipePrice.value.toFixed(2)}`;
  } else return recipePrice.error;
}

function recipeToPriceErrors(
  recipePrices: Map<string, Result<number, string>>
) {
  return Array.from(recipePrices.entries()).reduce(
    (a, [n, i]) => {
      if (!i.ok)
        a.push({
          name: ingredients.value.find((v) => v.id === n)?.name || n,
          error: i.error,
        });
      return a;
    },
    [] as {
      name: string;
      error: string;
    }[]
  );
}
const headers = [
  { title: "Name", key: "recipe.name" },
  { title: "Portions", key: "recipe.portions" },
  { title: "Price per Portion", key: "pricePerPortion" },
  { title: "Ingredient Issues", key: "ingredientIssues", sortable: false },
  { title: "Actions", key: "actions", sortable: false },
];

// Recipe Dialog
const editingRecipe = ref(false);
const currentRecipe: Ref<Recipe | DatabaseData<Recipe>> = ref(Recipe());
const currentRecipePrices = computed(() => recipePrice(currentRecipe.value));
function addNew() {
  currentRecipe.value = Recipe();
  editingRecipe.value = true;
}
function addIngredient() {
  if (!currentRecipe.value.ingredients) currentRecipe.value.ingredients = [];
  currentRecipe.value.ingredients.push(RecipeIngredient());
}
function deleteIngredient(index: number) {
  currentRecipe.value.ingredients?.splice(index, 1);
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
const confirmation = ref<InstanceType<typeof Confirm> | null>(null);
async function removeRecipe(recipe: DatabaseData<Recipe>) {
  console.log(recipe.id);
  if (
    !(await confirmation.value?.open({
      titleColor: "",
      title: "Delete Recipe",
      width: 400,
      message: "Are you sure you want to delete this recipe?",
    }))
  )
    return;
  await deleteWithTrash(db, "recipes", recipe.id)
}
async function updateRecipe(recipe: DatabaseData<Recipe> | Recipe) {
  if ("id" in recipe) await set(dbRef(db, "recipes/" + recipe.id), recipe);
  else await push(dbRef(db, "recipes"), recipe);
}
</script>
