// Firebase Configuration and Initialization
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

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.database();

// Configure Google Auth Provider
const googleProvider = new firebase.auth.GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account'
});