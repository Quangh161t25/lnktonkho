// ============================================================
// app.js - ERP System Logic
// ============================================================

const CONFIG = {
    spreadsheetId: "1qo4DMUGNd-D7n2hbrRiGIIkR24mArDoKZSeYjdkP8hQ",
    authSheetName: "DSNV",
    nxSheetName: "NX_CT",
    nhapSheetName: "NHAP_CT",
    xuatSheetName: "XUAT_CT",
    transferSheetName: "CHUYEN_KHO_CT",
    productSheetName: "DS_SP",
    warehouseProductSheetName: "DS_SP_KHO",
    reconciliationSheetName: "DOI_SOAT",
    giuHangSheetName: "GIU_HANG",
    kiemKhoSheetName: "KIEM_KHO",
    permissionsFile: "permissions.json",
    serviceAccountEmail: "test-gia-ason@api-test-sheet-161.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC3NN84hLTkQPZd\nLj7niXZTICq7nHsuTn3J6r2Paq12m70/lYSmrwh1i0EStr9bO19QM8cevGlslwGr\nWSVOLJlc6+w1HGPKvRXtA41kYV9MYIvpzIPQtkFE7Hxq71QyBARcv39Lfzze6Ioj\n3G8VBvAKFLAnCUr97GHRv+KbCTFxPZupd3PEB+xS5ZUlzdBCEZvDid3iXaaEJJ+l\nTd1apAGQHjtnDTLOkiTa8zf7X5ebALwnI9MziOdN8VyprHXGhkachPbKyrG0QwEs\n2jtiI6Y5ULsBPjNefoavH8MKU5DEAT9h0fZ7KfsKYVMDuXqmEKBs0D3B4Z6aDZQW\nwT2dDRZDAgMBAAECggEAEIuVoSzZVuFhaz1GI9ji0IacjvO50cIq7M8Zrj4/F756\nEw6PIhKENafAb7U4INm2AnzUMO8CqL9Jpxs85qUM3W4JysSByqLUiRW2184amIyb\nj7jCXfLBTQn8AbHgrUepl5d/vBmFYMgon/mqjbNiGDb4FZgEQSkie5o6fi/dWp5d\nNahbZl+WTOB/znhAfKh/zferHNxldR/ERmwOubZUerkqysWiBigc3ovpLSUof9ur\nz3hNPPp0CKQjF40xuQc6FYTHUHMLuMvp78PXuc/mYqQmZ8VOGhU+faGtZ4m+QJly\ndF5dS8U5cwKEF+ptuAUiWSahn6INb9yKn3+FcsW0UQKBgQDb8N4eWFvbgpRo/vxo\nwBN2u2TWubj6clcrq/1a+VR0njC28Can0ogJHhrFhPxVs5D/rugs3HlbyAXJFptY\nV0DZPCwBxGU5P5RbGjXWWEUXjp4ISKQD8WKfVlXNr79TqLdOg2NZBYQAi06Cpo/T\nPV9l7LSG2Tj/9WdvD7W2wvrpaQKBgQDVPjpJN6xh7+sHtSU0mjKvrqigpHbuSQ/o\nXpUaWSIpJffm5QpFPAOcTT5mHZCyllicJQIrfPSY+sH8n+sF03CUqVkV4Q2UqfOf\npFaLDB4P6SQ8iesZyF4VKFrj/cAvRJmp0e5W/DRnFkoEp+8c+nrru2+Dzm9kb7Uq\n0CiltqYAywKBgBtcfrV1to+7Ue0x84KwintV2rifyDRX7yI+tjkQFYKgf1zyyUxN\nc6D2vsvdvGqI+TvlrXqPPwW8/4NBrbeyux2LT8o0fYc+sp0WyKXOu2Gv21caelUH\nPYam/eultn6Y2Z0J2V0kw4Qx0GWOhQv5cZnDdb3k3iNxixmU8b03ynEpAoGBAKEA\n7O0fNe50QRZ+tOq0ihSPYQ55XrqnO3WNBDLynZJH8pbI1CpWF7vJrpVXOUs9rQWo\nA61mGR/wJMtiywaJEHWOL48PbzuR3jno0NcHfSMyOoPi9jlvSWncIFQH4TVPLF5F\n/Rh8L+ytrZE6YpWUoX6e9KGmGgDRPw5mQGpuL4RlAoGADe9n080SXlsUk4nHVjUz\nEfv7EBoBkgOpqb9T1foRfJl46NxmmTOYV3iGIhjwcDskEg284k4iq/gH6EEFyEBc\nVz13jzB1nBgjfezFesVQz7bA/+Wik6HZtxAxVg38BKMt+Q1tYw9wOjbGPqOn++VC\nsR2Sh8e3h3Knd6j1tceRIFU=\n-----END PRIVATE KEY-----\n",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["https://www.googleapis.com/auth/spreadsheets"]
};

const WAREHOUSE_OPTIONS = ['KHO 1', 'KHO 2', 'KHO 3', 'KHO 4', 'KHO 5'];

function isAllowedWarehouse(value) {
    return WAREHOUSE_OPTIONS.includes((value || '').toString().trim());
}

function setWarehouseSelectValue(selectId, value) {
    const select = document.getElementById(selectId);
    if (!select) return;
    const normalized = (value || '').toString().trim();
    select.value = isAllowedWarehouse(normalized) ? normalized : '';
    if (selectId === 'nxManualWarehouse') updateNXManualCommonWarehouseButtons();
}

// ─── State ───────────────────────────────────────────────────
let usersData = [];
let nxDataRaw = JSON.parse(localStorage.getItem('erp_nx_cache') || '[]');
let nhapDataRaw = JSON.parse(localStorage.getItem('erp_nhap_cache') || '[]');
let xuatDataRaw = JSON.parse(localStorage.getItem('erp_xuat_cache') || '[]');
let transferDataRaw = JSON.parse(localStorage.getItem('erp_transfer_cache') || '[]');
let productDataRaw = JSON.parse(localStorage.getItem('erp_product_cache') || '[]');
let warehouseProductDataRaw = JSON.parse(localStorage.getItem('erp_warehouse_product_cache') || '[]');
let reconciliationDataRaw = JSON.parse(localStorage.getItem('erp_reconciliation_cache') || '[]');
let giuHangDataRaw = JSON.parse(localStorage.getItem('erp_gh_cache') || '[]');
let kiemKhoDataRaw = JSON.parse(localStorage.getItem('erp_kk_cache') || '[]');
let currentUser = null;
let loggedInUser = null;
let accessToken = null;
let tokenExpiry = 0;
let isSidebarCollapsed = false;
let activeModuleName = 'home';
let dsnvManualModule = '';
let dsnvUploadModule = '';
let reconciliationStatusFilter = '';
let orderImageFile = null;
let orderImageRows = [];

// ─── Chart instances ──────────────────────────────────────────
let importChartObj = null;
let exportChartObj = null;
let dailyImportChartObj = null;
let dailyExportChartObj = null;

const NX_WAREHOUSE_CONFIRM = {
    quantityCol: 13,
    statusCol: 14,
    userCol: 15,
    timeCol: 16,
    fetchRange: 'A1:Q60000',
    updateStartLetter: 'N',
    updateEndLetter: 'Q',
    statuses: ['Đã nhặt hàng', 'Đã lên xe', 'Hoàn thành']
};

// ─── Pagination State ─────────────────────────────────────────
const PAGE_SIZE = 200;
let nxCurrentPage = 1;
let kkCurrentPage = 1;
const simpleModulePages = { nhap: 1, xuat: 1, chuyenkho: 1, sanpham: 1, sanphamkho: 1, doisoat: 1 };
const simpleModuleSorts = {
    sanpham: { column: 'ton_cuoi', direction: 'desc' },
    sanphamkho: { column: 'ton_cuoi', direction: 'desc' }
};
const ACTIVE_MODULES = ['home', 'nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang'];

const DEFAULT_PERMISSIONS = {
    roles: {
        'ADMIN': {
            modules: ['home', 'nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang'],
            actions: ['nx.manualAdd', 'nx.upload', 'nx.confirmWarehouse', 'sanpham.manage', 'doisoat.manage']
        },
        'kt': {
            modules: ['nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat'],
            actions: ['nx.upload', 'doisoat.manage']
        },
        'KHO': {
            modules: ['nhap', 'xuat', 'chuyenkho', 'sanphamkho'],
            actions: ['nx.confirmWarehouse']
        },
        'NPP': {
            modules: ['sanpham', 'xuat'],
            actions: []
        },
        'KD': {
            modules: ['sanpham', 'xuat'],
            actions: []
        },
        'NVKD': {
            modules: ['sanpham', 'xuat'],
            actions: []
        }
    },
    userRestrictions: {
        'KH00206': { hiddenProductIds: ['TK-0348', 'TK-0318', 'TK-0320', 'TK-0324'] }
    }
};
let appPermissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));

function renderPagination(totalItems, currentPage, containerId, onPageChange) {
    const totalPages = Math.ceil(totalItems / PAGE_SIZE);
    const container = document.getElementById(containerId);
    if (!container) return;
    if (totalPages <= 1) { container.innerHTML = ''; return; }

    const start = (currentPage - 1) * PAGE_SIZE + 1;
    const end = Math.min(currentPage * PAGE_SIZE, totalItems);

    container.innerHTML = `
        <div class="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-100">
            <span class="text-xs text-slate-400">${start}–${end} / ${totalItems}</span>
            <div class="flex items-center gap-1">
                <button onclick="${onPageChange}(1)" class="px-2 py-1 text-xs rounded-lg ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}" ${currentPage === 1 ? 'disabled' : ''}>«</button>
                <button onclick="${onPageChange}(${currentPage - 1})" class="px-2 py-1 text-xs rounded-lg ${currentPage === 1 ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}" ${currentPage === 1 ? 'disabled' : ''}>‹</button>
                <span class="px-3 py-1 text-xs font-bold text-blue-600 bg-blue-50 rounded-lg">${currentPage}/${totalPages}</span>
                <button onclick="${onPageChange}(${currentPage + 1})" class="px-2 py-1 text-xs rounded-lg ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}" ${currentPage === totalPages ? 'disabled' : ''}>›</button>
                <button onclick="${onPageChange}(${totalPages})" class="px-2 py-1 text-xs rounded-lg ${currentPage === totalPages ? 'text-slate-300 cursor-not-allowed' : 'text-slate-500 hover:bg-slate-100'}" ${currentPage === totalPages ? 'disabled' : ''}>»</button>
            </div>
        </div>
    `;
}

// ─── Utility ──────────────────────────────────────────────────
const formatNum = (val) => {
    const num = Number(val);
    return isNaN(num) ? (val || '0') : num.toLocaleString();
};

const cleanNumber = (val) => {
    if (typeof val === 'number') return Number.isFinite(val) ? val : 0;
    const cleaned = (val || '').toString().replace(/[,\s.]/g, '');
    const num = Number(cleaned);
    return Number.isFinite(num) ? num : 0;
};

