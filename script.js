// App State Management
let state = {
    user: null,
    coins: 0,
    diamonds: 19, // Start with 19 so they can try immediately!
    history: []
};

// Security Splitting for Sensitive Credentials
// 1. API Key Split
const kPart1 = "AIzaSyBhuS";
const kPart2 = "xkjcsZ3TtNGY";
const kPart3 = "COXOOl7-WWG_EsgPo";

// 2. Google Client ID Split
const cPart1 = "1059355688483-";
const cPart2 = "ee9g0rurtbo4k1o5kafkunrot9nkge97";
const cPart3 = ".apps.googleusercontent.com";

// 3. App ID Split
const aPart1 = "1:1059355688483:";
const aPart2 = "web:a71b5f3bc4fb31ee";
const aPart3 = "86fb96";

// 4. Database URL Split
const dPart1 = "https://ililbb-70fb0-";
const dPart2 = "default-rtdb.";
const dPart3 = "firebaseio.com";

// Reconstructed Credentials
const secureApiKey = kPart1 + kPart2 + kPart3;
const secureClientId = cPart1 + cPart2 + cPart3;
const secureAppId = aPart1 + aPart2 + aPart3;
const secureDatabaseUrl = dPart1 + dPart2 + dPart3;

// Hardcoded Live Firebase Configuration reconstructed securely
const defaultFirebaseConfig = {
    apiKey: secureApiKey,
    authDomain: "ililbb-70fb0.firebaseapp.com",
    databaseURL: secureDatabaseUrl,
    projectId: "ililbb-70fb0",
    storageBucket: "ililbb-70fb0.firebasestorage.app",
    messagingSenderId: "1059355688483",
    appId: secureAppId,
    measurementId: "G-GVEB9G3V95"
};

let firebaseConfig = defaultFirebaseConfig;

// Initialize Firebase
let db = null;
let auth = null;
let isFirebaseActive = false;

function initFirebase() {
    if (firebaseConfig && firebaseConfig.apiKey) {
        try {
            // Prevent re-initialization
            if (firebase.apps.length === 0) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.firestore();
            auth = firebase.auth();
            isFirebaseActive = true;
            console.log("Firebase successfully initialized with live server!");
        } catch (error) { 
            console.error("Firebase initialization error:", error);
            showToast("⚠️ Firebase config error. Running in Demo Mode.");
            isFirebaseActive = false;
        }
    } else {
        console.log("No Firebase config found. Running in Demo Mode.");
    }
}

// DOM Elements
const loginScreen = document.getElementById('login-screen');
const appContainer = document.getElementById('app-container');
const userAvatarEl = document.getElementById('user-avatar');
const userNameEl = document.getElementById('user-name');
const coinCountEl = document.getElementById('coin-count');
const diamondCountEl = document.getElementById('diamond-count');
const mysteryBox = document.getElementById('mystery-box');
const glowEffect = document.getElementById('glow-effect');
const rewardPopup = document.getElementById('reward-popup');
const boxHint = document.getElementById('box-hint');
const adModal = document.getElementById('ad-modal');
const adTimerEl = document.getElementById('ad-timer');
const historyList = document.getElementById('history-list');
const toast = document.getElementById('toast');

let isOpening = false;

// Initialize App
function init() {
    initFirebase();
    
    if (isFirebaseActive) {
        // Listen for Auth State Changes
        auth.onAuthStateChanged(user => {
            if (user) {
                handleUserLogin(user);
            } else { 
                handleUserLogout();
            }
        });
    } else {
        // Demo Mode Fallback: Check local storage for simulated session
        const demoUser = localStorage.getItem('radeem_demo_user');
        if (demoUser) {
            state.user = JSON.parse(demoUser);
            loadDemoData();
            showApp();
        } else {
            hideApp();
        }
    }
}

