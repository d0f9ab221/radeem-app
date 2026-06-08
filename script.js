// Safe Storage Wrapper to prevent SecurityError in sandboxed previewers
const safeStorage = {
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

// Firebase Configuration
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

let isFirebaseAvailable = false;
let simulatedDB = {};
let simulatedUser = null;

// Load simulated DB from safeStorage
try {
  const savedDB = safeStorage.getItem('radeem_simulated_db');
  if (savedDB) {
    simulatedDB = JSON.parse(savedDB);
  }
  const savedUser = safeStorage.getItem('radeem_simulated_user');
  if (savedUser) {
    simulatedUser = JSON.parse(savedUser);
  }
} catch (e) {}

function saveSimulatedDB() {
  safeStorage.setItem('radeem_simulated_db', JSON.stringify(simulatedDB));
}

// Initialize Firebase with Compat SDK
try {
  if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    isFirebaseAvailable = true;
    console.log("Firebase initialized successfully.");
  } else {
    console.warn("Firebase SDK not found. Running in local simulation mode.");
  }
} catch (error) {
  console.warn("Firebase failed to initialize. Running in local simulation mode.", error);
}

// --- AUTHENTICATION FUNCTIONS ---

function checkAuthState(callback) {
  if (isFirebaseAvailable) {
    firebase.auth().onAuthStateChanged((user) => {
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
  } else {
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
  }
}

async function loginUser(email, password) {
  if (isFirebaseAvailable) {
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      safeStorage.removeItem('radeem_guest_uid');
      safeStorage.removeItem('radeem_simulated_user');
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else {
    const uid = 'sim_' + email.replace(/[^a-zA-Z0-9]/g, '');
    await createUserProfile(uid, email, email.split('@')[0]);
    simulatedUser = { uid, email, displayName: email.split('@')[0] };
    safeStorage.setItem('radeem_simulated_user', JSON.stringify(simulatedUser));
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: simulatedUser };
  }
}

async function registerUser(email, password, username) {
  if (isFirebaseAvailable) {
    try {
      const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
      await createUserProfile(userCredential.user.uid, email, username);
      safeStorage.removeItem('radeem_guest_uid');
      safeStorage.removeItem('radeem_simulated_user');
      return { success: true, user: userCredential.user };
    } catch (error) {
      return { success: false, error: error.message };
    }
  } else {
    const uid = 'sim_' + Math.random().toString(36).substring(2, 15);
    await createUserProfile(uid, email, username);
    simulatedUser = { uid, email, displayName: username };
    safeStorage.setItem('radeem_simulated_user', JSON.stringify(simulatedUser));
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: simulatedUser };
  }
}

async function loginWithGoogle() {
  if (isFirebaseAvailable) {
    try {
      const provider = new firebase.auth.GoogleAuthProvider();
      const result = await firebase.auth().signInWithPopup(provider);
      await createUserProfile(result.user.uid, result.user.email, result.user.displayName);
      safeStorage.removeItem('radeem_guest_uid');
      safeStorage.removeItem('radeem_simulated_user');
      return { success: true, user: result.user };
    } catch (error) { 
      return { success: false, error: error.message };
    }
  } else {
    const uid = 'sim_google_' + Math.random().toString(36).substring(2, 15);
    await createUserProfile(uid, 'googleuser@gmail.com', 'Google User');
    simulatedUser = { uid, email: 'googleuser@gmail.com', displayName: 'Google User' };
    safeStorage.setItem('radeem_simulated_user', JSON.stringify(simulatedUser));
    safeStorage.removeItem('radeem_guest_uid');
    return { success: true, user: simulatedUser };
  }
}

async function loginAsGuest() {
  try {
    let guestUid = safeStorage.getItem('radeem_guest_uid');
    if (!guestUid) {
      guestUid = 'guest_' + Math.random().toString(36).substring(2, 15);
      safeStorage.setItem('radeem_guest_uid', guestUid);
    }
    await createUserProfile(guestUid, 'guest@radeem.app', 'Guest ' + guestUid.substring(6, 11).toUpperCase());
    const guestUser = { uid: guestUid, displayName: 'Guest User', isGuest: true };
    simulatedUser = guestUser;
    safeStorage.setItem('radeem_simulated_user', JSON.stringify(simulatedUser));
    return { success: true, user: guestUser };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function logoutUser() {
  safeStorage.removeItem('radeem_guest_uid');
  safeStorage.removeItem('radeem_simulated_user');
  simulatedUser = null;

  if (isFirebaseAvailable) {
    try {
      await firebase.auth().signOut();
    } catch (e) {}
  }
  return { success: true };
}

async function resetPassword(email) {
  if (isFirebaseAvailable) {
    try {
      await firebase.auth().sendPasswordResetEmail(email);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
  return { success: true };
}

// --- DATABASE FUNCTIONS ---

async function getUserData(uid) {
  if (isFirebaseAvailable && !uid.startsWith('guest_') && !uid.startsWith('sim_')) {
    try {
      const snapshot = await firebase.database().ref(`users/${uid}`).once('value');
      return snapshot.exists() ? snapshot.val() : null;
    } catch (error) {
      console.error("Error getting user data:", error);
    }
  }
  return simulatedDB[uid] || null;
}

async function createUserProfile(uid, email, username) {
  const defaultProfile = {
    username: username || email.split('@')[0],
    email: email,
    coins: 0,
    diamonds: 0,
    createdAt: new Date().toISOString(),
    redeemedCodes: {}
  };

  if (isFirebaseAvailable && !uid.startsWith('guest_') && !uid.startsWith('sim_')) {
    try {
      const userRef = firebase.database().ref(`users/${uid}`);
      const snapshot = await userRef.once('value');
      if (!snapshot.exists()) {
        await userRef.set(defaultProfile);
      }
      return;
    } catch (error) {
      console.error("Error creating user profile:", error);
    }
  }

  if (!simulatedDB[uid]) {
    simulatedDB[uid] = defaultProfile;
    saveSimulatedDB();
  }
}

async function updateUserCurrency(uid, coins, diamonds) {
  if (isFirebaseAvailable && !uid.startsWith('guest_') && !uid.startsWith('sim_')) {
    try {
      await firebase.database().ref(`users/${uid}`).update({ coins, diamonds });
      return;
    } catch (error) {
      console.error("Error updating currency:", error);
    }
  }

  if (simulatedDB[uid]) {
    simulatedDB[uid].coins = coins;
    simulatedDB[uid].diamonds = diamonds;
    saveSimulatedDB();
  }
}

async function addRedeemedCode(uid, code, amount) {
  const newCode = {
    code: code,
    amount: amount,
    date: new Date().toISOString()
  };

  if (isFirebaseAvailable && !uid.startsWith('guest_') && !uid.startsWith('sim_')) {
    try {
      await firebase.database().ref(`users/${uid}/redeemedCodes`).push(newCode);
      return;
    } catch (error) {
      console.error("Error adding redeemed code:", error);
    }
  }

  if (simulatedDB[uid]) {
    if (!simulatedDB[uid].redeemedCodes) {
      simulatedDB[uid].redeemedCodes = {};
    }
    const newId = 'code_' + Math.random().toString(36).substring(2, 15);
    simulatedDB[uid].redeemedCodes[newId] = newCode;
    saveSimulatedDB();
  }
}

// --- UI & PAGE CONTROLLERS ---

document.addEventListener('DOMContentLoaded', () => {
  const toast = document.getElementById('toast');

  function showToast(message, isError = false) {
    if (!toast) return;
    toast.textContent = message;
    toast.style.borderLeft = isError ? '4px solid var(--danger)' : '4px solid var(--success)';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }

  // --- LOGIN PAGE LOGIC ---
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    const googleBtn = document.getElementById('google-signin-btn');
    const guestBtn = document.getElementById('guest-login-btn');
    const forgotLink = document.getElementById('forgot-password-link');

    checkAuthState((user) => {
      if (user) {
        window.location.href = 'dashboard.html';
      }
    });

    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await loginUser(email, password);
      if (res.success) {
        showToast('Login successful! Redirecting...');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } else {
        showToast(res.error, true);
      }
    });

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        const res = await loginWithGoogle();
        if (res.success) {
          showToast('Google Login successful!');
          setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
          showToast(res.error, true);
        }
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener('click', async () => {
        const res = await loginAsGuest();
        if (res.success) {
          showToast('Logged in as Guest! Redirecting...');
          setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
          showToast(res.error, true);
        }
      });
    }

    if (forgotLink) {
      forgotLink.addEventListener('click', async (e) => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        if (!email) {
          showToast('Please enter your email address first.', true);
          return;
        }
        const res = await resetPassword(email);
        if (res.success) {
          showToast('Password reset email sent!');
        } else {
          showToast(res.error, true);
        }
      });
    }
  }

  // --- REGISTER PAGE LOGIC ---
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    const googleBtn = document.getElementById('google-signin-btn');
    const guestBtn = document.getElementById('guest-login-btn');

    checkAuthState((user) => {
      if (user) {
        window.location.href = 'dashboard.html';
      }
    });

    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('username').value;
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      const res = await registerUser(email, password, username);
      if (res.success) {
        showToast('Registration successful! Redirecting...');
        setTimeout(() => window.location.href = 'dashboard.html', 1000);
      } else {
        showToast(res.error, true);
      }
    });

    if (googleBtn) {
      googleBtn.addEventListener('click', async () => {
        const res = await loginWithGoogle();
        if (res.success) {
          showToast('Google Registration successful!');
          setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
          showToast(res.error, true);
        }
      });
    }

    if (guestBtn) {
      guestBtn.addEventListener('click', async () => {
        const res = await loginAsGuest();
        if (res.success) {
          showToast('Logged in as Guest! Redirecting...');
          setTimeout(() => window.location.href = 'dashboard.html', 1000);
        } else {
          showToast(res.error, true);
        }
      });
    }
  }

  // --- DASHBOARD PAGE LOGIC ---
  const watchAdBtn = document.getElementById('watch-ad-btn');
  if (watchAdBtn) {
    let currentUser = null;
    let userCoins = 0;
    let userDiamonds = 0;

    const userCoinsEl = document.getElementById('user-coins');
    const userDiamondsEl = document.getElementById('user-diamonds');
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');

    function updateUI() {
      if (userCoinsEl) userCoinsEl.textContent = userCoins;
      if (userDiamondsEl) userDiamondsEl.textContent = userDiamonds;
    }

    checkAuthState(async (user) => {
      if (!user) {
        window.location.href = 'index.html';
      } else {
        currentUser = user;
        const data = await getUserData(user.uid);
        if (data) {
          userCoins = data.coins || 0;
          userDiamonds = data.diamonds || 0;
          updateUI();
        }
      }
    });

    async function handleLogout() {
      await logoutUser();
      window.location.href = 'index.html';
    }
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }

    // Watch Ad Logic
    const adModal = document.getElementById('ad-modal');
    const adTimerEl = document.getElementById('ad-timer');
    const claimAdRewardBtn = document.getElementById('claim-ad-reward-btn');

    watchAdBtn.addEventListener('click', () => {
      if (!adModal) return;
      adModal.style.display = 'flex';
      let timeLeft = 15;
      claimAdRewardBtn.disabled = true;
      claimAdRewardBtn.textContent = 'Claim Reward';
      
      const interval = setInterval(() => {
        timeLeft--;
        if (adTimerEl) adTimerEl.textContent = `${timeLeft}s`;
        if (timeLeft <= 0) {
          clearInterval(interval);
          if (adTimerEl) adTimerEl.textContent = 'Done!';
          claimAdRewardBtn.disabled = false;
        }
      }, 1000);
    });

    if (claimAdRewardBtn) {
      claimAdRewardBtn.addEventListener('click', async () => {
        userDiamonds += 1;
        await updateUserCurrency(currentUser.uid, userCoins, userDiamonds);
        updateUI();
        if (adModal) adModal.style.display = 'none';
        showToast('You earned 1 Diamond!');
      });
    }

    // Mystery Box Logic
    const openBoxBtn = document.getElementById('open-box-btn');
    const mysteryBox = document.getElementById('mystery-box');

    if (openBoxBtn && mysteryBox) {
      openBoxBtn.addEventListener('click', async () => {
        if (userDiamonds < 19) {
          showToast('You need 19 Diamonds to open the Mystery Box!', true);
          return;
        }

        openBoxBtn.disabled = true;
        mysteryBox.classList.add('shake');

        setTimeout(async () => {
          mysteryBox.classList.remove('shake');
          mysteryBox.classList.add('open');
          
          userDiamonds -= 19;
          userCoins += 190;
          await updateUserCurrency(currentUser.uid, userCoins, userDiamonds);
          updateUI();
          showToast('🎉 You opened the box and got 190 Coins!');

          setTimeout(() => {
            mysteryBox.classList.remove('open');
            openBoxBtn.disabled = false;
          }, 3000);
        }, 2000); 
      });
    }

    // Redeem Logic
    const redeemBtn = document.getElementById('redeem-btn');
    const redeemModal = document.getElementById('redeem-modal');
    const closeRedeemModal = document.getElementById('close-redeem-modal');
    const generatedCodeEl = document.getElementById('generated-code');
    const copyCodeBtn = document.getElementById('copy-code-btn');

    if (redeemBtn) {
      redeemBtn.addEventListener('click', async () => {
        if (userCoins < 900) {
          showToast('You need 900 Coins to redeem a 10 RS code!', true);
          return;
        }

        userCoins -= 900;
        await updateUserCurrency(currentUser.uid, userCoins, userDiamonds);
        updateUI();

        // Generate random code
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = 'GP-';
        for (let i = 0; i < 4; i++) {
          for (let j = 0; j < 4; j++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
          }
          if (i < 3) code += '-';
        }

        await addRedeemedCode(currentUser.uid, code, '10 RS');
        if (generatedCodeEl) generatedCodeEl.textContent = code;
        if (redeemModal) redeemModal.style.display = 'flex';
      });
    }

    if (closeRedeemModal) {
      closeRedeemModal.addEventListener('click', () => {
        if (redeemModal) redeemModal.style.display = 'none';
      });
    }

    if (copyCodeBtn) {
      copyCodeBtn.addEventListener('click', () => {
        if (generatedCodeEl) {
          navigator.clipboard.writeText(generatedCodeEl.textContent);
          showToast('Code copied to clipboard!');
        }
      });
    }
  }

  // --- PROFILE PAGE LOGIC ---
  const profileUsername = document.getElementById('profile-username');
  if (profileUsername) {
    const logoutBtn = document.getElementById('logout-btn');
    const mobileLogoutBtn = document.getElementById('mobile-logout-btn');
    const profileAvatar = document.getElementById('profile-avatar');
    const profileEmail = document.getElementById('profile-email');
    const profileCoins = document.getElementById('profile-coins');
    const profileDiamonds = document.getElementById('profile-diamonds');
    const historyList = document.getElementById('history-list');

    checkAuthState(async (user) => {
      if (!user) {
        window.location.href = 'index.html';
      } else {
        const data = await getUserData(user.uid);
        if (data) {
          profileUsername.textContent = data.username || 'User';
          if (profileEmail) profileEmail.textContent = data.email;
          if (profileCoins) profileCoins.textContent = data.coins || 0;
          if (profileDiamonds) profileDiamonds.textContent = data.diamonds || 0;
          if (profileAvatar) profileAvatar.textContent = (data.username || 'U').charAt(0).toUpperCase();

          // Load History
          if (data.redeemedCodes && historyList) {
            historyList.innerHTML = '';
            Object.values(data.redeemedCodes).reverse().forEach(item => {
              const div = document.createElement('div');
              div.className = 'history-item';
              div.innerHTML = `
                <div>
                  <div style="font-weight: 700; font-size: 0.95rem;">${item.amount} Code</div>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${new Date(item.date).toLocaleDateString()}</div>
                </div>
                <div class="code-display">${item.code}</div>
              `;
              historyList.appendChild(div); 
            });
          }
        }
      }
    });

    async function handleLogout() {
      await logoutUser();
      window.location.href = 'index.html';
    }
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);
    if (mobileLogoutBtn) {
      mobileLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        handleLogout();
      });
    }
  }
});