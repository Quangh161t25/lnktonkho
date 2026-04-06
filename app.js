// ============================================================
// app.js - Tồn Kho ERP System Logic
// ============================================================

const CONFIG = {
    spreadsheetId: "1qo4DMUGNd-D7n2hbrRiGIIkR24mArDoKZSeYjdkP8hQ",
    authSheetName: "DSNV",
    nxSheetName: "NX_CT",
    tonKhoSheetName: "TON_KHO",
    giuHangSheetName: "GIU_HANG",
    serviceAccountEmail: "test-gia-ason@api-test-sheet-161.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3NN84hLTkQPZd\nLj7niXZTICq7nHsuTn3J6r2Paq12m70/lYSmrwh1i0EStr9bO19QM8cevGlslwGr\nWSVOLJlc6+w1HGPKvRXtA41kYV9MYIvpzIPQtkFE7Hxq71QyBARcv39Lfzze6Ioj\n3G8VBvAKFLAnCUr97GHRv+KbCTFxPZupd3PEB+xS5ZUlzdBCEZvDid3iXaaEJJ+l\nTd1apAGQHjtnDTLOkiTa8zf7X5ebALwnI9MziOdN8VyprHXGhkachPbKyrG0QwEs\n2jtiI6Y5ULsBPjNefoavH8MKU5DEAT9h0fZ7KfsKYVMDuXqmEKBs0D3B4Z6aDZQW\nwT2dDRZDAgMBAAECggEAEIuVoSzZVuFhaz1GI9ji0IacjvO50cIq7M8Zrj4/F756\nEw6PIhKENafAb7U4INm2AnzUMO8CqL9Jpxs85qUM3W4JysSByqLUiRW2184amIyb\nj7jCXfLBTQn8AbHgrUepl5d/vBmFYMgon/mqjbNiGDb4FZgEQSkie5o6fi/dWp5d\nNahbZl+WTOB/znhAfKh/zferHNxldR/ERmwOubZUerkqysWiBigc3ovpLSUof9ur\nz3hNPPp0CKQjF40xuQc6FYTHUHMLuMvp78PXuc/mYqQmZ8VOGhU+faGtZ4m+QJly\ndF5dS8U5cwKEF+ptuAUiWSahn6INb9yKn3+FcsW0UQKBgQDb8N4eWFvbgpRo/vxo\nwBN2u2TWubj6clcrq/1a+VR0njC28Can0ogJHhrFhPxVs5D/rugs3HlbyAXJFptY\nV0DZPCwBxGU5P5RbGjXWWEUXjp4ISKQD8WKfVlXNr79TqLdOg2NZBYQAi06Cpo/T\nPV9l7LSG2Tj/9WdvD7W2wvrpaQKBgQDVPjpJN6xh7+sHtSU0mjKvrqigpHbuSQ/o\nXpUaWSIpJffm5QpFPAOcTT5mHZCyllicJQIrfPSY+sH8n+sF03CUqVkV4Q2UqfOf\npFaLDB4P6SQ8iesZyF4VKFrj/cAvRJmp0e5W/DRnFkoEp+8c+nrru2+Dzm9kb7Uq\n0CiltqYAywKBgBtcfrV1to+7Ue0x84KwintV2rifyDRX7yI+tjkQFYKgf1zyyUxN\nc6D2vsvdvGqI+TvlrXqPPwW8/4NBrbeyux2LT8o0fYc+sp0WyKXOu2Gv21caelUH\nPYam/eultn6Y2Z0J2V0kw4Qx0GWOhQv5cZnDdb3k3iNxixmU8b03ynEpAoGBAKEA\n7O0fNe50QRZ+tOq0ihSPYQ55XrqnO3WNBDLynZJH8pbI1CpWF7vJrpVXOUs9rQWo\nA61mGR/wJMtiywaJEHWOL48PbzuR3jno0NcHfSMyOoPi9jlvSWncIFQH4TVPLF5F\n/Rh8L+ytrZE6YpWUoX6e9KGmGgDRPw5mQGpuL4RlAoGADe9n080SXlsUk4nHVjUz\nEfv7EBoBkgOpqb9T1foRfJl46NxmmTOYV3iGIhjwcDskEg284k4iq/gH6EEFyEBc\nVz13jzB1nBgjfezFesVQz7bA/+Wik6HZtxAxVg38BKMt+Q1tYw9wOjbGPqOn++VC\nsR2Sh8e3h3Knd6j1tceRIFU=\n-----END PRIVATE KEY-----\n",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
};

// ─── State ───────────────────────────────────────────────────
let usersData = [];
let nxDataRaw = JSON.parse(localStorage.getItem('erp_nx_cache') || '[]');
let tonKhoDataRaw = JSON.parse(localStorage.getItem('erp_tk_cache') || '[]');
let giuHangDataRaw = JSON.parse(localStorage.getItem('erp_gh_cache') || '[]');
let currentUser = null;
let accessToken = null;
let tokenExpiry = 0;
let isSidebarCollapsed = false;

// ─── Chart instances ──────────────────────────────────────────
let importChartObj = null;
let exportChartObj = null;
let dailyImportChartObj = null;
let dailyExportChartObj = null;

