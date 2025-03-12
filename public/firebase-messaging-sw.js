// Firebase Messaging Service Worker

// Import and configure the Firebase SDK
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js"
);

// Initialize the Firebase app in the service worker
firebase.initializeApp({
  // Your firebase configuration object
  // This should match your firebase config from app/lib/firebase.js
  // apiKey, authDomain, projectId, etc. should be filled in
  // with your actual Firebase project details
});

// Retrieve an instance of Firebase Messaging
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: "/favicon.ico",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Optional: Add additional service worker features like caching
self.addEventListener("fetch", (event) => {
  // You can implement caching strategies here if needed
});
