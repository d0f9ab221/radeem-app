// Global State
let currentUser = null;
let userCoins = 0;
let userDiamonds = 0;

// Route Protection & Auth State Observer
firebase.auth().onAuthStateChanged((user) => {
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    currentUser = user;
    
    // Sync User Data in Realtime
    syncUserData(user.uid, (data) => {
        if (data) {
            userCoins = data.coins || 0;
            userDiamonds = data.diamonds || 0;
            updateUI(data);
        }
    });
});

// Update UI Elements
function updateUI(data) {
    // Header Balances
    const headerCoins = document.getElementById('header-coins');
    const headerDiamonds = document.getElementById('header-diamonds');
    if (headerCoins) headerCoins.innerText = data.coins || 0;
    if (headerDiamonds) headerDiamonds.innerText = data.diamonds || 0;

    // Greeting
    const greeting = document.getElementById('user-greeting');
    if (greeting) greeting.innerText = `Hello, ${data.username || 'User'}`;

    // Stats Tab
    const statsCoins = document.getElementById('stats-coins');
    const statsDiamonds = document.getElementById('stats-diamonds');
    if (statsCoins) statsCoins.innerText = data.coins || 0;
    if (statsDiamonds) statsDiamonds.innerText = data.diamonds || 0;

    // Progress Bar (Simulated Daily Goal based on Diamonds)
    const progressText = document.getElementById('progress-text');
    const progressBarFill = document.getElementById('progress-bar-fill');
    if (progressText && progressBarFill) {
        const watchedCount = Math.min(data.diamonds % 10, 10); // Simulated daily progress
        progressText.innerText = `${watchedCount}/10 Ads Watched`;
        progressBarFill.style.width = `${watchedCount * 10}%`;
    }

    // Mystery Box Warning
    const boxWarning = document.getElementById('box-warning');
    if (boxWarning) {
        if (data.diamonds < 19) {
            boxWarning.innerText = `You need ${19 - data.diamonds} more diamonds to open.`;
            boxWarning.style.color = '#ff4d4d';
        } else {
            boxWarning.innerText = 'Ready to open!';
            boxWarning.style.color = '#2ec4b6';
        }
    }
}

// Tab Navigation Logic
const navItems = document.querySelectorAll('.nav-item');
const tabContents = document.querySelectorAll('.tab-content');

navItems.forEach(item => {
    item.addEventListener('click', () => {
        const tabId = item.getAttribute('data-tab');
        if (!tabId) return; // External links like Profile/Redeem

        // Update Active Nav Item
        navItems.forEach(nav => nav.classList.remove('active'));
        item.classList.add('active');

        // Update Active Tab Content
        tabContents.forEach(content => content.classList.remove('active'));
        document.getElementById(`tab-${tabId}`).classList.add('active');
    });
});

// Handle URL Query Params for Tab Redirection
window.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');
    if (tabParam) {
        const targetNav = document.querySelector(`.nav-item[data-tab="${tabParam}"]`);
        if (targetNav) targetNav.click();
    }
});

// --- WATCH ADS SYSTEM ---
const btnWatchAd = document.getElementById('btn-watch-ad');
const adModal = document.getElementById('ad-modal');
const adTimer = document.getElementById('ad-timer');
const adProgress = document.getElementById('ad-progress');
const rewardSplash = document.getElementById('reward-splash');

if (btnWatchAd) {
    btnWatchAd.addEventListener('click', () => {
        // Prevent spam clicks
        btnWatchAd.disabled = true;
        btnWatchAd.innerText = 'Loading Ad...';

        // Open Simulated Ad Modal
        setTimeout(() => {
            adModal.classList.remove('hidden');
            startAdCountdown();
        }, 1000);
    });
}

function startAdCountdown() {
    let timeLeft = 15;
    adTimer.innerText = `${timeLeft}s`;
    adProgress.style.width = '100%';

    const interval = setInterval(() => {
        timeLeft--;
        adTimer.innerText = `${timeLeft}s`;
        adProgress.style.width = `${(timeLeft / 15) * 100}%`;

        if (timeLeft <= 0) {
            clearInterval(interval);
            claimAdReward();
        }
    }, 1000);
}

async function claimAdReward() {
    adModal.classList.add('hidden');
    
    try {
        if (currentUser) {
            await rewardWatchAd(currentUser.uid);
            // Show Reward Splash
            rewardSplash.classList.remove('hidden');
        }
    } catch (error) {
        alert("Failed to claim reward: " + error.message);
    } finally {
        if (btnWatchAd) {
            btnWatchAd.disabled = false;
            btnWatchAd.innerText = 'Watch Video Ad';
        }
    }
}

function closeSplash() {
    rewardSplash.classList.add('hidden');
}

// --- MYSTERY BOX SYSTEM ---
const btnOpenBox = document.getElementById('btn-open-box');
const mysteryBox = document.getElementById('mystery-box');
const rewardReveal = document.getElementById('reward-reveal');
const particlesContainer = document.getElementById('particles');

if (btnOpenBox) {
    btnOpenBox.addEventListener('click', async () => {
        if (userDiamonds < 19) {
            alert("You don't have enough diamonds!");
            return;
        }

        // Disable button & start premium animation sequence
        btnOpenBox.disabled = true;
        btnOpenBox.innerText = 'Opening...';
        
        // 1. Shake Phase
        mysteryBox.classList.add('shake');
        createParticles();

        setTimeout(async () => {
            try {
                // Deduct diamonds and add coins in DB
                await openMysteryBoxDb(currentUser.uid);
                
                // 2. Open Phase
                mysteryBox.classList.remove('shake');
                mysteryBox.classList.add('open');
                
                // 3. Reveal Reward
                setTimeout(() => {
                    rewardReveal.classList.remove('hidden');
                    rewardReveal.classList.add('reveal-anim');
                }, 500);

                // Reset Box after 4 seconds
                setTimeout(() => {
                    mysteryBox.classList.remove('open');
                    rewardReveal.classList.add('hidden');
                    rewardReveal.classList.remove('reveal-anim');
                    btnOpenBox.disabled = false;
                    btnOpenBox.innerText = 'Open Box (19 💎)';
                }, 4500);

            } catch (error) {
                alert(error.message);
                mysteryBox.classList.remove('shake');
                btnOpenBox.disabled = false;
                btnOpenBox.innerText = 'Open Box (19 💎)';
            }
        }, 1500);
    });
}

function createParticles() {
    particlesContainer.innerHTML = '';
    for (let i = 0; i < 20; i++) {
        const particle = document.createElement('div');
        particle.classList.add('particle');
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 0.5}s`;
        particlesContainer.appendChild(particle);
    }
}