// ─── Utility ──────────────────────────────────────────────────
const formatNum = (val) => {
    const num = Number(val);
    return isNaN(num) ? (val || '0') : num.toLocaleString();
};

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
        const sid = CONFIG.spreadsheetId;
        const sname = CONFIG.authSheetName;
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${sname}!A1:M200`;

        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await resp.json();

        if (data.values && data.values.length > 1) {
            const headers = data.values[0].map(h => h ? h.toString().trim().toLowerCase() : '');
            const iId = headers.findIndex(h => h === 'id');
            const iName = headers.findIndex(h => h === 'ho_ten' || h === 'họ tên' || h === 'name' || h === 'ten');
            const iPass = headers.findIndex(h => h === 'password' || h === 'mat_khau');
            const iRole = headers.findIndex(h => h === 'role' || h === 'quyen');

            usersData = data.values.slice(1).map(r => ({
                id: iId !== -1 ? (r[iId] || '') : (r[0] || ''),
                name: iName !== -1 ? (r[iName] || '') : (r[1] || ''),
                role: iRole !== -1 ? (r[iRole] || '') : (r[5] || ''),
                password: iPass !== -1 ? (r[iPass] || '') : (r[6] || '')
            })).filter(u => u.id);
        }
    } catch (err) {
        console.error("Auth Fetch Error:", err);
    } finally {
        if (loading) loading.classList.add('hidden');
        if (form) form.classList.remove('hidden');
    }
}

// ─── Login / Logout ───────────────────────────────────────────
function handleLogin() {
    const uid = document.getElementById('usernameInput').value.trim();
    const pwd = document.getElementById('passwordInput').value.trim();
    if (!uid || !pwd) return alert("Vui lòng nhập đầy đủ thông tin.");

    const user = usersData.find(u => u.id === uid && (u.password ? u.password.toString() : "") === pwd);
    if (user) {
        currentUser = user;
        localStorage.setItem('erp_user_session', JSON.stringify(user));
        updateUserProfileUI();
        if (currentUser.role === 'NPP') switchModule('tonkho');
        else switchModule('home');
        setQuickDate('month'); // Initialize dashboard dates
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        Promise.all([fetchNXData(), fetchTonKhoData(), fetchGiuHangData()]).then(() => renderDashboard()).catch(console.error);
    } else {
        alert('Tài khoản hoặc mật khẩu không chính xác!');
    }
}

function logout() {
    localStorage.removeItem('erp_user_session');
    document.getElementById('mainApp').classList.add('hidden');
    document.getElementById('loginScreen').classList.remove('hidden');
    document.getElementById('usernameInput').value = '';
    document.getElementById('passwordInput').value = '';
}

// ─── UI Helpers ───────────────────────────────────────────────
function toggleUserMenu() {
    const dropdown = document.getElementById('userMenuDropdown');
    dropdown.classList.toggle('hidden');
}

window.onclick = function (event) {
    if (!event.target.closest('#userMenuButton')) {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
};

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const icon = document.getElementById('toggleIcon');
    isSidebarCollapsed = !isSidebarCollapsed;
    if (isSidebarCollapsed) {
        sidebar.classList.add('collapsed');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />';
    } else {
        sidebar.classList.remove('collapsed');
        icon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />';
    }
}

function updateUserProfileUI() {
    if (!currentUser) return;
    const nameArr = currentUser.name ? currentUser.name.split(' ') : [currentUser.id];
    const initials = nameArr[nameArr.length - 1].charAt(0).toUpperCase();

    document.getElementById('userNameHeader').textContent = currentUser.name || currentUser.id;
    document.getElementById('userRoleHeader').textContent = currentUser.role || "Nhân viên";
    document.getElementById('userAvatar').textContent = initials;

    const nameMob = document.getElementById('userNameHeaderMobile');
    const roleMob = document.getElementById('userRoleHeaderMobile');
    if (nameMob) nameMob.textContent = currentUser.name || currentUser.id;
    if (roleMob) roleMob.textContent = currentUser.role || "Nhân viên";

    // Hide/Show Navigation items based on role
    const allowed = ROLE_PERMISSIONS[currentUser.role] || ['home'];
    ['home', 'nhapxuat', 'tonkho', 'giuhang', 'dashboard'].forEach(m => {
        const navEl = document.getElementById(`nav-${m}`);
        const bNavEl = document.getElementById(`bottom-nav-${m}`);
        const isAllowed = allowed.includes(m);

        if (navEl) {
            if (isAllowed) navEl.classList.remove('hidden');
            else navEl.classList.add('hidden');
        }
        if (bNavEl) {
            if (isAllowed) bNavEl.classList.remove('hidden');
            else bNavEl.classList.add('hidden');
        }
    });
}

// ─── Module Navigation ────────────────────────────────────────
// ─── RBAC Configuration ──────────────────────────────────────
const ROLE_PERMISSIONS = {
    'ADMIN': ['home', 'nhapxuat', 'tonkho', 'giuhang', 'dashboard'],
    'kt': ['nhapxuat', 'tonkho', 'giuhang', 'dashboard'],
    'NPP': ['tonkho', 'nhapxuat']
};

function switchModule(moduleName) {
    if (!currentUser) return;
    const allowed = ROLE_PERMISSIONS[currentUser.role] || ['home'];
    if (!allowed.includes(moduleName)) {
        alert("Bạn không có quyền truy cập vào mục này.");
        return;
    }

    ['home', 'nhapxuat', 'tonkho', 'giuhang', 'dashboard'].forEach(m => {
        const mod = document.getElementById(`module-${m}`);
        if (mod) mod.classList.add('hidden');

        const navEl = document.getElementById(`nav-${m}`);
        const bottomNavEl = document.getElementById(`bottom-nav-${m}`);
        if (navEl) navEl.classList.remove('active');
        if (bottomNavEl) {
            bottomNavEl.classList.remove('text-blue-600');
            bottomNavEl.classList.add('text-slate-400');
        }
    });

    const targetMod = document.getElementById(`module-${moduleName}`);
    if (targetMod) targetMod.classList.remove('hidden');

    const activeNav = document.getElementById(`nav-${moduleName}`);
    const activeBottomNav = document.getElementById(`bottom-nav-${moduleName}`);
    if (activeNav) activeNav.classList.add('active');
    if (activeBottomNav) {
        activeBottomNav.classList.remove('text-slate-400');
        activeBottomNav.classList.add('text-blue-600');
    }

    const titles = {
        'home': 'Trang chủ',
        'nhapxuat': 'Nhập xuất chi tiết',
        'tonkho': 'Báo cáo tồn kho',
        'giuhang': 'Quản lý giữ hàng',
        'dashboard': 'Báo cáo & Phân tích'
    };
    document.getElementById('headerTitle').textContent = titles[moduleName] || 'Hệ thống';

    if (moduleName === 'nhapxuat') {
        if (nxDataRaw && nxDataRaw.length > 0) applyFilters();
        else renderNXModule();
    } else if (moduleName === 'tonkho') {
        if (tonKhoDataRaw && tonKhoDataRaw.length > 0) applyTonKhoFilters();
        else renderTonKhoModule();
    } else if (moduleName === 'giuhang') {
        if (giuHangDataRaw && giuHangDataRaw.length > 0) applyGiuHangFilters();
        else renderGiuHangModule();
    } else if (moduleName === 'dashboard') {
        if (nxDataRaw && nxDataRaw.length > 1) { renderDashboard(); renderInventoryAnalytics(); }
        else {
            const tbody = document.getElementById('dbTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-400">Đang tải dữ liệu báo cáo...</td></tr>';
            Promise.all([fetchNXData(), fetchTonKhoData()]).then(() => { renderDashboard(); renderInventoryAnalytics(); });
        }
    }
}

// ─── Module: Nhập Xuất ────────────────────────────────────────
async function fetchNXData() {
    try {
        const token = await getAccessToken();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.nxSheetName}!A1:M60000`;
        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await resp.json();
        nxDataRaw = data.values || [];
        localStorage.setItem('erp_nx_cache', JSON.stringify(nxDataRaw));
        updateDashboardFilterOptions();
        return nxDataRaw;
    } catch (err) {
        console.error("NX Data Fetch Error:", err);
        return [];
    }
}

async function renderNXModule() {
    const tbody = document.getElementById('nxTableBody');
    tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-sm">Đang tải dữ liệu và đồng bộ bộ lọc...</td></tr>';
    await fetchNXData();
    applyFilters();
}

