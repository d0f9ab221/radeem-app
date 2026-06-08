import { db, isFirebaseAvailable } from './firebase.js';
import { ref, set, get, update, push } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";
import { safeStorage } from './auth.js';

const SIM_DB_KEY = 'radeem_simulated_db';
function getSimulatedDB() {
  try {
    const data = safeStorage.getItem(SIM_DB_KEY);
    return data ? JSON.parse(data) : {};
  } catch (e) {
    return {};
  }
}

function saveSimulatedDB(data) {
  try {
    safeStorage.setItem(SIM_DB_KEY, JSON.stringify(data));
  } catch (e) {}
}

export async function createUserProfile(uid, email, username) {
  if (!isFirebaseAvailable) {
    const simDB = getSimulatedDB();
    if (!simDB[uid]) {
      simDB[uid] = {
        username: username || email.split('@')[0],
        email: email,
        coins: 0,
        diamonds: 0,
        lastDailyClaim: 0,
        createdAt: new Date().toISOString(),
        redeemedCodes: {}
      };
      saveSimulatedDB(simDB);
    }
    return;
  }

  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    if (!snapshot.exists()) {
      await set(userRef, {
        username: username || email.split('@')[0],
        email: email,
        coins: 0,
        diamonds: 0,
        lastDailyClaim: 0,
        createdAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error("Error creating user profile:", error);
  }
}

export async function getUserData(uid) {
  if (!isFirebaseAvailable) {
    const simDB = getSimulatedDB();
    return simDB[uid] || null;
  }

  try {
    const userRef = ref(db, `users/${uid}`);
    const snapshot = await get(userRef);
    return snapshot.exists() ? snapshot.val() : null;
  } catch (error) {
    console.error("Error getting user data:", error);
    return null;
  }
}

export async function updateUserCurrency(uid, coins, diamonds) {
  if (!isFirebaseAvailable) {
    const simDB = getSimulatedDB();
    if (simDB[uid]) {
      simDB[uid].coins = coins;
      simDB[uid].diamonds = diamonds;
      saveSimulatedDB(simDB);
    }
    return;
  }

  try {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, {
      coins: coins,
      diamonds: diamonds
    });
  } catch (error) {
    console.error("Error updating user currency:", error);
  }
}

export async function updateLastDailyClaim(uid, timestamp) {
  if (!isFirebaseAvailable) {
    const simDB = getSimulatedDB();
    if (simDB[uid]) {
      simDB[uid].lastDailyClaim = timestamp;
      saveSimulatedDB(simDB);
    }
    return;
  }

  try {
    const userRef = ref(db, `users/${uid}`);
    await update(userRef, {
      lastDailyClaim: timestamp
    });
  } catch (error) {
    console.error("Error updating daily claim time:", error);
  }
}

export async function addRedeemedCode(uid, code, amount) {
  if (!isFirebaseAvailable) {
    const simDB = getSimulatedDB();
    if (simDB[uid]) {
      if (!simDB[uid].redeemedCodes) {
        simDB[uid].redeemedCodes = {};
      }
      const newId = 'code_' + Math.random().toString(36).substring(2, 15);
      simDB[uid].redeemedCodes[newId] = {
        code: code,
        amount: amount,
        date: new Date().toISOString()
      };
      saveSimulatedDB(simDB);
    }
    return;
  }

  try {
    const codesRef = ref(db, `users/${uid}/redeemedCodes`);
    const newCodeRef = push(codesRef);
    await set(newCodeRef, {
      code: code,
      amount: amount,
      date: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error adding redeemed code:", error);
  }
}
