import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCK5PY0dWmC1SRnQ5OcRau89LdT9hGJ1ME",
  authDomain: "autoshop-bcc48.firebaseapp.com",
  projectId: "autoshop-bcc48",
  storageBucket: "autoshop-bcc48.firebasestorage.app",
  messagingSenderId: "358507260488",
  appId: "1:358507260488:web:2fc72565bf72959cf0467d",
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);