function applyFilters() {
    if (!nxDataRaw || nxDataRaw.length <= 1) return;

    const searchTerm = document.getElementById('nxSearchInput').value.toLowerCase().trim();
    const typeFilter = document.getElementById('nxTypeFilter').value;
    const tbody = document.getElementById('nxTableBody');

    const isNPP = currentUser && currentUser.role === 'NPP';
    const nxHeaders = nxDataRaw[0] ? nxDataRaw[0].map(h => (h || '').toString().toLowerCase().trim()) : [];
    const iMaKH = nxHeaders.indexOf('ma_kh');

    const filteredRows = nxDataRaw.slice(1).filter(row => {
        // NPP data limitation
        if (isNPP && iMaKH !== -1) {
            const rowMaKH = (row[iMaKH] || '').toString().trim();
            if (rowMaKH !== currentUser.id) return false;
        }

        const mdh = (row[3] || '').toString().toLowerCase();
        const khach = (row[5] || '').toString().toLowerCase();
        const tensp = (row[7] || '').toString();
        const truong = (row[2] || '').toString();

        if (!mdh && !tensp) return false;

        const matchesSearch = !searchTerm || mdh.includes(searchTerm) || khach.includes(searchTerm);
        const matchesType = !typeFilter || truong === typeFilter;
        return matchesSearch && matchesType;
    });

    document.getElementById('nxCount').textContent = `${filteredRows.length} đơn hàng`;

    if (filteredRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-10 text-center text-slate-400 text-sm">Không tìm thấy dữ liệu phù hợp.</td></tr>';
        return;
    }

    if (!tbody) return;
    tbody.innerHTML = filteredRows.map(row => {
        const ngay = row[1] || '';
        const truong = row[2] || '';
        const id = row[3] || '';
        const check = row[4] || '';
        const khach = row[5] || '';
        const nvkd = row[6] || '';
        const tensp = row[7] || '';
        const slg = row[8] || 0;
        const dongia = row[9] || 0;
        const thanhTien = row[10] || 0;
        const nvc = row[11] || '';

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${ngay}</td>
                <td class="px-4 py-3 text-xs font-medium ${check === 'CHÈN' ? 'text-blue-600' : 'text-slate-700'}">${truong}</td>
                <td class="px-4 py-3 text-xs font-mono font-bold text-slate-500">${id}</td>
                <td class="px-4 py-3 text-xs text-slate-700 font-medium">${khach}</td>
                <td class="px-4 py-3 text-xs text-slate-600">${tensp}</td>
                <td class="px-4 py-3 text-xs text-right font-bold text-slate-700">${slg}</td>
                <td class="px-4 py-3 text-xs text-right text-slate-500">${formatNum(dongia)}</td>
                <td class="px-4 py-3 text-xs text-right font-bold text-emerald-600">${formatNum(thanhTien)}</td>
                <td class="px-4 py-3 text-xs text-slate-500">${nvc}</td>
            </tr>
        `;
    }).join('');

    const mobileContainer = document.getElementById('nxMobileCards');
    if (mobileContainer) {
        mobileContainer.innerHTML = filteredRows.map(row => `
            <div class="mobile-card">
                <div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                    <div class="font-bold text-slate-800 text-sm">${row[3] || 'No ID'}</div>
                    <div class="text-[10px] font-bold px-2 py-0.5 rounded-full ${row[2] === 'NHẬP' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'}">${row[2]}</div>
                </div>
                <div class="space-y-2">
                    <div class="flex justify-between"><span class="mobile-card-label">Ngày</span><span class="mobile-card-value">${row[1] || ''}</span></div>
                    <div class="flex justify-between"><span class="mobile-card-label">Khách hàng</span><span class="mobile-card-value">${row[5] || ''}</span></div>
                    <div class="flex justify-between"><span class="mobile-card-label">Sản phẩm</span><span class="mobile-card-value">${row[7] || ''}</span></div>
                    <div class="flex justify-between items-baseline"><span class="mobile-card-label">SL - Đơn giá</span><span class="mobile-card-value">${row[8]} x ${formatNum(row[9])}</span></div>
                    <div class="flex justify-between pt-1 border-t border-slate-50"><span class="mobile-card-label">Thành tiền</span><span class="text-sm font-bold text-emerald-600">${formatNum(row[10])}</span></div>
                </div>
            </div>
        `).join('');
    }
}

// ─── Excel Upload Logic ────────────────────────────────────────
let currentUploadType = '';

function triggerUpload(type) {
    currentUploadType = type;
    document.getElementById('excelUploadInput').click();
}

function handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            processWorkbook(workbook, currentUploadType);
        } catch (err) {
            console.error("Parse Error:", err);
            alert("Lỗi khi đọc file Excel. Vui lòng kiểm tra định dạng.");
        }
    };
    reader.readAsArrayBuffer(file);
    input.value = ''; // Reset for next selection
}

async function processWorkbook(workbook, type) {
    const firstSheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[firstSheetName];
    // Convert to array of arrays (header:1 returns array for rows)
    const rawRows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    if (rawRows.length <= 1) {
        alert("File không có dữ liệu hoặc chỉ có tiêu đề.");
        return;
    }

    const rowsToUpload = [];
    // Start from row 4 (index 3) and skip the last row (length - 1)
    for (let i = 3; i < rawRows.length - 1; i++) {
        const r = rawRows[i];
        if (!r || r.length === 0) continue;

        let mappedRow = new Array(13).fill("");

        // COMMON: Ngay (B=1 -> GS 1), Truong (GS 2), Mã đơn (C=2 -> GS 3)
        mappedRow[1] = r[1] || ""; // Excel Col B
        mappedRow[2] = type;       // "NHẬP" or "XUẤT"
        mappedRow[3] = r[2] || ""; // Excel Col C (Mã đơn)

        if (type === 'NHẬP') {
            // Import Mapping: F=5 (6th), G=6 (7th), I=8 (9th), J=9 (10th), K=10 (11th)
            mappedRow[4] = "";           // Ma KH (Excel n/a)
            mappedRow[5] = "";           // Ten KH (Excel n/a)
            mappedRow[6] = r[5] || "";   // ID SP (Excel F)
            mappedRow[7] = r[6] || "";   // Tên SP (Excel G)
            mappedRow[8] = r[8] || "";   // Số lượng (Excel I)
            mappedRow[9] = r[9] || "";   // Đơn giá (Excel J)
            mappedRow[10] = r[10] || ""; // Thành tiền (Excel K)
        } else {
            // Export Mapping: H=7 (8th), I=8 (9th), J=9 (10th), K=10 (11th), M=12 (13th), N=13 (14th), O=14 (15th)
            mappedRow[4] = r[7] || "";   // Ma KH (Excel H)
            mappedRow[5] = r[8] || "";   // Ten KH (Excel I)
            mappedRow[6] = r[9] || "";   // ID SP (Excel J)
            mappedRow[7] = r[10] || "";  // Tên SP (Excel K)
            mappedRow[8] = r[12] || "";  // Số lượng (Excel M)
            mappedRow[9] = r[13] || "";  // Đơn giá (Excel N)
            mappedRow[10] = r[14] || ""; // Thành tiền (Excel O)
        }

        // Metadata: id_nv (GS index 11) - Bỏ trống theo yêu cầu
        mappedRow[11] = "";

        rowsToUpload.push(mappedRow);
    }

    if (rowsToUpload.length === 0) {
        alert("Không tìm thấy dữ liệu hợp lệ để tải lên.");
        return;
    }

    if (confirm(`Bạn có chắc chắn muốn tải lên ${rowsToUpload.length} bản ghi ${type} không?`)) {
        await appendNXData(rowsToUpload);
    }
}

async function appendNXData(rows) {
    try {
        const token = await getAccessToken();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.nxSheetName}!A1:append?valueInputOption=USER_ENTERED`;

        const resp = await fetch(url, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                values: rows
            })
        });

        if (resp.ok) {
            alert("Tải lên dữ liệu thành công!");
            await fetchNXData(); // Refresh local cache
            applyFilters();     // Refresh UI
        } else {
            const err = await resp.json();
            console.error("Upload Error:", err);
            alert("Lỗi khi tải lên Google Sheets. Vui lòng kiểm tra quyền truy cập.");
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Lỗi kết nối khi tải lên dữ liệu.");
    }
}

