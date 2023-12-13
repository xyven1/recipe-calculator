<template>
  <v-container class="fill-height flex-column ga-4" fluid>
    <v-row class="w-100 justify-center">
      <v-col style="min-width: min(100%, 200px)">
        <v-text-field
          v-model="search"
          label="Search"
          :prepend-inner-icon="mdiMagnify"
          single-line
          variant="outlined"
          color="primary"
          hide-details
          class="align-self-stretch"
          clearable
        />
      </v-col>
      <v-col cols="auto" class="d-flex align-center">
        <v-btn @click="addNew(search)" color="primary"> Add Ingredient </v-btn>
      </v-col>
    </v-row>
    <span class="text-center">
      Please search for an ingredient before adding!
    </span>
    <v-data-table
      :items="ingredients"
      v-model:items-per-page="itemsPerPage"
      :headers="headers"
      :search="search"
      :page="page"
      no-data-text="No Ingredients Found"
    >
      <template #item.actions="{ item }">
        <div class="d-flex">
          <v-btn
            variant="text"
            @click="edit(item)"
            color="primary"
            :icon="mdiPencil"
          >
          </v-btn>
          <v-btn
            variant="text"
            @click="removeIngredient(item)"
            :icon="mdiTrashCan"
            color="error"
          >
          </v-btn>
        </div>
      </template>
    </v-data-table>
    <v-dialog
      v-model="editingIngredient"
      persistent
      scrollable
      contained
      @keydown.esc="cancelEdit"
    >
      <v-form @submit.prevent="saveCurrentIngredient">
        <v-card color="background">
          <v-card-title>
            {{ "id" in currentIngredient ? "Edit" : "Add" }} Ingredient
          </v-card-title>
          <v-card-text class="d-flex flex-column ga-2">
            <v-text-field
              autofocus
              density="compact"
              hide-details="auto"
              v-model="currentIngredient.name"
              label="Ingredient Name"
              :rules="[(v) => !!v || 'Name is required']"
            />
            <v-text-field
              type="number"
              density="compact"
              hide-details="auto"
              v-model="currentIngredient.price"
              label="Price"
              :rules="[
                (v) => !!v || 'Price is required',
                (v) => v >= 0 || 'Price must be non-negative',
              ]"
            />
            <v-text-field
              type="number"
              density="compact"
              hide-details="auto"
              v-model="currentIngredient.asPurchased.value"
              label="Quantity"
              :rules="[
                (v) => !!v || 'Quantity is required',
                (v) => v > 0 || 'Quantity must be greater than 0',
              ]"
            />
            <v-autocomplete
              auto-select-first
              label="Unit"
              density="compact"
              hide-details="auto"
              v-model="currentIngredient.asPurchased.unit"
              :items="UNITS"
              :rules="[(v) => !!v || 'Unit is required']"
            />
            <v-text-field
              density="compact"
              hide-details="auto"
              v-model="currentIngredient.store"
              label="Store"
              :rules="[(v) => !!v || 'Store is required']"
            />
            <div class="d-flex flex-wrap justify-center overflow-y-auto ga-4">
              <v-card
                v-for="(conversion, i) in currentIngredient.conversions || []"
                :key="i"
                class="d-flex flex-wrap justify-center"
                density="compact"
              >
                <v-card-item>
                  From
                  <v-text-field
                    v-model="conversion.from.value"
                    density="compact"
                    hide-details="auto"
                    label="Quantity"
                    type="number"
                    :rules="[
                      (v) => !!v || 'Quantity is required',
                      (v) => v > 0 || 'Quantity must be greater than 0',
                    ]"
                  />
                  <v-autocomplete
                    auto-select-first
                    label="Unit"
                    v-model="conversion.from.unit"
                    density="compact"
                    hide-details="auto"
                    :items="UNITS"
                    :rules="[(v) => !!v || 'Unit is required']"
                  />
                  To
                  <v-text-field
                    v-model="conversion.to.value"
                    density="compact"
                    hide-details="auto"
                    label="Quantity"
                    type="number"
                    :rules="[
                      (v) => !!v || 'Quantity is required',
                      (v) => v > 0 || 'Quantity must be greater than 0',
                    ]"
                  />
                  <v-autocomplete
                    auto-select-first
                    label="Unit"
                    v-model="conversion.to.unit"
                    density="compact"
                    hide-details="auto"
                    :items="UNITS"
                    :rules="[
                      (v) => !!v || 'Unit is required',
                      (v) =>
                        !unit(v).equalBase(unit(conversion.from.unit)) ||
                        'Units are already compatible',
                      (v) =>
                        unit(v).equalBase(
                          unit(currentIngredient.asPurchased.unit)
                        ) ||
                        'Units should have the same base unit as the ingredient unit',
                    ]"
                  />
                </v-card-item>
                <v-card-actions>
                  <v-btn
                    @click="deleteConversion(i)"
                    variant="text"
                    color="error"
                    :icon="mdiTrashCan"
                  />
                </v-card-actions>
              </v-card>
            </div>
          </v-card-text>
          <v-card-actions>
            <v-btn @click="addNewConversion" color="primary">
              Add Conversion
            </v-btn>
            <v-spacer />
            <v-btn @click="cancelEdit" variant="tonal" color="warning">
              Cancel
            </v-btn>
            <v-btn type="submit" variant="tonal" color="success">Save</v-btn>
          </v-card-actions>
        </v-card>
      </v-form>
    </v-dialog>
  </v-container>
