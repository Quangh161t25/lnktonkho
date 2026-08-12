// ─── Auth & Token ─────────────────────────────────────────────
async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry - 300000) return accessToken;
    const header = { alg: "RS256", typ: "JWT" };
    const now = Math.floor(Date.now() / 1000);
    const payload = {
        iss: CONFIG.serviceAccountEmail,
        scope: CONFIG.scopes.join(" "),
        aud: CONFIG.tokenUrl,
        exp: now + 3600,
        iat: now
    };
    const sJWT = KJUR.jws.JWS.sign("RS256", JSON.stringify(header), JSON.stringify(payload), CONFIG.privateKey);

    try {
        const response = await fetch(CONFIG.tokenUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${sJWT}`
        });
        const data = await response.json();
        if (!response.ok || !data.access_token) throw new Error(`Token request failed: HTTP ${response.status}`);
        accessToken = data.access_token;
        tokenExpiry = Date.now() + (data.expires_in * 1000);
        return accessToken;
    } catch (err) { alert("Không thể xác thực với Google API"); return null; }
}

async function fetchAuthData() {
    const loading = document.getElementById('loginLoading');
    const form = document.getElementById('loginForm');
    if (loading) loading.classList.remove('hidden');
    if (form) form.classList.add('hidden');

    try {
        const token = await getAccessToken();
        if (!token) throw new Error('Missing Google API access token');
        const sid = CONFIG.spreadsheetId;
        const sname = CONFIG.authSheetName;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${sname}!A1:H10000`;

        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await resp.json();
        if (!resp.ok) throw new Error(`DSNV request failed: HTTP ${resp.status}`);

        if (data.values && data.values.length > 1) {
            const headers = data.values[0].map(h => h ? h.toString().trim().toLowerCase() : '');
            const iId = headers.findIndex(h => h === 'id');
            const iName = headers.findIndex(h => h === 'ho_ten' || h === 'họ tên' || h === 'name' || h === 'ten');
            const iImage = headers.findIndex(h => h === 'hinh_anh');
            const iGender = headers.findIndex(h => h === 'gioi_tinh');
            const iBirthDate = headers.findIndex(h => h === 'ngay_sinh');
            const iPass = headers.findIndex(h => h === 'password' || h === 'mat_khau' || h === 'mk');
            const iRole = headers.findIndex(h => h === 'role' || h === 'quyen');
            const iType = headers.findIndex(h => h === 'truong');

            usersData = data.values.slice(1).map((r, index) => ({
                sheetRow: index + 2,
                id: normalizeLoginValue(iId !== -1 ? r[iId] : r[0]),
                name: normalizeLoginValue(iName !== -1 ? r[iName] : r[1]),
                image: normalizeLoginValue(iImage !== -1 ? r[iImage] : r[2]),
                gender: normalizeLoginValue(iGender !== -1 ? r[iGender] : r[3]),
                birthDate: normalizeLoginValue(iBirthDate !== -1 ? r[iBirthDate] : r[4]),
                role: normalizeLoginValue(iRole !== -1 ? r[iRole] : r[5]),
                password: normalizeLoginValue(iPass !== -1 ? r[iPass] : r[6]),
                type: normalizeLoginValue(iType !== -1 ? r[iType] : r[7])
            })).filter(u => u.id);
            if (loggedInUser) {
                const freshLogin = usersData.find(u => u.id === loggedInUser.id);
                if (!freshLogin) {
                    logout();
                    return usersData;
                }
                loggedInUser = freshLogin;
            }
            if (currentUser) {
                const freshView = usersData.find(u => u.id === currentUser.id);
                currentUser = freshView || loggedInUser;
            }
            if (loggedInUser && currentUser) persistUserSession();
            if (document.getElementById('mainApp')) {
                populateAdminViewUserSelect();
                updateUserProfileUI();
            }
        } else {
            usersData = [];
            if (loggedInUser) logout();
        }
        return usersData;
    } catch (err) {
        console.error("Auth Fetch Error:", err);
    } finally {
        if (loading) loading.classList.add('hidden');
        if (form) form.classList.remove('hidden');
    }
}

// ─── Login / Logout ───────────────────────────────────────────
async function handleLogin() {
    await fetchAuthData();
    const uid = normalizeLoginValue(document.getElementById('usernameInput').value);
    const pwd = normalizeLoginValue(document.getElementById('passwordInput').value);
    if (!uid || !pwd) return alert("Vui lòng nhập đầy đủ thông tin.");

    if (!usersData || usersData.length === 0) return alert("Khong doc duoc danh sach tai khoan tu sheet DSNV.");

    const normalizedUid = uid.toLowerCase();
    const user = usersData.find(u => normalizeLoginValue(u.id).toLowerCase() === normalizedUid
        && normalizeLoginValue(u.password) === pwd);
    if (user) {
        loggedInUser = user;
        currentUser = user;
        persistUserSession();
        const initialModule = getInitialModuleForCurrentUser();
        if (initialModule !== getPageEntryModule() && navigateToModulePage(initialModule)) return;
        updateUserProfileUI();
        switchModule(initialModule, { renderOnly: true });
        document.getElementById('mainApp')?.classList.remove('hidden');
        fetchReferenceData().catch(console.error);
    } else {
        alert('Tài khoản hoặc mật khẩu không chính xác!');
    }
}

function logout() {
    clearUserSession();
    window.location.replace('login.html');
}