// ─── Module: Tồn Kho ──────────────────────────────────────────
async function fetchTonKhoData() {
    try {
        const token = await getAccessToken();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.tonKhoSheetName}!A1:H1000`;
        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (!resp.ok) {
            const errData = await resp.json();
            console.error("Sheet API Error:", errData);
            tonKhoDataRaw = [];
            return [];
        }
        const data = await resp.json();
        tonKhoDataRaw = data.values || [];
        localStorage.setItem('erp_tk_cache', JSON.stringify(tonKhoDataRaw));
        return tonKhoDataRaw;
    } catch (err) {
        console.error("Ton Kho Data Fetch Error:", err);
        tonKhoDataRaw = [];
        return [];
    }
}

async function renderTonKhoModule() {
    const tbody = document.getElementById('tonKhoTableBody');
    tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-400 text-sm">Đang tải dữ liệu...</td></tr>';
    await Promise.all([fetchTonKhoData(), fetchNXData(), fetchGiuHangData()]);
    applyTonKhoFilters();
}

function applyTonKhoFilters() {
    const tbody = document.getElementById('tonKhoTableBody');
    const searchTerm = document.getElementById('tonKhoSearchInput').value.toLowerCase().trim();

    if (!tonKhoDataRaw || tonKhoDataRaw.length <= 1) {
        document.getElementById('tonKhoCount').textContent = `0 sản phẩm`;
        tbody.innerHTML = `<tr><td colspan="8" class="px-4 py-10 text-center text-slate-400 text-sm">Không thấy dữ liệu trong sheet "${CONFIG.tonKhoSheetName}". Hãy kiểm tra tên sheet.</td></tr>`;
        return;
    }

    const nxAgg = {};
    if (nxDataRaw && nxDataRaw.length > 1) {
        nxDataRaw.slice(1).forEach(row => {
            const idSp = (row[6] || '').toString();
            const type = (row[2] || '').toString();
            const slg = Number(row[8] || 0);
            if (!nxAgg[idSp]) nxAgg[idSp] = { nhap: 0, xuat: 0 };
            if (type === 'NHẬP') nxAgg[idSp].nhap += slg;
            if (type === 'XUẤT') nxAgg[idSp].xuat += slg;
        });
    }

    const giuAgg = {};
    if (giuHangDataRaw && giuHangDataRaw.length > 1) {
        giuHangDataRaw.slice(1).forEach(row => {
            const idSp = (row[3] || '').toString();
            const slg = Number(row[5] || 0);
            if (!giuAgg[idSp]) giuAgg[idSp] = 0;
            giuAgg[idSp] += slg;
        });
    }

    const isNPP = currentUser && currentUser.role === 'NPP';
    let allowedProductIds = new Set();
    if (isNPP) {
        // NPP chỉ thấy SP mà họ đã từng XUẤT (Lọc theo cột ma_kh trong NX_CT)
        const nxHeaders = nxDataRaw[0] ? nxDataRaw[0].map(h => (h || '').toString().toLowerCase().trim()) : [];
        const iMaKH = nxHeaders.indexOf('ma_kh');

        if (nxDataRaw && nxDataRaw.length > 1) {
            nxDataRaw.slice(1).forEach(row => {
                const type = (row[2] || '').toString();
                const rowMaKH = iMaKH !== -1 ? (row[iMaKH] || '').toString().trim() : '';
                const spName = (row[7] || '').toString();

                if (type === 'XUẤT' && rowMaKH === currentUser.id) {
                    allowedProductIds.add(spName);
                }
            });
        }
    }

    const filteredRows = tonKhoDataRaw.slice(1).filter(row => {
        const id = (row[0] || '').toString();
        const ten = (row[1] || '').toString().toLowerCase();
        const model = (row[2] || '').toString().toLowerCase();
        if (!id || !ten) return false;

        // NPP Filter
        if (isNPP && !allowedProductIds.has(row[1])) return false;

        return !searchTerm || ten.includes(searchTerm) || model.includes(searchTerm);
    });

    document.getElementById('tonKhoCount').textContent = `${filteredRows.length} sản phẩm`;

    if (filteredRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="px-4 py-10 text-center text-slate-400 text-sm">Không tìm thấy sản phẩm phù hợp.</td></tr>';
        return;
    }

    if (!tbody) return;

    // NPP Column visibility (Header)
    const headerRow = document.querySelector('#module-tonkho thead tr');
    if (headerRow) {
        if (isNPP) {
            headerRow.innerHTML = `
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên SP</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Có thể bán</th>
            `;
        } else {
            headerRow.innerHTML = `
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Tên SP</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">Model</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tồn đầu</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Nhập</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Xuất</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tạm giữ</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Có thể bán</th>
                <th class="px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Tồn cuối</th>
            `;
        }
    }

    tbody.innerHTML = filteredRows.map(row => {
        const id = (row[0] || '').toString();
        const ten = row[1] || '';
        const model = row[2] || '';
        const tondau = Number(row[6] || 0);
        const tonHT = Number(row[7] || 0);

        const agg = nxAgg[id] || { nhap: 0, xuat: 0 };
        const tamgiu = giuAgg[id] || 0;
        const cotheban = tondau + agg.nhap - agg.xuat - tamgiu;

        if (isNPP) {
            return `
                <tr class="hover:bg-slate-50/80 transition-colors">
                    <td class="px-4 py-3 text-sm font-semibold text-slate-700">${ten}</td>
                    <td class="px-4 py-3 text-xs text-slate-500 italic">${model}</td>
                    <td class="px-4 py-3 text-xs text-right text-emerald-600 font-bold">${formatNum(cotheban)}</td>
                </tr>
            `;
        }

        return `
            <tr class="hover:bg-slate-50/80 transition-colors">
                <td class="px-4 py-3 text-sm font-semibold text-slate-700">${ten}</td>
                <td class="px-4 py-3 text-xs text-slate-500 italic">${model}</td>
                <td class="px-4 py-3 text-xs text-right text-slate-600">${formatNum(tondau)}</td>
                <td class="px-4 py-3 text-xs text-right text-blue-600 font-medium">${formatNum(agg.nhap)}</td>
                <td class="px-4 py-3 text-xs text-right text-orange-600 font-medium">${formatNum(agg.xuat)}</td>
                <td class="px-4 py-3 text-xs text-right text-slate-400 font-bold">${formatNum(tamgiu)}</td>
                <td class="px-4 py-3 text-xs text-right text-emerald-600 font-bold">${formatNum(cotheban)}</td>
                <td class="px-4 py-3 text-xs text-right text-slate-700 font-bold">${formatNum(tonHT)}</td>
            </tr>
        `;
    }).join('');

    const mobileContainer = document.getElementById('tonKhoMobileCards');
    if (mobileContainer) {
        mobileContainer.innerHTML = filteredRows.map(r => {
            const id = (r[0] || '').toString().trim();
            const ten = (r[1] || '').toString().trim();
            const model = (r[2] || '').toString().trim();
            const tondau = Number(r[6] || 0);
            const agg = nxAgg[id] || { nhap: 0, xuat: 0 };
            const tamgiu = giuAgg[id] || 0;
            const cotheban = tondau + agg.nhap - agg.xuat - tamgiu;

            if (isNPP) {
                return `
                    <div class="mobile-card">
                        <div class="font-bold text-slate-800 text-sm mb-1">${ten}</div>
                        <div class="text-[10px] text-slate-400 italic mb-2">${model}</div>
                        <div class="bg-emerald-50 p-3 rounded-xl flex justify-between items-center">
                            <div class="mobile-card-label text-emerald-600 font-semibold">Có thể bán</div>
                            <div class="font-bold text-emerald-700 text-lg">${formatNum(cotheban)}</div>
                        </div>
                    </div>
                `;
            }

            return `
                <div class="mobile-card">
                    <div class="font-bold text-slate-800 text-sm mb-2">${ten}</div>
                    <div class="grid grid-cols-2 gap-2 text-[11px]">
                        <div class="bg-slate-50 p-2 rounded-lg"><div class="mobile-card-label">Tồn đầu</div><div class="font-bold">${formatNum(tondau)}</div></div>
                        <div class="bg-blue-50 p-2 rounded-lg"><div class="mobile-card-label text-blue-600">Nhập</div><div class="font-bold text-blue-600">${formatNum(agg.nhap)}</div></div>
                        <div class="bg-orange-50 p-2 rounded-lg"><div class="mobile-card-label text-orange-600">Xuất</div><div class="font-bold text-orange-600">${formatNum(agg.xuat)}</div></div>
                        <div class="bg-emerald-50 p-2 rounded-lg"><div class="mobile-card-label text-emerald-600">Có thể bán</div><div class="font-bold text-emerald-600">${formatNum(cotheban)}</div></div>
                    </div>
                </div>
            `;
        }).join('');
    }

    // Check for stock-out alerts
    checkStockAndNotify();
}

// ─── Module: Giữ Hàng ─────────────────────────────────────────
async function fetchGiuHangData() {
    try {
        const token = await getAccessToken();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.giuHangSheetName}!A1:F50`;
        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (!resp.ok) {
            const errData = await resp.json();
            console.error("Giu Hang API Error:", errData);
            giuHangDataRaw = [];
            return [];
        }
        const data = await resp.json();
        giuHangDataRaw = data.values || [];
        localStorage.setItem('erp_gh_cache', JSON.stringify(giuHangDataRaw));
        return giuHangDataRaw;
    } catch (err) {
        console.error("Giu Hang Data Fetch Error:", err);
        giuHangDataRaw = [];
        return [];
    }
}

async function renderGiuHangModule() {
    const tbody = document.getElementById('giuHangTableBody');
    tbody.innerHTML = '<tr><td colspan="4" class="px-4 py-10 text-center text-slate-400 text-sm">Đang tải dữ liệu...</td></tr>';
    await Promise.all([fetchGiuHangData(), fetchTonKhoData()]);
    applyGiuHangFilters();
}

