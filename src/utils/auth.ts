import { GoogleAuthProvider, signInWithCredential } from "firebase/auth";
import { RouteLocation } from "vue-router";
import "vue3-google-login";
import { CallbackTypes, googleSdkLoaded } from "vue3-google-login";
import { getCurrentUser, useFirebaseAuth } from "vuefire";

export async function isAuthorized(): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return false;
  const token = await currentUser.getIdTokenResult();
  return token.claims.authorized as boolean;
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
  googleSdkLoaded((google) => {
    isAuthorized().then((authorized) => {
      if (!authorized) {
        google.accounts.id.prompt(onNotification);
      }
    });
  });
}

console.log(import.meta.env.VITE_BASE_URL);
// remove trailing / from base url
const redirect_uri =
  (import.meta.env.VITE_BASE_URL as string).replace(/\/$/, "") + "/login";

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
  console.log("signInFirebase", credential);
  try {
    await signInWithCredential(useFirebaseAuth()!, credential);
  } catch (reason) {
    console.error("Failed loginCallback", reason);
  }
}
