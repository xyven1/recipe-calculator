// Utilities
import { defineStore } from "pinia";
type AppStore = {};

export const useAppStore = defineStore(
  "app",
  (): AppStore => {
    return {};
  },
  {
    persist: true,
  },
);
