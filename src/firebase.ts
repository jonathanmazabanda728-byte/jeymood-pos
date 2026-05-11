import { initializeApp } from "firebase/app";

import {
  getFirestore
} from "firebase/firestore";

import {
  getAuth
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBwY0hQwA4qrgEdVP7-gWmLfN5jhSMfAKA",
  authDomain: "jeymood-pos.firebaseapp.com",
  projectId: "jeymood-pos",
  storageBucket: "jeymood-pos.firebasestorage.app",
  messagingSenderId: "979019659313",
  appId: "1:979019659313:web:f78133d728055a57ddfd10"
};

const app =
  initializeApp(firebaseConfig);

export const db =
  getFirestore(app);

export const auth =
  getAuth(app);