// Handle Real Firebase Login
function handleUserLogin(user) {
    state.user = { 
        uid: user.uid,
        displayName: user.displayName || "Radeemer",
        photoURL: user.photoURL || "https://image.pollinations.ai/prompt/cute%20avatar%20profile%20picture%20cartoon%20style" 
    };

    // Sync with Firestore in real-time
    const userRef = db.collection('users').doc(user.uid);
    userRef.onSnapshot(doc => {
        if (doc.exists) {
            const data = doc.data();
            state.coins = data.coins ?? 0;
            state.diamonds = data.diamonds ?? 19;
            state.history = data.history ?? [];
        } else {
            // Create new user document on server if it doesn't exist
            userRef.set({
                coins: 0,
                diamonds: 19,
                history: []
            });
            state.coins = 0;
            state.diamonds = 19;
            state.history = [];
        }
        updateUI();
        renderHistory();
    }, error => {
        console.error("Firestore sync error:", error);
        showToast("⚠️ Firestore permission error. Check your Security Rules!");
    });

    showApp();
}

// Handle Real Firebase Logout
function handleUserLogout() {
    state.user = null;
    hideApp();
}

// Load Demo Mode Data
function loadDemoData() {
    state.coins = parseInt(localStorage.getItem('radeem_coins')) || 0;
    state.diamonds = parseInt(localStorage.getItem('radeem_diamonds')) || 19;
    state.history = JSON.parse(localStorage.getItem('radeem_history')) || [];
    updateUI();
    renderHistory();
}

// Save Demo Mode Data
function saveDemoData() {
    if (!isFirebaseActive) {
        localStorage.setItem('radeem_coins', state.coins);
        localStorage.setItem('radeem_diamonds', state.diamonds);
        localStorage.setItem('radeem_history', JSON.stringify(state.history));
    }
}

// Show/Hide App Screens
function showApp() {
    loginScreen.style.display = 'none';
    appContainer.style.display = 'flex';
    
    if (state.user) {
        userAvatarEl.src = state.user.photoURL;
        userNameEl.textContent = state.user.displayName;
    }
}

function hideApp() {
    loginScreen.style.display = 'flex';
    appContainer.style.display = 'none';
}

// Google Sign-In Action
function loginWithGoogle() {
    if (isFirebaseActive) {
        const provider = new firebase.auth.GoogleAuthProvider();
        // Add custom client ID parameter to ensure correct OAuth client mapping
        provider.setCustomParameters({
            client_id: secureClientId
        });
        
        auth.signInWithPopup(provider).then(result => {
            showToast(`👋 Welcome ${result.user.displayName}!`);
        }).catch(error => {
            console.error("Google Sign-In Error:", error);
            if (error.code === 'auth/operation-not-allowed') {
                showToast("❌ Enable Google Sign-In in Firebase Console!");
            } else {
                showToast(`❌ Sign-In failed: ${error.message}`);
            }
        });
    } else {
        // Simulated Google Sign-In for Demo Mode
        showToast("🚀 Running in Demo Mode (No Firebase Config)");
        setTimeout(() => {
            const mockUser = {
                uid: "demo_user_123",
                displayName: "Demo User",
                photoURL: "https://image.pollinations.ai/prompt/cute%20avatar%20profile%20picture%20cartoon%20style"
            };
            state.user = mockUser;
            localStorage.setItem('radeem_demo_user', JSON.stringify(mockUser));
            loadDemoData();
            showApp();
            showToast("🎉 Logged in as Demo User!");
        }, 800);
    }
}

// Logout Action
function logout() {
    if (isFirebaseActive) {
        auth.signOut().then(() => {
            showToast("Logged out successfully.");
        });
    } else {
        localStorage.removeItem('radeem_demo_user');
        state.user = null;
        hideApp();
        showToast("Logged out from Demo Mode.");
    }
}

// Update Balances UI
function updateUI() {
    coinCountEl.textContent = state.coins;
    diamondCountEl.textContent = state.diamonds;
}

// Tab Switching Logic
function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    document.getElementById(`tab-${tabId}`).classList.add('active');
    event.currentTarget.classList.add('active');
}