function applyGiuHangFilters() {
    const tbody = document.getElementById('giuHangTableBody');
    const searchInput = document.getElementById('giuHangSearchInput');
    const searchTerm = searchInput ? searchInput.value.toLowerCase().trim() : '';

    if (!giuHangDataRaw || giuHangDataRaw.length <= 1) {
        const countEl = document.getElementById('giuHangCount');
        if (countEl) countEl.textContent = `0 bản ghi`;
        if (tbody) tbody.innerHTML = `<tr><td colspan="5" class="px-4 py-10 text-center text-slate-400 text-sm">Không có dữ liệu giữ hàng.</td></tr>`;
        return;
    }

    const filteredRows = giuHangDataRaw.slice(1).filter(row => {
        const id = (row[0] || '').toString();
        const tensp = (row[4] || '').toString().toLowerCase();
        const tennv = (row[2] || '').toString().toLowerCase();
        if (!id || !tensp) return false;
        return !searchTerm || tensp.includes(searchTerm) || tennv.includes(searchTerm);
    });

    const countEl = document.getElementById('giuHangCount');
    if (countEl) countEl.textContent = `${filteredRows.length} bản ghi`;

    if (!tbody) return;
    if (filteredRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-10 text-center text-slate-400 text-sm">Không tìm thấy bản ghi phù hợp.</td></tr>';
        return;
    }

    tbody.innerHTML = filteredRows.map(row => {
        const id = row[0] || '';
        const tennv = row[2] || '';
        const idsp = row[3] || '';
        const tensp = row[4] || '';
        const slg = Number(row[5] || 0);

        return `
            <tr class="hover:bg-slate-50/80 transition-colors group">
                <td class="px-4 py-3 text-sm text-slate-700">
                    <div class="font-medium">${tennv}</div>
                </td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold font-mono">
                        ${idsp}
                    </span>
                </td>
                <td class="px-4 py-3 text-sm text-slate-600 italic">
                    ${tensp}
                </td>
                <td class="px-4 py-3 text-right">
                    <span class="font-bold text-blue-600 font-mono">${formatNum(slg)}</span>
                </td>
                <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onclick="openGHDrawer('${id}')" class="p-1.5 text-blue-500 hover:bg-blue-50 rounded-md transition" title="Sửa">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                        </button>
                        <button onclick="deleteGiuHang('${id}')" class="p-1.5 text-red-500 hover:bg-red-50 rounded-md transition" title="Xóa">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');

    const mobileContainer = document.getElementById('giuHangMobileCards');
    if (mobileContainer) {
        mobileContainer.innerHTML = filteredRows.map(row => {
            const id = row[0];
            const tennv = row[2] || '';
            const idsp = row[3] || '';
            const tensp = row[4] || '';
            const slg = Number(row[5] || 0);
            return `
                <div class="mobile-card">
                    <div class="flex justify-between items-center mb-2">
                        <div class="font-bold text-slate-800 text-sm">${tennv}</div>
                        <div class="text-[10px] text-slate-400 font-mono">${idsp}</div>
                    </div>
                    <div class="text-xs text-slate-600 mb-3">${tensp}</div>
                    <div class="flex justify-between items-center pt-2 border-t border-slate-50">
                        <span class="mobile-card-label">Số lượng</span>
                        <div class="flex items-center gap-4">
                            <span class="text-blue-600 font-bold">${formatNum(slg)}</span>
                            <div class="flex gap-2">
                                <button onclick="openGHDrawer('${id}')" class="p-2 text-blue-500 bg-blue-50 rounded-lg">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </button>
                                <button onclick="deleteGiuHang('${id}')" class="p-2 text-red-500 bg-red-50 rounded-lg">
                                    <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }
}

// ─── CRUD: Drawer Giữ Hàng ────────────────────────────────────
function openGHDrawer(ghId = '') {
    const drawer = document.getElementById('ghDrawer');
    const overlay = document.getElementById('ghDrawerOverlay');
    const title = document.getElementById('ghDrawerTitle');
    const idRow = document.getElementById('ghFormRowId');
    const userLabel = document.getElementById('ghFormUserLabel');

    document.getElementById('ghFormSpId').value = '';
    document.getElementById('ghFormSpName').value = '';
    document.getElementById('ghFormSlg').value = '';
    idRow.value = ghId;
    userLabel.textContent = currentUser ? currentUser.name : 'Chưa đăng nhập';

    if (ghId) {
        title.textContent = 'Sửa Giữ Hàng';
        const row = giuHangDataRaw.find(r => r[0] == ghId);
        if (row) {
            const spId = row[3] || '';
            document.getElementById('ghFormSpId').value = spId;
            document.getElementById('ghFormSpName').value = row[4] || '';
            document.getElementById('ghFormSlg').value = row[5] || '';
            updateGiuHangAvailable(spId);
        }
    } else {
        title.textContent = 'Thêm Giữ Hàng Mới';
        document.getElementById('ghFormAvailable').value = '0';
    }

    overlay.classList.remove('hidden');
    setTimeout(() => { drawer.classList.remove('translate-x-full'); }, 10);
}

function closeGHDrawer() {
    const drawer = document.getElementById('ghDrawer');
    const overlay = document.getElementById('ghDrawerOverlay');
    drawer.classList.add('translate-x-full');
    setTimeout(() => { overlay.classList.add('hidden'); }, 300);
    document.getElementById('ghSpDropdown').classList.add('hidden');
}

function searchProducts(term) {
    const dropdown = document.getElementById('ghSpDropdown');
    if (!term) { dropdown.classList.add('hidden'); return; }

    const matches = (tonKhoDataRaw || []).slice(1).filter(row => {
        const id = (row[0] || '').toString().toLowerCase();
        const name = (row[1] || '').toString().toLowerCase();
        const t = term.toLowerCase();
        return id.includes(t) || name.includes(t);
    }).slice(0, 10);

    if (matches.length > 0) {
        dropdown.innerHTML = matches.map(row => `
            <div onclick="selectProduct('${row[0]}', '${row[1]}')" class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                <div class="text-sm font-bold text-slate-700">${row[0]}</div>
                <div class="text-xs text-slate-400 truncate">${row[1]}</div>
            </div>
        `).join('');
        dropdown.classList.remove('hidden');
    } else {
        dropdown.innerHTML = '<div class="px-4 py-3 text-xs text-slate-400 italic">Không tìm thấy sản phẩm</div>';
        dropdown.classList.remove('hidden');
    }
}

function selectProduct(id, name) {
    document.getElementById('ghFormSpId').value = id;
    document.getElementById('ghFormSpName').value = name;
    document.getElementById('ghSpDropdown').classList.add('hidden');
    updateGiuHangAvailable(id);
}

function updateGiuHangAvailable(idSp) {
    const display = document.getElementById('ghFormAvailable');
    if (!idSp) { display.value = '0'; return; }

    const tkRecord = (tonKhoDataRaw || []).slice(1).find(r => r[0] == idSp);
    if (!tkRecord) { display.value = '0 (Không tìm thấy trong kho)'; return; }

    const tondau = Number(tkRecord[6] || 0);
    let nhap = 0, xuat = 0;
    if (nxDataRaw && nxDataRaw.length > 1) {
        nxDataRaw.slice(1).forEach(row => {
            if (row[6] == idSp) {
                if (row[2] === 'NHẬP') nhap += Number(row[8] || 0);
                if (row[2] === 'XUẤT') xuat += Number(row[8] || 0);
            }
        });
    }

    let tamgiu = 0;
    if (giuHangDataRaw && giuHangDataRaw.length > 1) {
        giuHangDataRaw.slice(1).forEach(row => {
            if (row[3] == idSp) tamgiu += Number(row[5] || 0);
        });
    }

    display.value = formatNum(tondau + nhap - xuat - tamgiu);
}

async function saveGiuHang() {
    const idSp = document.getElementById('ghFormSpId').value.trim();
    const tenSp = document.getElementById('ghFormSpName').value.trim();
    const slg = document.getElementById('ghFormSlg').value.trim();
    const rowId = document.getElementById('ghFormRowId').value;
    const btn = document.getElementById('ghSaveBtn');

    if (!idSp || !slg) return alert("Vui lòng nhập ID sản phẩm và số lượng.");

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner !w-4 !h-4 !border-white/20 !border-l-white !m-0"></div> <span>Đang xử lý...</span>';

    try {
        const token = await getAccessToken();
        const sid = CONFIG.spreadsheetId;
        const sname = CONFIG.giuHangSheetName;

        if (rowId) {
            const index = giuHangDataRaw.findIndex(r => r[0] == rowId);
            if (index === -1) throw new Error("Không tìm thấy dòng để sửa");
            const values = [[rowId, currentUser.id, currentUser.name, idSp, tenSp, slg]];
            const range = `${sname}!A${index + 1}:F${index + 1}`;
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}?valueInputOption=RAW`, {
                method: 'PUT',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ values })
            });
        } else {
            const newId = Date.now().toString();
            const values = [[newId, currentUser.id, currentUser.name, idSp, tenSp, slg]];
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${sname}!A1:append?valueInputOption=RAW`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ values })
            });
        }

        closeGHDrawer();
        await renderGiuHangModule();
    } catch (err) {
        alert("Lỗi khi lưu dữ liệu: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Lưu thay đổi</span>';
    }
}

