// Utilities
import { defineStore } from "pinia";
import { Ref, ref } from "vue";
type AppStore = {
  range: Ref<[number, number]>;
};

export const useAppStore = defineStore(
  "app",
  (): AppStore => {
    const range = ref<[number, number]>([0, 0]);
    return {
      range,
    };
  },
  {
    persist: true,
  }
);
