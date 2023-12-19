<template>
  <v-container class="fill-height flex-column align-start ga-4" fluid>
    <v-btn @click="addScheduleItem(ScheduleItem())" color="primary">
      Add Schedule
    </v-btn>
    <div
      class="w-100"
      style="
        --grid-layout-gap: 10px;
        --grid-column-count: 8;
        --grid-item--min-width: 400px;

        --gap-count: calc(var(--grid-column-count) - 1);
        --total-gap-width: calc(var(--gap-count) * var(--grid-layout-gap));
        --grid-item--max-width: calc(
          (100% - var(--total-gap-width)) / var(--grid-column-count)
        );

        display: grid;
        grid-template-columns: repeat(
          auto-fill,
          minmax(
            max(var(--grid-item--min-width), var(--grid-item--max-width)),
            1fr
          )
        );
        grid-gap: var(--grid-layout-gap);
      "
    >
      <v-card
        v-for="scheduleItem in schedule.sort(
          (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )"
        :key="scheduleItem.id"
        elevation="4"
      >
        <v-card-title>
          {{ new Date(scheduleItem.date).toLocaleDateString() }} -
          {{ recipes.find((v) => v.id === scheduleItem.recipeID)?.name }}
        </v-card-title>
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
          <v-expansion-panels color="tonal">
            <v-expansion-panel color="tonal">
              <v-expansion-panel-title :expand-icon="mdiPencil">
                Date
              </v-expansion-panel-title>
              <v-expansion-panel-text class="justify-center">
                <v-date-picker
                  :model-value="new Date(scheduleItem.date)"
                  @update:model-value="
                    (v) => {
                      console.log(v);
                      scheduleItem.date = v.toISOString();
                    }
                  "
                />
              </v-expansion-panel-text>
            </v-expansion-panel>
          </v-expansion-panels>
        </v-card-text>
        <v-card-actions>
          <v-btn
            @click="addScheduleItem(scheduleItem)"
            color="success"
            variant="tonal"
          >
            Save
          </v-btn>
          <v-btn
            @click="removeScheduleItem(scheduleItem)"
            color="error"
            variant="tonal"
          >
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
    <confirm ref="confirmation"/>
  </v-container>
</template>

<script lang="ts" setup>
import Confirm from "@/components/Confirm.vue";
import { DatabaseData, Recipe, ScheduleItem } from "@/types/recipe";
import { deleteWithTrash } from "@/utils/firebase";
import { mdiPencil } from "@mdi/js";
import { ref as dbRef, push, set } from "firebase/database";
import { ref } from "vue";
import { useDatabase, useDatabaseList } from "vuefire";
const db = useDatabase();
const schedule = useDatabaseList<ScheduleItem>(dbRef(db, "schedule"));
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));

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
    title: "Delete Schedule",
    width: 400,
    message: "Are you sure you want to delete this schedule?",
  })))
    return; 
  await deleteWithTrash(db, "schedule", scheduleItem.id);
}
const confirmation = ref<InstanceType<typeof Confirm> | null>(null);
</script>
