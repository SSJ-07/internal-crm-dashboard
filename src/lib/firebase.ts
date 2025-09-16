// src/lib/firebase.ts
import { initializeApp } from "firebase/app"
import { getAnalytics } from "firebase/analytics"
import { getFirestore } from "firebase/firestore"
import { getAuth } from "firebase/auth"

const firebaseConfig = {
  apiKey: "AIzaSyC1zMNUb-vF33fFcqJggt_ifqLmKm0h2c",
  authDomain: "internal-crm-dahsboard.firebaseapp.com",
  projectId: "internal-crm-dahsboard",
  storageBucket: "internal-crm-dahsboard.appspot.com",
  messagingSenderId: "212677803820",
  appId: "1:212677803820:web:4d35c2c2428ddf03743689",
  measurementId: "G-V0LXXWYZ1"
}

const app = initializeApp(firebaseConfig)

export const db = getFirestore(app)
export const auth = getAuth(app)