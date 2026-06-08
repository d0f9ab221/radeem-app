// Database Operations and Realtime Syncing

// Sync User Data in Realtime
function syncUserData(uid, callback) {
  const userRef = db.ref('users/' + uid);
  userRef.on('value', (snapshot) => {
    const data = snapshot.val();
    if (data) {
      callback(data);
    }
  });
  return userRef;
}

// Update User Balances
async function updateUserBalances(uid, coinsDelta, diamondsDelta) {
  const userRef = db.ref('users/' + uid);
  try {
    await userRef.transaction((currentData) => {
      if (currentData) {
        currentData.coins = (currentData.coins || 0) + coinsDelta;
        currentData.diamonds = (currentData.diamonds || 0) + diamondsDelta;
        // Prevent negative balances
        if (currentData.coins < 0) currentData.coins = 0;
        if (currentData.diamonds < 0) currentData.diamonds = 0;
      }
      return currentData;
    });
    return { success: true };
  } catch (error) {
    console.error("Transaction failed: ", error);
    return { success: false, message: error.message };
  }
}

// Create Redeem Request
async function createRedeemRequest(uid, email, coinsUsed, amount) {
  const userRef = db.ref('users/' + uid);
  const newRequestRef = db.ref('redeemRequests').push();
  
  try {
    let transactionSuccess = false;
    
    // First deduct coins safely
    await userRef.transaction((currentData) => {
      if (currentData && (currentData.coins || 0) >= coinsUsed) {
        currentData.coins -= coinsUsed;
        transactionSuccess = true;
        return currentData;
      }
      return; // Abort transaction if not enough coins
    });

    if (transactionSuccess) {
      // Create the redeem request record
      await newRequestRef.set({
        uid: uid,
        email: email,
        coinsUsed: coinsUsed,
        amount: amount,
        status: 'pending',
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
      return { success: true };
    } else {
      return { success: false, message: "Insufficient coins balance." };
    }
  } catch (error) {
    console.error("Redeem request failed: ", error);
    return { success: false, message: error.message };
  }
}

// Sync Redeem History
function syncRedeemHistory(uid, callback) {
  const requestsRef = db.ref('redeemRequests').orderByChild('uid').equalTo(uid);
  requestsRef.on('value', (snapshot) => {
    const requests = [];
    snapshot.forEach((childSnapshot) => {
      requests.push({
        id: childSnapshot.key,
        ...childSnapshot.val()
      });
    });
    // Sort by newest first
    requests.sort((a, b) => b.createdAt - a.createdAt);
    callback(requests);
  });
  return requestsRef;
}