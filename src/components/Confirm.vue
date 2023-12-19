<template>
  <v-dialog v-model="dialog" :max-width="options_.width" :style="{ zIndex: options_.zIndex }" @keydown.esc="cancel">
    <v-card>
      <v-toolbar :color="options_.titleColor">
        <v-toolbar-title>{{ options_.title }}</v-toolbar-title>
      </v-toolbar>
      <v-card-text v-show="!!options_.message">{{ options_.message}}</v-card-text>
      <v-card-actions class="pt-0">
        <v-spacer></v-spacer>
        <v-btn color="primary" variant="tonal" @click="agree">Yes</v-btn>
        <v-btn color="grey" variant="tonal" @click="cancel">Cancel</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

type Options = {
  titleColor: string;
  title: string;
  message: string | null;
  confirmText: string;
  confirmColor: string;
  cancelText: string;
  cancelColor: string;
  width: number;
  zIndex: number;
}

const dialog = ref(false);
const resolve = ref<((value: boolean) => void) | null>(null);
const options_ = ref<Options>({
  titleColor: "primary",
  title: "Confirm",
  message: null,
  confirmText: "Yes",
  confirmColor: "primary",
  cancelText: "Cancel",
  cancelColor: "grey",
  width: 1000,
  zIndex: 200,
});
defineExpose({
  open
})

function open(options: Partial<Options>) {
  dialog.value = true;
  Object.assign(options_.value, options);
  return new Promise<boolean>((res, ) => {
    resolve.value = res;
  });
}

function agree() {
  resolve.value?.(true);
  dialog.value = false;
}

function cancel() {
  resolve.value?.(false);
  dialog.value = false;
}
</script>