import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDEczHs03E7jULrtntyeLj6F4C9InUGlIg",
  authDomain: "gestionale-palestra-k.firebaseapp.com",
  projectId: "gestionale-palestra-k",
  storageBucket: "gestionale-palestra-k.firebasestorage.app",
  messagingSenderId: "66205728697",
  appId: "1:66205728697:web:3a5c316b08f6dcab40c068",
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);