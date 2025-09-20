// Firebase Configuration
const firebaseConfig = {
    apiKey: 'AIzaSyBwMosnv7cpHvegTzj4c7swDvyQzTI0k1U',
    appId: '1:633066867122:web:7ff03e3b8be0633346bcab',
    messagingSenderId: '633066867122',
    projectId: 'count-d6c8f',
    authDomain: 'count-d6c8f.firebaseapp.com',
    databaseURL: 'https://count-d6c8f-default-rtdb.firebaseio.com',
    storageBucket: 'count-d6c8f.firebasestorage.app',
    measurementId: 'G-2797W8XZQQ',
};

// Initialize Firebase App (core)
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Function to fetch app config and update the UI
async function fetchAppConfig() {
    try {
        const docRef = db.collection('app_config').doc('latest_version');
        const doc = await docRef.get();

        if (doc.exists) {
            const data = doc.data();
            const apkLink = data.apk_link;
            const versionName = data.version_name;

            const downloadButtons = document.querySelectorAll('#download-button, #final-download-button');
            downloadButtons.forEach(button => {
                if (apkLink) {
                    button.setAttribute('href', apkLink);
                }
            });
            
            const versionInfo = document.getElementById('version-info');
            if (versionInfo && versionName) {
                versionInfo.textContent = `সর্বশেষ ভার্সন: ${versionName}`;
            }

        } else {
            console.log("App config document not found!");
        }
    } catch (error) {
        console.error("Error getting app config:", error);
    }
}

// Generic function to fetch themes for index and themes pages
async function fetchThemes(options = {}) {
    const { limit, containerId, detailed } = options;
    const themesGrid = document.getElementById(containerId);
    if (!themesGrid) return;

    const spinner = themesGrid.querySelector('.spinner-container');

    try {
        let query = db.collection('themes');
        if (limit) {
            query = query.limit(limit);
        }
        const querySnapshot = await query.get();
        
        if (spinner) {
            spinner.style.display = 'none'; // Hide spinner once data is fetched
        }

        if (querySnapshot.empty) {
            themesGrid.innerHTML = '<p style="color: #aaa;">কোনো থিম পাওয়া যায়নি।</p>';
            return;
        }

        querySnapshot.forEach(doc => {
            const themeData = doc.data();
            let themeUrl = themeData.backgroundImageUrl;

            if (themeUrl) {
                const cardLink = document.createElement('a');
                cardLink.href = `theme-details.html?id=${doc.id}`;
                cardLink.classList.add('theme-card-link');

                const card = document.createElement('div');
                card.classList.add('theme-card');
                card.style.backgroundImage = `url(${themeUrl})`;

                if (detailed) {
                    const details = document.createElement('div');
                    details.classList.add('theme-card-details');
                    const name = document.createElement('h3');
                    name.textContent = themeData.name || 'Unnamed Theme';
                    const price = document.createElement('p');
                    price.textContent = `${themeData.price || 0} ${themeData.currency || 'token'}`;
                    details.appendChild(name);
                    details.appendChild(price);
                    card.appendChild(details);
                }
                
                cardLink.appendChild(card);
                themesGrid.appendChild(cardLink);
            }
        });
    } catch (error) {
        console.error("Error fetching themes:", error);
        if (spinner) {
            spinner.style.display = 'none';
        }
        themesGrid.innerHTML = '<p style="color: #aaa;">থিম লোড করা সম্ভব হয়নি।</p>';
    }
}

