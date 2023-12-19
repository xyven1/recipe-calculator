import { firebaseApp } from "@/utils/firebase";
import { computedAsync } from "@vueuse/core";
import {
  GoogleAuthProvider,
  IdTokenResult,
  User,
  getAuth,
  signInWithCredential,
  signOut,
} from "firebase/auth";
import { computed } from "vue";
import { RouteLocation, RouteMeta } from "vue-router";
import "vue3-google-login";
import { CallbackTypes, googleSdkLoaded } from "vue3-google-login";
import { getCurrentUser, useCurrentUser } from "vuefire";

export function useUserWithToken() {
  const userNullable = useCurrentUser();
  const user = computed(() => userNullable.value ?? null);
  const token = computedAsync(async () => {
    if (!user.value) return null;
    return await user.value.getIdTokenResult();
  });

  return { user, token };
}

export function initializeAuth() {
  googleSdkLoaded((google) => {
    google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      // use_fedcm_for_prompt: true,
      cancel_on_tap_outside: true,
      callback: (res: CallbackTypes.CredentialPopupResponse) =>
        signInFirebase(res.credential, null),
    });
  });
}

export function signInWithPrompt(onNotification: (notifiction: any) => void) {
  googleSdkLoaded(async (google) => {
    if (!(await getCurrentUser())) google.accounts.id.prompt(onNotification);
  });
}

// remove trailing / from base url
const redirect_uri = location.origin + "/login";

export function signInWithRedirect(route: RouteLocation) {
  googleSdkLoaded((google) => {
    google.accounts.oauth2
      .initCodeClient({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
        scope: "email profile",
        redirect_uri,
        state: route.path,
        ux_mode: "redirect",
      })
      .requestCode();
  });
}

export async function handleSignInWithRedirectCode(code: string) {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      code,
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      client_secret: import.meta.env.VITE_GOOGLE_CLIENT_SECRET,
      redirect_uri,
      grant_type: "authorization_code",
    }),
  });
  const json = await res.json();
  await signInFirebase(json.id_token, json.access_token);
}

async function signInFirebase(
  idToken: string | null,
  accessToken: string | null
) {
  const credential = GoogleAuthProvider.credential(idToken, accessToken);
  try {
    await signInWithCredential(getAuth(firebaseApp), credential);
  } catch (reason) {
    console.error("Failed loginCallback", reason);
  }
}

export async function signOutFirebase() {
  await signOut(getAuth(firebaseApp));
}

export async function getUserAndToken() {
  const user = await getCurrentUser();
  if (!user) return { user: null, token: null };
  const token = await user.getIdTokenResult();
  return { user, token };
}

export function canAccessRoute(
  routeMeta: RouteMeta,
  userAndToken: { user: User | null; token: IdTokenResult | null }
) {
  return (
    (routeMeta.user ? !!userAndToken.user : true) &&
    (routeMeta.admin ? (userAndToken.token?.claims.admin as boolean) : true)
  );
}
