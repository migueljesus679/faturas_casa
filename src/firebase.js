// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyASjXjawnrLQRgaiom5sa02uUjj-FR1XZE",
  authDomain: "faturas-74408.firebaseapp.com",
  projectId: "faturas-74408",
  storageBucket: "faturas-74408.firebasestorage.app",
  messagingSenderId: "94978555296",
  appId: "1:94978555296:web:6adb72f8fe9f4d8f3db8c5",
  measurementId: "G-1JVN9VH152",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
