// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCWbzuwWSlhfJhChelm7sW8RzL4MHY5gg8",
  authDomain: "recipe-calculator-d4995.firebaseapp.com",
  databaseURL: "https://recipe-calculator-d4995-default-rtdb.firebaseio.com",
  projectId: "recipe-calculator-d4995",
  storageBucket: "recipe-calculator-d4995.appspot.com",
  messagingSenderId: "305092323060",
  appId: "1:305092323060:web:403783a426cb5b12d060a1",
  measurementId: "G-VKE946QXKE",
};

// Initialize Firebase
export const firebaseApp = initializeApp(firebaseConfig);
export const googleAuthProvider = new GoogleAuthProvider();
