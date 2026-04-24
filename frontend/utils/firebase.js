// lib/firebase.js
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDnRDtG4r5gV7oZ1_bTECDtiqwSwOZv6qw",
  authDomain: "lea-codewarriors.firebaseapp.com",
  projectId: "lea-codewarriors",
  storageBucket: "lea-codewarriors.firebasestorage.app",
  messagingSenderId: "788619241623",
  appId: "1:788619241623:web:0b0bc7e18d1cef0cdda1d2"
};

const app = initializeApp(firebaseConfig);

export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export const db = getFirestore(app);