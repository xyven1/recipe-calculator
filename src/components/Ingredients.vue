<template>
  <v-container>
    <v-btn
      @click="
        () => {
          ingredient = Ingredient();
          editingIngredient = true;
        }
      "
      color="primary"
    >
      Add Ingredient
    </v-btn>
    <v-data-table :items="ingredients" :headers="headers">
      <template v-slot:item.actions="{ item }">
        <div class="d-flex">
          <v-btn
            variant="text"
            @click="
              () => {
                ingredient = item;
                editingIngredient = true;
              }
            "
          >
            Edit
          </v-btn>
          <v-btn variant="text" @click="removeIngredient(item)"> Delete </v-btn>
        </div>
      </template>
    </v-data-table>
    <v-overlay v-model="editingIngredient" class="justify-center align-center">
      <v-card color="background">
        <v-card-text>
          <v-text-field
            type="number"
            density="compact"
            hide-details="auto"
            v-model="ingredient.name"
            label="Ingredient Name"
            ref="ingredientName"
          />
          <v-text-field
            type="number"
            density="compact"
            hide-details="auto"
            v-model="ingredient.price"
            label="Price"
          />
          <v-text-field
            type="number"
            density="compact"
            hide-details="auto"
            v-model="ingredient.asPurchased.value"
            label="Quantity"
          />
          <v-autocomplete
            auto-select-first
            label="Unit"
            density="compact"
            hide-details="auto"
            v-model="ingredient.asPurchased.unit"
            :items="UNITS"
          />
          <v-text-field
            type="number"
            density="compact"
            hide-details="auto"
            v-model="ingredient.store"
            label="Store"
          />
          <div class="d-flex flex-wrap">
            <v-card
              v-for="(conversion, i) in ingredient.conversions || []"
              class="ma-2"
            >
              <v-card-text>
                From:
                <v-text-field
                  v-model="conversion.from.value"
                  density="compact"
                  hide-details="auto"
                  label="Quantity"
                  type="number"
                />
                <v-autocomplete
                  auto-select-first
                  label="Unit"
                  v-model="conversion.from.unit"
                  density="compact"
                  hide-details="auto"
                  :items="UNITS"
                />
                To:
                <v-text-field
                  v-model="conversion.to.value"
                  density="compact"
                  hide-details="auto"
                  label="Quantity"
                  type="number"
                />
                <v-autocomplete
                  auto-select-first
                  label="Unit"
                  v-model="conversion.to.unit"
                  density="compact"
                  hide-details="auto"
                  :items="UNITS"
                />
              </v-card-text>
              <v-card-actions>
                <v-btn
                  @click="
                    () => {
                      if (ingredient.conversions)
                        ingredient.conversions.splice(i, 1);
                    }
                  "
                  variant="text"
                  color="error"
                >
                  Delete
                </v-btn>
              </v-card-actions>
            </v-card>
          </div>
        </v-card-text>
        <v-card-actions>
          <v-btn
            @click="
              () => {
                if (!ingredient.conversions) ingredient.conversions = [];
                ingredient.conversions.push(Conversion());
              }
            "
            color="primary"
            >Add Conversion</v-btn
          >
          <v-btn
            @click="updateIngredient(ingredient)"
            variant="tonal"
            color="success"
            >Save</v-btn
          >
        </v-card-actions>
      </v-card>
    </v-overlay>
  </v-container>
</template>

<script lang="ts" setup>
import { Conversion, Ingredient, UNITS } from "@/types/recipe";
import { ref as dbRef, push, remove, set } from "firebase/database";
import { Ref, ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
import { VTextField } from "vuetify/lib/components/index.mjs";
const db = useDatabase();
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

const ingredientName = ref<VTextField>();

const headers = [
  { title: "Name", key: "name" },
  { title: "Price", key: "price" },
  { title: "Unit", key: "asPurchased.unit" },
  { title: "Quantity", key: "asPurchased.value" },
  { title: "Store", key: "store" },
  { title: "Link", key: "link" },
  { title: "# Conversions", key: "conversions.length" },
  { title: "Actions", key: "actions", sortable: false },
];

const ingredient: Ref<Ingredient> = ref(Ingredient());

const editingIngredient = ref(false);

function removeIngredient(
  ingredient: Ingredient & {
    readonly id: string;
  }
) {
  remove(dbRef(db, "ingredients/" + ingredient.id));
}

function updateIngredient(
  ingredient:
    | (Ingredient & {
        readonly id: string;
      })
    | Ingredient
) {
  if (!("id" in ingredient)) {
    push(dbRef(db, "ingredients"), ingredient);
  } else {
    console.log("Saved");
    set(dbRef(db, "ingredients/" + ingredient.id), ingredient);
  }
  editingIngredient.value = false;
}
</script>