async function deleteGiuHang(rowId) {
    if (!confirm("Bạn có chắc chắn muốn xóa bản ghi này?")) return;
    try {
        const token = await getAccessToken();
        const sid = CONFIG.spreadsheetId;
        const sname = CONFIG.giuHangSheetName;
        const index = giuHangDataRaw.findIndex(r => r[0] == rowId);
        if (index === -1) return;
        const range = `${sname}!A${index + 1}:F${index + 1}`;
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}:clear`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${token}` }
        });
        await renderGiuHangModule();
    } catch (err) {
        alert("Lỗi khi xóa: " + err.message);
    }
}

async function clearAllGiuHang() {
    if (!confirm("CẢNH BÁO: Bạn có chắc chắn muốn XÓA TOÀN BỘ danh sách giữ hàng không? Hành động này không thể hoàn tác.")) return;
    try {
        const token = await getAccessToken();
        const sid = CONFIG.spreadsheetId;
        const sname = CONFIG.giuHangSheetName;
        const range = `${sname}!A2:F1000`;
        await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}:clear`, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${token}` }
        });
        await renderGiuHangModule();
        alert("Đã xóa toàn bộ danh sách giữ hàng.");
    } catch (err) {
        alert("Lỗi khi xóa toàn bộ: " + err.message);
    }
}

// ─── Dashboard Helpers ─────────────────────────────────────
function changeDate(inputId, delta) {
    const el = document.getElementById(inputId);
    let d = el.value ? new Date(el.value) : new Date();
    d.setDate(d.getDate() + delta);
    el.value = d.toISOString().split('T')[0];
    renderDashboard();
}

function setQuickDate(range) {
    const from = document.getElementById('dbFromDate');
    const to = document.getElementById('dbToDate');
    const now = new Date();
    let start = new Date();
    let end = new Date();

    if (range === 'today') {
        // start = end = now
    } else if (range === 'week') {
        const day = now.getDay();
        const diff = now.getDate() - day + (day === 0 ? -6 : 1);
        start = new Date(now.setDate(diff));
        end = new Date();
    } else if (range === 'month') {
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        end = new Date();
    }

    from.value = start.toISOString().split('T')[0];
    to.value = end.toISOString().split('T')[0];
    renderDashboard();
}

function setDbType(val) {
    document.getElementById('dbTruong').value = val;
    const group = document.getElementById('dbTypeButtons');
    group.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('bg-white', 'shadow-sm', 'active-type');
        btn.classList.add('hover:bg-white');
    });
    const id = val === 'NHẬP' ? 'btn-type-nhap' : (val === 'XUẤT' ? 'btn-type-xuat' : 'btn-type-all');
    const active = document.getElementById(id);
    if (active) {
        active.classList.add('bg-white', 'shadow-sm', 'active-type');
        active.classList.remove('hover:bg-white');
    }
    renderDashboard();
}

