import { defineStore } from "pinia";
import { Ref, ref, watch } from "vue";
import { useTheme } from "vuetify/lib/framework.mjs";

type ThemeStore = {
  darkMode: Ref<boolean>;
};

export const useThemeStore = defineStore(
  "theme",
  (): ThemeStore => {
    const theme = useTheme();
    const darkMode = ref(false);
    // watches are inplace of a computed property for darkMode, so persisting works
    watch(darkMode, (value) => {
      theme.global.name.value = value ? "dark" : "light";
    });
    watch(theme.global.name, (value) => {
      darkMode.value = value === "dark";
    });
    return {
      darkMode,
    };
  },
  {
    persist: true,
  }
);