function normalizeHeaderKey(value) {
    return (value || '').toString().trim().toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function findHeaderIndex(headers, aliases) {
    const normalizedHeaders = headers.map(normalizeHeaderKey);
    const normalizedAliases = aliases.map(normalizeHeaderKey);
    return normalizedHeaders.findIndex(header => normalizedAliases.includes(header));
}

function normalizeNXType(value) {
    return (value || '').toString().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
}

function isNXExportRow(row) {
    return normalizeNXType(row && row[2]) === 'XUAT';
}

function getWarehouseConfirmStatus(row) {
    return (row && row[NX_WAREHOUSE_CONFIRM.statusCol] || '').toString().trim();
}

function getWarehouseNextStatus(currentStatus) {
    const statuses = NX_WAREHOUSE_CONFIRM.statuses;
    const currentIndex = statuses.indexOf(currentStatus);
    if (currentIndex === -1) return statuses[0];
    return statuses[Math.min(currentIndex + 1, statuses.length - 1)];
}

function formatConfirmTime(date = new Date()) {
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function renderWarehouseStatusBadge(row) {
    if (!isNXExportRow(row)) return '<span class="text-[11px] text-slate-300">-</span>';
    const qty = row[NX_WAREHOUSE_CONFIRM.quantityCol] || '';
    const status = getWarehouseConfirmStatus(row);
    const user = row[NX_WAREHOUSE_CONFIRM.userCol] || '';
    const time = row[NX_WAREHOUSE_CONFIRM.timeCol] || '';
    const expectedQty = cleanNumber(row[8]);
    const confirmedQty = cleanNumber(qty);
    const qtyOk = status && confirmedQty === expectedQty;
    const statusClass = status === 'Hoàn thành'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : (status ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-500 border-slate-200');
    const qtyClass = status ? (qtyOk ? 'text-emerald-700' : 'text-red-600') : 'text-slate-400';
    const label = status || 'Chưa xác nhận';
    const meta = status ? `<div class="mt-1 text-[10px] ${qtyClass}">SL: ${qty || 0}/${row[8] || 0}${user ? ` - ${user}` : ''}${time ? ` - ${time}` : ''}</div>` : '';

    return `<div><span class="inline-flex px-2 py-1 rounded-lg border text-[10px] font-bold ${statusClass}">${label}</span>${meta}</div>`;
}

async function updateNXWarehouseConfirmation(sheetRow, confirmedQty, status) {
    const token = await getAccessToken();
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.nxSheetName}!${NX_WAREHOUSE_CONFIRM.updateStartLetter}${sheetRow}:${NX_WAREHOUSE_CONFIRM.updateEndLetter}${sheetRow}?valueInputOption=USER_ENTERED`;
    const values = [[
        confirmedQty,
        status,
        currentUser ? currentUser.id : '',
        formatConfirmTime()
    ]];

    const resp = await fetch(url, {
        method: 'PUT',
        headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ values })
    });

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        console.error("Warehouse confirm update error:", err);
        throw new Error('Không thể cập nhật xác nhận kho.');
    }
}

async function confirmNXWarehouseRow(sheetRow) {
    if (!canCurrentUser('nx.confirmWarehouse')) {
        alert("Bạn không có quyền xác nhận kho.");
        return;
    }
    const rowIndex = sheetRow - 1;
    const row = nxDataRaw[rowIndex];
    if (!row || !isNXExportRow(row)) {
        alert("Chỉ xác nhận kho cho dòng XUẤT.");
        return;
    }

    const expectedQty = cleanNumber(row[8]);
    const currentQty = row[NX_WAREHOUSE_CONFIRM.quantityCol] || row[8] || '';
    const qtyInput = prompt(`Xác nhận số lượng hàng gửi đi cho đơn ${row[3] || ''} - ${row[6] || ''}\nSố lượng trên đơn: ${row[8] || 0}`, currentQty);
    if (qtyInput === null) return;

    const confirmedQty = cleanNumber(qtyInput);
    if (confirmedQty < 0) {
        alert("Số lượng xác nhận không hợp lệ.");
        return;
    }

    const nextStatus = getWarehouseNextStatus(getWarehouseConfirmStatus(row));
    const qtyText = confirmedQty === expectedQty ? 'đúng' : `khác số lượng đơn (${confirmedQty}/${expectedQty})`;
    if (!confirm(`Xác nhận ${nextStatus} với số lượng ${qtyText}?`)) return;

    try {
        await updateNXWarehouseConfirmation(sheetRow, confirmedQty, nextStatus);
        row[NX_WAREHOUSE_CONFIRM.quantityCol] = confirmedQty;
        row[NX_WAREHOUSE_CONFIRM.statusCol] = nextStatus;
        row[NX_WAREHOUSE_CONFIRM.userCol] = currentUser ? currentUser.id : '';
        row[NX_WAREHOUSE_CONFIRM.timeCol] = formatConfirmTime();
        localStorage.setItem('erp_nx_cache', JSON.stringify(nxDataRaw));
        applyFilters();
        alert("Đã cập nhật xác nhận kho.");
    } catch (err) {
        console.error(err);
        alert("Lỗi khi cập nhật xác nhận kho. Vui lòng kiểm tra quyền truy cập Sheet.");
    }
}

const escAttr = (val) => (val || '').toString()
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

const jsArg = (val) => escAttr((val || '').toString().replace(/\\/g, '\\\\').replace(/'/g, "\\'"));

function resolveRoleKey(role) {
    const roleText = (role || '').toString().trim();
    if (!roleText) return '';
    if (appPermissions.roles && appPermissions.roles[roleText]) return roleText;
    const upperRole = roleText.toUpperCase();
    return Object.keys(appPermissions.roles || {}).find(key => key.toUpperCase() === upperRole) || roleText;
}

function getRoleConfig(role) {
    const roleKey = resolveRoleKey(role);
    return (appPermissions.roles && appPermissions.roles[roleKey]) || { modules: ['home'], actions: [] };
}

function getAllowedModules(role) {
    return (getRoleConfig(role).modules || ['home']).filter(moduleName => ACTIVE_MODULES.includes(moduleName));
}

function getDefaultModuleForCurrentUser() {
    const allowed = currentUser ? getAllowedModules(currentUser.role) : [];
    return allowed.includes('home') ? 'home' : (allowed[0] || '');
}

function getAuthUser() {
    return loggedInUser || currentUser;
}

function sanitizeSessionUser(user) {
    if (!user) return null;
    return {
        id: user.id || '',
        name: user.name || '',
        image: user.image || '',
        gender: user.gender || '',
        birthDate: user.birthDate || '',
        role: user.role || '',
        type: user.type || ''
    };
}

function normalizeLoginValue(value) {
    return (value ?? '').toString().replace(/[\u200B-\u200D\uFEFF]/g, '').trim();
}

function persistUserSession() {
    const authUser = getAuthUser();
    if (!authUser || !currentUser) return;
    localStorage.setItem('erp_user_session', JSON.stringify({
        loggedInUser: sanitizeSessionUser(authUser),
        viewUser: sanitizeSessionUser(currentUser)
    }));
}

function clearUserSession() {
    localStorage.removeItem('erp_user_session');
    loggedInUser = null;
    currentUser = null;
}

function restoreSavedSession(savedSession) {
    if (!savedSession) return false;
    const parsedSession = JSON.parse(savedSession);
    const savedLogin = parsedSession && parsedSession.loggedInUser ? parsedSession.loggedInUser : parsedSession;
    const savedView = parsedSession && parsedSession.viewUser ? parsedSession.viewUser : savedLogin;
    const freshLogin = savedLogin && usersData.find(user => user.id === savedLogin.id);
    if (!freshLogin) return false;

    loggedInUser = freshLogin;
    currentUser = savedView && usersData.find(user => user.id === savedView.id) || freshLogin;
    persistUserSession();
    return true;
}

function isAdminSession() {
    const authUser = getAuthUser();
    return !!authUser && resolveRoleKey(authUser.role) === 'ADMIN';
}

function isViewingAsOtherUser() {
    const authUser = getAuthUser();
    return !!authUser && !!currentUser && authUser.id !== currentUser.id;
}

function canCurrentUser(action) {
    if (!currentUser) return false;
    if (resolveRoleKey(currentUser.role) === 'ADMIN') return true;
    const actions = getRoleConfig(currentUser.role).actions || [];
    return actions.includes(action);
}

function getHiddenProductIdsForUser(userId) {
    const restriction = appPermissions.userRestrictions && appPermissions.userRestrictions[userId];
    return restriction && Array.isArray(restriction.hiddenProductIds) ? restriction.hiddenProductIds : [];
}

async function loadPermissionsConfig() {
    try {
        const resp = await fetch(CONFIG.permissionsFile, { cache: 'no-store' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        appPermissions = {
            ...DEFAULT_PERMISSIONS,
            ...data,
            roles: { ...DEFAULT_PERMISSIONS.roles, ...(data.roles || {}) },
            userRestrictions: { ...DEFAULT_PERMISSIONS.userRestrictions, ...(data.userRestrictions || {}) }
        };
    } catch (err) {
        console.warn("Permission config fallback:", err);
        appPermissions = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
    }
}

function normalizeTxType(type) {
    const t = (type || '').toString().toUpperCase();
    if (t.includes('NH') && t.includes('TR')) return 'NHAP_TRA';
    if (t.includes('NH')) return 'NHAP';
    if (t.includes('H') && t.includes('TR')) return 'XUAT';
    if (t.includes('XU')) return 'XUAT';
    return t;
}

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
            populateAdminViewUserSelect();
            updateUserProfileUI();
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
        updateUserProfileUI();
        switchModule(getDefaultModuleForCurrentUser());
        document.getElementById('loginScreen').classList.add('hidden');
        document.getElementById('mainApp').classList.remove('hidden');
        fetchReferenceData().catch(console.error);
    } else {
        alert('Tài khoản hoặc mật khẩu không chính xác!');
    }
}

function logout() {
    clearUserSession();
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
    if (!event.target.closest('#userMenuButton') && !event.target.closest('#userMenuDropdown')) {
        const dropdown = document.getElementById('userMenuDropdown');
        if (dropdown && !dropdown.classList.contains('hidden')) {
            dropdown.classList.add('hidden');
        }
    }
};

function populateAdminViewUserSelect() {
    const wrap = document.getElementById('adminViewAsWrap');
    const select = document.getElementById('adminViewAsSelect');
    if (!wrap || !select) return;

    if (!isAdminSession()) {
        wrap.classList.add('hidden');
        return;
    }

    wrap.classList.remove('hidden');
    select.innerHTML = (usersData || [])
        .filter(u => u.id)
        .map(u => `<option value="${escAttr(u.id)}">${escAttr(u.id)}${u.name ? ` - ${escAttr(u.name)}` : ''}${u.role ? ` (${escAttr(u.role)})` : ''}</option>`)
        .join('');
    select.value = currentUser ? currentUser.id : getAuthUser().id;
}

function refreshCurrentModuleView() {
    const visibleModule = ['home', 'nhapxuat', 'nhap', 'xuat', 'chuyenkho', 'anhdonhang', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang', 'giuhang', 'kiemkho', 'dashboard']
        .find(m => !document.getElementById(`module-${m}`)?.classList.contains('hidden'));
    const allowed = currentUser ? getAllowedModules(currentUser.role) : [];
    if (visibleModule && allowed.includes(visibleModule)) {
        if (visibleModule !== 'home') switchModule(visibleModule);
        return;
    }
    const defaultModule = getDefaultModuleForCurrentUser();
    if (defaultModule) switchModule(defaultModule);
}

function getVisibleModuleName() {
    return ['home', 'nhapxuat', 'nhap', 'xuat', 'chuyenkho', 'anhdonhang', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang', 'giuhang', 'kiemkho', 'dashboard']
        .find(m => !document.getElementById(`module-${m}`)?.classList.contains('hidden')) || activeModuleName || 'home';
}

function updateHeaderRefreshButton(moduleName) {
    const btn = document.getElementById('headerRefreshBtn');
    if (!btn) return;
    if (moduleName && moduleName !== 'home') btn.classList.remove('hidden');
    else btn.classList.add('hidden');
}

async function refreshActiveModule() {
    const moduleName = getVisibleModuleName();
    const btn = document.getElementById('headerRefreshBtn');
    const icon = document.getElementById('headerRefreshIcon');
    if (btn) btn.disabled = true;
    if (icon) icon.classList.add('animate-spin');
    try {
        if (moduleName === 'nhapxuat') {
            await renderNXModule();
        } else if (['nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat'].includes(moduleName)) {
            await renderSimpleSheetModule(moduleName, false, true);
        } else if (moduleName === 'anhdonhang') {
            await fetchReferenceData();
            renderOrderImageRows();
        } else if (['nhanvien', 'khachhang'].includes(moduleName)) {
            await fetchAuthData();
            renderDsnvDirectory(moduleName);
        } else if (moduleName === 'giuhang') {
            await renderGiuHangModule();
        } else if (moduleName === 'kiemkho') {
            await renderKiemKhoModule();
        } else if (moduleName === 'dashboard') {
            await fetchNXData();
            updateDashboardFilterOptions();
            renderDashboard();
        } else {
            await fetchReferenceData();
        }
    } catch (err) {
        console.error("Refresh active module error:", err);
        alert("Không thể làm mới dữ liệu. Vui lòng thử lại.");
    } finally {
        if (icon) icon.classList.remove('animate-spin');
        if (btn) btn.disabled = false;
    }
}

function changeAdminViewUser(userId) {
    if (!isAdminSession()) return;
    const target = usersData.find(u => u.id === userId) || getAuthUser();
    currentUser = target;
    persistUserSession();
    updateUserProfileUI();
    refreshCurrentModuleView();
}

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
    const authUser = getAuthUser() || currentUser;
    const viewAsOther = isViewingAsOtherUser();
    const nameArr = authUser.name ? authUser.name.split(' ') : [authUser.id];
    const initials = nameArr[nameArr.length - 1].charAt(0).toUpperCase();

    document.getElementById('userNameHeader').textContent = authUser.name || authUser.id;
    document.getElementById('userRoleHeader').textContent = viewAsOther
        ? `Xem: ${currentUser.id}`
        : (authUser.role || "Nhân viên");
    document.getElementById('userAvatar').textContent = initials;

    const nameMob = document.getElementById('userNameHeaderMobile');
    const roleMob = document.getElementById('userRoleHeaderMobile');
    if (nameMob) nameMob.textContent = authUser.name || authUser.id;
    if (roleMob) roleMob.textContent = viewAsOther ? `Đang xem: ${currentUser.id}` : (authUser.role || "Nhân viên");

    const viewingLabel = document.getElementById('adminViewingLabel');
    if (viewingLabel) {
        viewingLabel.textContent = viewAsOther
            ? `Đang xem dữ liệu của ${currentUser.name || currentUser.id} (${currentUser.role || ''})`
            : 'Đang xem dữ liệu ADMIN';
    }
    populateAdminViewUserSelect();

    // Hide/Show Navigation items based on role
    const allowed = getAllowedModules(currentUser.role);
    ['home', 'nhapxuat', 'nhap', 'xuat', 'chuyenkho', 'anhdonhang', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang', 'giuhang', 'kiemkho', 'dashboard'].forEach(m => {
        const navEl = document.getElementById(`nav-${m}`);
        const bNavEl = document.getElementById(`bottom-nav-${m}`);
        const cardEl = document.getElementById(`home-card-${m}`);
        const isAllowed = allowed.includes(m);

        if (navEl) {
            if (isAllowed) navEl.classList.remove('hidden');
            else navEl.classList.add('hidden');
        }
        if (bNavEl) {
            if (isAllowed) bNavEl.classList.remove('hidden');
            else bNavEl.classList.add('hidden');
        }
        if (cardEl) {
            if (isAllowed) cardEl.classList.remove('hidden');
            else cardEl.classList.add('hidden');
        }
    });

    // Hide/Show Upload Buttons for Nhập Xuất (Only Admin & kt)
    const canUpload = canCurrentUser('nx.upload');
    const canManualAdd = canCurrentUser('nx.manualAdd');
    const btnManualNX = document.getElementById('btnManualNX');
    const btnNhap = document.getElementById('btnUploadNhap');
    const btnXuat = document.getElementById('btnUploadXuat');
    const btnUploadTraLai = document.getElementById('btnUploadTraLai');
    const btnUploadNhapTra = document.getElementById('btnUploadNhapTra');
    const btnDownloadNXTemplate = document.getElementById('btnDownloadNXTemplate');
    const oldBtn = document.getElementById('btnExportTraLai');
    if (oldBtn) oldBtn.remove();

    if (btnManualNX) {
        if (canManualAdd) btnManualNX.classList.remove('hidden');
        else btnManualNX.classList.add('hidden');
    }

    if (btnNhap) {
        if (canUpload) btnNhap.classList.remove('hidden');
        else btnNhap.classList.add('hidden');
    }
    if (btnXuat) {
        if (canUpload) btnXuat.classList.remove('hidden');
        else btnXuat.classList.add('hidden');
    }
    if (btnUploadTraLai) {
        if (canUpload) btnUploadTraLai.classList.remove('hidden');
        else btnUploadTraLai.classList.add('hidden');
    }
    if (btnUploadNhapTra) {
        if (canUpload) btnUploadNhapTra.classList.remove('hidden');
        else btnUploadNhapTra.classList.add('hidden');
    }
    if (btnDownloadNXTemplate) {
        if (canUpload) btnDownloadNXTemplate.classList.remove('hidden');
        else btnDownloadNXTemplate.classList.add('hidden');
    }
    const btnAddGiuHang = document.getElementById('btnAddGiuHang');
    if (btnAddGiuHang) {
        if (canCurrentUser('giuhang.add')) btnAddGiuHang.classList.remove('hidden');
        else btnAddGiuHang.classList.add('hidden');
    }

    const btnClearGiuHang = document.getElementById('btnClearGiuHang');
    if (btnClearGiuHang) {
        if (canCurrentUser('giuhang.clearAll')) btnClearGiuHang.classList.remove('hidden');
        else btnClearGiuHang.classList.add('hidden');
    }

    const btnAddKiemKho = document.getElementById('btnAddKiemKho');
    if (btnAddKiemKho) {
        if (canCurrentUser('kiemkho.add')) btnAddKiemKho.classList.remove('hidden');
        else btnAddKiemKho.classList.add('hidden');
    }

    const canManageProducts = canCurrentUser('sanpham.manage');
    ['btnProductManual', 'btnProductExcel', 'btnProductTemplate', 'btnWarehouseProductManual', 'btnWarehouseProductExcel', 'btnWarehouseProductTemplate'].forEach(id => {
        const btn = document.getElementById(id);
        if (!btn) return;
        if (canManageProducts) btn.classList.remove('hidden');
        else btn.classList.add('hidden');
    });
}

// ─── Module Navigation ────────────────────────────────────────
const HEADER_SEARCH_MODULES = {
    nhap: { inputId: 'nhapSearchInput', placeholder: 'Tìm trong danh sách nhập...' },
    xuat: { inputId: 'xuatSearchInput', placeholder: 'Tìm trong danh sách xuất...' },
    chuyenkho: { inputId: 'chuyenkhoSearchInput', placeholder: 'Tìm trong điều chuyển kho...' },
    sanpham: { inputId: 'sanphamSearchInput', placeholder: 'Tìm sản phẩm...' },
    sanphamkho: { inputId: 'sanphamkhoSearchInput', placeholder: 'Tìm sản phẩm theo kho...' },
    doisoat: { inputId: 'doisoatSearchInput', placeholder: 'Tìm dữ liệu đối soát...' },
    nhanvien: { inputId: 'nhanvienSearchInput', placeholder: 'Tìm nhân viên...' },
    khachhang: { inputId: 'khachhangSearchInput', placeholder: 'Tìm khách hàng...' },
    giuhang: { inputId: 'giuHangSearchInput', placeholder: 'Tìm tên nhân viên, sản phẩm...' },
    kiemkho: { inputId: 'kiemKhoSearchInput', placeholder: 'Tìm ngày, mã SP, vị trí...' }
};
let activeHeaderSearchModule = '';

function updateHeaderSearch(moduleName) {
    const wrap = document.getElementById('headerSearchWrap');
    const input = document.getElementById('headerSearchInput');
    const config = HEADER_SEARCH_MODULES[moduleName];
    if (!wrap || !input) return;

    activeHeaderSearchModule = config ? moduleName : '';
    if (!config) {
        wrap.classList.add('hidden');
        input.value = '';
        return;
    }

    const moduleInput = document.getElementById(config.inputId);
    input.placeholder = config.placeholder;
    input.value = moduleInput ? moduleInput.value : '';
    wrap.classList.remove('hidden');
}

function handleHeaderSearch(value) {
    const config = HEADER_SEARCH_MODULES[activeHeaderSearchModule];
    if (!config) return;
    const moduleInput = document.getElementById(config.inputId);
    if (moduleInput) moduleInput.value = value;

    if (activeHeaderSearchModule === 'nhapxuat') applyFilters(true);
    else if (['nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat'].includes(activeHeaderSearchModule)) renderSimpleSheetModule(activeHeaderSearchModule, true);
    else if (['nhanvien', 'khachhang'].includes(activeHeaderSearchModule)) renderDsnvDirectory(activeHeaderSearchModule);
    else if (activeHeaderSearchModule === 'giuhang') applyGiuHangFilters();
    else if (activeHeaderSearchModule === 'kiemkho') applyKiemKhoFilters(true);
}

function switchModule(moduleName) {
    if (!currentUser) return;
    const allowed = getAllowedModules(currentUser.role);
    if (!allowed.includes(moduleName)) {
        alert("Bạn không có quyền truy cập vào mục này.");
        return;
    }

    activeModuleName = moduleName;
    ['home', 'nhapxuat', 'nhap', 'xuat', 'chuyenkho', 'anhdonhang', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang', 'giuhang', 'kiemkho', 'dashboard'].forEach(m => {
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
        'nhap': 'Danh sách nhập',
        'xuat': 'Danh sách xuất',
        'chuyenkho': 'Điều chuyển kho',
        'sanpham': 'Danh sách sản phẩm',
        'sanphamkho': 'Danh sách sản phẩm kho',
        'doisoat': 'Đối soát',
        'nhanvien': 'Danh sách nhân viên',
        'khachhang': 'Danh sách khách hàng',
        'giuhang': 'Quản lý giữ hàng',
        'dashboard': 'Báo cáo & Phân tích'
    };
    titles['anhdonhang'] = 'Ảnh đơn hàng';
    titles['kiemkho'] = 'Kiểm kho';
    document.getElementById('headerTitle').textContent = titles[moduleName] || 'Hệ thống';
    updateHeaderSearch(moduleName);
    updateHeaderRefreshButton(moduleName);

    if (moduleName === 'nhapxuat') {
        if (nxDataRaw && nxDataRaw.length > 0) applyFilters();
        else renderNXModule();
    } else if (['nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat'].includes(moduleName)) {
        renderSimpleSheetModule(moduleName, false, true);
    } else if (moduleName === 'anhdonhang') {
        if (!productDataRaw || productDataRaw.length <= 1) fetchReferenceData().then(() => renderOrderImageRows());
        else renderOrderImageRows();
    } else if (['nhanvien', 'khachhang'].includes(moduleName)) {
        renderDsnvDirectory(moduleName);
    } else if (moduleName === 'giuhang') {
        if (giuHangDataRaw && giuHangDataRaw.length > 0) applyGiuHangFilters();
        else renderGiuHangModule();
    } else if (moduleName === 'kiemkho') {
        if (kiemKhoDataRaw && kiemKhoDataRaw.length > 0) applyKiemKhoFilters();
        else renderKiemKhoModule();
    } else if (moduleName === 'dashboard') {
        if (nxDataRaw && nxDataRaw.length > 1) renderDashboard();
        else {
            const tbody = document.getElementById('dbTableBody');
            if (tbody) tbody.innerHTML = '<tr><td colspan="4" class="px-6 py-10 text-center text-slate-400">Đang tải dữ liệu báo cáo...</td></tr>';
            fetchNXData().then(() => renderDashboard());
        }
    }
}

// ─── Module: Nhập Xuất ────────────────────────────────────────
async function fetchNXData() {
    try {
        const token = await getAccessToken();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.nxSheetName}!${NX_WAREHOUSE_CONFIRM.fetchRange}`;
        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        const data = await resp.json();
        nxDataRaw = data.values || [];
        localStorage.setItem('erp_nx_cache', JSON.stringify(nxDataRaw));
        updateDashboardFilterOptions();
        populateNXFilterDataLists(nxDataRaw);
        return nxDataRaw;
    } catch (err) {
        console.error("NX Data Fetch Error:", err);
        return [];
    }
}

const SIMPLE_SHEET_MODULES = {
    nhap: {
        sheetName: () => CONFIG.nhapSheetName,
        range: 'A1:O60000',
        cacheKey: 'erp_nhap_cache',
        columns: ['id', 'ngay', 'truong', 'mdh', 'ma_kh', 'ten_khach', 'id_sp', 'ten_sp', 'slg', 'don_gia', 'thanh_tien', 'kho', 'id_nv_nhan', 'ghi_chu', 'loai_hinh']
    },
    xuat: {
        sheetName: () => CONFIG.xuatSheetName,
        range: 'A1:O60000',
        cacheKey: 'erp_xuat_cache',
        columns: ['id', 'ngay', 'truong', 'mdh', 'ma_kh', 'ten_khach', 'id_sp', 'ten_sp', 'slg', 'don_gia', 'thanh_tien', 'kho', 'id_nv_xuat', 'ghi_chu', 'loai_hinh']
    },
    chuyenkho: {
        sheetName: () => CONFIG.transferSheetName,
        range: 'A1:K60000',
        cacheKey: 'erp_transfer_cache',
        columns: ['id', 'ngay', 'mdh', 'id_sp', 'ten_sp', 'slg', 'kho_di', 'kho_nhan', 'ghi_chu', 'tinh_trang', 'trang_thai']
    },
    sanpham: {
        sheetName: () => CONFIG.productSheetName,
        range: 'A1:F10000',
        cacheKey: 'erp_product_cache',
        columns: ['id', 'ten_sp', 'model', 'anh', 'gia_ban', 'ghi_chu']
    },
    sanphamkho: {
        sheetName: () => CONFIG.warehouseProductSheetName,
        range: 'A1:F50000',
        cacheKey: 'erp_warehouse_product_cache',
        columns: ['id', 'kho', 'id_sp', 'ten_sp', 'ton_dau', 'ton_sau']
    },
    doisoat: {
        sheetName: () => CONFIG.reconciliationSheetName,
        range: 'A1:C50000',
        cacheKey: 'erp_reconciliation_cache',
        columns: ['id', 'ten_sp', 'ton_misa']
    }
};
let simpleSheetUploadModule = '';
let simpleSheetManualModule = '';
let nxManualEditContext = null;
let warehouseTransferEditContext = null;
let productManualEditSheetRow = 0;
let warehouseProductEditSheetRow = 0;

function getSimpleModuleData(moduleName) {
    if (moduleName === 'nhap') return nhapDataRaw;
    if (moduleName === 'xuat') return xuatDataRaw;
    if (moduleName === 'chuyenkho') return transferDataRaw;
    if (moduleName === 'sanpham') return productDataRaw;
    if (moduleName === 'sanphamkho') return warehouseProductDataRaw;
    if (moduleName === 'doisoat') return reconciliationDataRaw;
    return [];
}

function setSimpleModuleData(moduleName, values) {
    if (moduleName === 'nhap') nhapDataRaw = values;
    else if (moduleName === 'xuat') xuatDataRaw = values;
    else if (moduleName === 'chuyenkho') transferDataRaw = values;
    else if (moduleName === 'sanpham') productDataRaw = values;
    else if (moduleName === 'sanphamkho') warehouseProductDataRaw = values;
    else if (moduleName === 'doisoat') reconciliationDataRaw = values;
}

async function fetchSimpleSheetModule(moduleName) {
    const config = SIMPLE_SHEET_MODULES[moduleName];
    if (!config) return [];
    try {
        const token = await getAccessToken();
        const sheetName = config.sheetName();
        const range = encodeURIComponent(`'${sheetName}'!${config.range}`);
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}`;
        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();
        const values = data.values || [];
        setSimpleModuleData(moduleName, values);
        localStorage.setItem(config.cacheKey, JSON.stringify(values));
        return values;
    } catch (err) {
        console.error(`${moduleName} data fetch error:`, err);
        setSimpleModuleData(moduleName, []);
        localStorage.removeItem(config.cacheKey);
        return [];
    }
}

async function fetchReferenceData() {
    return Promise.all([
        fetchSimpleSheetModule('sanpham'),
        fetchSimpleSheetModule('sanphamkho')
    ]);
}

function getFilteredSimpleModuleRows(moduleName) {
    const values = getSimpleModuleData(moduleName);
    const searchInput = document.getElementById(`${moduleName}SearchInput`);
    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const dateFrom = document.getElementById(`${moduleName}DateFrom`)?.value || '';
    const dateTo = document.getElementById(`${moduleName}DateTo`)?.value || '';
    const filterMdh = (document.getElementById(`${moduleName}FilterMdh`)?.value || '').toLowerCase().trim();
    const filterMaKh = (document.getElementById(`${moduleName}FilterMaKh`)?.value || '').toLowerCase().trim();
    const filterIdSp = (document.getElementById(`${moduleName}FilterIdSp`)?.value || '').toLowerCase().trim();
    const filterKho = (document.getElementById(`${moduleName}FilterKho`)?.value || '').toLowerCase().trim();
    const isDetailModule = ['nhap', 'xuat'].includes(moduleName);
    const isTransferModule = moduleName === 'chuyenkho';
    const roleKey = currentUser ? resolveRoleKey(currentUser.role) : '';
    const nppProductIds = moduleName === 'sanpham' && roleKey === 'NPP' ? getNppVisibleProductIds() : null;
    const hiddenProductIds = currentUser
        ? new Set(getHiddenProductIdsForUser(currentUser.id).map(id => id.toLowerCase()))
        : new Set();
    const rows = (values || []).slice(1).map((row, index) => {
        if (isDetailModule || isTransferModule || moduleName === 'sanpham' || moduleName === 'sanphamkho') row._sheetRow = index + 2;
        return row;
    }).filter(row => {
        const text = row.map(cell => (cell || '').toString()).join(' ').toLowerCase();
        if (!row.some(cell => (cell || '').toString().trim()) || (searchTerm && !text.includes(searchTerm))) return false;
        if (moduleName === 'sanpham') {
            const idSp = (row[0] || '').toString().trim().toLowerCase();
            if (hiddenProductIds.has(idSp)) return false;
            if (nppProductIds && !nppProductIds.has(idSp)) return false;
        }
        if (moduleName === 'doisoat' && reconciliationStatusFilter) {
            const aggregates = getProductAggregates(getReconciliationAsOfDate());
            const idSp = (row[0] || '').toString().trim().toLowerCase();
            const tonCuoi = (aggregates.get(idSp) || { tonCuoi: 0 }).tonCuoi;
            const difference = tonCuoi - cleanNumber(row[2]);
            if (reconciliationStatusFilter === 'thua' && difference <= 0) return false;
            if (reconciliationStatusFilter === 'du' && difference !== 0) return false;
            if (reconciliationStatusFilter === 'thieu' && difference >= 0) return false;
        }
        const rowKho = (row[moduleName === 'sanphamkho' ? 1 : 11] || '').toString().toLowerCase().trim();
        if (filterKho && rowKho !== filterKho) return false;
        if (moduleName === 'sanphamkho' && filterIdSp) {
            const rowIdSp = (row[2] || '').toString().toLowerCase().trim();
            const selectedIdSp = parseProductIdInput(filterIdSp).toLowerCase();
            if (!rowIdSp.includes(selectedIdSp)) return false;
        }
        if (isTransferModule) {
            const rowDate = parseSimpleSheetDate(row[1]);
            const mdh = (row[2] || '').toString().toLowerCase();
            const idSp = (row[3] || '').toString().toLowerCase();
            const khoDi = (row[6] || '').toString().toLowerCase();
            const khoNhan = (row[7] || '').toString().toLowerCase();
            const filterKhoDi = (document.getElementById('chuyenkhoFilterKhoDi')?.value || '').toLowerCase();
            const filterKhoNhan = (document.getElementById('chuyenkhoFilterKhoNhan')?.value || '').toLowerCase();
            const filterCondition = (document.getElementById('chuyenkhoFilterCondition')?.value || '').toLowerCase().trim();
            const filterStatus = (document.getElementById('chuyenkhoFilterStatus')?.value || '').toLowerCase().trim();
            if ((dateFrom || dateTo) && Number.isNaN(rowDate.getTime())) return false;
            if (filterMdh && !mdh.includes(filterMdh)) return false;
            if (filterIdSp && !idSp.includes(filterIdSp)) return false;
            if (filterKhoDi && khoDi !== filterKhoDi) return false;
            if (filterKhoNhan && khoNhan !== filterKhoNhan) return false;
            if (filterCondition && !(row[9] || '').toString().toLowerCase().includes(filterCondition)) return false;
            if (filterStatus && !(row[10] || '').toString().toLowerCase().includes(filterStatus)) return false;
            if (dateFrom && rowDate < new Date(`${dateFrom}T00:00:00`)) return false;
            if (dateTo && rowDate > new Date(`${dateTo}T23:59:59.999`)) return false;
            return true;
        }
        if (!isDetailModule) return true;

        const rowDate = parseSimpleSheetDate(row[1]);
        const mdh = (row[3] || '').toString().toLowerCase();
        const maKh = (row[4] || '').toString().toLowerCase();
        const idSp = (row[6] || '').toString().toLowerCase();
        if (moduleName === 'xuat' && roleKey === 'NPP') {
            const currentCustomerId = (currentUser.id || '').toString().trim().toLowerCase();
            if (!currentCustomerId || maKh.trim() !== currentCustomerId) return false;
        }
        if ((dateFrom || dateTo) && Number.isNaN(rowDate.getTime())) return false;
        if (filterMdh && !mdh.includes(filterMdh)) return false;
        if (filterMaKh && !maKh.includes(filterMaKh)) return false;
        if (filterIdSp && !idSp.includes(filterIdSp)) return false;
        if (dateFrom && rowDate < new Date(`${dateFrom}T00:00:00`)) return false;
        if (dateTo && rowDate > new Date(`${dateTo}T23:59:59.999`)) return false;
        return true;
    });
    return isDetailModule || isTransferModule
        ? rows.sort((a, b) => parseSimpleSheetDate(b[1]).getTime() - parseSimpleSheetDate(a[1]).getTime())
        : rows;
}

function setReconciliationStatusFilter(status) {
    reconciliationStatusFilter = reconciliationStatusFilter === status ? '' : status;
    document.querySelectorAll('[data-doisoat-filter]').forEach(button => {
        const active = button.dataset.doisoatFilter === reconciliationStatusFilter;
        button.classList.toggle('ring-2', active);
        button.classList.toggle('ring-offset-2', active);
        button.classList.toggle('ring-slate-400', active);
    });
    renderSimpleSheetModule('doisoat', true);
}

function getNppVisibleProductIds() {
    if (!currentUser || resolveRoleKey(currentUser.role) !== 'NPP') return null;
    const customerId = (currentUser.id || '').toString().trim().toLowerCase();
    return new Set((xuatDataRaw || []).slice(1)
        .filter(row => (row[4] || '').toString().trim().toLowerCase() === customerId)
        .map(row => (row[6] || '').toString().trim().toLowerCase())
        .filter(Boolean));
}

function parseSimpleSheetDate(value) {
    const text = (value || '').toString().trim();
    if (!text) return new Date(0);
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        const [day, month, year] = text.split('/').map(Number);
        return new Date(year, month - 1, day);
    }
    return new Date(text);
}

function formatDateInputValue(date) {
    const pad = value => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function setSimpleSheetQuickDate(moduleName, range) {
    if (!['nhap', 'xuat', 'chuyenkho'].includes(moduleName)) return;
    const from = document.getElementById(`${moduleName}DateFrom`);
    const to = document.getElementById(`${moduleName}DateTo`);
    if (!from || !to) return;

    const end = new Date();
    const start = new Date(end);
    if (range === 'week') start.setDate(end.getDate() - ((end.getDay() + 6) % 7));
    if (range === 'month') start.setDate(1);
    from.value = formatDateInputValue(start);
    to.value = formatDateInputValue(end);
    renderSimpleSheetModule(moduleName, true);
}

function getReconciliationAsOfDate() {
    const value = document.getElementById('doisoatDateTo')?.value || '';
    return value ? new Date(`${value}T23:59:59.999`) : null;
}

function clearReconciliationDateFilter() {
    const input = document.getElementById('doisoatDateTo');
    if (input) input.value = '';
    renderSimpleSheetModule('doisoat', true);
}

function getVisibleSimpleModuleColumnIndexes(moduleName, config) {
    return config.columns
        .map((_, index) => index)
        .filter(index => !['nhap', 'xuat', 'chuyenkho'].includes(moduleName) || index !== 0);
}

function getSimpleModuleDisplayColumns(moduleName, config) {
    if (moduleName === 'sanphamkho') return ['kho', 'id_sp', 'ten_sp', 'ton_dau', 'nhap', 'xuat', 'nhap_ck', 'xuat_ck', 'ton_cuoi'];
    if (moduleName === 'sanpham') {
        return currentUser && resolveRoleKey(currentUser.role) === 'NPP'
            ? ['anh', 'id', 'ten_sp', 'ton_cuoi']
            : ['anh', 'id', 'ten_sp', 'ton_dau', 'nhap', 'xuat', 'ton_cuoi'];
    }
    if (moduleName === 'doisoat') return ['id', 'ten_sp', 'ton_cuoi', 'ton_misa', 'chenh_lech'];
    if (['nhap', 'xuat'].includes(moduleName)) return config.columns.slice(1).filter(column => !['id_nv_nhan', 'id_nv_xuat'].includes(column));
    if (moduleName === 'chuyenkho') return config.columns.slice(1);
    return config.columns;
}

function updateSimpleModuleHeaders(moduleName, displayColumns) {
    document.querySelectorAll(`[data-sort-module="${moduleName}"]`).forEach(header => {
        header.classList.toggle('hidden', !displayColumns.includes(header.dataset.sortColumn));
    });
}

function getWarehouseMovementTotals(asOfDate = null) {
    const totals = new Map();
    const addRows = (rows, type) => {
        (rows || []).slice(1).forEach(row => {
            if (asOfDate) {
                const rowDate = parseSimpleSheetDate(row[1]);
                if (Number.isNaN(rowDate.getTime()) || rowDate > asOfDate) return;
            }
            const kho = (row[11] || '').toString().trim();
            const idSp = (row[6] || '').toString().trim();
            if (!kho || !idSp) return;
            const key = `${kho}|${idSp}`.toLowerCase();
            if (!totals.has(key)) totals.set(key, { nhap: 0, xuat: 0, nhapCk: 0, xuatCk: 0 });
            totals.get(key)[type] += cleanNumber(row[8]);
        });
    };
    addRows(nhapDataRaw, 'nhap');
    addRows(xuatDataRaw, 'xuat');
    (transferDataRaw || []).slice(1).forEach(row => {
        if (asOfDate) {
            const rowDate = parseSimpleSheetDate(row[1]);
            if (Number.isNaN(rowDate.getTime()) || rowDate > asOfDate) return;
        }
        const idSp = (row[3] || '').toString().trim();
        const khoDi = (row[6] || '').toString().trim();
        const khoNhan = (row[7] || '').toString().trim();
        const quantity = cleanNumber(row[5]);
        if (idSp && khoDi) {
            const key = `${khoDi}|${idSp}`.toLowerCase();
            if (!totals.has(key)) totals.set(key, { nhap: 0, xuat: 0, nhapCk: 0, xuatCk: 0 });
            totals.get(key).xuatCk += quantity;
        }
        if (idSp && khoNhan) {
            const key = `${khoNhan}|${idSp}`.toLowerCase();
            if (!totals.has(key)) totals.set(key, { nhap: 0, xuat: 0, nhapCk: 0, xuatCk: 0 });
            totals.get(key).nhapCk += quantity;
        }
    });
    return totals;
}

// Compute per‑product aggregates across all warehouses
function getProductAggregates(asOfDate = null) {
    const aggregates = new Map();
    // Initialize from sanphamkho (warehouse product) data for initial and final stock
    (warehouseProductDataRaw || []).slice(1).forEach(row => {
        const idSp = (row[2] || '').toString().trim().toLowerCase();
        if (!idSp) return;
        const tonDau = cleanNumber(row[4]);
        if (!aggregates.has(idSp)) aggregates.set(idSp, { tonDau: 0, nhap: 0, xuat: 0, tonCuoi: 0 });
        const agg = aggregates.get(idSp);
        agg.tonDau += tonDau;
    });
    // Add movement totals (nhap/xuat) from all warehouses
    const movementTotals = getWarehouseMovementTotals(asOfDate);
    movementTotals.forEach((val, key) => {
        const [_, idSp] = key.split('|'); // ignore kho, keep idSp
        if (!aggregates.has(idSp)) aggregates.set(idSp, { tonDau: 0, nhap: 0, xuat: 0, tonCuoi: 0 });
        const agg = aggregates.get(idSp);
        agg.nhap += val.nhap;
        agg.xuat += val.xuat;
    });
    aggregates.forEach(agg => {
        agg.tonCuoi = agg.tonDau + agg.nhap - agg.xuat;
    });
    return aggregates;
}

function getSimpleModuleDisplayValue(moduleName, row, column, index, movementTotals) {
    // Sanpham: virtual aggregate columns across all warehouses
    if (moduleName === 'sanpham') {
        if (['ton_dau', 'nhap', 'xuat', 'ton_cuoi'].includes(column)) {
            const aggregates = movementTotals.productAggregates || getProductAggregates();
            const idSp = (row[0] || '').toString().trim().toLowerCase();
            const agg = aggregates.get(idSp) || { tonDau: 0, nhap: 0, xuat: 0, tonCuoi: 0 };
            if (column === 'ton_dau') return agg.tonDau;
            if (column === 'nhap') return agg.nhap;
            if (column === 'xuat') return agg.xuat;
            if (column === 'ton_cuoi') return agg.tonCuoi;
        }
        return row[index] || '';
    }
    // Sanphamkho: virtual movement columns per warehouse
    if (moduleName === 'sanphamkho') {
        const key = `${(row[1] || '').toString().trim()}|${(row[2] || '').toString().trim()}`.toLowerCase();
        const totals = movementTotals.get(key) || { nhap: 0, xuat: 0, nhapCk: 0, xuatCk: 0 };
        if (column === 'nhap') return totals.nhap;
        if (column === 'xuat') return totals.xuat;
        if (column === 'nhap_ck') return totals.nhapCk;
        if (column === 'xuat_ck') return totals.xuatCk;
        if (column === 'ton_cuoi') return cleanNumber(row[4]) + totals.nhap - totals.xuat + totals.nhapCk - totals.xuatCk;
        return row[index] || '';
    }
    if (moduleName === 'doisoat') {
        const aggregates = movementTotals.productAggregates || getProductAggregates();
        const idSp = (row[0] || '').toString().trim().toLowerCase();
        const tonCuoi = (aggregates.get(idSp) || { tonCuoi: 0 }).tonCuoi;
        if (column === 'ton_cuoi') return tonCuoi;
        if (column === 'chenh_lech') return tonCuoi - cleanNumber(row[2]);
    }
    if (['nhap', 'xuat'].includes(moduleName) && column === 'loai_hinh') return normalizeOrderLoaiHinh(row[index]);
    return row[index] || '';
}

function renderSimpleModuleCell(moduleName, column, value) {
    if (moduleName === 'sanpham' && column === 'anh') {
        return value
            ? `<img src="${escAttr(value)}" alt="" class="w-10 h-10 rounded-lg object-cover border border-slate-200">`
            : '';
    }
    return escAttr(value);
}

function getSimpleModuleCellClass(moduleName, column) {
    if (moduleName !== 'sanpham') return '';
    if (column === 'anh') return ' w-[72px]';
    if (column === 'id') return ' w-[180px] max-w-[180px] truncate';
    if (column === 'ten_sp') return ' max-w-[420px] truncate';
    if (['ton_dau', 'nhap', 'xuat'].includes(column)) return ' w-[110px]';
    if (column === 'ton_cuoi') return ' w-[130px]';
    return '';
}

function sortSimpleModuleRows(moduleName, rows, movementTotals) {
    const sort = simpleModuleSorts[moduleName];
    const config = SIMPLE_SHEET_MODULES[moduleName];
    if (!sort || !config) return rows;
    const numericColumns = new Set(['ton_dau', 'ton_sau', 'nhap', 'xuat', 'nhap_ck', 'xuat_ck', 'ton_cuoi', 'gia_ban']);
    const direction = sort.direction === 'asc' ? 1 : -1;
    const getValue = row => {
        const index = config.columns.indexOf(sort.column);
        return getSimpleModuleDisplayValue(moduleName, row, sort.column, index, movementTotals);
    };
    return [...rows].sort((a, b) => {
        const valueA = getValue(a);
        const valueB = getValue(b);
        let compared;
        if (numericColumns.has(sort.column)) {
            compared = cleanNumber(valueA) - cleanNumber(valueB);
        } else {
            compared = (valueA || '').toString().localeCompare((valueB || '').toString(), 'vi', {
                numeric: true,
                sensitivity: 'base'
            });
        }
        if (compared === 0) {
            compared = (a[0] || '').toString().localeCompare((b[0] || '').toString(), 'vi', {
                numeric: true,
                sensitivity: 'base'
            });
        }
        return compared * direction;
    });
}

function toggleSimpleModuleSort(moduleName, column) {
    const sort = simpleModuleSorts[moduleName];
    if (!sort) return;
    if (sort.column === column) sort.direction = sort.direction === 'desc' ? 'asc' : 'desc';
    else {
        sort.column = column;
        sort.direction = 'desc';
    }
    simpleModulePages[moduleName] = 1;
    renderSimpleSheetModule(moduleName);
}

function renderSimpleModuleSortIndicators(moduleName) {
    const sort = simpleModuleSorts[moduleName];
    if (!sort) return;
    document.querySelectorAll(`[data-sort-module="${moduleName}"]`).forEach(header => {
        const indicator = header.querySelector('[data-sort-indicator]');
        if (!indicator) return;
        indicator.textContent = header.dataset.sortColumn === sort.column
            ? (sort.direction === 'desc' ? '▼' : '▲')
            : '';
    });
}

function renderProductStockDetails(idSp) {
    const wrap = document.getElementById('productStockDetails');
    const tbody = document.getElementById('productWarehouseDetailRows');
    if (!wrap || !tbody) return;
    const productId = (idSp || '').toString().trim();
    if (!productId) {
        wrap.classList.add('hidden');
        tbody.innerHTML = '';
        return;
    }

    const movementTotals = getWarehouseMovementTotals();
    const warehouseRows = (warehouseProductDataRaw || []).slice(1)
        .filter(row => (row[2] || '').toString().trim() === productId)
        .map(row => {
            const kho = (row[1] || '').toString().trim();
            const movement = movementTotals.get(`${kho}|${productId}`.toLowerCase()) || { nhap: 0, xuat: 0, nhapCk: 0, xuatCk: 0 };
            const tonDau = cleanNumber(row[4]);
            const tonSau = cleanNumber(row[5]);
            return { kho, tonDau, tonSau, nhap: movement.nhap, xuat: movement.xuat, nhapCk: movement.nhapCk, xuatCk: movement.xuatCk, tonCuoi: tonDau + movement.nhap - movement.xuat + movement.nhapCk - movement.xuatCk };
        });
    const total = warehouseRows.reduce((sum, row) => ({
        tonDau: sum.tonDau + row.tonDau,
        nhap: sum.nhap + row.nhap,
        xuat: sum.xuat + row.xuat,
        tonCuoi: sum.tonCuoi + row.tonCuoi
    }), { tonDau: 0, nhap: 0, xuat: 0, tonCuoi: 0 });

    document.getElementById('productDetailTonDau').textContent = formatNum(total.tonDau);
    document.getElementById('productDetailNhap').textContent = formatNum(total.nhap);
    document.getElementById('productDetailXuat').textContent = formatNum(total.xuat);
    document.getElementById('productDetailTonCuoi').textContent = formatNum(total.tonCuoi);
    tbody.innerHTML = warehouseRows.length
        ? warehouseRows.map(row => `
            <tr>
                <td class="px-3 py-2 text-xs font-medium text-slate-700">${escAttr(row.kho)}</td>
                <td class="px-3 py-2 text-xs text-right text-slate-600">${formatNum(row.tonDau)}</td>
                <td class="px-3 py-2 text-xs text-right text-slate-600">${formatNum(row.tonSau)}</td>
                <td class="px-3 py-2 text-xs text-right text-blue-600">${formatNum(row.nhap)}</td>
                <td class="px-3 py-2 text-xs text-right text-orange-600">${formatNum(row.xuat)}</td>
                <td class="px-3 py-2 text-xs text-right text-cyan-600">${formatNum(row.nhapCk)}</td>
                <td class="px-3 py-2 text-xs text-right text-violet-600">${formatNum(row.xuatCk)}</td>
                <td class="px-3 py-2 text-xs text-right font-bold text-emerald-700">${formatNum(row.tonCuoi)}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="8" class="px-3 py-6 text-center text-xs text-slate-400">Chưa có dữ liệu theo kho.</td></tr>';
    wrap.classList.remove('hidden');
}

async function renderSimpleSheetModule(moduleName, resetPage, refreshData = false) {
    if (resetPage) simpleModulePages[moduleName] = 1;
    const config = SIMPLE_SHEET_MODULES[moduleName];
    const tbody = document.getElementById(`${moduleName}TableBody`);
    const mobile = document.getElementById(`${moduleName}MobileCards`);
    const count = document.getElementById(`${moduleName}Count`);
    if (!config || !tbody) return;
    const visibleColumnIndexes = getVisibleSimpleModuleColumnIndexes(moduleName, config);
    const displayColumns = getSimpleModuleDisplayColumns(moduleName, config);
    updateSimpleModuleHeaders(moduleName, displayColumns);

    tbody.innerHTML = `<tr><td colspan="${displayColumns.length}" class="px-4 py-10 text-center text-slate-400">Đang tải dữ liệu...</td></tr>`;
    if (['sanpham', 'sanphamkho', 'doisoat'].includes(moduleName) && (refreshData || !productDataRaw.length || !warehouseProductDataRaw.length || !nhapDataRaw.length || !xuatDataRaw.length || !transferDataRaw.length)) {
        await Promise.all([
            fetchSimpleSheetModule('sanpham'),
            fetchSimpleSheetModule('sanphamkho'),
            fetchSimpleSheetModule('nhap'),
            fetchSimpleSheetModule('xuat'),
            fetchSimpleSheetModule('chuyenkho')
        ]);
    }
    if (refreshData || !getSimpleModuleData(moduleName).length) await fetchSimpleSheetModule(moduleName);
    if (moduleName === 'sanphamkho') populateWarehouseProductFilterList();
    const movementTotals = moduleName === 'sanphamkho' ? getWarehouseMovementTotals() : new Map();
    if (moduleName === 'sanpham') movementTotals.productAggregates = getProductAggregates();
    if (moduleName === 'doisoat') movementTotals.productAggregates = getProductAggregates(getReconciliationAsOfDate());
    const rows = sortSimpleModuleRows(moduleName, getFilteredSimpleModuleRows(moduleName), movementTotals);
    renderSimpleModuleSortIndicators(moduleName);
    if (count) count.textContent = `${rows.length} bản ghi`;

    const page = simpleModulePages[moduleName] || 1;
    const pageRows = rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
    tbody.innerHTML = pageRows.length
        ? pageRows.map(row => `<tr class="hover:bg-slate-50/80 transition-colors ${['nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho'].includes(moduleName) ? 'cursor-pointer' : ''}" ${['nhap', 'xuat'].includes(moduleName) ? `ondblclick="openDetailRowEditDrawer('${moduleName}', ${row._sheetRow || 0})" title="Double-click để sửa"` : (moduleName === 'chuyenkho' ? `ondblclick="openWarehouseTransferEditDrawer(${row._sheetRow || 0})" title="Double-click để sửa"` : (moduleName === 'sanpham' ? `ondblclick="openProductManualDrawer(${row._sheetRow || 0})" title="Xem chi tiết sản phẩm"` : (moduleName === 'sanphamkho' ? `ondblclick="openWarehouseProductDrawer(${row._sheetRow || 0})" title="Double-click để sửa"` : '')))}> ${displayColumns.map((column, displayIndex) => {
            const physicalIndex = config.columns.indexOf(column);
            const value = getSimpleModuleDisplayValue(moduleName, row, column, physicalIndex !== -1 ? physicalIndex : displayIndex, movementTotals);
            const align = ['slg', 'don_gia', 'thanh_tien', 'ton_dau', 'ton_sau', 'ton_cuoi', 'ton_misa', 'chenh_lech', 'gia_ban', 'nhap', 'xuat', 'nhap_ck', 'xuat_ck'].includes(column) ? ' text-right' : '';
            return `<td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap${align}${getSimpleModuleCellClass(moduleName, column)}">${renderSimpleModuleCell(moduleName, column, value)}</td>`;
        }).join('')}</tr>`).join('')
        : `<tr><td colspan="${displayColumns.length}" class="px-4 py-10 text-center text-slate-400">Không có dữ liệu phù hợp.</td></tr>`;

    if (mobile) {
        mobile.innerHTML = pageRows.map(row => `
            <div class="mobile-card" ${['nhap', 'xuat'].includes(moduleName) ? `ondblclick="openDetailRowEditDrawer('${moduleName}', ${row._sheetRow || 0})"` : (moduleName === 'chuyenkho' ? `ondblclick="openWarehouseTransferEditDrawer(${row._sheetRow || 0})"` : (moduleName === 'sanpham' ? `ondblclick="openProductManualDrawer(${row._sheetRow || 0})"` : (moduleName === 'sanphamkho' ? `ondblclick="openWarehouseProductDrawer(${row._sheetRow || 0})"` : '')))}>
                ${displayColumns.map((column, displayIndex) => {
            const physicalIndex = config.columns.indexOf(column);
            const value = getSimpleModuleDisplayValue(moduleName, row, column, physicalIndex !== -1 ? physicalIndex : displayIndex, movementTotals);
            return `
                    <div class="flex justify-between gap-3 py-1">
                        <span class="mobile-card-label">${escAttr(column)}</span>
                        <span class="mobile-card-value text-right break-all">${escAttr(value)}</span>
                    </div>
                `}).join('')}
            </div>
        `).join('');
    }
    renderPagination(rows.length, page, `${moduleName}Pagination`, `goSimpleModulePage.bind(null, '${moduleName}')`);
}

function goSimpleModulePage(moduleName, page) {
    simpleModulePages[moduleName] = page;
    renderSimpleSheetModule(moduleName);
}

function normalizeDirectoryType(value) {
    return (value || '').toString().trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/Đ/g, 'D');
}

function isCustomerDirectoryUser(user) {
    return ['KHACH HANG NPP', 'KHACH HANG NCC'].includes(normalizeDirectoryType(user && user.type));
}

function renderDsnvDirectory(moduleName) {
    if (!['nhanvien', 'khachhang'].includes(moduleName)) return;
    const tbody = document.getElementById(`${moduleName}TableBody`);
    const mobile = document.getElementById(`${moduleName}MobileCards`);
    const count = document.getElementById(`${moduleName}Count`);
    const searchTerm = (document.getElementById(`${moduleName}SearchInput`)?.value || '').toLowerCase().trim();
    if (!tbody) return;

    const rows = (usersData || []).filter(user => {
        const type = normalizeDirectoryType(user.type);
        const matchesType = moduleName === 'nhanvien'
            ? type === 'NHAN VIEN'
            : isCustomerDirectoryUser(user);
        if (!matchesType) return false;
        const text = [user.id, user.name, user.gender, user.birthDate, user.role, user.type].join(' ').toLowerCase();
        return !searchTerm || text.includes(searchTerm);
    });

    if (count) count.textContent = `${rows.length} bản ghi`;
    tbody.innerHTML = rows.length ? rows.map(user => `
        <tr class="hover:bg-slate-50/80 transition-colors">
            <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${escAttr(user.id)}</td>
            <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${escAttr(user.name)}</td>
            <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${user.image ? `<img src="${escAttr(user.image)}" alt="" class="w-9 h-9 rounded-lg object-cover border border-slate-200">` : ''}</td>
            <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${escAttr(user.gender)}</td>
            <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${escAttr(user.birthDate)}</td>
            <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${escAttr(user.role)}</td>
            <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${escAttr(user.type)}</td>
        </tr>
    `).join('') : '<tr><td colspan="7" class="px-4 py-10 text-center text-slate-400">Không có dữ liệu phù hợp.</td></tr>';

    if (mobile) {
        mobile.innerHTML = rows.map(user => `
            <div class="mobile-card">
                <div class="flex justify-between gap-3 py-1"><span class="mobile-card-label">ID</span><span class="mobile-card-value text-right">${escAttr(user.id)}</span></div>
                <div class="flex justify-between gap-3 py-1"><span class="mobile-card-label">Họ tên</span><span class="mobile-card-value text-right">${escAttr(user.name)}</span></div>
                <div class="flex justify-between gap-3 py-1"><span class="mobile-card-label">Giới tính</span><span class="mobile-card-value text-right">${escAttr(user.gender)}</span></div>
                <div class="flex justify-between gap-3 py-1"><span class="mobile-card-label">Ngày sinh</span><span class="mobile-card-value text-right">${escAttr(user.birthDate)}</span></div>
                <div class="flex justify-between gap-3 py-1"><span class="mobile-card-label">Quyền</span><span class="mobile-card-value text-right">${escAttr(user.role)}</span></div>
                <div class="flex justify-between gap-3 py-1"><span class="mobile-card-label">Trường</span><span class="mobile-card-value text-right">${escAttr(user.type)}</span></div>
            </div>
        `).join('');
    }
}

function openDsnvManualDrawer(moduleName) {
    if (!isAdminSession() || !['nhanvien', 'khachhang'].includes(moduleName)) return alert("Chỉ ADMIN được cập nhật DSNV.");
    dsnvManualModule = moduleName;
    const title = document.getElementById('dsnvManualDrawerTitle');
    if (title) title.textContent = moduleName === 'nhanvien' ? 'Thêm nhân viên' : 'Thêm khách hàng';
    ['dsnvManualId', 'dsnvManualName', 'dsnvManualImage', 'dsnvManualGender', 'dsnvManualBirthDate', 'dsnvManualRole', 'dsnvManualPassword'].forEach(id => {
        document.getElementById(id).value = '';
    });
    const type = document.getElementById('dsnvManualType');
    type.innerHTML = moduleName === 'nhanvien'
        ? '<option value="NHÂN VIÊN">NHÂN VIÊN</option>'
        : '<option value="KHÁCH HÀNG NPP">KHÁCH HÀNG NPP</option><option value="KHÁCH HÀNG NCC">KHÁCH HÀNG NCC</option>';
    const drawer = document.getElementById('dsnvManualDrawer');
    const overlay = document.getElementById('dsnvManualDrawerOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

function closeDsnvManualDrawer() {
    const drawer = document.getElementById('dsnvManualDrawer');
    const overlay = document.getElementById('dsnvManualDrawerOverlay');
    if (!drawer || !overlay) return;
    dsnvManualModule = '';
    drawer.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

function getDsnvManualRow() {
    return [
        document.getElementById('dsnvManualId').value.trim(),
        document.getElementById('dsnvManualName').value.trim(),
        document.getElementById('dsnvManualImage').value.trim(),
        document.getElementById('dsnvManualGender').value.trim(),
        document.getElementById('dsnvManualBirthDate').value.trim(),
        document.getElementById('dsnvManualRole').value.trim(),
        document.getElementById('dsnvManualPassword').value,
        document.getElementById('dsnvManualType').value
    ];
}

async function updateDsnvSheetRow(sheetRow, row) {
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${CONFIG.authSheetName}'!A${sheetRow}:H${sheetRow}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
}

async function appendDsnvRows(rows) {
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${CONFIG.authSheetName}'!A1`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: rows })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
}

