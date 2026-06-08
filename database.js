// Realtime Syncing of User Data
function syncUserData(uid, callback) {
    const userRef = firebase.database().ref(`users/${uid}`);
    userRef.on('value', (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.val());
        } else {
            callback(null);
        }
    });
}

// Watch Ad Reward (+1 Diamond)
async function rewardWatchAd(uid) {
    const userRef = firebase.database().ref(`users/${uid}`);
    try {
        await userRef.transaction((currentData) => {
            if (currentData) {
                currentData.diamonds = (currentData.diamonds || 0) + 1;
            }
            return currentData;
        });
    } catch (error) {
        console.error("Transaction failed: ", error);
        throw error;
    }
}

// Open Mystery Box (Deduct 19 Diamonds, Add 190 Coins)
async function openMysteryBoxDb(uid) {
    const userRef = firebase.database().ref(`users/${uid}`);
    let success = false;
    try {
        const result = await userRef.transaction((currentData) => {
            if (currentData) {
                if ((currentData.diamonds || 0) >= 19) {
                    currentData.diamonds -= 19;
                    currentData.coins = (currentData.coins || 0) + 190;
                    success = true;
                } else {
                    // Cancel transaction if not enough diamonds
                    return; 
                }
            }
            return currentData;
        });
        
        if (!result.committed || !success) {
            throw new Error("Insufficient diamonds to open the box!");
        }
        return true;
    } catch (error) {
        console.error("Mystery Box Transaction failed: ", error);
        throw error;
    }
}

// Create Redeem Request (Deduct 900 Coins, Create Request)
async function createRedeemRequest(uid, email, paymentDetails) {
    const userRef = firebase.database().ref(`users/${uid}`);
    const requestRef = firebase.database().ref('redeemRequests').push();
    let success = false;

    try {
        const result = await userRef.transaction((currentData) => {
            if (currentData) {
                if ((currentData.coins || 0) >= 900) {
                    currentData.coins -= 900;
                    success = true;
                }
            }
            return currentData;
        });

        if (result.committed && success) {
            await requestRef.set({
                uid: uid,
                email: email,
                paymentDetails: paymentDetails,
                coinsUsed: 900,
                amount: 10,
                status: 'pending',
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
            return true;
        } else {
            throw new Error("Insufficient coins! You need 900 coins.");
        }
    } catch (error) {
        console.error("Redeem Request failed: ", error);
        throw error;
    }
}