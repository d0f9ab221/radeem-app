// State Management
let state = {
    coins: parseInt(localStorage.getItem('radeem_coins')) || 0,
    diamonds: parseInt(localStorage.getItem('radeem_diamonds')) || 0,
    history: JSON.parse(localStorage.getItem('radeem_history')) || []
};

// Audio Synthesis for Game-like Sound Effects
const playSound = (type) => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);

        if (type === 'click') {
            osc.frequency.setValueAtTime(400, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
        } else if (type === 'success') {
            osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
            osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
            osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
            osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.3); // C6
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
            osc.start();
            osc.stop(ctx.currentTime + 0.5);
        } else if (type === 'error') {
            osc.frequency.setValueAtTime(220, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(110, ctx.currentTime + 0.2);
            gain.gain.setValueAtTime(0.2, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
            osc.start();
            osc.stop(ctx.currentTime + 0.25);
        } else if (type === 'ad') {
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.1, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
            osc.start();
            osc.stop(ctx.currentTime + 0.2);
        }
    } catch (e) {
        console.log('Audio context not allowed yet');
    }
};

// Update UI Elements
function updateUI() {
    document.getElementById('coin-balance').innerText = state.coins.toLocaleString();
    document.getElementById('diamond-balance').innerText = state.diamonds.toLocaleString();
    saveState();
    renderHistory();
}

// Save State to LocalStorage
function saveState() {
    localStorage.setItem('radeem_coins', state.coins);
    localStorage.setItem('radeem_diamonds', state.diamonds);
    localStorage.setItem('radeem_history', JSON.stringify(state.history));
}

// Tab Switching Logic
function switchTab(tabId) {
    playSound('click');
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    // Show selected tab
    document.getElementById(`tab-${tabId}`).classList.remove('hidden');

    // Update navigation active states
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active', 'text-indigo-600', 'font-semibold');
        btn.classList.add('text-slate-400');
    });
    const activeBtn = document.getElementById(`nav-${tabId}`);
    activeBtn.classList.add('active', 'text-indigo-600', 'font-semibold');
    activeBtn.classList.remove('text-slate-400');
}

// Toast Notification
function showToast(message, isError = false) {
    const toast = document.getElementById('toast');
    const toastMsg = document.getElementById('toast-msg');
    toastMsg.innerText = message;
    
    if (isError) {
        toast.classList.remove('bg-slate-800');
        toast.classList.add('bg-rose-600');
    } else {
        toast.classList.remove('bg-rose-600');
        toast.classList.add('bg-slate-800');
    }

    toast.classList.remove('opacity-0', 'pointer-events-none');
    toast.classList.add('opacity-100');

    setTimeout(() => {
        toast.classList.add('opacity-0', 'pointer-events-none');
        toast.classList.remove('opacity-100');
    }, 3000);
}

// Simulated Video Ad Logic
const btnWatchAd = document.getElementById('btn-watch-ad');
const adModal = document.getElementById('ad-modal');
const adTimer = document.getElementById('ad-timer');
const btnCloseAd = document.getElementById('btn-close-ad');

btnWatchAd.addEventListener('click', () => {
    playSound('click');
    adModal.classList.remove('hidden');
    let timeLeft = 5;
    adTimer.innerText = `${timeLeft}s`;
    btnCloseAd.disabled = true;
    btnCloseAd.className = "w-full bg-slate-200 text-slate-400 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2 cursor-not-allowed";
    btnCloseAd.innerHTML = `<span>Wait to Skip (${timeLeft}s)</span>`;

    const interval = setInterval(() => {
        timeLeft--;
        if (timeLeft > 0) {
            adTimer.innerText = `${timeLeft}s`;
            btnCloseAd.innerHTML = `<span>Wait to Skip (${timeLeft}s)</span>`;
        } else {
            clearInterval(interval);
            adTimer.innerText = "Reward Ready!";
            adTimer.className = "bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full";
            btnCloseAd.disabled = false;
            btnCloseAd.className = "w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 px-4 rounded-xl text-sm transition-all hover:opacity-95 flex items-center justify-center gap-2 cursor-pointer";
            btnCloseAd.innerHTML = `<span>Claim 19 Diamonds</span> <i class="fa-solid fa-circle-check"></i>`;
            playSound('ad');
        }
    }, 1000);
});

btnCloseAd.addEventListener('click', () => {
    if (btnCloseAd.disabled) return;
    adModal.classList.add('hidden');
    // Reset timer badge style
    adTimer.className = "bg-indigo-600 text-white text-xs font-bold px-2.5 py-1 rounded-full";
    
    // Reward diamonds
    state.diamonds += 19;
    updateUI();
    playSound('success');
    showToast("🎉 +19 Diamonds added to your wallet!");
});