async function upsertDsnvRows(rows, moduleName) {
    if (!isAdminSession()) return alert("Chỉ ADMIN được cập nhật DSNV.");
    const normalizedRows = new Map();
    rows.forEach(row => {
        const normalized = Array.from({ length: 8 }, (_, index) => row[index] ?? '');
        const id = (normalized[0] || '').toString().trim();
        const type = normalizeDirectoryType(normalized[7]);
        const validType = moduleName === 'nhanvien'
            ? type === 'NHAN VIEN'
            : ['KHACH HANG NPP', 'KHACH HANG NCC'].includes(type);
        if (id && validType) normalizedRows.set(id.toLowerCase(), normalized);
    });
    if (!normalizedRows.size) return alert("Không có dòng hợp lệ. Kiểm tra ID và cột truong.");
    await fetchAuthData();
    const existingRows = new Map((usersData || []).map(user => [user.id.toLowerCase(), user]));
    const updates = [];
    const appends = [];
    normalizedRows.forEach((row, id) => {
        const existing = existingRows.get(id);
        if (existing) {
            if (!row[6]) row[6] = existing.password || '';
            updates.push(updateDsnvSheetRow(existing.sheetRow, row));
        }
        else appends.push(row);
    });
    await Promise.all(updates);
    if (appends.length) await appendDsnvRows(appends);
    await fetchAuthData();
    renderDsnvDirectory(moduleName);
    return true;
}

