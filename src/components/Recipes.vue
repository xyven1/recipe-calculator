<template>
  <v-container class="flex-column">
    <v-btn
      @click="
        () => {
          recipe = Recipe();
          editingRecipe = true;
        }
      "
      color="primary"
    >
      Add Recipe
    </v-btn>
    <v-data-table :items="recipes" :headers="headers">
      <template v-slot:item.pricePerPortion="{ item }">
        {{ recipeToPriceString(item) }}
      </template>
      <template v-slot:item.actions="{ item }">
        <div class="d-flex">
          <v-btn
            variant="text"
            @click="
              () => {
                recipe = item;
                editingRecipe = true;
              }
            "
          >
            Edit
          </v-btn>
          <v-btn variant="text" @click="removeRecipe(item)"> Delete </v-btn>
        </div>
      </template>
    </v-data-table>
    <v-overlay v-model="editingRecipe" class="justify-center align-center">
      <v-card class="ma-4" color="background">
        <v-card-text class="d-flex flex-column">
          <v-text-field
            density="default"
            hide-details="auto"
            v-model="recipe.name"
            label="Recipe Name"
          />
          <v-text-field
            hide-details="auto"
            density="default"
            type="number"
            v-model="recipe.portions"
            label="Portions"
          />
          <div class="d-flex overflow-auto flex-wrap">
            <v-card
              v-for="ingredient in recipe.ingredients"
              class="ma-2"
              elevation="3"
            >
              <v-card-text>
                <v-autocomplete
                  density="compact"
                  hide-details="auto"
                  auto-select-first
                  label="Ingredient"
                  v-model="ingredient.ingredientID"
                  item-title="name"
                  item-value="id"
                  :items="ingredients"
                />
                <v-text-field
                  density="compact"
                  hide-details="auto"
                  type="number"
                  v-model="ingredient.amount.value"
                  label="Quantity"
                />
                <v-autocomplete
                  auto-select-first
                  density="compact"
                  hide-details="auto"
                  v-model="ingredient.amount.unit"
                  label="Unit"
                  :items="UNITS"
                />
              </v-card-text>
              <v-card-actions>
                <v-btn
                  @click="
                    recipe.ingredients.splice(
                      recipe.ingredients.indexOf(ingredient),
                      1
                    )
                  "
                  variant="text"
                  color="error"
                  >Delete</v-btn
                >
              </v-card-actions>
            </v-card>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            :icon="mdiPlus"
            @click="recipe.ingredients.push(RecipeIngredient())"
          />
          <v-btn @click="editingRecipe = false" color="warning" variant="tonal"
            >Cancel</v-btn
          >
          <v-btn @click="updateRecipe(recipe)" color="success" variant="tonal"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-overlay>
  </v-container>
</template>

<script lang="ts" setup>
import {
  Ingredient,
  Recipe,
  RecipeIngredient,
  UNITS,
  getInPurchasedUnits,
} from "@/types/recipe";
import { mdiPlus } from "@mdi/js";
import { ref as dbRef, push, remove, set } from "firebase/database";
import { Ref, ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
const db = useDatabase();
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

function recipeToPriceString(recipe: Recipe) {
  try {
    let price = 0;
    for (const [index, i] of recipe.ingredients.entries()) {
      const ingredientDetails = ingredients.value.find(
        (v) => v.id === i.ingredientID
      );
      if (!ingredientDetails)
        throw new Error(`${index + 1}th ingredient not found`);
      const amount = getInPurchasedUnits(ingredientDetails, i.amount);
      const pricePerUnit =
        ingredientDetails.price / ingredientDetails.asPurchased.value;
      price += pricePerUnit * amount.value;
    }
    return "$" + (price / recipe.portions).toFixed(2);
  } catch (e) {
    console.log(e);
    return e;
  }
}

const recipe: Ref<Recipe> = ref({
  name: "",
  ingredients: [],
  portions: 0,
  instructions: "",
  link: "",
});
const headers = [
  { title: "Name", key: "name" },
  { title: "Portions", key: "portions" },
  { title: "Price per Portion", key: "pricePerPortion" },
  { title: "Actions", key: "actions", sortable: false },
];

const editingRecipe = ref(false);

function removeRecipe(
  recipe: Recipe & {
    readonly id: string;
  }
) {
  remove(dbRef(db, "recipes/" + recipe.id));
}

function updateRecipe(
  recipe:
    | (Recipe & {
        readonly id: string;
      })
    | Recipe
) {
  if (!("id" in recipe)) {
    push(dbRef(db, "recipes"), recipe);
  } else {
    set(dbRef(db, "recipes/" + recipe.id), recipe);
  }
  editingRecipe.value = false;
}
</script>
