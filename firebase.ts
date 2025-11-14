import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

// IMPORTANT: Replace with your web app's Firebase configuration.
// You can get this from your Firebase project settings in the Firebase console.
const firebaseConfig = {
  apiKey: "AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "your-messaging-sender-id",
  appId: "1:your-messaging-sender-id:web:your-app-id"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
