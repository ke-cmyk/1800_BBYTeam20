/* Loaded on:
 * login.html
 */

// Initialize the FirebaseUI Widget using Firebase.
var ui = new firebaseui.auth.AuthUI(firebase.auth());

/**
 * User authentication setup.
 */
var uiConfig = {
  callbacks: {
    signInSuccessWithAuthResult: function (authResult, redirectUrl) {
      // User successfully signed in.
      // Return type determines whether we continue the redirect automatically
      // or whether we leave that to developer to handle.
      //------------------------------------------------------------------------------------------
      // The code below is modified from default snippet provided by the FB documentation.
      //
      // If the user is a "brand new" user, then create a new "user" in your own database.
      // Assign this user with the name and email provided.
      // Before this works, you must enable "Firestore" from the firebase console.
      // The Firestore rules must allow the user to write.
      //------------------------------------------------------------------------------------------
      var user = authResult.user;
      if (authResult.additionalUserInfo.isNewUser) {
        console.log(user.displayName + " " + user.email + " " + user.uid);
        db.collection("users").doc(user.uid).set({
          name: user.displayName,
          email: user.email,
          userID: user.uid,
          profile: "https://firebasestorage.googleapis.com/v0/b/autobridge20.appspot.com/o/User%20Profile%20Pictures%2FdefaultAccount.svg?alt=media&token=6399ebf4-08d4-4fdd-9f33-c6d6ce7a9752",
          vehicles: [],
          requests: [],
          offers: [],
          offerVehicleIDs: []
        }).then(function () {
          console.log("New user added to firestore");
          window.location.assign("home.html");       //re-direct to home.html after sign-up
        }).catch(function (error) {
          console.log("Error adding new user: " + error);
        });
      } else {
        return true;
      }
      return false;
    },
    uiShown: function () {
      // The widget is rendered.
      // Hide the loader.
      document.getElementById('loader').style.display = 'none';
    }
  },
  // Will use popup for IDP Providers sign-in flow instead of the default, redirect.
  signInFlow: 'popup',
  signInSuccessUrl: "home.html",
  signInOptions: [
    // Leave the lines as is for the providers you want to offer your users.
    // firebase.auth.GoogleAuthProvider.PROVIDER_ID,
    // firebase.auth.FacebookAuthProvider.PROVIDER_ID,
    // firebase.auth.TwitterAuthProvider.PROVIDER_ID,
    // firebase.auth.GithubAuthProvider.PROVIDER_ID,
    firebase.auth.EmailAuthProvider.PROVIDER_ID,
    // firebase.auth.PhoneAuthProvider.PROVIDER_ID
  ],
  // Terms of service url.
  tosUrl: "", // your-tos-url
  // Privacy policy url.
  privacyPolicyUrl: "" //your-privacy-policy-url
};

ui.start('#firebaseui-auth-container', uiConfig);