</template>

<script lang="ts" setup>
import { Conversion, DatabaseData, Ingredient, UNITS } from "@/types/recipe";
import { mdiMagnify, mdiPencil, mdiTrashCan } from "@mdi/js";
import { ref as dbRef, push, remove, set } from "firebase/database";
import { unit } from "mathjs";
import { Ref, ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
import { SubmitEventPromise } from "vuetify/lib/framework.mjs";
const db = useDatabase();
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

defineExpose({
  addNew,
});

const headers = [
  { title: "Name", key: "name" },
  { title: "Price", key: "price" },
  { title: "Unit", key: "asPurchased.unit" },
  { title: "Quantity", key: "asPurchased.value" },
  { title: "Store", key: "store" },
  { title: "Link", key: "link" },
  { title: "Conversions", key: "conversions.length" },
  { title: "Actions", key: "actions", sortable: false },
];

const search = ref("");
const page = ref(0);
const itemsPerPage = ref(10);

// Ingredient Dialog
const currentIngredient: Ref<DatabaseData<Ingredient> | Ingredient> = ref(
  Ingredient()
);
const editingIngredient = ref(false);
function addNew(name: string = "") {
  currentIngredient.value = Ingredient();
  currentIngredient.value.name = name;
  editingIngredient.value = true;
}
function addNewConversion() {
  if (!currentIngredient.value.conversions)
    currentIngredient.value.conversions = [];
  currentIngredient.value.conversions.push(Conversion());
}
function deleteConversion(index: number) {
  if (currentIngredient.value.conversions)
    currentIngredient.value.conversions.splice(index, 1);
}
function edit(ingredient: DatabaseData<Ingredient>) {
  currentIngredient.value = {
    ...JSON.parse(JSON.stringify(ingredient)),
    id: ingredient.id,
  };
  editingIngredient.value = true;
}
function cancelEdit() {
  editingIngredient.value = false;
}
async function saveCurrentIngredient(event: SubmitEventPromise) {
  const results = await event;
  if (!results.valid) return;
  const id = await updateIngredient(currentIngredient.value);
  if (itemsPerPage.value > 0)
    page.value =
      Math.floor(
        ingredients.value.findIndex((v) => v.id === id) / itemsPerPage.value
      ) + 1;
  editingIngredient.value = false;
}

async function removeIngredient(ingredient: DatabaseData<Ingredient>) {
  await remove(dbRef(db, "ingredients/" + ingredient.id));
}
async function updateIngredient(
  ingredient: DatabaseData<Ingredient> | Ingredient
): Promise<string> {
  if ("id" in ingredient) {
    await set(dbRef(db, "ingredients/" + ingredient.id), ingredient);
    return ingredient.id;
  } else return (await push(dbRef(db, "ingredients"), ingredient)).key!;
}
</script>

<style>
.testing > .v-overlay__content {
  display: flex;
}
.testing > .v-overlay__content > .v-card {
  display: flex;
  flex: 1 1 100%;
  flex-direction: column;
}
</style>
