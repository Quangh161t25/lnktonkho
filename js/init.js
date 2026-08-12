// ─── App Init ────────────────────────────────────────────────
async function initializeApplication() {
    const isLoginPage = getPageEntryModule() === 'login';
    const savedSession = localStorage.getItem('erp_user_session');
    if (!savedSession && !isLoginPage) {
        window.location.replace('login.html');
        return;
    }

    await loadPermissionsConfig();
    await fetchAuthData();
    if (savedSession) {
        try {
            if (!restoreSavedSession(savedSession)) throw new Error('Saved user is no longer available');
            const initialModule = getInitialModuleForCurrentUser();
            if (initialModule !== getPageEntryModule() && navigateToModulePage(initialModule)) return;
            replaceModulePageUrl(initialModule);
            updateUserProfileUI();
            document.getElementById('mainApp')?.classList.remove('hidden');
            switchModule(initialModule, { renderOnly: true });
            fetchReferenceData().catch(console.error);
        } catch (e) {
            clearUserSession();
            if (!isLoginPage) {
                window.location.replace('login.html');
                return;
            }
        }
    }

    // Register PWA features (Only on HTTP/HTTPS)
    if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
        // Inject Manifest
        const link = document.createElement('link');
        link.rel = 'manifest';
        link.href = 'manifest.json';
        document.head.appendChild(link);

        // Inject Meta Tags
        const metaTheme = document.createElement('meta');
        metaTheme.name = 'theme-color';
        metaTheme.content = '#2563eb';
        document.head.appendChild(metaTheme);

        const metaApple = document.createElement('meta');
        metaApple.name = 'apple-mobile-web-app-capable';
        metaApple.content = 'yes';
        document.head.appendChild(metaApple);

        // Register Service Worker
        if ('serviceWorker' in navigator) {
            try {
                const registration = await navigator.serviceWorker.register('sw.js');
                console.log('Service Worker registered');
                registration.update();
            } catch (e) {
                console.error('SW registration failed', e);
            }
        }
    } else if (window.location.protocol === 'file:') {
        console.warn('PWA features (Service Worker, Manifest) are disabled because you are running the file locally via file://. Please use a web server (http/https) to enable these features.');
    }
}

if (document.readyState === 'complete') initializeApplication();
else window.addEventListener('load', initializeApplication, { once: true });

// Open warehouse view for a specific product ID
function openProductWarehouseDetails(productId) {
    const filterInput = document.getElementById('sanphamkhoFilterIdSp');
    if (filterInput) filterInput.value = productId;
    // Switch to the warehouse module and apply filter
    switchModule('sanphamkho');
    // Force re‑render with filter applied
    renderSimpleSheetModule('sanphamkho', true, true);
}
