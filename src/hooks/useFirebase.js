import { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDiztKa8i_jKJJwcrjKSZqV9sdHcXini1Q",
  authDomain: "mtc-attendance.firebaseapp.com",
  projectId: "mtc-attendance",
  storageBucket: "mtc-attendance.firebasestorage.app",
  messagingSenderId: "1059271445061",
  appId: "1:1059271445061:web:e32f46ca89f1e3e015f12c"
};

export const useFirebase = () => {
  const [db, setDb] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      setDb(firestore);
    } catch (e) {
      console.error("Could not initialize Firebase:", e);
      setError("Lỗi: Không thể khởi tạo ứng dụng.");
    }
  }, []);

  return { db, error };
};