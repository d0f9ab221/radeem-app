import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyBhuSxkjcsZ3TtNGYCOXOOl7-WWG_EsgPo",
  authDomain: "ililbb-70fb0.firebaseapp.com",
  databaseURL: "https://ililbb-70fb0-default-rtdb.firebaseio.com",
  projectId: "ililbb-70fb0",
  storageBucket: "ililbb-70fb0.firebasestorage.app",
  messagingSenderId: "1059355688483",
  appId: "1:1059355688483:web:a71b5f3bc4fb31ee86fb96",
  measurementId: "G-GVEB9G3V95"
};

let app = null;
let auth = null;
let db = null;
let googleProvider = null;
let isFirebaseAvailable = false;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getDatabase(app);
  googleProvider = new GoogleAuthProvider();
  isFirebaseAvailable = true;
} catch (error) {
  console.warn("Firebase failed to initialize. Switching to local simulation mode for previewer.", error);
  isFirebaseAvailable = false;
}

export { auth, db, googleProvider, isFirebaseAvailable };