async function saveDsnvManual() {
    const row = getDsnvManualRow();
    if (!row[0] || !row[1]) return alert("Vui lòng nhập ID và Họ tên.");
    const btn = document.getElementById('dsnvManualSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    try {
        await upsertDsnvRows([row], dsnvManualModule);
        closeDsnvManualDrawer();
    } catch (err) {
        console.error(err);
        alert("Không thể lưu DSNV.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu thông tin';
    }
}

function triggerDsnvExcelUpload(moduleName) {
    if (!isAdminSession() || !['nhanvien', 'khachhang'].includes(moduleName)) return alert("Chỉ ADMIN được cập nhật DSNV.");
    dsnvUploadModule = moduleName;
    simpleSheetUploadModule = '';
    const input = document.getElementById('simpleSheetExcelInput');
    input.value = '';
    input.click();
}

function downloadDsnvTemplate(moduleName) {
    if (!isAdminSession() || !['nhanvien', 'khachhang'].includes(moduleName)) return;
    const columns = ['id', 'ho_ten', 'hinh_anh', 'gioi_tinh', 'ngay_sinh', 'quyen', 'mk', 'truong'];
    const type = moduleName === 'nhanvien' ? 'NHÂN VIÊN' : 'KHÁCH HÀNG NPP';
    const worksheet = XLSX.utils.aoa_to_sheet([columns, ['ID-MAU-001', 'Tên mẫu', '', '', '2000-01-01', '', '', type]]);
    worksheet['!cols'] = columns.map(column => ({ wch: Math.max(14, column.length + 3) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'DSNV');
    XLSX.writeFile(workbook, `Mau_DSNV_${moduleName}.xlsx`);
}

function getWritableSimpleModule(moduleName) {
    return ['nhap', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat'].includes(moduleName) ? SIMPLE_SHEET_MODULES[moduleName] : null;
}

async function appendWarehouseProductRows(rows) {
    const config = SIMPLE_SHEET_MODULES.sanphamkho;
    if (!rows.length) return false;
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${config.sheetName()}'!A1`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: rows })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    await fetchSimpleSheetModule('sanphamkho');
    if (!document.getElementById('module-sanphamkho')?.classList.contains('hidden')) {
        await renderSimpleSheetModule('sanphamkho');
    }
    return true;
}

async function appendSimpleSheetRows(moduleName, rows) {
    const config = getWritableSimpleModule(moduleName);
    if (!config || !rows.length) return false;
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${config.sheetName()}'!A1`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}:append?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: rows })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    await fetchSimpleSheetModule(moduleName);
    await renderSimpleSheetModule(moduleName);
    return true;
}

async function ensureWarehouseProductsFromDetailRows(detailRows) {
    const rows = (detailRows || []).filter(row => row && row.length);
    if (!rows.length) return;
    if (!productDataRaw || productDataRaw.length <= 1) await fetchSimpleSheetModule('sanpham');
    if (!warehouseProductDataRaw || warehouseProductDataRaw.length <= 1) await fetchSimpleSheetModule('sanphamkho');

    const existingIds = new Set((warehouseProductDataRaw || []).slice(1)
        .map(row => {
            const kho = (row[1] || '').toString().trim();
            const idSp = (row[2] || '').toString().trim();
            return normalizeWarehouseProductKey(kho, idSp) || (row[0] || '').toString().trim().toLowerCase();
        })
        .filter(Boolean));
    const productById = new Map((productDataRaw || []).slice(1).map(row => [
        (row[0] || '').toString().trim(),
        {
            name: (row[1] || '').toString().trim(),
            model: (row[2] || '').toString().trim()
        }
    ]).filter(([id]) => id));
    const rowsToAppend = [];

    rows.forEach(row => {
        const kho = (row[11] || '').toString().trim();
        const idSp = (row[6] || '').toString().trim();
        if (!kho || !idSp) return;
        const id = `${kho}|${idSp}`;
        const key = normalizeWarehouseProductKey(kho, idSp);
        if (existingIds.has(key)) return;
        const product = productById.get(idSp);
        rowsToAppend.push([
            id,
            kho,
            idSp,
            product?.name || (row[7] || '').toString().trim(),
            0,
            0
        ]);
        existingIds.add(key);
    });

    if (rowsToAppend.length) await appendWarehouseProductRows(rowsToAppend);
}

async function ensureWarehouseProductsFromTransferRows(transferRows) {
    const rows = (transferRows || []).filter(row => row && row.length);
    if (!rows.length) return;
    if (!productDataRaw || productDataRaw.length <= 1) await fetchSimpleSheetModule('sanpham');
    await fetchSimpleSheetModule('sanphamkho');

    const existingIds = new Set((warehouseProductDataRaw || []).slice(1)
        .map(row => {
            const kho = (row[1] || '').toString().trim();
            const idSp = (row[2] || '').toString().trim();
            return normalizeWarehouseProductKey(kho, idSp) || (row[0] || '').toString().trim().toLowerCase();
        })
        .filter(Boolean));
    const productById = new Map((productDataRaw || []).slice(1).map(row => [
        (row[0] || '').toString().trim(),
        (row[1] || '').toString().trim()
    ]).filter(([id]) => id));
    const rowsToAppend = [];

    rows.forEach(row => {
        const idSp = (row[3] || '').toString().trim();
        if (!idSp) return;
        const tenSp = productById.get(idSp) || (row[4] || '').toString().trim();
        [row[6], row[7]].forEach(value => {
            const kho = (value || '').toString().trim();
            if (!kho) return;
            const id = `${kho}|${idSp}`;
            const key = normalizeWarehouseProductKey(kho, idSp);
            if (existingIds.has(key)) return;
            rowsToAppend.push([id, kho, idSp, tenSp, 0, 0]);
            existingIds.add(key);
        });
    });

    if (rowsToAppend.length) await appendWarehouseProductRows(rowsToAppend);
}

function normalizeWarehouseProductKey(kho, idSp) {
    const cleanKho = (kho || '').toString().trim();
    const cleanIdSp = (idSp || '').toString().trim();
    return cleanKho && cleanIdSp ? `${cleanKho}|${cleanIdSp}`.toLowerCase() : '';
}

async function updateProductSheetRow(sheetRow, row) {
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${CONFIG.productSheetName}'!B${sheetRow}:F${sheetRow}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row.slice(1)] })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return true;
}

async function updateWarehouseProductSheetRow(sheetRow, row) {
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${CONFIG.warehouseProductSheetName}'!A${sheetRow}:F${sheetRow}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return true;
}

async function updateReconciliationSheetRow(sheetRow, row) {
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${CONFIG.reconciliationSheetName}'!A${sheetRow}:C${sheetRow}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return true;
}

async function updateWarehouseTransferSheetRow(sheetRow, row) {
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${CONFIG.transferSheetName}'!A${sheetRow}:K${sheetRow}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    const response = await fetch(url, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

async function deleteWarehouseTransferSheetRows(sheetRows) {
    if (!sheetRows.length) return;
    const token = await getAccessToken();
    const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}?fields=sheets.properties(sheetId,title)`;
    const metadataResponse = await fetch(metadataUrl, { headers: { "Authorization": `Bearer ${token}` } });
    if (!metadataResponse.ok) throw new Error(`HTTP ${metadataResponse.status}`);
    const metadata = await metadataResponse.json();
    const sheet = (metadata.sheets || []).find(item => item.properties?.title === CONFIG.transferSheetName);
    if (!sheet) throw new Error(`Sheet not found: ${CONFIG.transferSheetName}`);
    const requests = [...sheetRows].sort((a, b) => b - a).map(sheetRow => ({
        deleteDimension: {
            range: {
                sheetId: sheet.properties.sheetId,
                dimension: 'ROWS',
                startIndex: sheetRow - 1,
                endIndex: sheetRow
            }
        }
    }));
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ requests })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
}

async function updateDetailSheetRow(moduleName, sheetRow, row) {
    const config = getWritableSimpleModule(moduleName);
    if (!config || !['nhap', 'xuat'].includes(moduleName)) return false;
    const token = await getAccessToken();
    const range = encodeURIComponent(`'${config.sheetName()}'!A${sheetRow}:O${sheetRow}`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`;
    const resp = await fetch(url, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values: [row] })
    });
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
    return true;
}

function getDetailUpsertKey(row) {
    const mdh = (row[3] || '').toString().trim().toLowerCase();
    const idSp = (row[6] || '').toString().trim().toLowerCase();
    const kho = (row[11] || '').toString().trim().toLowerCase();
    return mdh && idSp && kho ? `${mdh}__${idSp}__${kho}` : '';
}

async function upsertDetailRows(moduleName, rows) {
    const config = getWritableSimpleModule(moduleName);
    if (!config || !['nhap', 'xuat'].includes(moduleName) || !rows.length) return false;
    if (rows.some(row => !isAllowedWarehouse(row[11]))) return alert("Kho phải là một trong các giá trị: KHO 1, KHO 2, KHO 3, KHO 4, KHO 5.");
    await fetchSimpleSheetModule(moduleName);

    const normalizedRows = new Map();
    rows.forEach(row => {
        const normalized = config.columns.map((_, index) => row[index] ?? '');
        normalized[14] = normalizeOrderLoaiHinh(normalized[14]);
        const key = getDetailUpsertKey(normalized);
        if (!key) return;
        const existing = normalizedRows.get(key);
        if (existing) {
            existing[8] = cleanNumber(existing[8]) + cleanNumber(normalized[8]);
            existing[10] = cleanNumber(existing[10]) + cleanNumber(normalized[10]);
        } else {
            normalizedRows.set(key, normalized);
        }
    });
    if (!normalizedRows.size) return alert("File Excel phải có MDH, ID SP và Kho để cập nhật hoặc thêm mới.");

    const existingRowsByKey = new Map();
    (getSimpleModuleData(moduleName) || []).slice(1).forEach((row, index) => {
        const key = getDetailUpsertKey(row);
        if (key) existingRowsByKey.set(key, index + 2);
    });

    const rowsToAppend = [];
    const updates = [];
    normalizedRows.forEach((row, key) => {
        const sheetRow = existingRowsByKey.get(key);
        if (sheetRow) updates.push(updateDetailSheetRow(moduleName, sheetRow, row));
        else rowsToAppend.push(row);
    });
    await Promise.all(updates);
    if (rowsToAppend.length) await appendSimpleSheetRows(moduleName, rowsToAppend);
    else {
        await fetchSimpleSheetModule(moduleName);
        await renderSimpleSheetModule(moduleName);
    }
    await ensureWarehouseProductsFromDetailRows(Array.from(normalizedRows.values()));
    return true;
}

async function upsertProductRows(rows) {
    const config = SIMPLE_SHEET_MODULES.sanpham;
    if (!rows.length) return false;
    if (!productDataRaw || productDataRaw.length <= 1) await fetchSimpleSheetModule('sanpham');

    const normalizedRows = new Map();
    rows.forEach(row => {
        const normalized = config.columns.map((_, index) => row[index] ?? '');
        const id = (normalized[0] || '').toString().trim();
        if (id) {
            normalized[0] = id;
            normalizedRows.set(id.toLowerCase(), normalized);
        }
    });
    if (!normalizedRows.size) return alert("Vui lòng nhập ít nhất một ID sản phẩm.");

    const existingRowsById = new Map();
    (productDataRaw || []).slice(1).forEach((row, index) => {
        const id = (row[0] || '').toString().trim().toLowerCase();
        if (id) existingRowsById.set(id, index + 2);
    });

    const rowsToAppend = [];
    const updates = [];
    normalizedRows.forEach((row, id) => {
        const sheetRow = existingRowsById.get(id);
        if (sheetRow) updates.push(updateProductSheetRow(sheetRow, row));
        else rowsToAppend.push(row);
    });
    await Promise.all(updates);
    if (rowsToAppend.length) await appendSimpleSheetRows('sanpham', rowsToAppend);
    else {
        await fetchSimpleSheetModule('sanpham');
        await renderSimpleSheetModule('sanpham');
    }
    return true;
}

async function upsertWarehouseProductRows(rows) {
    const config = SIMPLE_SHEET_MODULES.sanphamkho;
    if (!rows.length) return false;
    if (rows.some(row => !isAllowedWarehouse(row[1]))) return alert("Kho phải là một trong các giá trị: KHO 1, KHO 2, KHO 3, KHO 4, KHO 5.");
    if (!warehouseProductDataRaw || warehouseProductDataRaw.length <= 1) await fetchSimpleSheetModule('sanphamkho');

    const normalizedRows = new Map();
    rows.forEach(row => {
        const normalized = config.columns.map((_, index) => row[index] ?? '');
        const kho = (normalized[1] || '').toString().trim();
        const idSp = (normalized[2] || '').toString().trim();
        if (!kho || !idSp) return;
        normalized[0] = `${kho}|${idSp}`;
        normalized[1] = kho;
        normalized[2] = idSp;
        normalized[3] = (normalized[3] || '').toString().trim() || getProductNameById(idSp);
        normalizedRows.set(`${kho}|${idSp}`.toLowerCase(), normalized);
    });
    if (!normalizedRows.size) return alert("File Excel phải có Kho và ID SP để cập nhật hoặc thêm mới.");

    const existingRowsById = new Map();
    (warehouseProductDataRaw || []).slice(1).forEach((row, index) => {
        const kho = (row[1] || '').toString().trim();
        const idSp = (row[2] || '').toString().trim();
        if (kho && idSp) existingRowsById.set(`${kho}|${idSp}`.toLowerCase(), index + 2);
    });

    const rowsToAppend = [];
    const updates = [];
    normalizedRows.forEach((row, id) => {
        const sheetRow = existingRowsById.get(id);
        if (sheetRow) updates.push(updateWarehouseProductSheetRow(sheetRow, row));
        else rowsToAppend.push(row);
    });
    await Promise.all(updates);
    if (rowsToAppend.length) await appendWarehouseProductRows(rowsToAppend);
    else {
        await fetchSimpleSheetModule('sanphamkho');
        await renderSimpleSheetModule('sanphamkho');
    }
    return true;
}

async function upsertReconciliationRows(rows) {
    if (!canCurrentUser('doisoat.manage')) return alert("Bạn không có quyền cập nhật đối soát.");
    if (!Array.isArray(rows)) return false;
    await Promise.all([
        fetchSimpleSheetModule('sanpham'),
        fetchSimpleSheetModule('sanphamkho'),
        fetchSimpleSheetModule('nhap'),
        fetchSimpleSheetModule('xuat')
    ]);
    const products = new Map((productDataRaw || []).slice(1)
        .map(row => [(row[0] || '').toString().trim().toLowerCase(), {
            id: (row[0] || '').toString().trim(),
            name: (row[1] || '').toString().trim()
        }])
        .filter(([id]) => id));
    const uploadedRows = new Map();
    rows.forEach(row => {
        const id = (row[0] || '').toString().trim();
        if (!id) return;
        uploadedRows.set(id.toLowerCase(), row);
    });
    const ids = new Map();
    products.forEach((product, key) => ids.set(key, product.id));
    uploadedRows.forEach((row, key) => ids.set(key, (row[0] || '').toString().trim()));
    const normalizedRows = new Map();
    ids.forEach((id, key) => {
        const uploadedRow = uploadedRows.get(key) || [];
        const tonMisa = cleanNumber(uploadedRow[2]);
        normalizedRows.set(key, [
            id,
            products.get(key)?.name || (uploadedRow[1] || '').toString().trim(),
            tonMisa
        ]);
    });
    if (!normalizedRows.size) return alert("Không có ID sản phẩm nào để ghi đối soát.");

    const values = [['id', 'ten_sp', 'ton_misa'], ...Array.from(normalizedRows.values())];
    await replaceReconciliationSheetValues(values);
    reconciliationDataRaw = values;
    localStorage.setItem(SIMPLE_SHEET_MODULES.doisoat.cacheKey, JSON.stringify(values));
    await renderSimpleSheetModule('doisoat');
    return true;
}

async function replaceReconciliationSheetValues(values) {
    const token = await getAccessToken();
    const clearRange = encodeURIComponent(`'${CONFIG.reconciliationSheetName}'!A1:E50000`);
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${clearRange}:clear`;
    const clearResp = await fetch(clearUrl, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({})
    });
    if (!clearResp.ok) throw new Error(`HTTP ${clearResp.status}`);

    const updateRange = encodeURIComponent(`'${CONFIG.reconciliationSheetName}'!A1:C${values.length}`);
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${updateRange}?valueInputOption=USER_ENTERED`;
    const updateResp = await fetch(updateUrl, {
        method: 'PUT',
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ values })
    });
    if (!updateResp.ok) throw new Error(`HTTP ${updateResp.status}`);
}

function openSimpleSheetManualDrawer(moduleName) {
    if (!canCurrentUser('nx.manualAdd')) return alert("Bạn không có quyền thêm dữ liệu bằng tay.");
    if (moduleName === 'chuyenkho') return openWarehouseTransferDrawer();
    openNXManualDrawer(moduleName);
}

