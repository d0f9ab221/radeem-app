// Main Application Logic
let currentUser = null;
let userSyncRef = null;
let historySyncRef = null;

// Initialize App State
document.addEventListener('DOMContentLoaded', () => {
  auth.onAuthStateChanged((user) => {
    if (user) {
      currentUser = user;
      initializeUI(user);
    } else {
      // If on a protected page, redirect to login
      const publicPages = ['login.html', 'register.html', 'forgot-password.html'];
      const currentPage = window.location.pathname.split('/').pop();
      if (!publicPages.includes(currentPage) && currentPage !== '') {
        window.location.href = 'login.html';
      }
    }
  });
});

// Initialize UI and Realtime Syncs
function initializeUI(user) {
  // Sync User Profile & Balances
  userSyncRef = syncUserData(user.uid, (data) => {
    updateHeaderBalances(data);
    updateDashboardStats(data);
    updateProfileDetails(data, user);
  });

  // Setup Navigation Active States
  setupNavigation();

  // Page-specific Initializations
  const currentPage = window.location.pathname.split('/').pop();
  if (currentPage === 'redeem.html') {
    initializeRedeemPage(user);
  } else if (currentPage === 'profile.html') {
    initializeProfilePage(user);
  } else if (currentPage === 'dashboard.html' || currentPage === '') {
    initializeDashboardPage();
  }
}

// Update Header Balances across all pages
function updateHeaderBalances(data) {
  const coinElements = document.querySelectorAll('.user-coins-value');
  const diamondElements = document.querySelectorAll('.user-diamonds-value');
  
  coinElements.forEach(el => el.textContent = data.coins || 0);
  diamondElements.forEach(el => el.textContent = data.diamonds || 0);
}

// Update Dashboard Stats
function updateDashboardStats(data) {
  const usernameEl = document.getElementById('dashboard-username');
  if (usernameEl) {
    usernameEl.textContent = data.username || 'User';
  }
  
  // Update progress bar based on coins earned towards next redeem (900 coins)
  const progressFill = document.getElementById('progress-fill');
  const progressText = document.getElementById('progress-text');
  if (progressFill && progressText) {
    const currentCoins = data.coins || 0;
    const target = 900;
    const percentage = Math.min(100, Math.floor((currentCoins / target) * 100));
    progressFill.style.width = `${percentage}%`;
    progressText.textContent = `${percentage}% to Next Redeem`;
  }
}

