import { db } from './firebase.js';
import { ref, set, get, update, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

export async function createUserProfile(uid, email, username) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  if (!snapshot.exists()) {
    await set(userRef, {
      username: username || email.split('@')[0],
      email: email,
      coins: 0,
      diamonds: 0,
      createdAt: new Date().toISOString()
    });
  }
}

export async function getUserData(uid) {
  const userRef = ref(db, `users/${uid}`);
  const snapshot = await get(userRef);
  return snapshot.exists() ? snapshot.val() : null;
}

export async function updateUserCurrency(uid, coins, diamonds) {
  const userRef = ref(db, `users/${uid}`);
  await update(userRef, {
    coins: coins,
    diamonds: diamonds
  });
}

export async function addRedeemedCode(uid, code, amount) {
  const codesRef = ref(db, `users/${uid}/redeemedCodes`);
  const newCodeRef = push(codesRef);
  await set(newCodeRef, {
    code: code,
    amount: amount,
    date: new Date().toISOString()
  });
}