function updateDashboardFilterOptions() {
    if (!nxDataRaw || nxDataRaw.length <= 1) return;
    const headers = nxDataRaw[0].map(h => (h || '').toString().toLowerCase().trim());
    const findI = (terms) => {
        for (const t of terms) {
            const idx = headers.findIndex(h => h.includes(t));
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const iIdSp = findI(['id_sp', 'mã sp', 'mã sản phẩm']);
    const iTenSp = findI(['tên sp', 'tên sản phẩm', 'product']);
    const iMaKh = findI(['ma_kh', 'mã kh', 'mã khách']);
    const iKhach = findI(['khách hàng', 'tên kh', 'customer']);
    const iIdNv = findI(['id_nv', 'mã nv', 'id nhân viên']);
    const iNv = findI(['nhân viên', 'nvkd', 'staff']);

    const products = new Set();
    const customers = new Set();
    const employees = new Set();

    nxDataRaw.slice(1).forEach(r => {
        const idSp = (r[iIdSp !== -1 ? iIdSp : 6] || '').toString().trim();
        const tenSp = (r[iTenSp !== -1 ? iTenSp : 7] || '').toString().trim();
        if (idSp && tenSp) products.add(`${idSp} - ${tenSp}`);
        else if (idSp) products.add(idSp);

        const maKh = (r[iMaKh !== -1 ? iMaKh : 4] || '').toString().trim();
        const tenKh = (r[iKhach !== -1 ? iKhach : 5] || '').toString().trim();
        if (maKh && tenKh) customers.add(`${maKh} - ${tenKh}`);
        else if (maKh) customers.add(maKh);

        const idNv = (r[iIdNv !== -1 ? iIdNv : 11] || '').toString().trim();
        const tenNv = (r[iNv !== -1 ? iNv : 6] || '').toString().trim();
        if (idNv && tenNv) employees.add(`${idNv} - ${tenNv}`);
        else if (idNv) employees.add(idNv);
    });

    const populate = (id, items) => {
        const dl = document.getElementById(id);
        if (dl) dl.innerHTML = Array.from(items).sort().map(i => `<option value="${i}">`).join('');
    };

    populate('dl-products', products);
    populate('dl-customers', customers);
    populate('dl-employees', employees);
}

// ─── Module: Dashboard ────────────────────────────────────────
async function refreshDashboard() {
    const btn = document.querySelector('[onclick="refreshDashboard()"]');
    if (btn) btn.classList.add('animate-spin');
    await fetchNXData();
    renderDashboard();
    if (btn) btn.classList.remove('animate-spin');
}

function renderDashboard() {
    if (!nxDataRaw || nxDataRaw.length <= 1) {
        const tbody = document.getElementById('dbTableBody');
        if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-400 font-medium">Không có dữ liệu trong sheet "NX_CT" để hiển thị báo cáo.</td></tr>';
        return;
    }

    const fromDate = document.getElementById('dbFromDate').value;
    const toDate = document.getElementById('dbToDate').value;
    const filterIdSp = document.getElementById('dbIdSp').value.toLowerCase().trim();
    const filterTruong = document.getElementById('dbTruong').value;
    const filterMaKh = document.getElementById('dbMaKh').value.toLowerCase().trim();
    const filterIdNv = document.getElementById('dbIdNv').value.toLowerCase().trim();

    const parseDateStr = (s) => {
        if (!s) return null;
        if (s.includes('/')) {
            const parts = s.split('/');
            return new Date(parts[2], parts[1] - 1, parts[0]);
        }
        return new Date(s);
    };

    const fFrom = fromDate ? new Date(fromDate) : null;
    const fTo = toDate ? new Date(toDate) : null;
    if (fTo) fTo.setHours(23, 59, 59, 999);

    const agg = {};
    const dailyAgg = {};

    const headers = nxDataRaw[0].map(h => (h || '').toString().toLowerCase().trim());
    const findI = (terms) => {
        for (const t of terms) {
            const idx = headers.findIndex(h => h.includes(t));
            if (idx !== -1) return idx;
        }
        return -1;
    };

    const iDate = findI(['ngày', 'date']);
    const iType = findI(['trường', 'loại', 'type']);
    const iMaKh = findI(['ma_kh', 'mã kh', 'mã khách']);
    const iKhach = findI(['khách hàng', 'tên kh', 'customer']);
    const iIdSp = findI(['id_sp', 'mã sp', 'mã sản phẩm']);
    const iTenSp = findI(['tên sp', 'tên sản phẩm', 'product']);
    const iIdNv = findI(['id_nv', 'mã nv', 'id nhân viên']);
    const iNv = findI(['nhân viên', 'nvkd', 'staff']);
    const iSlg = findI(['số lượng', 'slg', 'quantity']);

    nxDataRaw.slice(1).forEach(r => {
        const rawDate = r[iDate !== -1 ? iDate : 1] || '';
        const rDateObj = parseDateStr(rawDate);
        if (!rDateObj) return;

        const rTruong = (r[iType !== -1 ? iType : 2] || '').toString();
        const rMaKh = (r[iMaKh !== -1 ? iMaKh : 4] || '').toString().toLowerCase();
        const rTenKh = (r[iKhach !== -1 ? iKhach : 5] || '').toString().toLowerCase();
        const rIdSp = (r[iIdSp !== -1 ? iIdSp : 6] || '').toString().toLowerCase();
        const rTenSp = (r[iTenSp !== -1 ? iTenSp : 7] || '').toString().toLowerCase();
        const rIdNv = (r[iIdNv !== -1 ? iIdNv : 11] || '').toString().toLowerCase();
        const rTenNv = (r[iNv !== -1 ? iNv : 6] || '').toString().toLowerCase();

        if (fFrom && rDateObj < fFrom) return;
        if (fTo && rDateObj > fTo) return;

        // Robust Filter (Mã hoặc Tên)
        const checkMatch = (val, id, name) => {
            if (!val) return true;
            return id.includes(val) || name.includes(val) || val.includes(id);
        };

        if (!checkMatch(filterIdSp, rIdSp, rTenSp)) return;
        if (filterTruong && rTruong !== filterTruong) return;
        if (!checkMatch(filterMaKh, rMaKh, rTenKh)) return;
        if (!checkMatch(filterIdNv, rIdNv, rTenNv)) return;

        const id = r[iIdSp !== -1 ? iIdSp : 6] || 'N/A';
        const name = r[iTenSp !== -1 ? iTenSp : 7] || 'Sản phẩm không tên';
        const slg = Number(r[iSlg !== -1 ? iSlg : 8] || 0);

        if (!agg[id]) agg[id] = { name, nhap: 0, xuat: 0 };
        if (rTruong === 'NHẬP') agg[id].nhap += slg;
        if (rTruong === 'XUẤT') agg[id].xuat += slg;

        const dateKey = rDateObj.toISOString().split('T')[0];
        if (!dailyAgg[dateKey]) dailyAgg[dateKey] = { nhap: 0, xuat: 0 };
        if (rTruong === 'NHẬP') dailyAgg[dateKey].nhap += slg;
        if (rTruong === 'XUẤT') dailyAgg[dateKey].xuat += slg;
    });

    const aggList = Object.keys(agg).map(id => ({ id, ...agg[id] }));
    const dailyList = Object.keys(dailyAgg).sort().map(d => ({ date: d, ...dailyAgg[d] }));

    const tbody = document.getElementById('dbTableBody');
    document.getElementById('dbTableCount').textContent = `${aggList.length} sản phẩm`;

    tbody.innerHTML = aggList.sort((a, b) => (b.nhap + b.xuat) - (a.nhap + a.xuat)).map(item => `
        <tr class="hover:bg-slate-50 transition-colors">
            <td class="px-6 py-3 text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">${item.id}</td>
            <td class="px-6 py-3 text-sm font-semibold text-slate-700">${item.name}</td>
            <td class="px-6 py-3 text-sm text-right font-medium text-blue-600">${formatNum(item.nhap)}</td>
            <td class="px-6 py-3 text-sm text-right font-medium text-orange-600">${formatNum(item.xuat)}</td>
        </tr>
    `).join('');

    const topNhap = [...aggList].sort((a, b) => b.nhap - a.nhap).slice(0, 10).filter(i => i.nhap > 0);
    const topXuat = [...aggList].sort((a, b) => b.xuat - a.xuat).slice(0, 10).filter(i => i.xuat > 0);

    renderChart('importChart', topNhap, 'nhap', 'Top Nhập', '#3b82f6', 'bar', importChartObj, (obj) => importChartObj = obj);
    renderChart('exportChart', topXuat, 'xuat', 'Top Xuất', '#f97316', 'bar', exportChartObj, (obj) => exportChartObj = obj);
    renderChart('dailyImportChart', dailyList, 'nhap', 'Nhập Số Lượng', '#60a5fa', 'line', dailyImportChartObj, (obj) => dailyImportChartObj = obj);
    renderChart('dailyExportChart', dailyList, 'xuat', 'Xuất Số Lượng', '#fb923c', 'line', dailyExportChartObj, (obj) => dailyExportChartObj = obj);
    renderInventoryAnalytics();
}

function renderChart(canvasId, data, key, label, color, type, existingChart, setChart) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    if (existingChart) existingChart.destroy();

    const chartLabels = type === 'bar' ? data.map(i => i.id) : data.map(i => i.date);

    const newChart = new Chart(ctx, {
        type: type,
        data: {
            labels: chartLabels,
            datasets: [{
                label: label,
                data: data.map(i => i[key]),
                backgroundColor: color + '33',
                borderColor: color,
                borderWidth: 2,
                borderRadius: type === 'bar' ? 6 : 0,
                tension: 0.3,
                fill: type === 'line'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { backgroundColor: '#1e293b', padding: 12, cornerRadius: 8 }
            },
            scales: {
                x: { grid: { display: false }, ticks: { font: { size: 9 } } },
                y: { grid: { display: false }, ticks: { font: { size: 9 } } }
            }
        }
    });
    setChart(newChart);
}

// ─── Inventory Analytics ──────────────────────────────────────
function renderInventoryAnalytics() {
    const tbody = document.getElementById('invAnalyticsBody');
    const countEl = document.getElementById('invAnalyticsCount');
    if (!tbody) return;

    if (!tonKhoDataRaw || tonKhoDataRaw.length <= 1) {
        tbody.innerHTML = '<tr><td colspan="10" class="px-4 py-8 text-center text-slate-400">Chưa có dữ liệu tồn kho.</td></tr>';
        return;
    }

    const filterIdSp = (document.getElementById('dbIdSp') ? document.getElementById('dbIdSp').value : '').toLowerCase().trim();

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    const prevMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const prevYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const parseDateStr = (s) => {
        if (!s) return null;
        if (s.includes('/')) {
            const p = s.split('/');
            return new Date(+p[2], +p[1] - 1, +p[0]);
        }
        return new Date(s);
    };

    const nxByIdAll = {};
    let globalMinDate = null, globalMaxDate = null;

    if (nxDataRaw && nxDataRaw.length > 1) {
        nxDataRaw.slice(1).forEach(r => {
            const id = (r[6] || '').toString().trim();
            const type = (r[2] || '').toString();
            const slg = Number(r[8] || 0);
            const d = parseDateStr((r[1] || '').toString());
            if (!id || !d) return;

            if (!nxByIdAll[id]) nxByIdAll[id] = { nhap_all: 0, xuat_all: 0, nhap_this: 0, xuat_this: 0, nhap_prev: 0, xuat_prev: 0 };

            if (!globalMinDate || d < globalMinDate) globalMinDate = d;
            if (!globalMaxDate || d > globalMaxDate) globalMaxDate = d;

            const isThisMonth = (d.getMonth() === thisMonth && d.getFullYear() === thisYear);
            const isPrevMonth = (d.getMonth() === prevMonth && d.getFullYear() === prevYear);

            if (type === 'NHẬP') {
                nxByIdAll[id].nhap_all += slg;
                if (isThisMonth) nxByIdAll[id].nhap_this += slg;
                if (isPrevMonth) nxByIdAll[id].nhap_prev += slg;
            }
            if (type === 'XUẤT') {
                nxByIdAll[id].xuat_all += slg;
                if (isThisMonth) nxByIdAll[id].xuat_this += slg;
                if (isPrevMonth) nxByIdAll[id].xuat_prev += slg;
            }
        });
    }

    const totalDays = (globalMinDate && globalMaxDate)
        ? Math.max(1, Math.round((globalMaxDate - globalMinDate) / 86400000) + 1)
        : 30;

    const rows = tonKhoDataRaw.slice(1).filter(r => {
        const id = (r[0] || '').toString().trim();
        const name = (r[1] || '').toString().trim();
        if (!id || !name) return false;
        if (filterIdSp && !id.toLowerCase().includes(filterIdSp)) return false;
        return true;
    });

    const formatN = (n) => n.toLocaleString('vi-VN');
    const fmt2 = (n) => n.toFixed(2);

    if (countEl) countEl.textContent = rows.length + ' sản phẩm';

    tbody.innerHTML = rows.map(r => {
        const id = (r[0] || '').toString().trim();
        const model = (r[2] || '').toString();
        const tensp = (r[1] || '').toString();
        const tondau = Number(r[6] || 0);

        const nx = nxByIdAll[id] || { nhap_all: 0, xuat_all: 0, nhap_this: 0, xuat_this: 0, nhap_prev: 0, xuat_prev: 0 };
        const tonHT = tondau + nx.nhap_all - nx.xuat_all;

        const ton_this = tondau + nx.nhap_this - nx.xuat_this;
        const ton_prev = tondau + nx.nhap_prev - nx.xuat_prev;
        let growthHtml = '<span class="text-slate-300">—</span>';
        if (ton_prev !== 0) {
            const g = ((ton_this - ton_prev) / Math.abs(ton_prev)) * 100;
            const color = g > 0 ? 'text-blue-600' : g < 0 ? 'text-red-500' : 'text-slate-400';
            const arrow = g > 0 ? '▲' : g < 0 ? '▼' : '●';
            growthHtml = '<span class="' + color + ' font-bold">' + arrow + ' ' + fmt2(g) + '%</span>';
        }

        const avgInv = (tondau + tonHT) / 2;
        let turnoverHtml = '<span class="text-slate-300">—</span>';
        if (avgInv > 0 && nx.xuat_all > 0) {
            const t = nx.xuat_all / avgInv;
            const color = t >= 4 ? 'text-emerald-600' : t >= 1 ? 'text-blue-500' : 'text-orange-500';
            turnoverHtml = '<span class="' + color + ' font-bold">' + fmt2(t) + 'x</span>';
        }

        let dtsHtml = '<span class="text-slate-300">—</span>';
        const dailySales = nx.xuat_all / totalDays;
        if (tonHT > 0 && dailySales > 0) {
            const days = Math.round(tonHT / dailySales);
            const color = days <= 30 ? 'text-red-500' : days <= 90 ? 'text-orange-500' : 'text-emerald-600';
            dtsHtml = '<span class="' + color + ' font-bold">' + days + ' ngày</span>';
        } else if (tonHT <= 0) {
            dtsHtml = '<span class="text-slate-400 text-[10px]">Hết hàng</span>';
        }

        return '<tr class="hover:bg-slate-50 transition-colors">' +
            '<td class="px-4 py-2.5 font-mono text-[10px] font-bold text-slate-400 uppercase">' + id + '</td>' +
            '<td class="px-4 py-2.5 font-semibold text-slate-700 text-xs">' + tensp + '</td>' +
            '<td class="px-4 py-2.5 text-slate-500 text-[11px]">' + model + '</td>' +
            '<td class="px-4 py-2.5 text-right text-slate-600">' + formatN(tondau) + '</td>' +
            '<td class="px-4 py-2.5 text-right text-blue-600">' + formatN(nx.nhap_all) + '</td>' +
            '<td class="px-4 py-2.5 text-right text-orange-600">' + formatN(nx.xuat_all) + '</td>' +
            '<td class="px-4 py-2.5 text-right font-bold text-emerald-700">' + formatN(tonHT) + '</td>' +
            '<td class="px-4 py-2.5 text-center">' + growthHtml + '</td>' +
            '<td class="px-4 py-2.5 text-center">' + turnoverHtml + '</td>' +
            '<td class="px-4 py-2.5 text-center">' + dtsHtml + '</td>' +
            '</tr>';
    }).join('');
}

// ─── App Init ────────────────────────────────────────────────
window.addEventListener('load', async () => {
    const savedSession = localStorage.getItem('erp_user_session');
    if (savedSession) {
        try {
            currentUser = JSON.parse(savedSession);
            updateUserProfileUI();
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            if (currentUser.role === 'NPP') switchModule('tonkho');
            else switchModule('home');
            setQuickDate('month'); // Default dashboard to this month
            Promise.all([fetchNXData(), fetchTonKhoData(), fetchGiuHangData()]).then(() => renderDashboard()).catch(console.error);
        } catch (e) {
            localStorage.removeItem('erp_user_session');
        }
    }
    await fetchAuthData();

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

    initNotificationService();
});

// ─── Notification Service ────────────────────────────────────
let notiPollingId = null;
let notifiedItems = JSON.parse(localStorage.getItem('erp_notified_items') || '{}');

async function toggleStockNotifications() {
    if (!("Notification" in window)) {
        alert("Trình duyệt này không hỗ trợ thông báo.");
        return;
    }

    if (Notification.permission === "denied") {
        alert("Bạn đã chặn thông báo. Vui lòng vào cài đặt trình duyệt để bật lại.");
        return;
    }

    const currentStatus = localStorage.getItem('erp_noti_enabled') === 'true';
    if (!currentStatus) {
        const permission = await Notification.requestPermission();
        if (permission === "granted") {
            localStorage.setItem('erp_noti_enabled', 'true');
            initNotificationService();
            new Notification("Đã bật thông báo kho", { body: "Bạn sẽ nhận được cảnh báo khi sản phẩm hết hàng." });
        }
    } else {
        localStorage.setItem('erp_noti_enabled', 'false');
        initNotificationService();
    }
}

function initNotificationService() {
    const isEnabled = localStorage.getItem('erp_noti_enabled') === 'true';
    const btn = document.getElementById('stockNotiBtn');
    if (btn) {
        if (isEnabled && Notification.permission === "granted") {
            btn.classList.add('active');
            if (!notiPollingId) {
                // Kiểm tra mỗi 5 phút (Tải cả 3 bảng để tính số lượng Có thể bán)
                notiPollingId = setInterval(() => {
                    Promise.all([fetchTonKhoData(), fetchNXData(), fetchGiuHangData()]).then(checkStockAndNotify);
                }, 5 * 60 * 1000);
            }
            checkStockAndNotify();
        } else {
            btn.classList.remove('active');
            if (notiPollingId) {
                clearInterval(notiPollingId);
                notiPollingId = null;
            }
        }
    }
}

function checkStockAndNotify() {
    if (!tonKhoDataRaw || tonKhoDataRaw.length <= 1) return;
    if (localStorage.getItem('erp_noti_enabled') !== 'true') return;

    // 1. Tính toán số liệu tổng hợp (giống applyTonKhoFilters)
    const nxAgg = {};
    if (nxDataRaw && nxDataRaw.length > 1) {
        nxDataRaw.slice(1).forEach(row => {
            const idSp = (row[6] || '').toString();
            const type = (row[2] || '').toString();
            const slg = Number(row[8] || 0);
            if (!nxAgg[idSp]) nxAgg[idSp] = { nhap: 0, xuat: 0 };
            if (type === 'NHẬP') nxAgg[idSp].nhap += slg;
            if (type === 'XUẤT') nxAgg[idSp].xuat += slg;
        });
    }
    const giuAgg = {};
    if (giuHangDataRaw && giuHangDataRaw.length > 1) {
        giuHangDataRaw.slice(1).forEach(row => {
            const idSp = (row[3] || '').toString();
            const slg = Number(row[5] || 0);
            if (!giuAgg[idSp]) giuAgg[idSp] = 0;
            giuAgg[idSp] += slg;
        });
    }

    let hasNewAlert = false;
    tonKhoDataRaw.slice(1).forEach(row => {
        const id = (row[0] || '').toString();
        const name = (row[1] || '').toString();
        const tondau = Number(row[6] || 0);

        // Tính Có thể bán = Tồn đầu + Nhập - Xuất - Tạm giữ
        const agg = nxAgg[id] || { nhap: 0, xuat: 0 };
        const tamgiu = giuAgg[id] || 0;
        const available = tondau + agg.nhap - agg.xuat - tamgiu;

        if (available <= 0 && !notifiedItems[id]) {
            notifiedItems[id] = true;
            hasNewAlert = true;
            new Notification("HẾT HÀNG (Có thể bán): " + name, {
                body: `Sản phẩm "${name}" đã hết số lượng có thể bán.`,
                icon: "icons/icon-512.png"
            });
        } else if (available > 0 && notifiedItems[id]) {
            // Đã nhập thêm hàng, xóa khỏi danh sách đã báo
            delete notifiedItems[id];
            hasNewAlert = true;
        }
    });

    if (hasNewAlert) {
        localStorage.setItem('erp_notified_items', JSON.stringify(notifiedItems));
    }
}