// Update Profile Details with Self-Healing Join Date
function updateProfileDetails(data, authUser) {
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileCoins = document.getElementById('profile-coins');
  const profileDiamonds = document.getElementById('profile-diamonds');
  const profileJoinDate = document.getElementById('profile-join-date');
  const profileAvatarContainer = document.getElementById('profile-avatar-container');

  if (profileName) profileName.textContent = data.username || 'User';
  if (profileEmail) profileEmail.textContent = data.email || authUser.email;
  if (profileCoins) profileCoins.textContent = data.coins || 0;
  if (profileDiamonds) profileDiamonds.textContent = data.diamonds || 0;
  
  if (profileJoinDate) {
    if (data.createdAt) {
      const date = new Date(data.createdAt);
      profileJoinDate.textContent = "Joined " + date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } else {
      // Self-healing fallback: write createdAt if missing
      const now = Date.now();
      db.ref('users/' + authUser.uid + '/createdAt').set(now);
      const date = new Date(now);
      profileJoinDate.textContent = "Joined " + date.toLocaleDateString('en-US', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    }
  }

  // Render Avatar (Google Photo or Initials SVG)
  if (profileAvatarContainer) {
    if (authUser.photoURL) {
      profileAvatarContainer.innerHTML = `<img src="${authUser.photoURL}" alt="Avatar" class="user-avatar-img">`;
    } else {
      const initial = (data.username || 'U').charAt(0).toUpperCase();
      profileAvatarContainer.innerHTML = `
        <div class="avatar-fallback-gradient">
          <span>${initial}</span>
        </div>
      `;
    }
  }
}

// Setup Navigation Active States
function setupNavigation() {
  const currentPage = window.location.pathname.split('/').pop();
  const navLinks = document.querySelectorAll('.nav-item');
  
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (currentPage === href || (currentPage === '' && href === 'dashboard.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// Watch Ads Simulation System
let isWatchingAd = false;
async function watchAd() {
  if (isWatchingAd) return;
  isWatchingAd = true;

  const watchBtn = document.getElementById('watch-ad-btn');
  if (watchBtn) {
    watchBtn.disabled = true;
    watchBtn.innerHTML = 'Loading Ad...';
  }

  // Show Ad Modal
  const adModal = document.getElementById('ad-modal');
  const adCountdown = document.getElementById('ad-countdown');
  const adProgressBar = document.getElementById('ad-progress-bar');
  
  if (adModal) {
    adModal.classList.add('active');
    let timeLeft = 5; // 5 seconds high-quality simulated ad
    adCountdown.textContent = timeLeft;
    adProgressBar.style.width = '100%';

    const interval = setInterval(() => {
      timeLeft--;
      adCountdown.textContent = timeLeft;
      adProgressBar.style.width = `${(timeLeft / 5) * 100}%`;

      if (timeLeft <= 0) {
        clearInterval(interval);
        showAdReward();
      }
    }, 1000);
  }
}

// Show Ad Reward Animation and Save to Firebase (+19 Diamonds)
async function showAdReward() {
  const adModal = document.getElementById('ad-modal');
  const rewardAnimation = document.getElementById('reward-animation');
  
  if (adModal) adModal.classList.remove('active');
  
  if (rewardAnimation) {
    rewardAnimation.classList.add('active');
  }

  // Save reward to Firebase (+19 Diamonds)
  if (currentUser) {
    await updateUserBalances(currentUser.uid, 0, 19);
  }

  setTimeout(() => {
    if (rewardAnimation) rewardAnimation.classList.remove('active');
    const watchBtn = document.getElementById('watch-ad-btn');
    if (watchBtn) {
      watchBtn.disabled = false;
      watchBtn.innerHTML = `
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="5 3 19 12 5 21 5 3"></polygon>
        </svg>
        Watch Video Ad
      `;
    }
    isWatchingAd = false;
  }, 2500);
}

// Mystery Box System
let isOpeningBox = false;
async function openMysteryBox() {
  if (isOpeningBox) return;
  
  // Fetch current diamonds first
  const snapshot = await db.ref('users/' + currentUser.uid + '/diamonds').once('value');
  const currentDiamonds = snapshot.val() || 0;

  if (currentDiamonds < 19) {
    showToast("Not enough diamonds! You need 19 Diamonds.", "error");
    return;
  }

  isOpeningBox = true;
  const boxContainer = document.getElementById('mystery-box-container');
  const boxStatusText = document.getElementById('box-status-text');
  const openBtn = document.getElementById('open-box-btn');

  if (openBtn) openBtn.disabled = true;
  if (boxStatusText) boxStatusText.textContent = "Opening...";

  // Trigger Shake and Glow Animations
  if (boxContainer) {
    boxContainer.classList.add('shaking');
  }

  // Deduct 19 Diamonds and Add 190 Coins instantly in Firebase
  const result = await updateUserBalances(currentUser.uid, 190, -19);

  if (result.success) {
    setTimeout(() => {
      if (boxContainer) {
        boxContainer.classList.remove('shaking');
        boxContainer.classList.add('open');
      }
      
      // Show Reward Reveal
      const rewardReveal = document.getElementById('box-reward-reveal');
      if (rewardReveal) {
        rewardReveal.classList.add('active');
      }

      if (boxStatusText) boxStatusText.textContent = "Box Opened!";
    }, 1500);

    // Reset Box State after showing reward
    setTimeout(() => {
      const boxContainer = document.getElementById('mystery-box-container');
      const rewardReveal = document.getElementById('box-reward-reveal');
      
      if (boxContainer) boxContainer.classList.remove('open');
      if (rewardReveal) rewardReveal.classList.remove('active');
      if (boxStatusText) boxStatusText.textContent = "Tap to Open!";
      if (openBtn) openBtn.disabled = false;
      
      isOpeningBox = false;
      showToast("Successfully claimed 190 Coins!", "success");
    }, 4500);
  } else {
    if (boxContainer) boxContainer.classList.remove('shaking');
    if (boxStatusText) boxStatusText.textContent = "Tap to Open!";
    if (openBtn) openBtn.disabled = false;
    isOpeningBox = false;
    showToast(result.message || "Failed to open box.", "error");
  }
}

// Initialize Redeem Page
function initializeRedeemPage(user) {
  // Sync Redeem History
  historySyncRef = syncRedeemHistory(user.uid, (requests) => {
    const historyContainer = document.getElementById('redeem-history-list');
    if (!historyContainer) return;

    if (requests.length === 0) {
      historyContainer.innerHTML = `
        <div class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <p>No redeem history found.</p>
        </div>
      `;
      return;
    }

    historyContainer.innerHTML = requests.map(req => {
      const date = new Date(req.createdAt).toLocaleDateString();
      const statusClass = req.status === 'pending' ? 'status-pending' : 'status-approved';
      return `
        <div class="history-card">
          <div class="history-info">
            <span class="history-title">₹${req.amount} Redeem Code</span>
            <span class="history-date">${date}</span>
          </div>
          <div class="history-status">
            <span class="status-badge ${statusClass}">${req.status.toUpperCase()}</span>
            <span class="history-cost">-${req.coinsUsed} Coins</span>
          </div>
        </div>
      `;
    }).join('');
  });
}

// Process Redeem Request
async function processRedeem() {
  const snapshot = await db.ref('users/' + currentUser.uid + '/coins').once('value');
  const currentCoins = snapshot.val() || 0;

  if (currentCoins < 900) {
    showToast("Insufficient coins! You need at least 900 Coins.", "error");
    return;
  }

  const redeemBtn = document.getElementById('redeem-btn');
  if (redeemBtn) redeemBtn.disabled = true;

  const result = await createRedeemRequest(currentUser.uid, currentUser.email, 900, 10);
  
  if (result.success) {
    showToast("Redeem request submitted successfully!", "success");
  } else {
    showToast(result.message || "Redeem failed. Try again.", "error");
  }

  if (redeemBtn) redeemBtn.disabled = false;
}

// Initialize Profile Page
function initializeProfilePage(user) {
  const editBtn = document.getElementById('edit-profile-btn');
  const saveBtn = document.getElementById('save-profile-btn');
  const usernameInput = document.getElementById('edit-username');
  const profileDisplay = document.getElementById('profile-display-group');
  const profileEditForm = document.getElementById('profile-edit-form');

  if (editBtn && saveBtn && usernameInput && profileDisplay && profileEditForm) {
    editBtn.addEventListener('click', () => {
      profileDisplay.classList.add('hidden');
      profileEditForm.classList.remove('hidden');
      // Pre-fill current username
      db.ref('users/' + user.uid + '/username').once('value').then(snap => {
        usernameInput.value = snap.val() || '';
      });
    });

    saveBtn.addEventListener('click', async () => {
      const newUsername = usernameInput.value.trim();
      if (!newUsername) {
        showToast("Username cannot be empty!", "error");
        return;
      }

      saveBtn.disabled = true;
      await db.ref('users/' + user.uid).update({
        username: newUsername
      });
      
      profileDisplay.classList.remove('hidden');
      profileEditForm.classList.add('hidden');
      saveBtn.disabled = false;
      showToast("Profile updated successfully!", "success");
    });
  }
}

// Toast Notification Helper
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.classList.add('show');
  }, 100);

  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}