// Mystery Box Opening Logic
const btnOpenBox = document.getElementById('btn-open-box');
const mysteryBoxContainer = document.getElementById('mystery-box-container');
const rewardModal = document.getElementById('reward-modal');
const rewardCard = document.getElementById('reward-card');

btnOpenBox.addEventListener('click', triggerBoxOpen);
mysteryBoxContainer.addEventListener('click', triggerBoxOpen);

function triggerBoxOpen() {
    if (state.diamonds < 19) {
        playSound('error');
        showToast("❌ Not enough Diamonds! Watch an ad to get 19 Diamonds.", true);
        return;
    }

    // Deduct diamonds
    state.diamonds -= 19;
    updateUI();
    playSound('click');

    // Trigger shake animation
    mysteryBoxContainer.classList.add('shake-box');
    
    setTimeout(() => {
        mysteryBoxContainer.classList.remove('shake-box');
        // Reward coins
        state.coins += 190;
        updateUI();
        
        // Show reward modal
        rewardModal.classList.remove('hidden');
        setTimeout(() => {
            rewardCard.classList.remove('scale-95');
            rewardCard.classList.add('scale-100');
        }, 50);
        
        playSound('success');
        triggerConfetti();
    }, 800);
}

function closeRewardModal() {
    playSound('click');
    rewardCard.classList.remove('scale-100');
    rewardCard.classList.add('scale-95');
    setTimeout(() => {
        rewardModal.classList.add('hidden');
    }, 150);
}

// Redeem Code Logic
function redeemCode(amountRs, coinCost) {
    if (state.coins < coinCost) {
        playSound('error');
        showToast(`❌ Insufficient coins! You need ${coinCost} coins.`, true);
        return;
    }

    // Deduct coins
    state.coins -= coinCost;
    
    // Generate mock Google Play Redeem Code
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = 'GP-';
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            code += characters.charAt(Math.floor(Math.random() * characters.length));
        }
        if (i < 3) code += '-';
    }

    // Add to history
    const redeemItem = {
        id: Date.now(),
        title: `₹${amountRs} Google Play Code`,
        code: code,
        cost: coinCost,
        date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    
    state.history.unshift(redeemItem);
    updateUI();
    playSound('success');
    triggerConfetti();

    // Show success alert with code
    alert(`🎉 Redemption Successful!\n\nYour ₹${amountRs} Google Play Redeem Code is:\n${code}\n\nYou can copy this code anytime from the History tab.`);
}

// Render History List
function renderHistory() {
    const historyList = document.getElementById('history-list');
    if (state.history.length === 0) {
        historyList.innerHTML = `
            <div class="text-center py-12 text-slate-400">
                <i class="fa-solid fa-receipt text-4xl mb-3 opacity-50"></i>
                <p class="text-sm">No codes redeemed yet. Start earning!</p>
            </div>
        `;
        return;
    }

    historyList.innerHTML = state.history.map(item => `
        <div class="bg-white border border-slate-100 rounded-2xl p-4 shadow-sm flex flex-col gap-3">
            <div class="flex justify-between items-start">
                <div>
                    <h4 class="font-bold text-slate-800 text-sm">${item.title}</h4>
                    <span class="text-[10px] text-slate-400">${item.date}</span>
                </div>
                <span class="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                    -${item.cost} Coins
                </span>
            </div>
            <div class="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                <code class="font-mono font-bold text-indigo-600 text-xs tracking-wider">${item.code}</code>
                <button onclick="copyToClipboard('${item.code}')" class="text-indigo-600 hover:text-indigo-800 text-xs font-bold flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-indigo-50 transition-all">
                    <i class="fa-regular fa-copy"></i> Copy
                </button>
            </div>
        </div>
    `).join('');
}

// Copy to Clipboard Helper
function copyToClipboard(text) {
    navigator.clipboard.writeText(text).then(() => {
        playSound('click');
        showToast("📋 Code copied to clipboard!");
    }).catch(err => {
        showToast("❌ Failed to copy code", true);
    });
}

// Confetti Animation Effect
function triggerConfetti() {
    const container = document.getElementById('confetti-container');
    const colors = ['#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ec4899'];
    
    for (let i = 0; i < 50; i++) {
        const confetti = document.createElement('div');
        confetti.classList.add('confetti');
        confetti.style.left = Math.random() * 100 + 'vw';
        confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        confetti.style.transform = `scale(${Math.random() * 0.6 + 0.4})`;
        confetti.style.animationDuration = Math.random() * 2 + 1.5 + 's';
        container.appendChild(confetti);
        
        // Remove after animation completes
        setTimeout(() => {
            confetti.remove();
        }, 3500);
    }
}

// Initial Load
window.onload = () => {
    updateUI();
};