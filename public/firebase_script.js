// Import the functions you need from the SDKs you need

  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";

  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-analytics.js";
  import { getAuth } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

  // TODO: Add SDKs for Firebase products that you want to use

  // https://firebase.google.com/docs/web/setup#available-libraries


  // Your web app's Firebase configuration

  // For Firebase JS SDK v7.20.0 and later, measurementId is optional

  const firebaseConfig = {

    apiKey: "AIzaSyA-t63YOUUZmWDMSF04uMKHEq6XRtzuc1c",

    authDomain: "sahyadri-61c65.firebaseapp.com",

    projectId: "sahyadri-61c65",

    storageBucket: "sahyadri-61c65.firebasestorage.app",

    messagingSenderId: "1063304018395",

    appId: "1:1063304018395:web:1da0f9802cc6ae3041cffe",

    measurementId: "G-WSNTJ1NCYN"

  };


  // Initialize Firebase

  const app = initializeApp(firebaseConfig);

  const analytics = getAnalytics(app);
  const auth = getAuth(app);

  export { app, auth };
