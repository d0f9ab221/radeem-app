import { auth, googleProvider, isFirebaseAvailable } from './firebase.js';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged, 
  signInWithPopup,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { createUserProfile } from './database.js';

// Safe storage wrapper to prevent SecurityError in sandboxed previewers
export const safeStorage = {
  _data: {},
  getItem(key) {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      return this._data[key] || null;
    }
  },
  setItem(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      this._data[key] = value;
    }
  },
  removeItem(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      delete this._data[key];
    }
  }
};

// Track simulated logged in user for previewer fallback
let simulatedUser = null;
const SIMULATED_USER_KEY = 'radeem_simulated_user';

// Initialize simulated user from safeStorage if exists
try {
  const saved = safeStorage.getItem(SIMULATED_USER_KEY);
  if (saved) {
    simulatedUser = JSON.parse(saved);
  }
} catch (e) {}

export function checkAuthState(callback) {
  if (!isFirebaseAvailable) {
    // Simulation Mode
    setTimeout(() => {
      if (simulatedUser) {
        callback(simulatedUser);
      } else {
        const guestUid = safeStorage.getItem('radeem_guest_uid');
        if (guestUid) {
          callback({
            uid: guestUid,
            email: 'guest@radeem.app',
            displayName: 'Guest User',
            isGuest: true
          });
        } else {
          callback(null);
        }
      }
    }, 100);
    return;
  }

  // Real Firebase Mode
  try {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        callback(user);
      } else {
        const guestUid = safeStorage.getItem('radeem_guest_uid');
        if (guestUid) {
          callback({
            uid: guestUid,
            email: 'guest@radeem.app',
            displayName: 'Guest User',
            isGuest: true
          });
        } else {
          callback(null);
        }
      }
    });
  } catch (error) {
    console.error("Error in onAuthStateChanged:", error);
    callback(null);
  }
}

export async function loginAsGuest() { 
  try {
    let guestUid = safeStorage.getItem('radeem_guest_uid');
    if (!guestUid) {
      guestUid = 'guest_' + Math.random().toString(36).substring(2, 15);
      safeStorage.setItem('radeem_guest_uid', guestUid);
    }
    
    await createUserProfile(guestUid, 'guest@radeem.app', 'Guest ' + guestUid.substring(6, 11).toUpperCase());
    
    const guestUser = { uid: guestUid, displayName: 'Guest User', isGuest: true };
    if (!isFirebaseAvailable) {
      simulatedUser = guestUser;
      safeStorage.setItem(SIMULATED_USER_KEY, JSON.stringify(simulatedUser));
    }
    return { success: true, user: guestUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function registerUser(email, password, username) {
  if (!isFirebaseAvailable) {
    // Simulation Mode
    const uid = 'sim_' + Math.random().toString(36).substring(2, 15);
    await createUserProfile(uid, email, username);
    simulatedUser = { uid, email, displayName: username };
    safeStorage.setItem(SIMULATED_USER_KEY, JSON.stringify(simulatedUser));
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: simulatedUser };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    await createUserProfile(userCredential.user.uid, email, username);
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: userCredential.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function loginUser(email, password) {
  if (!isFirebaseAvailable) {
    // Simulation Mode
    const uid = 'sim_' + email.replace(/[^a-zA-Z0-9]/g, '');
    await createUserProfile(uid, email, email.split('@')[0]);
    simulatedUser = { uid, email, displayName: email.split('@')[0] };
    safeStorage.setItem(SIMULATED_USER_KEY, JSON.stringify(simulatedUser));
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: simulatedUser };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: userCredential.user };
  } catch (error) { 
    return { success: false, error: error.message };
  }
}

export async function loginWithGoogle() {
  if (!isFirebaseAvailable) {
    // Simulation Mode
    const uid = 'sim_google_' + Math.random().toString(36).substring(2, 15);
    await createUserProfile(uid, 'googleuser@gmail.com', 'Google User');
    simulatedUser = { uid, email: 'googleuser@gmail.com', displayName: 'Google User' };
    safeStorage.setItem(SIMULATED_USER_KEY, JSON.stringify(simulatedUser));
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: simulatedUser };
  }

  try {
    const result = await signInWithPopup(auth, googleProvider);
    await createUserProfile(result.user.uid, result.user.email, result.user.displayName);
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: result.user };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function logoutUser() {
  safeStorage.removeItem('radeem_guest_uid');
  safeStorage.removeItem(SIMULATED_USER_KEY);
  simulatedUser = null;

  if (!isFirebaseAvailable) {
    return { success: true };
  }

  try {
    await signOut(auth);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

export async function resetPassword(email) {
  if (!isFirebaseAvailable) {
    return { success: true };
  }
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}