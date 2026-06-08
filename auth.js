// Authentication Helper Functions

// Check if user is logged in and redirect if necessary
function checkAuthState(requireAuth, redirectUrl) {
  auth.onAuthStateChanged((user) => {
    if (user) {
      if (!requireAuth) {
        window.location.href = redirectUrl;
      }
    }
  } else {
    if (requireAuth) {
      window.location.href = redirectUrl;
    }
  }
});
}

// Register with Email and Password
async function registerWithEmail(email, password, username) {
  try {
    const userCredential = await auth.createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Create user profile in Realtime Database with Server Timestamp
    await db.ref('users/' + user.uid).set({
      username: username,
      email: email,
      coins: 0,
      diamonds: 0,
      createdAt: firebase.database.ServerValue.TIMESTAMP
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Login with Email and Password
async function loginWithEmail(email, password) {
  try {
    await auth.signInWithEmailAndPassword(email, password);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Sign In with Google
async function signInWithGoogle() {
  try {
    const result = await auth.signInWithPopup(googleProvider);
    const user = result.user;
    
    // Check if user already exists in database
    const snapshot = await db.ref('users/' + user.uid).once('value');
    if (!snapshot.exists()) {
      // Create profile for new Google user with Server Timestamp
      await db.ref('users/' + user.uid).set({
        username: user.displayName || 'User_' + Math.random().toString(36).substring(2, 7),
        email: user.email,
        coins: 0,
        diamonds: 0,
        createdAt: firebase.database.ServerValue.TIMESTAMP
      });
    }
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Send Password Reset Email
async function sendPasswordReset(email) {
  try {
    await auth.sendPasswordResetEmail(email);
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

// Logout User
async function logoutUser() {
  try {
    await auth.signOut();
    window.location.href = 'login.html';
  } catch (error) {
    console.error("Logout Error:", error);
  }
}