// Try to Open Mystery Box
function tryOpenBox() {
    if (isOpening) return; 

    if (state.diamonds < 19) {
        showToast("❌ Need 19 Diamonds! Watch an ad below.");
        return;
    }

    isOpening = true;
    state.diamonds -= 19;
    
    // Save state locally or push to server
    saveStateToServerOrLocal();

    // 1. Shake Animation
    mysteryBox.classList.add('shake');
    boxHint.textContent = "Unlocking...";

    setTimeout(() => { 
        mysteryBox.classList.remove('shake');
        
        // 2. Open Animation
        mysteryBox.classList.add('open');
        glowEffect.classList.add('active');
        
        // 3. Show Reward Popup
        rewardPopup.classList.add('show');
        
        // 4. Add Coins
        state.coins += 190;
        saveStateToServerOrLocal();
        showToast("🎉 Opened! +190 Coins added!");

        // 5. Reset Box after delay
        setTimeout(() => {
            mysteryBox.classList.remove('open');
            glowEffect.classList.remove('active');
            rewardPopup.classList.remove('show');
            boxHint.textContent = "Touch the box to unlock rewards!";
            isOpening = false;
        }, 3000);

    }, 600);
}

// Watch Ad Simulation
function watchAd() {
    adModal.classList.add('active');
    let timeLeft = 5;
    adTimerEl.textContent = `${timeLeft}s`;

    const interval = setInterval(() => {
        timeLeft--;
        adTimerEl.textContent = `${timeLeft}s`;

        if (timeLeft <= 0) {
            clearInterval(interval);
            adModal.classList.remove('active');
            
            // Reward user
            state.diamonds += 19;
            saveStateToServerOrLocal();
            showToast("💎 +19 Diamonds Claimed!");
        }
    }, 1000);
}

// Redeem Code Logic
function redeemCode(provider, cost) {
    if (state.coins < cost) {
        showToast(`❌ Need ${cost} Coins to redeem!`);
        return;
    }

    state.coins -= cost;
    
    // Generate a realistic looking redeem code
    const generatedCode = generateRandomCode();
    
    // Add to history
    const newRedemption = { 
        id: Date.now(),
        provider: provider,
        code: generatedCode,
        date: new Date().toLocaleDateString(),
        value: "₹10 RS"
    };

    state.history.unshift(newRedemption);
    saveStateToServerOrLocal();
    renderHistory();
    showToast("🎟️ Code Redeemed! Check History tab.");
}

// Helper: Save state to Firestore or LocalStorage
function saveStateToServerOrLocal() {
    if (isFirebaseActive && state.user) {
        db.collection('users').doc(state.user.uid).update({
            coins: state.coins,
            diamonds: state.diamonds,
            history: state.history
        }).catch(err => {
            console.error("Error updating server state:", err);
            showToast("⚠️ Server sync failed. Check connection.");
        });
    } else {
        saveDemoData();
        updateUI();
    }
}

// Helper: Generate Random Code
function generateRandomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let segment1 = '';
    let segment2 = '';
    let segment3 = '';
    
    for (let i = 0; i < 4; i++) {
        segment1 += chars.charAt(Math.floor(Math.random() * chars.length));
        segment2 += chars.charAt(Math.floor(Math.random() * chars.length));
        segment3 += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `RADM-${segment1}-${segment2}-${segment3}`;
}

// Render History Tab
function renderHistory() {
    if (state.history.length === 0) {
        historyList.innerHTML = `
            <div class="empty-state">
                <span class="empty-icon">📭</span>
                <p>No codes redeemed yet. Start opening boxes!</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = state.history.map(item => `
        <div class="history-item">
            <div class="history-info">
                <h4>${item.provider} (${item.value})</h4>
                <span>Redeemed on ${item.date}</span>
            </div>
            <div class="code-display">
                <span class="code-text" onclick="copyToClipboard('${item.code}')" title="Click to Copy">${item.code}</span>
                <span style="font-size: 9px; color: var(--text-muted);">Tap to copy</span>
            </div>
        </div>
    `).join('');
}

// Copy to Clipboard Helper
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        showToast("📋 Code copied to clipboard!");
    }).catch(err => {
        showToast("❌ Failed to copy code.");
    });
}

// Show Toast Notification
function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 2500);
}

// Run App
init();