async function openWarehouseTransferDrawer() {
    if (!productDataRaw || productDataRaw.length <= 1) await fetchSimpleSheetModule('sanpham');
    const drawer = document.getElementById('warehouseTransferDrawer');
    const overlay = document.getElementById('warehouseTransferDrawerOverlay');
    if (!drawer || !overlay) return;
    warehouseTransferEditContext = null;
    document.getElementById('warehouseTransferDrawerTitle').textContent = 'Thêm điều chuyển kho';
    document.getElementById('warehouseTransferDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('warehouseTransferOrderId').value = '';
    document.getElementById('warehouseTransferNote').value = '';
    document.getElementById('warehouseTransferCondition').value = '';
    document.getElementById('warehouseTransferStatus').value = '';
    document.getElementById('warehouseTransferCommonFrom').value = '';
    document.getElementById('warehouseTransferCommonTo').value = '';
    populateWarehouseTransferProducts();
    document.getElementById('warehouseTransferRows').innerHTML = '';
    addWarehouseTransferProductRow();
    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

async function openWarehouseTransferEditDrawer(sheetRow) {
    if (!canCurrentUser('nx.manualAdd')) return alert("Bạn không có quyền sửa dữ liệu.");
    await Promise.all([
        fetchSimpleSheetModule('chuyenkho'),
        (!productDataRaw || productDataRaw.length <= 1) ? fetchSimpleSheetModule('sanpham') : Promise.resolve(productDataRaw)
    ]);
    const moduleRows = getSimpleModuleData('chuyenkho') || [];
    const selected = moduleRows[sheetRow - 1];
    if (!selected) return alert("Không tìm thấy dòng cần sửa.");
    const mdh = (selected[2] || '').toString().trim();
    const rows = moduleRows.slice(1)
        .map((row, index) => ({ row, sheetRow: index + 2 }))
        .filter(item => mdh
            ? (item.row[2] || '').toString().trim().toLowerCase() === mdh.toLowerCase()
            : item.sheetRow === sheetRow);
    warehouseTransferEditContext = { mdh, sheetRows: rows.map(item => item.sheetRow) };
    document.getElementById('warehouseTransferDrawerTitle').textContent = 'Sửa điều chuyển kho';
    document.getElementById('warehouseTransferDate').value = formatDateForInput(selected[1] || '');
    document.getElementById('warehouseTransferOrderId').value = selected[2] || '';
    document.getElementById('warehouseTransferNote').value = selected[8] || '';
    document.getElementById('warehouseTransferCondition').value = selected[9] || '';
    document.getElementById('warehouseTransferStatus').value = selected[10] || '';
    const commonFrom = [...new Set(rows.map(item => item.row[6]).filter(isAllowedWarehouse))];
    const commonTo = [...new Set(rows.map(item => item.row[7]).filter(isAllowedWarehouse))];
    document.getElementById('warehouseTransferCommonFrom').value = commonFrom.length === 1 ? commonFrom[0] : '';
    document.getElementById('warehouseTransferCommonTo').value = commonTo.length === 1 ? commonTo[0] : '';
    populateWarehouseTransferProducts();
    document.getElementById('warehouseTransferRows').innerHTML = '';
    rows.forEach(item => addWarehouseTransferProductRow({
        detailId: item.row[0] || '',
        sheetRow: item.sheetRow,
        idSp: item.row[3] || '',
        tenSp: item.row[4] || '',
        slg: item.row[5] || 1,
        khoDi: item.row[6] || '',
        khoNhan: item.row[7] || ''
    }));
    const overlay = document.getElementById('warehouseTransferDrawerOverlay');
    const drawer = document.getElementById('warehouseTransferDrawer');
    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

function closeWarehouseTransferDrawer() {
    const drawer = document.getElementById('warehouseTransferDrawer');
    const overlay = document.getElementById('warehouseTransferDrawerOverlay');
    if (!drawer || !overlay) return;
    warehouseTransferEditContext = null;
    drawer.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

function populateWarehouseTransferProducts() {
    const list = document.getElementById('warehouseTransferProductList');
    if (!list) return;
    list.innerHTML = getProductCatalog()
        .map(product => `<option value="${escAttr(product.id)} - ${escAttr(product.name)}"></option>`)
        .join('');
}

async function generateWarehouseTransferOrderId() {
    await fetchSimpleSheetModule('chuyenkho');
    const existingIds = new Set((transferDataRaw || []).slice(1)
        .map(row => (row[2] || '').toString().trim().toUpperCase())
        .filter(Boolean));
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let orderId = '';
    do {
        orderId = Array.from({ length: 8 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    } while (existingIds.has(orderId));
    document.getElementById('warehouseTransferOrderId').value = orderId;
}

function addWarehouseTransferProductRow(data = {}) {
    const wrap = document.getElementById('warehouseTransferRows');
    if (!wrap) return;
    const row = document.createElement('tr');
    row.className = 'warehouse-transfer-row hover:bg-slate-50/80';
    row.dataset.detailId = data.detailId || '';
    row.dataset.sheetRow = data.sheetRow || '';
    row.innerHTML = `
        <td class="px-3 py-2"><input data-field="idSp" list="warehouseTransferProductList" oninput="updateWarehouseTransferProduct(this)" class="form-input" placeholder="Nhập hoặc chọn ID SP..."></td>
        <td class="px-3 py-2"><input data-field="tenSp" readonly class="form-input bg-slate-50"></td>
        <td class="px-3 py-2"><input data-field="slg" type="number" min="1" value="1" class="form-input text-right"></td>
        <td class="px-3 py-2"><select data-field="khoDi" class="form-input bg-white"><option value="">Chọn kho...</option>${WAREHOUSE_OPTIONS.map(kho => `<option value="${escAttr(kho)}">${escAttr(kho)}</option>`).join('')}</select></td>
        <td class="px-3 py-2"><select data-field="khoNhan" class="form-input bg-white"><option value="">Chọn kho...</option>${WAREHOUSE_OPTIONS.map(kho => `<option value="${escAttr(kho)}">${escAttr(kho)}</option>`).join('')}</select></td>
        <td class="px-3 py-2 text-center"><button type="button" onclick="removeWarehouseTransferProductRow(this)" class="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50">✕</button></td>
    `;
    wrap.appendChild(row);
    row.querySelector('[data-field="idSp"]').value = data.idSp || '';
    row.querySelector('[data-field="tenSp"]').value = data.tenSp || '';
    row.querySelector('[data-field="slg"]').value = data.slg ?? 1;
    row.querySelector('[data-field="khoDi"]').value = data.khoDi || document.getElementById('warehouseTransferCommonFrom')?.value || '';
    row.querySelector('[data-field="khoNhan"]').value = data.khoNhan || document.getElementById('warehouseTransferCommonTo')?.value || '';
}

function applyWarehouseTransferCommonWarehouse(field, warehouse) {
    const value = isAllowedWarehouse(warehouse) ? warehouse : '';
    document.querySelectorAll('#warehouseTransferRows .warehouse-transfer-row').forEach(row => {
        row.querySelector(`[data-field="${field}"]`).value = value;
    });
}

function removeWarehouseTransferProductRow(button) {
    const rows = document.querySelectorAll('#warehouseTransferRows .warehouse-transfer-row');
    if (rows.length <= 1) {
        const row = button.closest('.warehouse-transfer-row');
        row.querySelector('[data-field="idSp"]').value = '';
        row.querySelector('[data-field="tenSp"]').value = '';
        row.querySelector('[data-field="slg"]').value = '1';
        row.querySelector('[data-field="khoDi"]').value = '';
        row.querySelector('[data-field="khoNhan"]').value = '';
        return;
    }
    button.closest('.warehouse-transfer-row')?.remove();
}

function updateWarehouseTransferProduct(input) {
    const row = input.closest('.warehouse-transfer-row');
    if (!row) return;
    const idSp = parseProductIdInput(input.value);
    const product = getProductCatalog().find(item => item.id === idSp);
    row.querySelector('[data-field="tenSp"]').value = product ? product.name : '';
}

function validateWarehouseTransferRows(rows) {
    if (rows.some(row => !isAllowedWarehouse(row[6]) || !isAllowedWarehouse(row[7]))) {
        alert("Kho đi và Kho nhận phải là một trong các giá trị: KHO 1, KHO 2, KHO 3, KHO 4, KHO 5.");
        return false;
    }
    if (rows.some(row => row[6] === row[7])) {
        alert("Kho đi và Kho nhận phải khác nhau.");
        return false;
    }
    return true;
}

async function saveWarehouseTransferManual() {
    if (!canCurrentUser('nx.manualAdd')) return alert("Bạn không có quyền thực hiện thao tác này.");
    const ngay = formatDateDDMMYYYY(document.getElementById('warehouseTransferDate').value);
    const mdh = document.getElementById('warehouseTransferOrderId').value.trim();
    const ghiChu = document.getElementById('warehouseTransferNote').value.trim();
    const tinhTrang = document.getElementById('warehouseTransferCondition').value.trim();
    const trangThai = document.getElementById('warehouseTransferStatus').value.trim();
    if (!ngay || !mdh) return alert("Vui lòng nhập Ngày và MDH.");
    const timestamp = Date.now();
    const rows = Array.from(document.querySelectorAll('#warehouseTransferRows .warehouse-transfer-row')).map((row, index) => {
        const idSp = parseProductIdInput(row.querySelector('[data-field="idSp"]').value);
        const tenSp = row.querySelector('[data-field="tenSp"]').value.trim() || getProductNameById(idSp);
        const slg = cleanNumber(row.querySelector('[data-field="slg"]').value);
        const khoDi = row.querySelector('[data-field="khoDi"]').value;
        const khoNhan = row.querySelector('[data-field="khoNhan"]').value;
        if (!idSp || slg <= 0) return null;
        return {
            sheetRow: Number(row.dataset.sheetRow || 0),
            values: [row.dataset.detailId || `${timestamp}-${index + 1}`, ngay, mdh, idSp, tenSp, slg, khoDi, khoNhan, ghiChu, tinhTrang, trangThai]
        };
    }).filter(Boolean);
    if (!rows.length) return alert("Vui lòng nhập ít nhất 1 sản phẩm có số lượng lớn hơn 0.");
    if (!validateWarehouseTransferRows(rows.map(item => item.values))) return;
    const button = document.getElementById('warehouseTransferSaveBtn');
    button.disabled = true;
    button.textContent = 'Đang lưu...';
    try {
        if (warehouseTransferEditContext) {
            const retainedSheetRows = new Set(rows.map(item => item.sheetRow).filter(Boolean));
            const removedSheetRows = warehouseTransferEditContext.sheetRows.filter(sheetRow => !retainedSheetRows.has(sheetRow));
            await Promise.all(rows.filter(item => item.sheetRow).map(item => updateWarehouseTransferSheetRow(item.sheetRow, item.values)));
            const appendRows = rows.filter(item => !item.sheetRow).map(item => item.values);
            if (appendRows.length) await appendSimpleSheetRows('chuyenkho', appendRows);
            if (removedSheetRows.length) await deleteWarehouseTransferSheetRows(removedSheetRows);
            await fetchSimpleSheetModule('chuyenkho');
            await renderSimpleSheetModule('chuyenkho');
        } else {
            await appendSimpleSheetRows('chuyenkho', rows.map(item => item.values));
        }
        await ensureWarehouseProductsFromTransferRows(rows.map(item => item.values));
        closeWarehouseTransferDrawer();
    } catch (error) {
        console.error("Warehouse transfer save error:", error);
        alert("Không thể lưu phiếu điều chuyển kho.");
    } finally {
        button.disabled = false;
        button.textContent = 'Lưu điều chuyển';
    }
}

function triggerSimpleSheetExcelUpload(moduleName) {
    if (moduleName === 'doisoat' && !canCurrentUser('doisoat.manage')) return alert("Bạn không có quyền cập nhật đối soát.");
    if (['sanpham', 'sanphamkho'].includes(moduleName) && !canCurrentUser('sanpham.manage')) return alert("Bạn không có quyền cập nhật danh sách sản phẩm.");
    if (!['sanpham', 'sanphamkho', 'doisoat'].includes(moduleName) && !canCurrentUser('nx.upload')) return alert("Bạn không có quyền tải Excel lên.");
    if (!getWritableSimpleModule(moduleName)) return;
    dsnvUploadModule = '';
    simpleSheetUploadModule = moduleName;
    const input = document.getElementById('simpleSheetExcelInput');
    input.value = '';
    input.click();
}

function handleSimpleSheetExcelUpload(input) {
    const file = input.files[0];
    if (!file || (!simpleSheetUploadModule && !dsnvUploadModule)) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
        try {
            const workbook = XLSX.read(new Uint8Array(event.target.result), { type: 'array' });
            const worksheet = workbook.Sheets[workbook.SheetNames[0]];
            if (dsnvUploadModule) {
                const columns = ['id', 'ho_ten', 'hinh_anh', 'gioi_tinh', 'ngay_sinh', 'quyen', 'mk', 'truong'];
                const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                if (rows.length <= 1) return alert("File Excel chưa có dữ liệu.");
                const headers = rows[0].map(value => (value || '').toString().trim().toLowerCase());
                const indexes = columns.map(column => headers.indexOf(column));
                if (indexes.some(index => index === -1)) return alert(`File Excel phải có đủ header: ${columns.join(', ')}`);
                const values = rows.slice(1).map(row => indexes.map(index => row[index] ?? '')).filter(row => row.some(value => value !== ''));
                if (!values.length) return alert("Không tìm thấy dòng dữ liệu hợp lệ.");
                if (!confirm(`Tải ${values.length} dòng lên DSNV?`)) return;
                await upsertDsnvRows(values, dsnvUploadModule);
                alert("Tải Excel DSNV thành công.");
                return;
            }
            const config = getWritableSimpleModule(simpleSheetUploadModule);
            const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
            if (simpleSheetUploadModule === 'doisoat') {
                if (!rows.length) return alert("File Excel chưa có dữ liệu.");
                const dataRows = rows.slice();
                const firstId = normalizeHeaderKey(dataRows[0]?.[0]);
                if (['id', 'id_sp', 'ma_sp', 'ma_hang', 'sku'].includes(firstId)) dataRows.shift();
                const values = dataRows
                    .map(row => [row[0] ?? '', '', row[2] ?? ''])
                    .filter(row => row[0]);
                if (!confirm(`Xóa dữ liệu cũ và tải ${values.length} dòng từ file lên ${config.sheetName()}?`)) return;
                await upsertReconciliationRows(values);
                alert("Đối soát dữ liệu thành công.");
                return;
            }
            if (rows.length <= 1) return alert("File Excel chưa có dữ liệu.");
            const headers = rows[0].map(value => (value || '').toString().trim().toLowerCase());
            const indexes = config.columns.map(column => headers.indexOf(column));
            if (indexes.some(index => index === -1)) return alert(`File Excel phải có đủ header: ${config.columns.join(', ')}`);
            const values = rows.slice(1).map(row => indexes.map(index => row[index] ?? '')).filter(row => row.some(value => value !== ''));
            if (!values.length) return alert("Không tìm thấy dòng dữ liệu hợp lệ.");
            if (!confirm(`Tải ${values.length} dòng lên ${config.sheetName()}?`)) return;
            if (simpleSheetUploadModule === 'sanpham') await upsertProductRows(values);
            else if (simpleSheetUploadModule === 'sanphamkho') await upsertWarehouseProductRows(values);
            else if (['nhap', 'xuat'].includes(simpleSheetUploadModule)) await upsertDetailRows(simpleSheetUploadModule, values);
            else if (simpleSheetUploadModule === 'chuyenkho') {
                if (!validateWarehouseTransferRows(values)) return;
                await appendSimpleSheetRows(simpleSheetUploadModule, values);
                await ensureWarehouseProductsFromTransferRows(values);
            }
            else await appendSimpleSheetRows(simpleSheetUploadModule, values);
            alert("Tải Excel lên thành công.");
        } catch (err) {
            console.error(err);
            alert("Không thể đọc hoặc tải file Excel.");
        }
    };
    reader.readAsArrayBuffer(file);
}

function downloadSimpleSheetTemplate(moduleName) {
    const config = getWritableSimpleModule(moduleName);
    if (!config) return;
    if (moduleName === 'doisoat') {
        const columns = ['id', 'ten_sp', 'ton_misa'];
        const worksheet = XLSX.utils.aoa_to_sheet([columns, ['SP-MAU-001', 'Sản phẩm mẫu', 0]]);
        worksheet['!cols'] = [{ wch: 18 }, { wch: 36 }, { wch: 14 }];
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'DOI_SOAT');
        XLSX.writeFile(workbook, 'Mau_DOI_SOAT.xlsx');
        return;
    }
    const example = config.columns.map(column => {
        if (column === 'id') return moduleName === 'sanphamkho' ? 'KHO 1|SP-MAU-001' : 'ID-MAU-001';
        if (column === 'ngay') return '30/05/2026';
        if (column === 'truong') return moduleName === 'nhap' ? 'NHẬP' : 'XUẤT';
        if (column === 'mdh') return 'DON-MAU-001';
        if (column === 'ma_kh') return 'KH-MAU-001';
        if (column === 'ten_khach') return 'Khách hàng mẫu';
        if (column === 'id_sp') return 'SP-MAU-001';
        if (column === 'ten_sp') return 'Sản phẩm mẫu';
        if (column === 'slg') return 1;
        if (column === 'don_gia') return 100000;
        if (column === 'thanh_tien') return 100000;
        if (column === 'kho') return 'KHO 1';
        if (column === 'loai_hinh') return 'Thường';
        if (column === 'kho_di') return 'KHO 1';
        if (column === 'kho_nhan') return 'KHO 2';
        if (column === 'model') return 'MODEL-MAU';
        if (column === 'anh') return 'https://example.com/anh-san-pham.jpg';
        if (column === 'gia_ban') return 100000;
        if (column === 'ghi_chu') return 'Ghi chú mẫu';
        if (column === 'tinh_trang') return 'Đang điều chuyển';
        if (column === 'trang_thai') return 'Chờ xác nhận';
        if (column === 'ton_dau' || column === 'ton_sau' || column === 'ton_cuoi') return 0;
        return '';
    });
    const worksheet = XLSX.utils.aoa_to_sheet([config.columns, example]);
    worksheet['!cols'] = config.columns.map(column => ({ wch: Math.max(12, column.length + 3) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName());
    XLSX.writeFile(workbook, `Mau_${config.sheetName()}.xlsx`);
}

function downloadFilteredSimpleSheetExcel(moduleName) {
    const config = getWritableSimpleModule(moduleName);
    if (!config) return;
    const rows = getFilteredSimpleModuleRows(moduleName);
    if (!rows.length) return alert("Không có dữ liệu phù hợp để tải xuống.");
    const exportComputedColumns = ['sanpham', 'sanphamkho'].includes(moduleName);
    const columns = exportComputedColumns ? getSimpleModuleDisplayColumns(moduleName, config) : config.columns;
    const movementTotals = moduleName === 'sanphamkho' ? getWarehouseMovementTotals() : new Map();
    if (moduleName === 'sanpham') movementTotals.productAggregates = getProductAggregates();
    const exportRows = exportComputedColumns
        ? rows.map(row => columns.map((column, displayIndex) => {
            const physicalIndex = config.columns.indexOf(column);
            return getSimpleModuleDisplayValue(moduleName, row, column, physicalIndex !== -1 ? physicalIndex : displayIndex, movementTotals);
        }))
        : rows;
    const worksheet = XLSX.utils.aoa_to_sheet([columns, ...exportRows]);
    worksheet['!cols'] = columns.map(column => ({ wch: Math.max(12, column.length + 3) }));
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.sheetName());
    XLSX.writeFile(workbook, `${config.sheetName()}_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

async function openProductManualDrawer(sheetRow = 0) {
    if (!canCurrentUser('sanpham.manage')) return alert("Bạn không có quyền cập nhật danh sách sản phẩm.");
    productManualEditSheetRow = Number(sheetRow || 0);
    const title = document.getElementById('productManualDrawerTitle');
    if (title) title.textContent = productManualEditSheetRow ? 'Chi tiết sản phẩm' : 'Thêm sản phẩm';
    ['productManualId', 'productManualName', 'productManualModel', 'productManualImage'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('productManualPrice').value = '0';
    document.getElementById('productManualNote').value = '';
    renderProductStockDetails('');
    if (productManualEditSheetRow) {
        await Promise.all([
            (!productDataRaw || productDataRaw.length <= 1) ? fetchSimpleSheetModule('sanpham') : Promise.resolve(productDataRaw),
            (!warehouseProductDataRaw || warehouseProductDataRaw.length <= 1) ? fetchSimpleSheetModule('sanphamkho') : Promise.resolve(warehouseProductDataRaw),
            (!nhapDataRaw || nhapDataRaw.length <= 1) ? fetchSimpleSheetModule('nhap') : Promise.resolve(nhapDataRaw),
            (!xuatDataRaw || xuatDataRaw.length <= 1) ? fetchSimpleSheetModule('xuat') : Promise.resolve(xuatDataRaw),
            (!transferDataRaw || transferDataRaw.length <= 1) ? fetchSimpleSheetModule('chuyenkho') : Promise.resolve(transferDataRaw)
        ]);
        const row = (productDataRaw || [])[productManualEditSheetRow - 1];
        if (!row) return alert("Không tìm thấy sản phẩm cần sửa.");
        document.getElementById('productManualId').value = row[0] || '';
        document.getElementById('productManualName').value = row[1] || '';
        document.getElementById('productManualModel').value = row[2] || '';
        document.getElementById('productManualImage').value = row[3] || '';
        document.getElementById('productManualPrice').value = row[4] || 0;
        document.getElementById('productManualNote').value = row[5] || '';
        renderProductStockDetails(row[0] || '');
    }
    const drawer = document.getElementById('productManualDrawer');
    const overlay = document.getElementById('productManualDrawerOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

function closeProductManualDrawer() {
    const drawer = document.getElementById('productManualDrawer');
    const overlay = document.getElementById('productManualDrawerOverlay');
    if (!drawer || !overlay) return;
    productManualEditSheetRow = 0;
    renderProductStockDetails('');
    drawer.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

async function openWarehouseProductDrawer(sheetRow = 0) {
    if (!canCurrentUser('sanpham.manage')) return alert("Bạn không có quyền cập nhật sản phẩm kho.");
    warehouseProductEditSheetRow = Number(sheetRow || 0);
    const title = document.getElementById('warehouseProductDrawerTitle');
    if (title) title.textContent = warehouseProductEditSheetRow ? 'Sửa sản phẩm kho' : 'Thêm sản phẩm kho';
    setWarehouseSelectValue('warehouseProductKho', '');
    document.getElementById('warehouseProductIdSp').value = '';
    document.getElementById('warehouseProductName').value = '';
    document.getElementById('warehouseProductTonDau').value = 0;
    document.getElementById('warehouseProductTonSau').value = 0;
    if (warehouseProductEditSheetRow) {
        if (!warehouseProductDataRaw || warehouseProductDataRaw.length <= 1) await fetchSimpleSheetModule('sanphamkho');
        const row = (warehouseProductDataRaw || [])[warehouseProductEditSheetRow - 1];
        if (!row) return alert("Không tìm thấy sản phẩm kho cần sửa.");
        setWarehouseSelectValue('warehouseProductKho', row[1] || '');
        document.getElementById('warehouseProductIdSp').value = row[2] || '';
        document.getElementById('warehouseProductName').value = row[3] || '';
        document.getElementById('warehouseProductTonDau').value = row[4] || 0;
        document.getElementById('warehouseProductTonSau').value = row[5] || 0;
    }

    const drawer = document.getElementById('warehouseProductDrawer');
    const overlay = document.getElementById('warehouseProductDrawerOverlay');
    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

function closeWarehouseProductDrawer() {
    const drawer = document.getElementById('warehouseProductDrawer');
    const overlay = document.getElementById('warehouseProductDrawerOverlay');
    if (!drawer || !overlay) return;
    warehouseProductEditSheetRow = 0;
    drawer.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

async function saveWarehouseProduct() {
    if (!canCurrentUser('sanpham.manage')) return alert("Bạn không có quyền cập nhật sản phẩm kho.");
    const kho = document.getElementById('warehouseProductKho').value.trim();
    const idSp = document.getElementById('warehouseProductIdSp').value.trim();
    const tenSp = document.getElementById('warehouseProductName').value.trim() || getProductNameById(idSp);
    if (!kho || !idSp) return alert("Vui lòng nhập Kho và ID SP.");
    if (!isAllowedWarehouse(kho)) return alert("Vui lòng chọn Kho từ KHO 1 đến KHO 5.");
    const row = [
        `${kho}|${idSp}`,
        kho,
        idSp,
        tenSp,
        cleanNumber(document.getElementById('warehouseProductTonDau').value),
        cleanNumber(document.getElementById('warehouseProductTonSau').value)
    ];
    if (warehouseProductEditSheetRow) {
        if (!warehouseProductDataRaw || warehouseProductDataRaw.length <= 1) await fetchSimpleSheetModule('sanphamkho');
        const duplicateIndex = (warehouseProductDataRaw || []).slice(1).findIndex(existingRow => {
            const existingKho = (existingRow[1] || '').toString().trim();
            const existingIdSp = (existingRow[2] || '').toString().trim();
            return `${existingKho}|${existingIdSp}`.toLowerCase() === `${kho}|${idSp}`.toLowerCase();
        });
        const duplicateSheetRow = duplicateIndex === -1 ? 0 : duplicateIndex + 2;
        if (duplicateSheetRow && duplicateSheetRow !== warehouseProductEditSheetRow) {
            return alert("Kho và ID SP này đã tồn tại ở một dòng khác.");
        }
    }
    const btn = document.getElementById('warehouseProductSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    try {
        if (warehouseProductEditSheetRow) await updateWarehouseProductSheetRow(warehouseProductEditSheetRow, row);
        else await upsertWarehouseProductRows([row]);
        await renderSimpleSheetModule('sanphamkho', false, true);
        closeWarehouseProductDrawer();
    } catch (err) {
        console.error(err);
        alert("Không thể lưu sản phẩm kho.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu sản phẩm kho';
    }
}

async function saveProductManual() {
    if (!canCurrentUser('sanpham.manage')) return alert("Bạn không có quyền cập nhật danh sách sản phẩm.");
    const row = [
        document.getElementById('productManualId').value.trim(),
        document.getElementById('productManualName').value.trim(),
        document.getElementById('productManualModel').value.trim(),
        document.getElementById('productManualImage').value.trim(),
        cleanNumber(document.getElementById('productManualPrice').value),
        document.getElementById('productManualNote').value.trim()
    ];
    if (!row[0]) return alert("Vui lòng nhập ID sản phẩm.");
    if (!row[1]) return alert("Vui lòng nhập tên sản phẩm.");

    const btn = document.getElementById('productManualSaveBtn');
    btn.disabled = true;
    btn.textContent = 'Đang lưu...';
    try {
        if (productManualEditSheetRow) {
            await updateProductSheetRow(productManualEditSheetRow, row);
            await fetchSimpleSheetModule('sanpham');
            await renderSimpleSheetModule('sanpham');
        } else {
            await upsertProductRows([row]);
        }
        closeProductManualDrawer();
        alert("Đã lưu sản phẩm.");
    } catch (err) {
        console.error(err);
        alert("Không thể lưu sản phẩm.");
    } finally {
        btn.disabled = false;
        btn.textContent = 'Lưu sản phẩm';
    }
}

function populateNXFilterDataLists(data) {
    if (!data || data.length <= 1) return;
    const orderCustomerSet = new Set();
    const productSet = new Set();

    data.slice(1).forEach(row => {
        const mdh = (row[3] || '').toString().trim();
        const khach = (row[5] || '').toString().trim();
        const idsp = (row[6] || '').toString().trim();
        const tensp = (row[7] || '').toString().trim();

        if (mdh) orderCustomerSet.add(mdh);
        if (khach) orderCustomerSet.add(khach);
        if (idsp || tensp) {
            const combined = `${idsp}${idsp && tensp ? ' - ' : ''}${tensp}`;
            productSet.add(combined);
            if (idsp) productSet.add(idsp);
            if (tensp) productSet.add(tensp);
        }
    });

    const orderCustomerList = document.getElementById('nxOrderCustomerList');
    if (orderCustomerList) {
        orderCustomerList.innerHTML = Array.from(orderCustomerSet)
            .filter(Boolean)
            .sort()
            .map(item => `<option value="${item}"></option>`)
            .join('');
    }

    const productList = document.getElementById('nxProductList');
    if (productList) {
        productList.innerHTML = Array.from(productSet)
            .filter(Boolean)
            .sort()
            .map(item => `<option value="${item}"></option>`)
            .join('');
    }
}

async function renderNXModule() {
    const tbody = document.getElementById('nxTableBody');
    tbody.innerHTML = '<tr><td colspan="12" class="px-4 py-10 text-center text-slate-400 text-sm">Đang tải dữ liệu và đồng bộ bộ lọc...</td></tr>';
    await fetchNXData();
    applyFilters();
}

function applyFilters(resetPage) {
    if (resetPage) nxCurrentPage = 1;
    if (!nxDataRaw || nxDataRaw.length <= 1) return;

    const searchTerm = document.getElementById('nxSearchInput').value.toLowerCase().trim();
    const productSearch = document.getElementById('nxSearchProduct').value.toLowerCase().trim();
    const typeFilter = document.getElementById('nxTypeFilter').value;
    const dateFrom = document.getElementById('nxDateFrom').value;
    const dateTo = document.getElementById('nxDateTo').value;
    const tbody = document.getElementById('nxTableBody');

    const isNPP = currentUser && resolveRoleKey(currentUser.role) === 'NPP';
    const isNVKD = currentUser && resolveRoleKey(currentUser.role) === 'NVKD';
    const nxHeaders = nxDataRaw[0] ? nxDataRaw[0].map(h => (h || '').toString().toLowerCase().trim()) : [];
    const iMaKH = nxHeaders.indexOf('ma_kh');
    const iIdNv = nxHeaders.findIndex(h => h === 'id_nv' || h === 'mã nv' || h === 'id nhân viên' || h === 'nhân viên');
    const finalIIdNv = iIdNv !== -1 ? iIdNv : 11;

    const parseDateNX = (s) => {
        if (!s) return new Date(0);
        if (s.includes('/')) { const p = s.split('/'); return new Date(+p[2], +p[1] - 1, +p[0]); }
        return new Date(s);
    };

    let totalThanhTien = 0;
    let filteredRows = nxDataRaw.slice(1).map((row, index) => {
        row._sheetRow = index + 2;
        return row;
    }).filter(row => {
        if (isNPP && iMaKH !== -1) {
            const rowMaKH = (row[iMaKH] || '').toString().trim();
            if (rowMaKH !== currentUser.id) return false;
        }
        if (isNVKD) {
            const rowIdNv = (row[finalIIdNv] || '').toString().trim();
            if (rowIdNv !== currentUser.id) return false;
        }
        const mdh = (row[3] || '').toString().toLowerCase();
        const khach = (row[5] || '').toString().toLowerCase();
        const idsp = (row[6] || '').toString().toLowerCase();
        const tensp = (row[7] || '').toString().toLowerCase();
        const truong = (row[2] || '').toString();
        const rowDate = parseDateNX(row[1]);

        if (!mdh && !tensp) return false;

        const matchesSearch = !searchTerm || mdh.includes(searchTerm) || khach.includes(searchTerm);
        const combinedProductStr = `${idsp} - ${tensp}`;
        const matchesProduct = !productSearch || idsp.includes(productSearch) || tensp.includes(productSearch) || combinedProductStr.includes(productSearch);
        const matchesType = !typeFilter || truong === typeFilter;

        // Áp dụng hạn chế đặc biệt (Special Restrictions)
        if (currentUser && getHiddenProductIdsForUser(currentUser.id).includes(idsp.toUpperCase())) return false;

        // Date range filter
        let matchesDate = true;
        if (dateFrom) {
            const dFrom = new Date(dateFrom);
            dFrom.setHours(0, 0, 0, 0);
            if (rowDate < dFrom) matchesDate = false;
        }
        if (dateTo) {
            const dTo = new Date(dateTo);
            dTo.setHours(23, 59, 59, 999);
            if (rowDate > dTo) matchesDate = false;
        }

        const isMatch = matchesSearch && matchesProduct && matchesType && matchesDate;
        if (isMatch) {
            totalThanhTien += Number(row[10] || 0);
        }
        return isMatch;
    });

    // Sort by date descending
    filteredRows.sort((a, b) => parseDateNX(b[1]).getTime() - parseDateNX(a[1]).getTime());

    document.getElementById('nxCount').textContent = `${filteredRows.length} đơn hàng`;
    document.getElementById('nxTotalAmount').textContent = formatNum(totalThanhTien);

    if (filteredRows.length === 0) {
        tbody.innerHTML = '<tr><td colspan="12" class="px-4 py-10 text-center text-slate-400 text-sm">Không tìm thấy dữ liệu phù hợp.</td></tr>';
        renderPagination(0, 1, 'nxPagination', 'goNxPage');
        return;
    }

    // Pagination slice
    const totalItems = filteredRows.length;
    const pageRows = filteredRows.slice((nxCurrentPage - 1) * PAGE_SIZE, nxCurrentPage * PAGE_SIZE);

    if (!tbody) return;
    tbody.innerHTML = pageRows.map(row => {
        const ngay = row[1] || '';
        const truong = row[2] || '';
        const id = row[3] || '';
        const khach = row[5] || '';
        const idsp = row[6] || '';
        const tensp = row[7] || '';
        const slg = row[8] || 0;
        const dongia = row[9] || 0;
        const thanhTien = row[10] || 0;
        const nvc = row[11] || '';
        const canConfirmWarehouse = canCurrentUser('nx.confirmWarehouse') && isNXExportRow(row);
        const warehouseStatus = getWarehouseConfirmStatus(row);
        const nextWarehouseStatus = getWarehouseNextStatus(warehouseStatus);

        const typeClass = truong === 'NHẬP' ? 'bg-blue-50 text-blue-600' : (truong === 'XUẤT' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-700');

        return `
            <tr class="hover:bg-slate-50 transition-colors">
                <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${ngay}</td>
                <td class="px-4 py-3 text-center">
                    <span class="px-2 py-1 rounded-lg text-[10px] font-bold ${typeClass}">${truong}</span>
                </td>
                <td class="px-4 py-3 text-xs font-mono font-bold text-slate-500">${id}</td>
                <td class="px-4 py-3 text-xs text-slate-700 font-medium">${khach}</td>
                <td class="px-4 py-3 text-xs font-mono text-slate-400 font-bold">${idsp}</td>
                <td class="px-4 py-3 text-xs text-slate-600">${tensp}</td>
                <td class="px-4 py-3 text-xs text-right font-bold text-slate-700">${slg}</td>
                <td class="px-4 py-3 text-xs text-right text-slate-500">${formatNum(dongia)}</td>
                <td class="px-4 py-3 text-xs text-right font-bold text-emerald-600">${formatNum(thanhTien)}</td>
                <td class="px-4 py-3 text-xs text-slate-500">${nvc}</td>
                <td class="px-4 py-3 text-xs min-w-[190px]">${renderWarehouseStatusBadge(row)}</td>
                <td class="px-4 py-3 text-xs text-right">
                    ${canConfirmWarehouse ? `
                        <button type="button" onclick="confirmNXWarehouseRow(${row._sheetRow})"
                            class="px-3 py-1.5 rounded-lg bg-slate-900 text-white text-[11px] font-bold hover:bg-slate-700 transition">
                            ${nextWarehouseStatus}
                        </button>
                    ` : '<span class="text-slate-300">-</span>'}
                </td>
            </tr>
        `;
    }).join('');

    renderPagination(totalItems, nxCurrentPage, 'nxPagination', 'goNxPage');

    const mobileContainer = document.getElementById('nxMobileCards');
    if (mobileContainer) {
        mobileContainer.innerHTML = pageRows.map(row => {
            const trClass = row[2] === 'NHẬP' ? 'bg-blue-50 text-blue-600' : (row[2] === 'XUẤT' ? 'bg-orange-50 text-orange-600' : 'bg-slate-50 text-slate-700');
            return `
                <div class="mobile-card">
                    <div class="flex justify-between items-start mb-3 border-b border-slate-50 pb-2">
                        <div class="font-bold text-slate-800 text-sm">${row[3] || 'No ID'}</div>
                        <div class="text-[10px] font-bold px-2 py-0.5 rounded-full ${trClass}">${row[2]}</div>
                    </div>
                    <div class="space-y-2">
                        <div class="flex justify-between"><span class="mobile-card-label">Ngày</span><span class="mobile-card-value">${row[1] || ''}</span></div>
                        <div class="flex justify-between"><span class="mobile-card-label">Khách hàng</span><span class="mobile-card-value text-slate-900 font-medium">${row[5] || ''}</span></div>
                        <div class="flex justify-between"><span class="mobile-card-label">ID SP</span><span class="mobile-card-value font-mono font-bold text-slate-400">${row[6] || ''}</span></div>
                        <div class="flex justify-between"><span class="mobile-card-label">Sản phẩm</span><span class="mobile-card-value text-slate-600">${row[7] || ''}</span></div>
                        <div class="flex justify-between items-baseline"><span class="mobile-card-label">SL - Đơn giá</span><span class="mobile-card-value">${row[8]} x ${formatNum(row[9])}</span></div>
                        <div class="flex justify-between pt-1 border-t border-slate-50"><span class="mobile-card-label">Thành tiền</span><span class="text-sm font-bold text-emerald-600">${formatNum(row[10])}</span></div>
                        <div class="flex justify-between"><span class="mobile-card-label">Nhân viên</span><span class="mobile-card-value text-slate-400">${row[11] || ''}</span></div>
                        <div class="flex justify-between gap-3"><span class="mobile-card-label">Kho</span><span class="mobile-card-value text-right">${renderWarehouseStatusBadge(row)}</span></div>
                        ${canCurrentUser('nx.confirmWarehouse') && isNXExportRow(row) ? `
                            <button type="button" onclick="confirmNXWarehouseRow(${row._sheetRow})"
                                class="w-full mt-2 px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-700 transition">
                                ${getWarehouseNextStatus(getWarehouseConfirmStatus(row))}
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }
}

function goNxPage(page) {
    nxCurrentPage = page;
    applyFilters();
}

/**
 * Tải xuống dữ liệu Nhập xuất hiện tại (theo bộ lọc)
 */
function downloadNXExcel() {
    if (!nxDataRaw || nxDataRaw.length <= 1) {
        alert("Không có dữ liệu để tải xuống.");
        return;
    }

    // Lấy các giá trị lọc hiện tại
    const searchTerm = document.getElementById('nxSearchInput').value.toLowerCase().trim();
    const productSearch = document.getElementById('nxSearchProduct').value.toLowerCase().trim();
    const typeFilter = document.getElementById('nxTypeFilter').value;
    const dateFrom = document.getElementById('nxDateFrom').value;
    const dateTo = document.getElementById('nxDateTo').value;

    const isNPP = currentUser && resolveRoleKey(currentUser.role) === 'NPP';
    const isNVKD = currentUser && resolveRoleKey(currentUser.role) === 'NVKD';
    const nxHeaders = nxDataRaw[0] ? nxDataRaw[0].map(h => (h || '').toString().toLowerCase().trim()) : [];
    const iMaKH = nxHeaders.indexOf('ma_kh');
    const iIdNv = nxHeaders.findIndex(h => h === 'id_nv' || h === 'mã nv' || h === 'id nhân viên' || h === 'nhân viên');
    const finalIIdNv = iIdNv !== -1 ? iIdNv : 11;

    const parseDateNX = (s) => {
        if (!s) return new Date(0);
        if (s.includes('/')) { const p = s.split('/'); return new Date(+p[2], +p[1] - 1, +p[0]); }
        return new Date(s);
    };

    // Lọc dữ liệu (tương tự applyFilters)
    const filteredRows = nxDataRaw.slice(1).filter(row => {
        if (isNPP && iMaKH !== -1) {
            const rowMaKH = (row[iMaKH] || '').toString().trim();
            if (rowMaKH !== currentUser.id) return false;
        }
        if (isNVKD) {
            const rowIdNv = (row[finalIIdNv] || '').toString().trim();
            if (rowIdNv !== currentUser.id) return false;
        }

        const mdh = (row[3] || '').toString().toLowerCase();
        const khach = (row[5] || '').toString().toLowerCase();
        const idsp = (row[6] || '').toString().toLowerCase();
        const tensp = (row[7] || '').toString().toLowerCase();
        const truong = (row[2] || '').toString();
        const rowDate = parseDateNX(row[1]);

        if (!mdh && !tensp) return false;

        const matchesSearch = !searchTerm || mdh.includes(searchTerm) || khach.includes(searchTerm);
        const combinedProductStr = `${idsp} - ${tensp}`;
        const matchesProduct = !productSearch || idsp.includes(productSearch) || tensp.includes(productSearch) || combinedProductStr.includes(productSearch);
        const matchesType = !typeFilter || truong === typeFilter;

        if (currentUser && getHiddenProductIdsForUser(currentUser.id).includes(idsp.toUpperCase())) return false;

        let matchesDate = true;
        if (dateFrom) {
            const dFrom = new Date(dateFrom);
            dFrom.setHours(0, 0, 0, 0);
            if (rowDate < dFrom) matchesDate = false;
        }
        if (dateTo) {
            const dTo = new Date(dateTo);
            dTo.setHours(23, 59, 59, 999);
            if (rowDate > dTo) matchesDate = false;
        }

        return matchesSearch && matchesProduct && matchesType && matchesDate;
    });

    // Sắp xếp theo ngày giảm dần
    filteredRows.sort((a, b) => parseDateNX(b[1]).getTime() - parseDateNX(a[1]).getTime());

    if (filteredRows.length === 0) {
        alert("Không có dữ liệu phù hợp với bộ lọc để tải xuống.");
        return;
    }

    // Chuẩn bị dữ liệu cho file Excel
    const excelData = filteredRows.map(row => ({
        "Ngày": row[1] || "",
        "Loại": row[2] || "",
        "Mã đơn": row[3] || "",
        "Mã KH": row[4] || "",
        "Khách hàng": row[5] || "",
        "Mã SP": row[6] || "",
        "Tên sản phẩm": row[7] || "",
        "Số lượng": Number(row[8] || 0),
        "Đơn giá": Number(row[9] || 0),
        "Thành tiền": Number(row[10] || 0),
        "Nhân viên": row[11] || "",
        "SL kho xác nhận": row[NX_WAREHOUSE_CONFIRM.quantityCol] || "",
        "Trạng thái kho": row[NX_WAREHOUSE_CONFIRM.statusCol] || "",
        "Người xác nhận": row[NX_WAREHOUSE_CONFIRM.userCol] || "",
        "Thời gian xác nhận": row[NX_WAREHOUSE_CONFIRM.timeCol] || ""
    }));

    // Tạo workbook và sheet
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Tự động điều chỉnh độ rộng cột (tùy chọn)
    const wscols = [
        { wch: 12 }, // Ngày
        { wch: 8 },  // Loại
        { wch: 15 }, // Mã đơn
        { wch: 10 }, // Mã KH
        { wch: 20 }, // Khách hàng
        { wch: 12 }, // Mã SP
        { wch: 30 }, // Tên sản phẩm
        { wch: 10 }, // Số lượng
        { wch: 12 }, // Đơn giá
        { wch: 15 }, // Thành tiền
        { wch: 15 }, // Nhân viên
        { wch: 14 }, // SL kho xác nhận
        { wch: 18 }, // Trạng thái kho
        { wch: 16 }, // Người xác nhận
        { wch: 20 }  // Thời gian xác nhận
    ];
    worksheet['!cols'] = wscols;

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Chi tiết Nhập Xuất");

    // Xuất file
    const fileName = `Nhap_Xuat_Chi_Tiet_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(workbook, fileName);
}

// ─── Excel Upload Logic ────────────────────────────────────────
let currentUploadType = '';

function downloadNXUploadTemplate() {
    const rows = [
        ['FILE MẪU NHẬP XUẤT CHI TIẾT'],
        ['Giữ nguyên 3 dòng tiêu đề. Chọn đúng nút tải lên theo loại dữ liệu; chỉ cần điền các cột tương ứng.'],
        ['', 'Ngày', 'Mã đơn', '', '', 'Mã SP nhập / trả lại mua hàng', 'Tên SP nhập / trả lại mua hàng', 'Mã KH xuất / nhập trả', 'Khách hàng xuất / nhập trả', 'Mã SP xuất / nhập trả', 'Tên SP xuất / nhập trả', '', 'SL xuất / trả lại mua hàng', 'Đơn giá xuất / nhập trả', 'Thành tiền xuất', '', 'SL nhập trả', 'Thành tiền nhập trả'],
        ['', '30/05/2026', 'DON-MAU-001', '', '', 'SP-MAU-001', 'Sản phẩm mẫu', 'KH-MAU-001', 'Khách hàng mẫu', 'SP-MAU-001', 'Sản phẩm mẫu', '', 1, 100000, 100000, '', 1, 100000]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(rows);
    worksheet['!cols'] = [
        { wch: 4 }, { wch: 14 }, { wch: 18 }, { wch: 4 }, { wch: 4 }, { wch: 30 },
        { wch: 34 }, { wch: 24 }, { wch: 30 }, { wch: 28 }, { wch: 32 }, { wch: 4 },
        { wch: 28 }, { wch: 24 }, { wch: 20 }, { wch: 4 }, { wch: 18 }, { wch: 22 }
    ];
    worksheet['!merges'] = [
        XLSX.utils.decode_range('A1:R1'),
        XLSX.utils.decode_range('A2:R2')
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Mau nhap xuat');
    XLSX.writeFile(workbook, 'Mau_Nhap_Xuat_Chi_Tiet.xlsx');
}

function triggerUpload(type) {
    if (!canCurrentUser('nx.upload')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
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
    // Start from row 4 (index 3). Footer rows are skipped by quantity validation.
    for (let i = 3; i < rawRows.length; i++) {
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
        } else if (type === 'XUẤT') {
            // Export Mapping: H=7 (8th), I=8 (9th), J=9 (10th), K=10 (11th), M=12 (13th), N=13 (14th), O=14 (15th)
            mappedRow[4] = r[7] || "";   // Ma KH (Excel H)
            mappedRow[5] = r[8] || "";   // Ten KH (Excel I)
            mappedRow[6] = r[9] || "";   // ID SP (Excel J)
            mappedRow[7] = r[10] || "";  // Tên SP (Excel K)
            mappedRow[8] = r[12] || "";  // Số lượng (Excel M)
            mappedRow[9] = r[13] || "";  // Đơn giá (Excel N)
            mappedRow[10] = r[14] || ""; // Thành tiền (Excel O)
        } else if (type === 'HÀNG TRẢ LẠI' || type === 'XUẤT TRẢ') {
            // Return Mapping: B=1, C=2, F=5, G=6, J=9, M=12, N=13
            mappedRow[1] = r[1] || "";   // Ngay (Excel B)
            mappedRow[2] = "XUẤT";       // Ghi "XUẤT" thay vì XUẤT TRẢ
            mappedRow[3] = r[2] || "";   // Mã đơn (Excel C)
            mappedRow[6] = r[5] || "";   // ID SP (Excel F)
            mappedRow[7] = r[6] || "";   // Tên SP (Excel G)
            mappedRow[8] = r[12] || "";  // Số lượng (Excel M)
            mappedRow[9] = r[9] || "";    // Đơn giá (Excel J)
            mappedRow[10] = r[13] || ""; // Thành tiền (Excel N)
        } else if (type === 'NHẬP TRẢ') {
            // Return Mapping: B=1, C=2, H=7, I=8, J=9, K=10, Q=16, N=13, R=17
            mappedRow[1] = r[1] || "";   // Ngay (Excel B)
            mappedRow[2] = "NHẬP";       // Ghi "NHẬP" thay vì NHẬP TRẢ
            mappedRow[3] = r[2] || "";   // Mã đơn (Excel C)
            mappedRow[4] = r[7] || "";   // Ma KH (Excel H)
            mappedRow[5] = r[8] || "";   // Ten Khach (Excel I)
            mappedRow[6] = r[9] || "";   // ID SP (Excel J)
            mappedRow[7] = r[10] || "";  // Tên SP (Excel K)
            mappedRow[8] = r[16] || "";  // Số lượng (Excel Q)
            mappedRow[9] = r[13] || "";  // Đơn giá (Excel N)
            mappedRow[10] = r[17] || ""; // Thành tiền (Excel R)
        }

        // Kiểm tra số lượng (slg > 0)
        const slgVal = Number(mappedRow[8]);
        if (isNaN(slgVal) || slgVal <= 0) continue;

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
            return true;
        } else {
            const err = await resp.json();
            console.error("Upload Error:", err);
            alert("Lỗi khi tải lên Google Sheets. Vui lòng kiểm tra quyền truy cập.");
            return false;
        }
    } catch (err) {
        console.error("Fetch Error:", err);
        alert("Lỗi kết nối khi tải lên dữ liệu.");
        return false;
    }
}

async function openNXManualDrawer(targetModule = '') {
    if (!targetModule && (!nxDataRaw || nxDataRaw.length <= 1)) await fetchNXData();
    await Promise.all([
        fetchSimpleSheetModule('sanpham'),
        fetchSimpleSheetModule('sanphamkho'),
        fetchSimpleSheetModule('nhap'),
        fetchSimpleSheetModule('xuat')
    ]);

    const drawer = document.getElementById('nxManualDrawer');
    const overlay = document.getElementById('nxManualDrawerOverlay');
    if (!drawer || !overlay) return;

    nxManualEditContext = null;
    setNXManualTransferButtonVisible(false);
    simpleSheetManualModule = ['nhap', 'xuat'].includes(targetModule) ? targetModule : '';
    const typeSelect = document.getElementById('nxManualType');
    const title = document.getElementById('nxManualDrawerTitle');
    document.getElementById('nxManualDate').value = new Date().toISOString().slice(0, 10);
    typeSelect.value = targetModule === 'xuat' ? 'XUẤT' : 'NHẬP';
    typeSelect.disabled = !!simpleSheetManualModule;
    if (title) title.textContent = simpleSheetManualModule
        ? `Thêm ${simpleSheetManualModule === 'nhap' ? 'nhập' : 'xuất'} bằng tay`
        : 'Thêm nhập xuất bằng tay';
    document.getElementById('nxManualOrderId').value = '';
    document.getElementById('nxManualCustomer').value = '';
    document.getElementById('nxManualCustomerId').value = '';
    setWarehouseSelectValue('nxManualWarehouse', '');
    document.getElementById('nxManualRows').innerHTML = '';
    populateNXManualProductList();
    populateNXManualCustomers();
    populateNXManualEmployees();
    addNXManualProductRow();

    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

async function openDetailRowEditDrawer(moduleName, sheetRow) {
    if (!['nhap', 'xuat'].includes(moduleName) || !sheetRow) return;
    if (!canCurrentUser('nx.manualAdd')) return alert("Bạn không có quyền sửa dữ liệu.");
    await Promise.all([
        fetchSimpleSheetModule('sanpham'),
        fetchSimpleSheetModule('sanphamkho'),
        fetchSimpleSheetModule('nhap'),
        fetchSimpleSheetModule('xuat')
    ]);

    const moduleRows = getSimpleModuleData(moduleName) || [];
    const row = moduleRows[sheetRow - 1];
    if (!row) return alert("Không tìm thấy dòng cần sửa.");
    const mdh = (row[3] || '').toString().trim();
    const orderRows = moduleRows.slice(1)
        .map((detailRow, index) => ({ row: detailRow, sheetRow: index + 2 }))
        .filter(item => mdh
            ? (item.row[3] || '').toString().trim().toLowerCase() === mdh.toLowerCase()
            : item.sheetRow === sheetRow);
    nxManualEditContext = { moduleName, mdh };
    simpleSheetManualModule = moduleName;

    const drawer = document.getElementById('nxManualDrawer');
    const overlay = document.getElementById('nxManualDrawerOverlay');
    const typeSelect = document.getElementById('nxManualType');
    const title = document.getElementById('nxManualDrawerTitle');
    if (!drawer || !overlay || !typeSelect) return;

    if (title) title.textContent = `Sửa đơn ${moduleName === 'nhap' ? 'nhập' : 'xuất'}`;
    document.getElementById('nxManualDate').value = formatDateForInput(row[1] || '');
    typeSelect.value = moduleName === 'xuat' ? 'XUẤT' : 'NHẬP';
    typeSelect.disabled = true;
    document.getElementById('nxManualOrderId').value = row[3] || '';
    document.getElementById('nxManualCustomer').value = row[5] || '';
    document.getElementById('nxManualCustomerId').value = row[4] || '';
    setNXManualCommonWarehouse(orderRows.map(item => item.row));
    populateNXManualProductList();
    populateNXManualCustomers();
    populateNXManualEmployees();
    document.getElementById('nxManualEmployee').value = row[12] || '';
    document.getElementById('nxManualRows').innerHTML = '';
    orderRows.forEach(({ row: detailRow, sheetRow: detailSheetRow }) => addNXManualProductRow({
        detailId: detailRow[0] || '',
        sheetRow: detailSheetRow,
        idSp: detailRow[6] || '',
        productName: detailRow[7] || '',
        kho: detailRow[11] || '',
        slg: detailRow[8] || 1,
        donGia: detailRow[9] || 0,
        thanhTien: detailRow[10] || 0,
        loaiHinh: detailRow[14] || 'Thường'
    }));
    setNXManualTransferButtonVisible(true);

    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

function closeNXManualDrawer() {
    const drawer = document.getElementById('nxManualDrawer');
    const overlay = document.getElementById('nxManualDrawerOverlay');
    if (!drawer || !overlay) return;
    simpleSheetManualModule = '';
    nxManualEditContext = null;
    setNXManualTransferButtonVisible(false);
    const typeSelect = document.getElementById('nxManualType');
    if (typeSelect) typeSelect.disabled = false;
    drawer.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
}

function setNXManualTransferButtonVisible(visible) {
    ['nxManualTransferBtn', 'nxManualDeleteBtn'].forEach(id => {
        const button = document.getElementById(id);
        if (button) button.classList.toggle('hidden', !visible);
    });
}

function populateNXManualProductList() {
    const list = document.getElementById('nxManualProductList');
    if (!list) return;
    list.innerHTML = getProductCatalog()
        .map(p => `<option value="${escAttr(p.id)} - ${escAttr(p.name)}"></option>`)
        .join('');
}

function getNXManualCustomers() {
    return (usersData || []).filter(user => user.id && isCustomerDirectoryUser(user));
}

function populateNXManualCustomers() {
    const list = document.getElementById('nxManualCustomerList');
    if (!list) return;
    list.innerHTML = simpleSheetManualModule === 'xuat'
        ? getNXManualCustomers()
            .map(customer => `<option value="${escAttr(customer.id)} - ${escAttr(customer.name)}">${escAttr(customer.type)}</option>`)
            .join('')
        : '';
}

function resolveNXManualCustomer(value) {
    const text = (value || '').toString().trim();
    const normalized = text.toLowerCase();
    return getNXManualCustomers().find(customer => {
        const id = (customer.id || '').toString().trim();
        const name = (customer.name || '').toString().trim();
        return normalized === id.toLowerCase()
            || normalized === name.toLowerCase()
            || normalized === `${id} - ${name}`.toLowerCase();
    }) || null;
}

function updateNXManualCustomer(value) {
    const hiddenId = document.getElementById('nxManualCustomerId');
    if (!hiddenId) return;
    const customer = resolveNXManualCustomer(value);
    hiddenId.value = customer ? customer.id : '';
}

function selectNXManualCustomer(value) {
    const customer = resolveNXManualCustomer(value);
    if (!customer) return;
    document.getElementById('nxManualCustomerId').value = customer.id;
    document.getElementById('nxManualCustomer').value = customer.name || customer.id;
}

function populateWarehouseProductFilterList() {
    const list = document.getElementById('sanphamkhoProductList');
    if (!list) return;
    list.innerHTML = getProductCatalog()
        .map(p => `<option value="${escAttr(p.id)} - ${escAttr(p.name)}"></option>`)
        .join('');
}

function populateNXManualEmployees() {
    const select = document.getElementById('nxManualEmployee');
    if (!select) return;
    select.innerHTML = '<option value="">Chọn nhân viên...</option>' + (usersData || [])
        .filter(u => u.id)
        .map(u => `<option value="${escAttr(u.id)}">${escAttr(u.id)}${u.name ? ` - ${escAttr(u.name)}` : ''}</option>`)
        .join('');
    select.value = '';
}

function formatDateDDMMYYYY(value) {
    if (!value) return '';
    const text = value.toString();
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) return text;
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
        const [y, m, d] = text.split('-');
        return `${d}/${m}/${y}`;
    }
    return text;
}

function formatDateForInput(value) {
    const text = (value || '').toString().trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
        const [day, month, year] = text.split('/');
        return `${year}-${month}-${day}`;
    }
    return text;
}

function normalizeOrderLoaiHinh(value) {
    const text = (value || '').toString().trim();
    const normalized = text.toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    return normalized === 'BH' ? 'BH' : 'Thường';
}

function selectNXManualRowLoaiHinh(button, value) {
    setNXManualRowLoaiHinh(button.closest('.nx-manual-row'), value);
}

function setNXManualRowLoaiHinh(row, value) {
    if (!row) return;
    const normalized = normalizeOrderLoaiHinh(value);
    const input = row.querySelector('[data-field="loaiHinh"]');
    if (input) input.value = normalized;
    row.querySelectorAll('[data-loai-hinh]').forEach(button => {
        const active = normalizeOrderLoaiHinh(button.dataset.loaiHinh) === normalized;
        button.classList.toggle('bg-blue-600', active);
        button.classList.toggle('text-white', active);
        button.classList.toggle('border-blue-600', active);
        button.classList.toggle('bg-white', !active);
        button.classList.toggle('text-slate-500', !active);
        button.classList.toggle('border-slate-200', !active);
    });
}

function getWarehouseProductCurrentStock(kho, idSp) {
    const warehouse = (kho || '').toString().trim();
    const productId = (idSp || '').toString().trim();
    if (!warehouse || !productId) return 0;
    const productRow = (warehouseProductDataRaw || []).slice(1).find(row => {
        return (row[1] || '').toString().trim().toLowerCase() === warehouse.toLowerCase()
            && (row[2] || '').toString().trim().toLowerCase() === productId.toLowerCase();
    });
    const movement = getWarehouseMovementTotals().get(`${warehouse}|${productId}`.toLowerCase()) || { nhap: 0, xuat: 0, nhapCk: 0, xuatCk: 0 };
    return cleanNumber(productRow && productRow[4]) + movement.nhap - movement.xuat + movement.nhapCk - movement.xuatCk;
}

function updateNXManualStock(row) {
    if (!row) return;
    const idSp = parseProductIdInput(row.querySelector('[data-field="idSp"]').value);
    const kho = row.querySelector('[data-field="kho"]').value;
    row.querySelector('[data-field="tonKho"]').value = getWarehouseProductCurrentStock(kho, idSp);
}

function updateNXManualWarehouseRow(select) {
    updateNXManualStock(select.closest('.nx-manual-row'));
}

function updateNXManualCommonWarehouseButtons() {
    const selected = document.getElementById('nxManualWarehouse')?.value || '';
    document.querySelectorAll('#nxManualWarehouseButtons [data-warehouse]').forEach(button => {
        const active = button.dataset.warehouse === selected;
        button.classList.toggle('bg-blue-600', active);
        button.classList.toggle('border-blue-600', active);
        button.classList.toggle('text-white', active);
        button.classList.toggle('bg-white', !active);
        button.classList.toggle('border-slate-200', !active);
        button.classList.toggle('text-slate-500', !active);
    });
}

function selectNXManualCommonWarehouse(kho) {
    setWarehouseSelectValue('nxManualWarehouse', kho);
    applyNXManualWarehouseToAll(kho);
}

function applyNXManualWarehouseToAll(kho) {
    document.querySelectorAll('#nxManualRows .nx-manual-row').forEach(row => {
        row.querySelector('[data-field="kho"]').value = isAllowedWarehouse(kho) ? kho : '';
        updateNXManualStock(row);
    });
}

function setNXManualCommonWarehouse(rows) {
    const warehouses = [...new Set((rows || [])
        .map(row => (row[11] || '').toString().trim())
        .filter(isAllowedWarehouse))];
    setWarehouseSelectValue('nxManualWarehouse', warehouses.length === 1 ? warehouses[0] : '');
}

async function generateNXManualOrderId() {
    const selectedType = document.getElementById('nxManualType')?.value || '';
    const moduleName = ['nhap', 'xuat'].includes(simpleSheetManualModule)
        ? simpleSheetManualModule
        : (selectedType === 'XUẤT' ? 'xuat' : 'nhap');
    await fetchSimpleSheetModule(moduleName);
    const existingIds = new Set((getSimpleModuleData(moduleName) || []).slice(1)
        .map(row => (row[3] || '').toString().trim().toUpperCase())
        .filter(Boolean));
    const characters = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let orderId = '';
    do {
        orderId = Array.from({ length: 8 }, () => characters[Math.floor(Math.random() * characters.length)]).join('');
    } while (existingIds.has(orderId));
    document.getElementById('nxManualOrderId').value = orderId;
}

function addNXManualProductRow(data = {}) {
    const wrap = document.getElementById('nxManualRows');
    if (!wrap) return;
    const rowId = `nxm_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const row = document.createElement('tr');
    row.className = 'nx-manual-row hover:bg-slate-50/80 transition-colors';
    row.dataset.rowId = rowId;
    row.dataset.detailId = data.detailId || '';
    row.dataset.sheetRow = data.sheetRow || '';
    row.innerHTML = `
        <td class="px-3 py-2 align-middle">
            <input type="text" list="nxManualProductList" data-field="idSp" oninput="updateNXManualProductRow(this)"
                placeholder="Nhập mã SP..."
                class="w-full min-w-[180px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        </td>
        <td class="px-3 py-2 align-middle">
            <input type="text" data-field="tenSp" readonly
                class="w-full min-w-[260px] px-3 py-2 border border-slate-100 rounded-lg text-sm bg-slate-50 text-slate-500 cursor-not-allowed">
        </td>
        <td class="px-3 py-2 align-middle">
            <select data-field="kho" onchange="updateNXManualWarehouseRow(this)"
                class="w-full min-w-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
                <option value="">Chọn kho...</option>
                ${WAREHOUSE_OPTIONS.map(kho => `<option value="${escAttr(kho)}">${escAttr(kho)}</option>`).join('')}
            </select>
        </td>
        <td class="px-3 py-2 align-middle">
            <input type="number" data-field="slg" value="1" min="0" oninput="updateNXManualAmount(this)"
                class="w-full min-w-[90px] px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        </td>
        <td class="px-3 py-2 align-middle">
            <input type="number" data-field="tonKho" value="0" readonly
                class="w-full min-w-[100px] px-3 py-2 border border-slate-100 rounded-lg text-sm text-right bg-slate-50 text-slate-500 cursor-not-allowed">
        </td>
        <td class="px-3 py-2 align-middle">
            <input type="hidden" data-field="loaiHinh" value="Thường">
            <div class="flex items-center justify-center gap-2 min-w-[150px]">
                <button type="button" data-loai-hinh="Thường" onclick="selectNXManualRowLoaiHinh(this, 'Thường')"
                    class="px-3 py-2 rounded-lg border border-blue-600 bg-blue-600 text-white text-xs font-bold hover:border-blue-500 transition">Thường</button>
                <button type="button" data-loai-hinh="BH" onclick="selectNXManualRowLoaiHinh(this, 'BH')"
                    class="px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-500 text-xs font-bold hover:border-blue-400 hover:text-blue-600 transition">BH</button>
            </div>
        </td>
        <td class="hidden px-3 py-2 align-middle">
            <input type="number" data-field="donGia" value="0" min="0" oninput="updateNXManualAmount(this)"
                class="w-full min-w-[120px] px-3 py-2 border border-slate-200 rounded-lg text-sm text-right focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white">
        </td>
        <td class="hidden px-3 py-2 align-middle">
            <input type="number" data-field="thanhTien" value="0" readonly
                class="w-full min-w-[130px] px-3 py-2 border border-slate-100 rounded-lg text-sm text-right bg-slate-50 text-slate-500 cursor-not-allowed">
        </td>
        <td class="px-3 py-2 align-middle text-center">
            <button type="button" onclick="removeNXManualProductRow(this)"
                class="h-9 w-9 rounded-lg text-red-500 hover:bg-red-50 transition inline-flex items-center justify-center" title="Xóa dòng">
                <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
            </button>
        </td>
    `;
    wrap.appendChild(row);
    row.querySelector('[data-field="idSp"]').value = data.idSp || '';
    row.querySelector('[data-field="tenSp"]').value = data.productName || '';
    const defaultWarehouse = data.kho || document.getElementById('nxManualWarehouse')?.value || '';
    row.querySelector('[data-field="kho"]').value = isAllowedWarehouse(defaultWarehouse) ? defaultWarehouse : '';
    row.querySelector('[data-field="slg"]').value = data.slg ?? 1;
    row.querySelector('[data-field="donGia"]').value = data.donGia ?? 0;
    row.querySelector('[data-field="thanhTien"]').value = data.thanhTien ?? 0;
    setNXManualRowLoaiHinh(row, data.loaiHinh || 'Thường');
    updateNXManualStock(row);
}

function removeNXManualProductRow(btn) {
    const rows = document.querySelectorAll('#nxManualRows .nx-manual-row');
    if (rows.length <= 1) {
        const row = btn.closest('.nx-manual-row');
        row.querySelectorAll('input').forEach(input => {
            input.value = input.dataset.field === 'slg' ? '1' : (['donGia', 'thanhTien', 'tonKho'].includes(input.dataset.field) ? '0' : '');
        });
        row.querySelector('[data-field="kho"]').value = '';
        setNXManualRowLoaiHinh(row, 'Thường');
        return;
    }
    btn.closest('.nx-manual-row')?.remove();
}

function parseProductIdInput(value) {
    const text = (value || '').toString().trim();
    if (!text) return '';
    const normalized = text.toLowerCase();
    const matched = getProductCatalog()
        .filter(product => {
            const id = (product.id || '').toString().trim().toLowerCase();
            return id && (normalized === id || normalized.startsWith(`${id} - `));
        })
        .sort((a, b) => b.id.length - a.id.length)[0];
    return matched ? matched.id : text;
}

function updateNXManualProductRow(input) {
    const row = input.closest('.nx-manual-row');
    if (!row) return;
    const idSp = parseProductIdInput(input.value);
    const product = getProductCatalog().find(p => p.id === idSp);
    row.querySelector('[data-field="tenSp"]').value = product ? product.name : '';
    updateNXManualStock(row);
}

function updateNXManualAmount(input) {
    const row = input.closest('.nx-manual-row');
    if (!row) return;
    const slg = cleanNumber(row.querySelector('[data-field="slg"]').value);
    const donGia = cleanNumber(row.querySelector('[data-field="donGia"]').value);
    row.querySelector('[data-field="thanhTien"]').value = slg * donGia;
}

async function prefillNXManualOrderIfExists() {
    if (!simpleSheetManualModule || nxManualEditContext) return;
    const mdh = document.getElementById('nxManualOrderId').value.trim();
    if (!mdh) return;
    if (!getSimpleModuleData(simpleSheetManualModule).length) await fetchSimpleSheetModule(simpleSheetManualModule);

    const rows = (getSimpleModuleData(simpleSheetManualModule) || []).slice(1)
        .map((row, index) => ({ row, sheetRow: index + 2 }))
        .filter(item => (item.row[3] || '').toString().trim().toLowerCase() === mdh.toLowerCase());
    if (!rows.length) return;

    const first = rows[0].row;
    document.getElementById('nxManualDate').value = formatDateForInput(first[1] || '');
    document.getElementById('nxManualCustomer').value = first[5] || '';
    document.getElementById('nxManualCustomerId').value = first[4] || '';
    document.getElementById('nxManualEmployee').value = first[12] || '';
    setNXManualCommonWarehouse(rows.map(item => item.row));
    const wrap = document.getElementById('nxManualRows');
    wrap.innerHTML = '';
    rows.forEach(({ row, sheetRow }) => addNXManualProductRow({
        detailId: row[0] || '',
        sheetRow,
        idSp: row[6] || '',
        productName: row[7] || '',
        kho: row[11] || '',
        slg: row[8] || 1,
        donGia: row[9] || 0,
        thanhTien: row[10] || 0,
        loaiHinh: row[14] || 'Thường'
    }));
    setNXManualTransferButtonVisible(true);
}

async function transferNXManualOrder() {
    if (!canCurrentUser('nx.manualAdd')) return alert("Bạn không có quyền thực hiện thao tác này.");
    const sourceModule = simpleSheetManualModule;
    if (!['nhap', 'xuat'].includes(sourceModule)) return alert("Vui lòng mở chi tiết một đơn nhập hoặc xuất.");

    const mdh = document.getElementById('nxManualOrderId').value.trim();
    if (!mdh) return alert("Đơn hàng chưa có Mã đơn.");

    await fetchSimpleSheetModule(sourceModule);
    const sourceRows = (getSimpleModuleData(sourceModule) || []).slice(1)
        .filter(row => (row[3] || '').toString().trim().toLowerCase() === mdh.toLowerCase());
    if (!sourceRows.length) return alert("Không tìm thấy dữ liệu của đơn hàng.");

    const targetModule = sourceModule === 'xuat' ? 'nhap' : 'xuat';
    const sourceLabel = sourceModule === 'xuat' ? 'xuất' : 'nhập';
    const targetLabel = targetModule === 'nhap' ? 'nhập' : 'xuất';
    if (!confirm(`Tạo phiếu ${targetLabel} từ ${sourceRows.length} dòng của đơn ${mdh}? Bạn sẽ chọn lại kho cho từng sản phẩm trước khi lưu.`)) return;

    nxManualEditContext = null;
    simpleSheetManualModule = targetModule;
    document.getElementById('nxManualType').value = targetModule === 'nhap' ? 'NHẬP' : 'XUẤT';
    document.getElementById('nxManualType').disabled = true;
    document.getElementById('nxManualDrawerTitle').textContent = `Chuyển kho: tạo phiếu ${targetLabel}`;
    document.getElementById('nxManualEmployee').value = currentUser ? currentUser.id : '';
    setWarehouseSelectValue('nxManualWarehouse', '');
    document.getElementById('nxManualRows').innerHTML = '';
    sourceRows.forEach(row => addNXManualProductRow({
        idSp: row[6] || '',
        productName: row[7] || getProductNameById(row[6] || ''),
        kho: '',
        slg: row[8] || 1,
        donGia: row[9] || 0,
        thanhTien: row[10] || 0,
        loaiHinh: row[14] || 'Thường'
    }));
    populateNXManualCustomers();
    setNXManualTransferButtonVisible(false);
    alert(`Đã nạp đủ ${sourceRows.length} dòng từ danh sách ${sourceLabel}. Chọn kho cho từng sản phẩm hoặc chọn kho áp dụng cho tất cả SP, sau đó bấm Lưu nhập xuất.`);
}

async function deleteNXManualOrder() {
    if (!canCurrentUser('nx.manualAdd')) return alert("Bạn không có quyền thực hiện thao tác này.");
    const moduleName = simpleSheetManualModule;
    if (!['nhap', 'xuat'].includes(moduleName)) return alert("Vui lòng mở chi tiết một đơn đã tồn tại.");

    const mdh = document.getElementById('nxManualOrderId').value.trim();
    if (!mdh) return alert("Đơn hàng chưa có Mã đơn.");
    await fetchSimpleSheetModule(moduleName);
    const sheetRows = (getSimpleModuleData(moduleName) || []).slice(1)
        .map((row, index) => ({ row, sheetRow: index + 2 }))
        .filter(item => (item.row[3] || '').toString().trim().toLowerCase() === mdh.toLowerCase())
        .map(item => item.sheetRow);
    if (!sheetRows.length) return alert("Không tìm thấy dữ liệu của đơn hàng.");

    const moduleLabel = moduleName === 'nhap' ? 'nhập' : 'xuất';
    if (!confirm(`Xóa toàn bộ đơn ${moduleLabel} ${mdh} gồm ${sheetRows.length} dòng? Thao tác này không thể hoàn tác.`)) return;

    const button = document.getElementById('nxManualDeleteBtn');
    if (button) {
        button.disabled = true;
        button.innerHTML = '<div class="spinner !w-4 !h-4 !border-white/20 !border-l-white !m-0"></div> <span>Đang xóa...</span>';
    }
    try {
        const config = getWritableSimpleModule(moduleName);
        const token = await getAccessToken();
        const metadataUrl = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}?fields=sheets.properties(sheetId,title)`;
        const metadataResponse = await fetch(metadataUrl, {
            headers: { "Authorization": `Bearer ${token}` }
        });
        if (!metadataResponse.ok) throw new Error(`HTTP ${metadataResponse.status}`);
        const metadata = await metadataResponse.json();
        const sheet = (metadata.sheets || []).find(item => item.properties?.title === config.sheetName());
        if (!sheet) throw new Error(`Sheet not found: ${config.sheetName()}`);

        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}:batchUpdate`;
        const requests = [...sheetRows]
            .sort((a, b) => b - a)
            .map(sheetRow => ({
                deleteDimension: {
                    range: {
                        sheetId: sheet.properties.sheetId,
                        dimension: 'ROWS',
                        startIndex: sheetRow - 1,
                        endIndex: sheetRow
                    }
                }
            }));
        const response = await fetch(url, {
            method: 'POST',
            headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
            body: JSON.stringify({ requests })
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        await fetchSimpleSheetModule(moduleName);
        await renderSimpleSheetModule(moduleName);
        closeNXManualDrawer();
        alert(`Đã xóa đơn ${moduleLabel} ${mdh}.`);
    } catch (error) {
        console.error("Delete order error:", error);
        alert("Không thể xóa đơn hàng. Vui lòng thử lại.");
    } finally {
        if (button) {
            button.disabled = false;
            button.innerHTML = '<span>Xóa đơn</span>';
        }
    }
}

async function saveNXManual() {
    if (!canCurrentUser('nx.manualAdd')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
    const ngay = formatDateDDMMYYYY(document.getElementById('nxManualDate').value);
    const truong = document.getElementById('nxManualType').value;
    const maDon = document.getElementById('nxManualOrderId').value.trim();
    const customerText = document.getElementById('nxManualCustomer').value.trim();
    const customer = customerText ? resolveNXManualCustomer(customerText) : null;
    const maKh = customerText ? (document.getElementById('nxManualCustomerId').value.trim() || (customer ? customer.id : '')) : '';
    const khach = customerText ? (customer ? (customer.name || customer.id) : customerText) : '';
    const nhanVien = '';
    const btn = document.getElementById('nxManualSaveBtn');

    if (!ngay || !truong || !maDon) return alert("Vui lòng nhập Ngày, Trường và Mã đơn.");
    const detailRows = Array.from(document.querySelectorAll('#nxManualRows .nx-manual-row')).map(row => {
        const idSp = parseProductIdInput(row.querySelector('[data-field="idSp"]').value);
        const productName = row.querySelector('[data-field="tenSp"]').value.trim() || getProductNameById(idSp);
        const kho = row.querySelector('[data-field="kho"]').value.trim();
        const slg = cleanNumber(row.querySelector('[data-field="slg"]').value);
        const donGia = cleanNumber(row.querySelector('[data-field="donGia"]').value);
        const thanhTien = slg * donGia;
        const loaiHinh = normalizeOrderLoaiHinh(row.querySelector('[data-field="loaiHinh"]')?.value);
        if (!idSp || slg <= 0) return null;

        return {
            detailId: row.dataset.detailId || '',
            sheetRow: Number(row.dataset.sheetRow || 0),
            idSp,
            productName,
            kho,
            slg,
            donGia,
            thanhTien,
            loaiHinh
        };
    }).filter(Boolean);

    if (detailRows.length === 0) return alert("Vui lòng nhập ít nhất 1 sản phẩm có số lượng lớn hơn 0.");
    if (detailRows.some(item => !isAllowedWarehouse(item.kho))) return alert("Vui lòng chọn Kho từ KHO 1 đến KHO 5 cho từng sản phẩm.");

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner !w-4 !h-4 !border-white/20 !border-l-white !m-0"></div> <span>Đang lưu...</span>';
    try {
        let ok;
        if (simpleSheetManualModule) {
            const rows = detailRows.map((item, index) => [
                item.detailId || `${Date.now()}-${index + 1}`,
                ngay,
                truong,
                maDon,
                maKh,
                khach,
                item.idSp,
                item.productName,
                item.slg,
                item.donGia,
                item.thanhTien,
                item.kho,
                nhanVien,
                '',
                item.loaiHinh
            ]);
            if (nxManualEditContext) {
                const updates = [];
                const rowsToUpsert = [];
                rows.forEach((row, index) => {
                    const sheetRow = detailRows[index].sheetRow;
                    if (sheetRow) updates.push(updateDetailSheetRow(simpleSheetManualModule, sheetRow, row));
                    else rowsToUpsert.push(row);
                });
                await Promise.all(updates);
                if (rowsToUpsert.length) await upsertDetailRows(simpleSheetManualModule, rowsToUpsert);
                await ensureWarehouseProductsFromDetailRows(rows);
                await fetchSimpleSheetModule(simpleSheetManualModule);
                await renderSimpleSheetModule(simpleSheetManualModule);
                ok = true;
            } else {
                ok = await upsertDetailRows(simpleSheetManualModule, rows);
            }
        } else {
            const rows = detailRows.map(item => {
                const mappedRow = new Array(13).fill("");
                mappedRow[1] = ngay;
                mappedRow[2] = truong;
                mappedRow[3] = maDon;
                mappedRow[4] = maKh;
                mappedRow[5] = khach;
                mappedRow[6] = item.idSp;
                mappedRow[7] = item.productName;
                mappedRow[8] = item.slg;
                mappedRow[9] = item.donGia;
                mappedRow[10] = item.thanhTien;
                mappedRow[11] = nhanVien;
                return mappedRow;
            });
            ok = await appendNXData(rows);
        }
        if (ok) closeNXManualDrawer();
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Lưu nhập xuất</span>';
    }
}

// ─── Module: Kiểm Kho ─────────────────────────────────────────
async function fetchKiemKhoData() {
    try {
        const token = await getAccessToken();
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.kiemKhoSheetName}!A1:H50000`;
        const resp = await fetch(url, { headers: { "Authorization": `Bearer ${token}` } });
        if (!resp.ok) {
            const errData = await resp.json();
            console.error("Kiem Kho API Error:", errData);
            kiemKhoDataRaw = [];
            return [];
        }
        const data = await resp.json();
        kiemKhoDataRaw = data.values || [];
        localStorage.setItem('erp_kk_cache', JSON.stringify(kiemKhoDataRaw));
        return kiemKhoDataRaw;
    } catch (err) {
        console.error("Kiem Kho Data Fetch Error:", err);
        kiemKhoDataRaw = [];
        return [];
    }
}

function getProductCatalog() {
    if (productDataRaw && productDataRaw.length > 1) {
        return productDataRaw.slice(1).map(row => ({
            id: (row[0] || '').toString().trim(),
            name: (row[1] || '').toString().trim()
        })).filter(p => p.id);
    }
    const products = new Map();
    (nxDataRaw || []).slice(1).forEach(row => {
        const id = (row[6] || '').toString().trim();
        const name = (row[7] || '').toString().trim();
        if (id && !products.has(id)) products.set(id, { id, name });
    });
    return Array.from(products.values());
}

function getProductNameById(idSp) {
    const id = (idSp || '').toString().trim();
    if (!id) return '';
    const product = getProductCatalog().find(p => p.id === id);
    return product ? product.name : '';
}

function setOrderImageStatus(message, isError = false) {
    const status = document.getElementById('orderImageStatus');
    if (!status) return;
    status.textContent = message || '';
    status.className = `text-xs ${isError ? 'text-red-600' : 'text-slate-500'}`;
}

function handleOrderImageFile(input) {
    const file = input.files && input.files[0];
    orderImageFile = file || null;
    orderImageRows = [];
    const preview = document.getElementById('orderImagePreview');
    const empty = document.getElementById('orderImageEmpty');
    const rawText = document.getElementById('orderImageRawText');
    if (rawText) rawText.value = '';
    if (preview) {
        if (file) {
            preview.src = URL.createObjectURL(file);
            preview.classList.remove('hidden');
        } else {
            preview.removeAttribute('src');
            preview.classList.add('hidden');
        }
    }
    if (empty) empty.classList.toggle('hidden', !!file);
    setOrderImageStatus(file ? `Đã chọn ảnh: ${file.name}` : 'Chưa chọn ảnh.');
    renderOrderImageRows();
}

function escapeRegExp(text) {
    return (text || '').toString().replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function inferOrderImageQuantity(line, productId) {
    const cleanLine = (line || '').toString().replace(new RegExp(escapeRegExp(productId), 'ig'), ' ');
    const values = (cleanLine.match(/\b\d{1,6}\b/g) || [])
        .map(value => cleanNumber(value))
        .filter(value => value > 0 && value <= 999);
    return values.length ? values[values.length - 1] : 1;
}

function extractOrderImageRows(text) {
    const lines = (text || '').split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const catalog = getProductCatalog().slice().sort((a, b) => b.id.length - a.id.length);
    const result = new Map();

    catalog.forEach(product => {
        const id = (product.id || '').toString().trim();
        if (!id) return;
        const matcher = new RegExp(escapeRegExp(id), 'i');
        const matchedLines = lines.filter(line => matcher.test(line));
        if (!matchedLines.length) return;
        const quantity = matchedLines.reduce((total, line) => total + inferOrderImageQuantity(line, id), 0);
        result.set(id.toLowerCase(), {
            id_sp: id,
            ten_sp: product.name || getProductNameById(id),
            slg: quantity || 1,
            lines: matchedLines
        });
    });

    return Array.from(result.values());
}

async function analyzeOrderImage() {
    if (!orderImageFile) return alert("Vui lòng chụp hoặc chọn ảnh đơn hàng.");
    if (!window.Tesseract) return alert("Chưa tải được thư viện OCR. Vui lòng kiểm tra kết nối mạng rồi tải lại trang.");
    if (!productDataRaw || productDataRaw.length <= 1) await fetchSimpleSheetModule('sanpham');
    if (!getProductCatalog().length) return alert("Chưa có dữ liệu DS_SP để dò ID SP.");

    const rawText = document.getElementById('orderImageRawText');
    try {
        setOrderImageStatus("Đang đọc ảnh OCR... 0%");
        const result = await Tesseract.recognize(orderImageFile, 'eng+vie', {
            logger: message => {
                if (message.status === 'recognizing text') {
                    setOrderImageStatus(`Đang đọc ảnh OCR... ${Math.round((message.progress || 0) * 100)}%`);
                }
            }
        });
        const text = result?.data?.text || '';
        if (rawText) rawText.value = text;
        orderImageRows = extractOrderImageRows(text);
        renderOrderImageRows();
        setOrderImageStatus(orderImageRows.length
            ? `Đọc xong. Tìm thấy ${orderImageRows.length} sản phẩm khớp DS_SP.`
            : "Đọc xong nhưng chưa dò được ID SP nào. Kiểm tra ảnh rõ hơn hoặc xem lại raw OCR.", !orderImageRows.length);
    } catch (err) {
        console.error("Order image OCR error:", err);
        setOrderImageStatus("Không thể đọc ảnh. Kiểm tra kết nối mạng hoặc thử ảnh rõ hơn.", true);
    }
}

function updateOrderImageRowQuantity(index, value) {
    if (!orderImageRows[index]) return;
    orderImageRows[index].slg = cleanNumber(value);
}

function renderOrderImageRows() {
    const tbody = document.getElementById('orderImageTableBody');
    const count = document.getElementById('orderImageResultCount');
    if (count) count.textContent = `${orderImageRows.length} sản phẩm`;
    if (!tbody) return;
    if (!orderImageRows.length) {
        tbody.innerHTML = '<tr><td colspan="5" class="px-4 py-10 text-center text-slate-400 text-sm">Chưa có dữ liệu.</td></tr>';
        return;
    }
    tbody.innerHTML = orderImageRows.map((row, index) => `
        <tr class="border-b border-slate-50 hover:bg-slate-50/70">
            <td class="px-3 py-2 font-semibold text-slate-700">${escAttr(row.id_sp)}</td>
            <td class="px-3 py-2 text-slate-700">${escAttr(row.ten_sp)}</td>
            <td class="px-3 py-2 text-right">
                <input type="number" min="0" value="${escAttr(row.slg)}" onchange="updateOrderImageRowQuantity(${index}, this.value)"
                    class="w-24 text-right px-2 py-1 border border-slate-200 rounded-lg">
            </td>
            <td class="px-3 py-2 text-right text-slate-500">${row.lines.length}</td>
            <td class="px-3 py-2 text-xs text-slate-500 max-w-[460px] truncate" title="${escAttr(row.lines.join(' | '))}">${escAttr(row.lines[0] || '')}</td>
        </tr>
    `).join('');
}

function downloadOrderImageRowsExcel() {
    if (!orderImageRows.length) return alert("Chưa có dữ liệu để tải Excel.");
    const rows = orderImageRows.map(row => ({
        id_sp: row.id_sp,
        slg: row.slg,
        ten_sp: row.ten_sp
    }));
    const worksheet = XLSX.utils.json_to_sheet(rows, { header: ['id_sp', 'slg', 'ten_sp'] });
    worksheet['!cols'] = [{ wch: 22 }, { wch: 10 }, { wch: 45 }];
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Anh_don_hang');
    XLSX.writeFile(workbook, `Anh_Don_Hang_${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function clearOrderImageModule() {
    orderImageFile = null;
    orderImageRows = [];
    const input = document.getElementById('orderImageInput');
    const preview = document.getElementById('orderImagePreview');
    const empty = document.getElementById('orderImageEmpty');
    const rawText = document.getElementById('orderImageRawText');
    if (input) input.value = '';
    if (preview) {
        preview.removeAttribute('src');
        preview.classList.add('hidden');
    }
    if (empty) empty.classList.remove('hidden');
    if (rawText) rawText.value = '';
    setOrderImageStatus('Chọn ảnh rõ chữ, đủ sáng, ID SP không bị che.');
    renderOrderImageRows();
}

function getCurrentStockByProductId(idSp) {
    if (warehouseProductDataRaw && warehouseProductDataRaw.length > 1) {
        const movementTotals = getWarehouseMovementTotals();
        return warehouseProductDataRaw.slice(1).reduce((total, row) => {
            if ((row[2] || '').toString().trim() !== idSp) return total;
            const key = `${(row[1] || '').toString().trim()}|${(row[2] || '').toString().trim()}`.toLowerCase();
            const movement = movementTotals.get(key) || { nhap: 0, xuat: 0, nhapCk: 0, xuatCk: 0 };
            return total + cleanNumber(row[4]) + movement.nhap - movement.xuat + movement.nhapCk - movement.xuatCk;
        }, 0);
    }
    return (nxDataRaw || []).slice(1).reduce((total, row) => {
        if ((row[6] || '').toString().trim() !== idSp) return total;
        const quantity = cleanNumber(row[8]);
        const type = normalizeTxType(row[2]);
        if (type === 'NHAP' || type === 'NHAP_TRA') return total + quantity;
        if (type === 'XUAT') return total - quantity;
        return total;
    }, 0);
}

function updateKiemKhoDatalists() {
    const locationList = document.getElementById('kkLocationList');
    const quickWrap = document.getElementById('kkLocationQuick');
    const locations = Array.from(new Set((kiemKhoDataRaw || []).slice(1)
        .map(row => (row[6] || '').toString().trim())
        .filter(Boolean))).reverse();

    if (locationList) {
        locationList.innerHTML = locations.map(v => `<option value="${escAttr(v)}"></option>`).join('');
    }
    if (quickWrap) {
        quickWrap.innerHTML = locations.slice(0, 8).map(v => `
            <button type="button" onclick="selectKiemKhoLocation('${jsArg(v)}')"
                class="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-600 text-[11px] font-semibold hover:bg-blue-50 hover:text-blue-600 transition">
                ${escAttr(v)}
            </button>
        `).join('');
    }
}

async function renderKiemKhoModule() {
    const tbody = document.getElementById('kiemKhoTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-10 text-center text-slate-400 text-sm">Đang tải dữ liệu...</td></tr>';
    await Promise.all([fetchKiemKhoData(), fetchNXData(), fetchReferenceData()]);
    updateKiemKhoDatalists();
    applyKiemKhoFilters();
}

function applyKiemKhoFilters(resetPage) {
    if (resetPage) kkCurrentPage = 1;
    const tbody = document.getElementById('kiemKhoTableBody');
    const mobileContainer = document.getElementById('kiemKhoMobileCards');
    const countEl = document.getElementById('kiemKhoCount');
    const searchTerm = (document.getElementById('kiemKhoSearchInput')?.value || '').toLowerCase().trim();

    if (!kiemKhoDataRaw || kiemKhoDataRaw.length <= 1) {
        if (countEl) countEl.textContent = '0 bản ghi';
        if (tbody) tbody.innerHTML = `<tr><td colspan="7" class="px-4 py-10 text-center text-slate-400 text-sm">Không có dữ liệu trong sheet "${CONFIG.kiemKhoSheetName}".</td></tr>`;
        if (mobileContainer) mobileContainer.innerHTML = '';
        renderPagination(0, 1, 'kkPagination', 'goKkPage');
        return;
    }

    const rows = kiemKhoDataRaw.slice(1).map((row, idx) => ({ row, sheetRow: idx + 2 })).filter(item => {
        const row = item.row;
        const text = `${row[1] || ''} ${row[2] || ''} ${row[6] || ''} ${row[7] || ''}`.toLowerCase();
        return (row[0] || row[2]) && (!searchTerm || text.includes(searchTerm));
    }).reverse();

    if (countEl) countEl.textContent = `${rows.length} bản ghi`;

    if (rows.length === 0) {
        if (tbody) tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-10 text-center text-slate-400 text-sm">Không tìm thấy bản ghi phù hợp.</td></tr>';
        if (mobileContainer) mobileContainer.innerHTML = '';
        renderPagination(0, 1, 'kkPagination', 'goKkPage');
        return;
    }

    const totalItems = rows.length;
    const pageRows = rows.slice((kkCurrentPage - 1) * PAGE_SIZE, kkCurrentPage * PAGE_SIZE);

    if (tbody) {
        tbody.innerHTML = pageRows.map(item => {
            const row = item.row;
            const productName = getProductNameById(row[2]);
            const slgTon = cleanNumber(row[3]);
            const thucTe = cleanNumber(row[4]);
            const lech = cleanNumber(row[5]);
            const lechClass = lech === 0 ? 'text-slate-500' : (lech > 0 ? 'text-emerald-600' : 'text-red-600');
            return `
                <tr ondblclick="openKiemKhoDrawer('${jsArg(row[0])}')" title="Double click để sửa" class="hover:bg-slate-50/80 transition-colors cursor-pointer">
                    <td class="px-4 py-3 text-xs text-slate-600 whitespace-nowrap">${escAttr(row[1])}</td>
                    <td class="px-4 py-3">
                        <div class="text-xs font-mono font-bold text-slate-500">${escAttr(row[2])}</div>
                        <div class="text-xs text-slate-600 mt-1 max-w-xs truncate">${escAttr(productName)}</div>
                    </td>
                    <td class="px-4 py-3 text-xs text-right text-slate-600">${formatNum(slgTon)}</td>
                    <td class="px-4 py-3 text-xs text-right font-bold text-blue-600">${formatNum(thucTe)}</td>
                    <td class="px-4 py-3 text-xs text-right font-bold ${lechClass}">${formatNum(lech)}</td>
                    <td class="px-4 py-3 text-xs text-slate-600">${escAttr(row[6])}</td>
                    <td class="px-4 py-3 text-xs text-slate-500 max-w-xs truncate">${escAttr(row[7])}</td>
                </tr>
            `;
        }).join('');
    }

    if (mobileContainer) {
        mobileContainer.innerHTML = pageRows.map(item => {
            const row = item.row;
            const productName = getProductNameById(row[2]);
            const lech = cleanNumber(row[5]);
            const lechClass = lech === 0 ? 'text-slate-500' : (lech > 0 ? 'text-emerald-600' : 'text-red-600');
            return `
                <div ondblclick="openKiemKhoDrawer('${jsArg(row[0])}')" title="Double click để sửa" class="mobile-card cursor-pointer">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="font-bold text-slate-800 text-sm">${escAttr(row[2])}</div>
                            ${productName ? `<div class="text-xs text-slate-600 mt-1 leading-snug">${escAttr(productName)}</div>` : ''}
                            <div class="text-[11px] text-slate-400">${escAttr(row[1])}</div>
                        </div>
                        <div class="text-[11px] font-bold ${lechClass}">${formatNum(lech)}</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2 text-[11px]">
                        <div class="bg-slate-50 p-2 rounded-lg"><div class="mobile-card-label">Tồn</div><div class="font-bold">${formatNum(row[3])}</div></div>
                        <div class="bg-blue-50 p-2 rounded-lg"><div class="mobile-card-label text-blue-600">Thực tế</div><div class="font-bold text-blue-600">${formatNum(row[4])}</div></div>
                        <div class="bg-slate-50 p-2 rounded-lg"><div class="mobile-card-label">Vị trí</div><div class="font-bold truncate">${escAttr(row[6])}</div></div>
                    </div>
                    ${row[7] ? `<div class="mt-3 text-xs text-slate-500">${escAttr(row[7])}</div>` : ''}
                </div>
            `;
        }).join('');
    }

    renderPagination(totalItems, kkCurrentPage, 'kkPagination', 'goKkPage');
}

function goKkPage(page) {
    kkCurrentPage = page;
    applyKiemKhoFilters();
}

function openKiemKhoDrawer(rowId = '') {
    if (!canCurrentUser(rowId ? 'kiemkho.edit' : 'kiemkho.add')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
    const drawer = document.getElementById('kkDrawer');
    const overlay = document.getElementById('kkDrawerOverlay');
    const title = document.getElementById('kkDrawerTitle');
    if (!drawer || !overlay) return;

    updateKiemKhoDatalists();
    document.getElementById('kkFormRowId').value = rowId;
    document.getElementById('kkFormDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('kkFormSpId').value = '';
    document.getElementById('kkFormTon').value = '0';
    document.getElementById('kkFormThucTe').value = '0';
    document.getElementById('kkFormLech').value = '0';
    document.getElementById('kkFormLocation').value = '';
    document.getElementById('kkFormNote').value = '';
    document.getElementById('kkSpDropdown').classList.add('hidden');

    if (rowId) {
        if (title) title.textContent = 'Sửa kiểm kho';
        const row = (kiemKhoDataRaw || []).find(r => r[0] == rowId);
        if (row) {
            document.getElementById('kkFormDate').value = normalizeDateInput(row[1]);
            document.getElementById('kkFormSpId').value = row[2] || '';
            document.getElementById('kkFormTon').value = cleanNumber(row[3]);
            document.getElementById('kkFormThucTe').value = cleanNumber(row[4]);
            document.getElementById('kkFormLech').value = cleanNumber(row[5]);
            document.getElementById('kkFormLocation').value = row[6] || '';
            document.getElementById('kkFormNote').value = row[7] || '';
        }
    } else if (title) {
        title.textContent = 'Thêm kiểm kho';
    }

    overlay.classList.remove('hidden');
    setTimeout(() => drawer.classList.remove('translate-x-full'), 10);
}

function closeKiemKhoDrawer() {
    const drawer = document.getElementById('kkDrawer');
    const overlay = document.getElementById('kkDrawerOverlay');
    if (!drawer || !overlay) return;
    drawer.classList.add('translate-x-full');
    setTimeout(() => overlay.classList.add('hidden'), 300);
    document.getElementById('kkSpDropdown')?.classList.add('hidden');
}

function normalizeDateInput(value) {
    if (!value) return new Date().toISOString().slice(0, 10);
    const text = value.toString();
    if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
    if (text.includes('/')) {
        const p = text.split('/');
        if (p.length === 3) return `${p[2].padStart(4, '20')}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
    }
    return new Date().toISOString().slice(0, 10);
}

function parseKiemKhoProductInput(value) {
    return parseProductIdInput(value);
}

function searchKiemKhoProducts(term) {
    const dropdown = document.getElementById('kkSpDropdown');
    if (!dropdown) return;
    const searchTerm = (term || '').toLowerCase().trim();

    const catalog = getProductCatalog();
    const matches = catalog.filter(p => {
        if (!searchTerm) return true;
        return `${p.id} - ${p.name}`.toLowerCase().includes(searchTerm);
    }).slice(0, 50);
    const exact = catalog.find(p => p.id.toLowerCase() === parseKiemKhoProductInput(term).toLowerCase());
    if (exact) fillKiemKhoProduct(exact.id, false);

    if (!matches.length) {
        dropdown.innerHTML = '<div class="px-4 py-3 text-xs text-slate-400 italic">Không tìm thấy sản phẩm</div>';
        dropdown.classList.remove('hidden');
        return;
    }

    dropdown.innerHTML = matches.map(p => `
        <div onclick="selectKiemKhoProduct('${jsArg(p.id)}')" class="px-4 py-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
            <div class="text-sm font-bold text-slate-700 truncate">${escAttr(p.id)} - ${escAttr(p.name)}</div>
        </div>
    `).join('');
    dropdown.classList.remove('hidden');
}

function selectKiemKhoProduct(id) {
    fillKiemKhoProduct(id, true);
    document.getElementById('kkSpDropdown')?.classList.add('hidden');
}

function fillKiemKhoProduct(id, showLabel) {
    const product = getProductCatalog().find(p => p.id === id);
    const stock = getCurrentStockByProductId(id);
    if (showLabel) document.getElementById('kkFormSpId').value = product ? `${product.id} - ${product.name}` : id;
    document.getElementById('kkFormTon').value = stock;
    document.getElementById('kkFormThucTe').value = stock;
    updateKiemKhoLech();
}

function selectKiemKhoLocation(location) {
    document.getElementById('kkFormLocation').value = location;
}

function stepKiemKhoThucTe(delta) {
    const input = document.getElementById('kkFormThucTe');
    input.value = cleanNumber(input.value) + delta;
    updateKiemKhoLech();
}

function updateKiemKhoLech() {
    const ton = cleanNumber(document.getElementById('kkFormTon').value);
    const thucTe = cleanNumber(document.getElementById('kkFormThucTe').value);
    document.getElementById('kkFormLech').value = thucTe - ton;
}

async function saveKiemKho() {
    const rowId = document.getElementById('kkFormRowId').value;
    if (!canCurrentUser(rowId ? 'kiemkho.edit' : 'kiemkho.add')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
    const ngay = document.getElementById('kkFormDate').value;
    const idSp = parseKiemKhoProductInput(document.getElementById('kkFormSpId').value);
    const slgTon = cleanNumber(document.getElementById('kkFormTon').value);
    const thucTe = cleanNumber(document.getElementById('kkFormThucTe').value);
    const slgLech = thucTe - slgTon;
    const viTri = document.getElementById('kkFormLocation').value.trim();
    const ghiChu = document.getElementById('kkFormNote').value.trim();
    const btn = document.getElementById('kkSaveBtn');

    if (!ngay || !idSp) return alert("Vui lòng nhập ngày và sản phẩm.");

    btn.disabled = true;
    btn.innerHTML = '<div class="spinner !w-4 !h-4 !border-white/20 !border-l-white !m-0"></div> <span>Đang lưu...</span>';

    try {
        const token = await getAccessToken();
        const sid = CONFIG.spreadsheetId;
        const sname = CONFIG.kiemKhoSheetName;
        const id = rowId || Date.now().toString();
        const values = [[id, ngay, idSp, slgTon, thucTe, slgLech, viTri, ghiChu]];

        if (rowId) {
            const index = kiemKhoDataRaw.findIndex(r => r[0] == rowId);
            if (index === -1) throw new Error("Không tìm thấy dòng để sửa");
            const range = `${sname}!A${index + 1}:H${index + 1}`;
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${range}?valueInputOption=RAW`, {
                method: 'PUT',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ values })
            });
        } else {
            await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${sid}/values/${sname}!A1:append?valueInputOption=RAW`, {
                method: 'POST',
                headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ values })
            });
        }

        closeKiemKhoDrawer();
        await renderKiemKhoModule();
    } catch (err) {
        alert("Lỗi khi lưu kiểm kho: " + err.message);
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<span>Lưu kiểm kho</span>';
    }
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
    await Promise.all([fetchGiuHangData(), fetchNXData(), fetchReferenceData()]);
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
    if (!canCurrentUser(ghId ? 'giuhang.edit' : 'giuhang.add')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
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

    const matches = getProductCatalog().filter(product => {
        const id = product.id.toLowerCase();
        const name = product.name.toLowerCase();
        const t = term.toLowerCase();
        return id.includes(t) || name.includes(t);
    }).slice(0, 10);

    if (matches.length > 0) {
        dropdown.innerHTML = matches.map(product => `
            <div onclick="selectProduct('${jsArg(product.id)}', '${jsArg(product.name)}')" class="px-4 py-3 hover:bg-blue-50 cursor-pointer border-b border-slate-50 last:border-0 transition-colors">
                <div class="text-sm font-bold text-slate-700">${escAttr(product.id)}</div>
                <div class="text-xs text-slate-400 truncate">${escAttr(product.name)}</div>
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

    let tamgiu = 0;
    if (giuHangDataRaw && giuHangDataRaw.length > 1) {
        giuHangDataRaw.slice(1).forEach(row => {
            if (row[3] == idSp) tamgiu += Number(row[5] || 0);
        });
    }

    display.value = formatNum(getCurrentStockByProductId(idSp) - tamgiu);
}

async function saveGiuHang() {
    const rowId = document.getElementById('ghFormRowId').value;
    if (!canCurrentUser(rowId ? 'giuhang.edit' : 'giuhang.add')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
    const idSp = document.getElementById('ghFormSpId').value.trim();
    const tenSp = document.getElementById('ghFormSpName').value.trim();
    const slg = document.getElementById('ghFormSlg').value.trim();
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
    if (!canCurrentUser('giuhang.delete')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
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
    if (!canCurrentUser('giuhang.clearAll')) {
        alert("Bạn không có quyền thực hiện thao tác này.");
        return;
    }
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
        else if (maKh || tenKh) customers.add(maKh || tenKh);

        const idNv = (r[iIdNv !== -1 ? iIdNv : 11] || '').toString().trim();
        const tenNv = (r[iNv !== -1 ? iNv : 12] || '').toString().trim();
        if (idNv && tenNv) employees.add(`${idNv} - ${tenNv}`);
        else if (idNv || tenNv) employees.add(idNv || tenNv);
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
    if (fFrom) fFrom.setHours(0, 0, 0, 0);
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
        const rTenNv = (r[iNv !== -1 ? iNv : 12] || '').toString().toLowerCase();

        if (fFrom && rDateObj < fFrom) return;
        if (fTo && rDateObj > fTo) return;

        // Robust Filter (Mã hoặc Tên)
        const checkMatch = (val, id, name) => {
            if (!val) return true;
            const v = val.toLowerCase();
            const i = (id || '').toString().toLowerCase();
            const n = (name || '').toString().toLowerCase();
            const matchI = i && (v.includes(i) || i.includes(v));
            const matchN = n && (v.includes(n) || n.includes(v));
            return matchI || matchN;
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

        const dateKey = `${rDateObj.getFullYear()}-${String(rDateObj.getMonth() + 1).padStart(2, '0')}-${String(rDateObj.getDate()).padStart(2, '0')}`;
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

    const topNhap = [...aggList].sort((a, b) => b.nhap - a.nhap).filter(i => i.nhap > 0);
    const topXuat = [...aggList].sort((a, b) => b.xuat - a.xuat).filter(i => i.xuat > 0);

    const populateSubTable = (tbodyId, data, isDate, key) => {
        const tb = document.getElementById(tbodyId);
        if (!tb) return;
        tb.innerHTML = data.map(item => `
            <tr class="hover:bg-slate-50 transition-colors">
                ${isDate ? `
                    <td class="py-2.5 text-slate-600 font-medium text-sm">${item.date}</td>
                    <td class="py-2.5 text-right font-bold text-slate-800 text-sm">${formatNum(item[key])}</td>
                ` : `
                    <td class="py-2.5 text-slate-400 font-mono text-[10px] uppercase">${item.id}</td>
                    <td class="py-2.5 text-slate-700 font-semibold text-sm truncate max-w-[150px]" title="${item.name}">${item.name}</td>
                    <td class="py-2.5 text-right font-bold text-slate-800 text-sm">${formatNum(item[key])}</td>
                `}
            </tr>
        `).join('');
    };

    populateSubTable('importTableBody', topNhap, false, 'nhap');
    populateSubTable('exportTableBody', topXuat, false, 'xuat');
    populateSubTable('dailyImportTableBody', dailyList.filter(d => d.nhap > 0).reverse(), true, 'nhap');
    populateSubTable('dailyExportTableBody', dailyList.filter(d => d.xuat > 0).reverse(), true, 'xuat');

}


// ─── App Init ────────────────────────────────────────────────
window.addEventListener('load', async () => {
    await loadPermissionsConfig();
    await fetchAuthData();
    const savedSession = localStorage.getItem('erp_user_session');
    if (savedSession) {
        try {
            if (!restoreSavedSession(savedSession)) throw new Error('Saved user is no longer available');
            updateUserProfileUI();
            document.getElementById('loginScreen').classList.add('hidden');
            document.getElementById('mainApp').classList.remove('hidden');
            switchModule(getDefaultModuleForCurrentUser());
            fetchReferenceData().catch(console.error);
        } catch (e) {
            clearUserSession();
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
});

// Open warehouse view for a specific product ID
function openProductWarehouseDetails(productId) {
    const filterInput = document.getElementById('sanphamkhoFilterIdSp');
    if (filterInput) filterInput.value = productId;
    // Switch to the warehouse module and apply filter
    switchModule('sanphamkho');
    // Force re‑render with filter applied
    renderSimpleSheetModule('sanphamkho', true, true);
}
