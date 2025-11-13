// Fix: Import firebase v9 compat libraries to fix module export errors.
import firebase from "firebase/compat/app";
import "firebase/compat/auth";

// Your web app's Firebase configuration from the user
const firebaseConfig = {
  apiKey: "AIzaSyCL2T9eTICRPOooE3xPilhKj_k35jJJEkw",
  authDomain: "drillsoft-125de.firebaseapp.com",
  projectId: "drillsoft-125de",
  storageBucket: "drillsoft-125de.firebasestorage.app",
  messagingSenderId: "403912476034",
  appId: "1:403912476034:web:558483ac35b9e5204f7b9b",
  measurementId: "G-BQTJ6HFN6Z"
};

// Fix: Initialize Firebase using the compat syntax.
// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
export const auth = firebase.auth();
