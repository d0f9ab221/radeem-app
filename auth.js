// Email/Password Register
async function signUpWithEmail(email, password, username) {
    try {
        const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Create user profile in Realtime Database
        await firebase.database().ref(`users/${user.uid}`).set({
            username: username,
            email: email,
            coins: 0,
            diamonds: 0,
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        throw error;
    }
}

// Email/Password Login
async function signInWithEmail(email, password) {
    try {
        await firebase.auth().signInWithEmailAndPassword(email, password);
        window.location.href = 'dashboard.html';
    } catch (error) {
        throw error;
    }
}

// Google Sign-In
async function signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    try {
        const result = await firebase.auth().signInWithPopup(provider);
        const user = result.user;
        
        // Check if user already exists in database
        const snapshot = await firebase.database().ref(`users/${user.uid}`).once('value');
        if (!snapshot.exists()) {
            // Create profile for new Google user
            await firebase.database().ref(`users/${user.uid}`).set({
                username: user.displayName || 'Google User',
                email: user.email,
                coins: 0,
                diamonds: 0,
                createdAt: firebase.database.ServerValue.TIMESTAMP
            });
        }
        
        window.location.href = 'dashboard.html';
    } catch (error) {
        throw error;
    }
}

// Password Reset
async function resetPassword(email) {
    try {
        await firebase.auth().sendPasswordResetEmail(email);
    } catch (error) {
        throw error;
    }
}

// Logout
async function logoutUser() {
    try {
        await firebase.auth().signOut();
        window.location.href = 'login.html';
    } catch (error) {
        console.error("Logout Error:", error);
    }
}