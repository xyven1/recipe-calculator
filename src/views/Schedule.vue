<template>
  <v-container>
    <v-row class="justify-center">
      <v-col cols="auto">
        <v-date-picker
          :min-width="200"
          v-model="date"
          color="primary"/>
      </v-col>
      <v-col>
        <v-row 
            v-for="scheduleItem in scheduleItems"
            :key="scheduleItem.id">
          <v-col>
            <v-card class="d-flex justify-end" :min-width="200">
              <v-card-text class="d-flex flex-column ga-2">
                <v-autocomplete
                  auto-select-first
                  :items="recipes"
                  item-title="name"
                  item-value="id"
                  hide-details="auto"
                  density="compact"
                  v-model="scheduleItem.recipeID"
                />
                <v-text-field
                  v-model="scheduleItem.people"
                  type="number"
                  label="people"
                  hide-details="auto"
                  density="compact"
                />
              </v-card-text>
              <v-card-actions class="">
                <v-btn
                  @click="removeScheduleItem(scheduleItem)"
                  color="error"
                  variant="text"
                  :icon="mdiTrashCan"
                  density="compact"
                />
              </v-card-actions>
            </v-card>
          </v-col>
        </v-row>
        <v-row >
          <v-col cols="auto">
            <v-btn
              @click="save"
              color="success"
              variant="tonal"
              text="Save"
            />
          </v-col>
          <v-spacer/> 
          <v-col cols="auto">
            <v-btn @click="addScheduleItem(newScheduleItem())" 
              color="primary" 
              variant="tonal" 
              text="Add Meal"/>
          </v-col>
        </v-row>
      </v-col>
    </v-row>
    <v-row>
      <v-col>
        <v-card>
          <v-card-title>
            <v-tabs v-model="currentRecipe">
              <v-tab v-for="scheduleItem in scheduleItems" :key="scheduleItem.id">
                {{ scheduleItem.recipe?.name }}
              </v-tab>
            </v-tabs>
            <v-window v-model="currentRecipe">
              <v-window-item v-for="scheduleItem in scheduleItems" :key="scheduleItem.id">
                <v-list lines="one">
                  <template v-if="scheduleItem.recipe?.link??'' !== ''">
                    <v-list-item
                      title="Link">
                      <v-list-item-subtitle>
                        <a :href="scheduleItem.recipe?.link" target="_blank">
                          {{ scheduleItem.recipe?.link }}
                        </a>
                      </v-list-item-subtitle>
                    </v-list-item>
                    <v-divider/>
                  </template>
                  <v-list-item 
                    v-for="ingredient in scheduleItem.recipe?.ingredients??[]" 
                    :key="ingredient.ingredientID"
                    :title="ingredients.find((v) => v.id === ingredient.ingredientID)?.name">
                    <v-list-item-subtitle>
                      {{ ingredient.amount.value }} {{ ingredient.amount.unit }}
                    </v-list-item-subtitle>
                  </v-list-item>
                </v-list>
              </v-window-item>
            </v-window>
          </v-card-title>
        </v-card>
      </v-col>
    </v-row>
    <confirm ref="confirmation"/>
    <v-snackbar v-model="snackbar" :timeout="snackbarTimeout" location="top" :color="snackbarColor" variant="tonal" :min-width="0">
      {{ snackbarText }}
      <template #actions>
        <v-btn variant="text" :icon="mdiClose" @click="snackbar = false" density="compact"/>
      </template>
    </v-snackbar>
  </v-container>
</template>

<script lang="ts" setup>
import Confirm from "@/components/Confirm.vue";
import { DatabaseData, Ingredient, Recipe, ScheduleItem } from "@/types/recipe";
import { deleteWithTrash } from "@/utils/firebase";
import { mdiClose, mdiTrashCan } from "@mdi/js";
import { ref as dbRef, push, set } from "firebase/database";
import { computed, ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
const db = useDatabase();
const schedule = useDatabaseList<ScheduleItem>(dbRef(db, "schedule"));
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));
const ingredients = useDatabaseList<Ingredient>(dbRef(db, "ingredients"));

const currentRecipe = ref<Recipe | null>(null);

const date = ref(new Date());

const snackbar = ref(false);
const snackbarColor = ref("");
const snackbarTimeout = ref(3000);
const snackbarText = ref("");

const scheduleItems = computed(() =>
  schedule.value?.filter(
    (v) => new Date(v.date).toLocaleDateString() === date.value.toLocaleDateString()
  ).toSorted((a, b) => a.date.localeCompare(b.date)).map((v) => {
    const item = v as ScheduleItem & {
      readonly id: string;
      recipe: Recipe | undefined;
    }
    const recipe = recipes.value?.find((v) => v.id === item.recipeID)
    if (recipe) {
      item.recipe = JSON.parse(JSON.stringify(recipe)) as Recipe;
      const recipeMultiple = Math.ceil(item.people / item.recipe.portions);
      item.recipe.ingredients = (item.recipe.ingredients??[]).map((v) => {
        const ingredient = v;
        ingredient.amount.value *= recipeMultiple;
        return ingredient;
      });
    }
    return item;
  })
);

function newScheduleItem(): ScheduleItem {
  const item = ScheduleItem();
  item.date = date.value.toISOString();
  return item;
}

let previousDiff = 0;
function openSnackbar(text: string, color = "", timeout = 3000) {
  snackbarColor.value = color;
  snackbarTimeout.value = timeout + previousDiff;
  snackbarText.value = text;
  snackbar.value = true;
  previousDiff = previousDiff === 0 ? .1 : 0;
}

function save() {
  scheduleItems.value?.forEach((v) => addScheduleItem(v));
  openSnackbar("Saved: " + new Date().toLocaleTimeString(), "success");
}

function addScheduleItem(
  scheduleItem: DatabaseData<ScheduleItem> | ScheduleItem
) {
  if ("id" in scheduleItem)
    set(dbRef(db, "schedule/" + scheduleItem.id), scheduleItem);
  else push(dbRef(db, "schedule"), scheduleItem);
}
async function removeScheduleItem(
  scheduleItem: ScheduleItem & {
    readonly id: string;
  }
) {
  if (!(await confirmation.value?.open({
    titleColor: "",
    title: "Delete Meal",
    width: 400,
    message: "Are you sure you want to delete this meal?",
  })))
    return; 
  await deleteWithTrash(db, "schedule", scheduleItem.id);
  openSnackbar("Deleted meal", "error");
}
const confirmation = ref<InstanceType<typeof Confirm> | null>(null);
</script>