// Function to fetch and display details for a single theme
async function fetchThemeDetails() {
    const container = document.getElementById('theme-details-container');
    if (!container) return;

    const spinner = container.querySelector('.spinner-container');

    const params = new URLSearchParams(window.location.search);
    const themeId = params.get('id');

    if (!themeId) {
        if (spinner) spinner.style.display = 'none';
        container.innerHTML = '<p style="color: #aaa;">কোনো থিম আইডি পাওয়া যায়নি।</p>';
        return;
    }

    try {
        const docRef = db.collection('themes').doc(themeId);
        const doc = await docRef.get();

        if (spinner) spinner.style.display = 'none';

        if (!doc.exists) {
            container.innerHTML = '<p style="color: #aaa;">এই থিমটি খুঁজে পাওয়া যায়নি।</p>';
            return;
        }

        const themeData = doc.data();
        
        const content = document.createElement('div');
        content.classList.add('theme-details-content');

        const imageDiv = document.createElement('div');
        const image = document.createElement('img');
        image.src = themeData.backgroundImageUrl;
        image.alt = themeData.name;
        image.classList.add('theme-details-image');
        imageDiv.appendChild(image);

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('theme-details-info');
        
        const title = document.createElement('h1');
        title.textContent = themeData.name || 'Unnamed Theme';
        infoDiv.appendChild(title);

        const detailsList = document.createElement('ul');
        detailsList.classList.add('details-list');

        for (const key in themeData) {
            if (Object.hasOwnProperty.call(themeData, key)) {
                const value = themeData[key];
                const li = document.createElement('li');
                
                const keySpan = document.createElement('span');
                keySpan.classList.add('key');
                keySpan.textContent = key.replace(/([A-Z])/g, ' $1');
                
                const valueSpan = document.createElement('span');
                valueSpan.classList.add('value');
                
                if (typeof value === 'string' && value.startsWith('#')) {
                    const swatch = document.createElement('div');
                    swatch.classList.add('color-swatch');
                    swatch.style.backgroundColor = value;
                    valueSpan.appendChild(swatch);
                }
                
                valueSpan.append(String(value));
                
                li.appendChild(keySpan);
                li.appendChild(valueSpan);
                detailsList.appendChild(li);
            }
        }
        
        infoDiv.appendChild(detailsList);
        content.appendChild(imageDiv);
        content.appendChild(infoDiv);
        container.innerHTML = ''; // Clear loading/error message
        container.appendChild(content);

    } catch (error) {
        console.error("Error fetching theme details:", error);
        if (spinner) spinner.style.display = 'none';
        container.innerHTML = '<p style="color: #aaa;">থিমের বিবরণ লোড করা সম্ভব হয়নি।</p>';
    }
}

// --- Web Push Notification Logic ---
async function setupNotifications() {
    const subscribeButton = document.getElementById('subscribeButton');
    if (!subscribeButton) return; // Only run if button exists

    // Initialize messaging here, after firebase.initializeApp()
    const messaging = firebase.messaging(); 

    // Check if messaging is supported
    if (!firebase.messaging.isSupported()) {
        subscribeButton.textContent = 'নোটিফিকেশন সমর্থিত নয়';
        subscribeButton.disabled = true;
        return;
    }

    // Register service worker
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/firebase-messaging-sw.js')
            .then((registration) => {
                console.log('Service Worker registered with scope:', registration.scope);
            })
            .catch((error) => {
                console.error('Service Worker registration failed:', error);
            });
    }

    // Request permission and get token
    const requestPermission = async () => {
        try {
            const permission = await Notification.requestPermission();
            if (permission === 'granted') {
                subscribeButton.textContent = 'নোটিফিকেশন চালু আছে';
                subscribeButton.disabled = true;
                const token = await messaging.getToken({ vapidKey: 'YOUR_VAPID_KEY_HERE' }); // IMPORTANT: Replace with your VAPID key
                console.log('FCM Token:', token);
                // Optional: Save token to Firestore
                if (token) {
                    await db.collection('fcmTokens').doc(token).set({
                        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                        userAgent: navigator.userAgent
                    });
                    console.log('FCM Token saved to Firestore.');
                }
            } else {
                subscribeButton.textContent = 'নোটিফিকেশন ব্লক করা হয়েছে';
                subscribeButton.disabled = true;
                console.warn('Notification permission denied or blocked.');
            }
        } catch (error) {
            console.error('Error getting notification permission or token:', error);
            subscribeButton.textContent = 'এরর: আবার চেষ্টা করুন';
            subscribeButton.disabled = false;
        }
    };

    // Initial check for permission status
    if (Notification.permission === 'granted') {
        subscribeButton.textContent = 'নোটিফিকেশন চালু আছে';
        subscribeButton.disabled = true;
    } else if (Notification.permission === 'denied') {
        subscribeButton.textContent = 'নোটিফিকেশন ব্লক করা হয়েছে';
        subscribeButton.disabled = true;
    } else {
        subscribeButton.textContent = 'নোটিফিকেশন চালু করুন';
        subscribeButton.disabled = false;
    }

    subscribeButton.addEventListener('click', requestPermission);
}


