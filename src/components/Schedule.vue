<template>
  <v-container fluid>
    <v-btn @click="addScheduleItem(ScheduleItem())" color="primary"
      >Add Schedule</v-btn
    >
    <div
      style="
        --grid-layout-gap: 10px;
        --grid-column-count: 8;
        --grid-item--min-width: 300px;

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
        class="ma-2"
        elevation="4"
      >
        <v-card-title>
          {{ new Date(scheduleItem.date).toLocaleDateString() }} -
          {{ recipes.find((v) => v.id === scheduleItem.recipeID)?.name }}
        </v-card-title>
        <v-autocomplete
          :items="recipes"
          item-title="name"
          item-value="id"
          v-model="scheduleItem.recipeID"
        >
        </v-autocomplete
        ><v-expansion-panels>
          <v-expansion-panel title="Date">
            <v-expansion-panel-text>
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
        <v-text-field
          v-model="scheduleItem.people"
          type="number"
          label="people"
        />
        <v-card-actions>
          <v-btn @click="addScheduleItem(scheduleItem)" color="success">
            Save
          </v-btn>
          <v-btn @click="removeScheduleItem(scheduleItem)" color="error">
            Delete
          </v-btn>
        </v-card-actions>
      </v-card>
    </div>
  </v-container>
</template>

<script lang="ts" setup>
import { Recipe, ScheduleItem } from "@/types/recipe";
import { ref as dbRef, push, remove, set } from "firebase/database";
import { useDatabase, useDatabaseList } from "vuefire";
const db = useDatabase();
const schedule = useDatabaseList<ScheduleItem>(dbRef(db, "schedule"));
const recipes = useDatabaseList<Recipe>(dbRef(db, "recipes"));

function addScheduleItem(
  scheduleItem:
    | (ScheduleItem & {
        readonly id: string;
      })
    | ScheduleItem
) {
  if (!("id" in scheduleItem)) {
    push(dbRef(db, "schedule"), scheduleItem);
  } else {
    set(dbRef(db, "schedule/" + scheduleItem.id), scheduleItem);
  }
}
function removeScheduleItem(
  scheduleItem: ScheduleItem & {
    readonly id: string;
  }
) {
  if ("id" in scheduleItem) {
    remove(dbRef(db, "schedule/" + scheduleItem.id));
  }
}
</script>
