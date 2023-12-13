/**
 * plugins/index.ts
 *
 * Automatically included in `./src/main.ts`
 */

// Plugins
import { VueFire, VueFireAuth } from "vuefire";
import vuetify from "./vuetify";
import { firebaseApp } from "../utils/firebase";
import pinia from "../store";
import router from "../router";

// Types
import type { App } from "vue";

export function registerPlugins(app: App) {
  app
    .use(VueFire, {
      firebaseApp,
      modules: [VueFireAuth()],
    })
    .use(vuetify)
    .use(router)
    .use(pinia);
}