// Main script execution after DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    
    fetchAppConfig();

    // --- Page-specific Logic ---
    // Only call fetchThemes if its container exists
    if (document.getElementById('themes-grid')) {
        fetchThemes({ limit: 4, containerId: 'themes-grid', detailed: false });
    }
    if (document.getElementById('themes-grid-full')) {
        fetchThemes({ containerId: 'themes-grid-full', detailed: true });
    }
    // Only call fetchThemeDetails if its container exists
    if (document.getElementById('theme-details-container')) {
        fetchThemeDetails();
    }

    // --- Image Modal Gallery Logic ---
    const modal = document.getElementById("imageModal");
    if (modal) {
        const modalImg = document.getElementById("modalImage");
        const galleryItems = document.querySelectorAll(".gallery-item");
        const closeBtn = document.querySelector(".modal .close");
        const prevBtn = document.querySelector(".modal .prev");
        const nextBtn = document.querySelector(".modal .next");
        let currentIndex = 0;

        galleryItems.forEach((item, index) => {
            item.addEventListener('click', () => {
                openModal(index);
            });
        });

        function openModal(index) {
            currentIndex = index;
            const imgSrc = galleryItems[currentIndex].querySelector('img').src;
            modal.style.display = "block";
            modalImg.src = imgSrc;
        }

        function closeModal() {
            modal.style.display = "none";
        }

        function changeImage(direction) {
            currentIndex += direction;
            if (currentIndex >= galleryItems.length) {
                currentIndex = 0; // Loop to the first image
            }
            if (currentIndex < 0) {
                currentIndex = galleryItems.length - 1; // Loop to the last image
            }
            const imgSrc = galleryItems[currentIndex].querySelector('img').src;
            modalImg.src = imgSrc;
        }

        closeBtn.addEventListener('click', closeModal);
        prevBtn.addEventListener('click', () => changeImage(-1));
        nextBtn.addEventListener('click', () => changeImage(1));

        // Close modal on outside click
        window.addEventListener('click', (event) => {
            if (event.target == modal) {
                closeModal();
            }
        });

        // Keyboard navigation
        document.addEventListener('keydown', (event) => {
            if (modal.style.display === "block") {
                if (event.key === "ArrowRight") {
                    changeImage(1);
                }
                if (event.key === "ArrowLeft") {
                    changeImage(-1);
                }
                if (event.key === "Escape") {
                    closeModal();
                }
            }
        });
    }


    // Only setup notifications if the button exists
    const subscribeButton = document.getElementById('subscribeButton');
    if (subscribeButton) { 
        setupNotifications();
    }

    // --- FAQ Accordion Logic ---
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            const currentlyActive = document.querySelector('.faq-item.active');
            if (currentlyActive && currentlyActive !== item) {
                currentlyActive.classList.remove('active');
            }
            item.classList.toggle('active');
        });
    });

    // --- Scroll Animation Logic ---
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show-on-scroll');
            } else {
                // Optional: remove the class to re-animate on scroll up
                // entry.target.classList.remove('show-on-scroll');
            }
        });
    }, {
        threshold: 0.1 // Trigger when 10% of the element is visible
    });

    const hiddenElements = document.querySelectorAll('.hidden-on-scroll');
    hiddenElements.forEach(el => observer.observe(el));

    // --- Back to Top Button Logic ---
    const backToTopButton = document.getElementById('back-to-top-btn');
    if (backToTopButton) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 300) {
                backToTopButton.classList.add('show');
            } else {
                backToTopButton.classList.remove('show');
            }
        });

        backToTopButton.addEventListener('click', (e) => {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }

});