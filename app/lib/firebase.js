// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDSEjW_KrlgT8qHEoaeFYlNbqgvyVETGyY",
  authDomain: "ratemyprofessor-99fb5.firebaseapp.com",
  projectId: "ratemyprofessor-99fb5",
  storageBucket: "ratemyprofessor-99fb5.firebasestorage.app",
  messagingSenderId: "177122975941",
  appId: "1:177122975941:web:17578a39295416155150ac",
  measurementId: "G-HMGH83WRN5",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
export const db = getFirestore(app);

// Initialize Analytics
const analytics = typeof window !== "undefined" ? getAnalytics(app) : null;
