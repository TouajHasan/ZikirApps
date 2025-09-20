importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.0/firebase-messaging.js');

// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object. Make sure to use the same
// values that you use in your web app. Note that this is not the
// same as the Firebase config object you use in your web app.
// It is a subset of the config object that is used to initialize
// the Firebase app in the service worker.
// For example, you only need to provide the 'apiKey' and 'projectId' for the service worker.
// The 'messagingSenderId' is also required for FCM.

// Replace with your actual Firebase config object
const firebaseConfig = {
    apiKey: 'AIzaSyBwMosnv7cpHvegTzj4c7swDvyQzTI0k1U',
    projectId: 'count-d6c8f',
    messagingSenderId: '633066867122',
    appId: '1:633066867122:web:7ff03e3b8be0633346bcab' // appId is also needed for some FCM features
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

// Optional: Handle messages in the background
messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/firebase-logo.png' // You might want to add a custom icon
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
