// ============================================================
// app.js - ERP System Logic
// ============================================================

// 2 commit 

// fjhh

const CONFIG = {
    spreadsheetId: "1qo4DMUGNd-D7n2hbrRiGIIkR24mArDoKZSeYjdkP8hQ",
    authSheetName: "DSNV",
    nxSheetName: "NX_CT",
    nhapSheetName: "NHAP_CT",
    expectedSheetName: "DU_KIEN_HANG_VE",
    xuatSheetName: "XUAT_CT",
    transferSheetName: "CHUYEN_KHO_CT",
    productSheetName: "DS_SP",
    warehouseProductSheetName: "DS_SP_KHO",
    reconciliationSheetName: "DOI_SOAT",
    giuHangSheetName: "GIU_HANG",
    kiemKhoSheetName: "KIEM_KHO",
    permissionsFile: "permissions.json",
    serviceAccountEmail: "lnk-773@cty-lnk-161.iam.gserviceaccount.com",
    privateKey: "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQDTg5BFj22QViBG\nTyE073/XFsN/Tu0qf9zHmCREpC0V8hMUIG1sh7BhcfEYMpoQy3PK1EKmcVFj33/f\nn8p1KI+4vGrFAJgXLPxlbNmfJA1S2Ru5rMZxamZPiQ+vfCSVbjlyfb019oaDTd55\nTYWxl8QjI7uv+bd8p2aJDCk6fMams96j82kjQG5GObrmDNINtNWXW9S7K32Yndjx\nOcoFe4VFICAau9y2phJFdw1Dh82fa2DMtnJttCeRN+wgQhoH0299XEoyJvGTzBTH\n1hJnwzKiiZHlLNMTAmzqlp+/YZa9kkqBhslKG+w3U0qS6gJA2Qh2yJQCEQYUk5OD\nqDrd2ZmBAgMBAAECggEAJIbhJJ4dE/LHrpSuPaPJnkW0W7kv3GnJ4R8tTjxS++n6\n8PwboYU6SM3CTsU4VYOpGsM2wmMp5Nc9UEtaTYrEbSj+wEg2u7PdX4+hcmnpsh/D\nubg0afQvuHcJQissbzDik1rTEO1is+y/6Y9hcfatXMsoN77meMy4+Jxkx1CyhqmT\ncOowEwASxDkSKN4472OSujg7ECkQY224FlafLbjU5nsRgF2EqfA4Z10e+FGQE6l0\n+E6mD135lUyk/Ug6zjizEdEmHC8+BBfsGJCIYizBFJZ7KjfF5VPbdWHBdw+m0qQr\nMIqfTrfiO7TVs8VqiFv3JEOYKSG6ZM7oAIii7xsGdQKBgQDxqLxd+NPbZFp0OKEU\nAOmNt2CjA/iEmCeNZ8Cjkkn6lWS6q8X9fdWEHAgWJPcnOZA4U3PrZSNFZzrJ9f+b\nVWS5/zynJgAY96YAQoOiTJjnJUlaMTNt+QkEtduFZKOwy1I4Ig9fFwQQBIrlE4rQ\nc39QaYm7Az9JLJAqVwScMYlAPQKBgQDgEN1NOKMUkEbOtLIWWnUWTzCtSChs4AvQ\nbhIivQAMQRcZ4ALtpf1RIJgqHyh2SA3ptGaujJDic61tfTeEUx1NEIFdisFpLIG6\nu88g0KMU/0hJd0yabg/Cgh464Sp2XTeiB3tDd7LwfdUMZFVameiSREAZW/feLbPO\nbmJ/3aFulQKBgCwSScgZiQmJ07U+XqH3SKC/wK/6GWiVFyGCum8aTsOUWzpv+Tux\npy7grdjcBPbyWIrtLUbQuw39NYt/gY4ilKwXEEirdXkYMP37I2aF8Zy2ABqivm5f\n7HUfdVlucSvc6LG0BHmjCOqi6XG9jqNVbPKNTMD+ZpxBtEkEdaLGpfFBAoGAE+bL\nkTlPmtr5vxBjpQKh1bpw62M2W/1Gb1vndnhtEamSYLT57ZvJtTP87/jWgjMCMVjZ\nqfVIRSTbKZdun+019AtcQi+54BqY5zoZOqPtaEcIZ6YWAr113uPpxXcMa3j6IQUj\nGKoAFcZHbxNWVXbIJn2zZ804Zd6PUu2RCCRqW0UCgYEAv5rs4lg2tdIx3zKX67qQ\naFDBvxYriDqUuACpzV9TlZme6tDp+S21BGhwzwl9dcaWjda++lqyBqtkSHZtGAY+\nNf7d7jqgqgiofhYlBTSVo8qU8vVvIlzgzOb+Z3aZPiZHiCu8K4YAJ9Qn5q8Fz1PV\n4b87bpePRsmiNvOiCsTBaRY=\n-----END PRIVATE KEY-----\n",
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
let expectedDataRaw = JSON.parse(localStorage.getItem('erp_expected_cache') || '[]');
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
const simpleModulePages = { nhap: 1, dukien: 1, xuat: 1, chuyenkho: 1, sanpham: 1, sanphamkho: 1, doisoat: 1 };
const simpleModuleSorts = {
    sanpham: { column: 'ton_cuoi', direction: 'desc' },
    sanphamkho: { column: 'ton_cuoi', direction: 'desc' }
};
const ACTIVE_MODULES = ['home', 'nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang'];

const DEFAULT_PERMISSIONS = {
    roles: {
        'ADMIN': {
            modules: ['home', 'nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat', 'nhanvien', 'khachhang'],
            actions: ['nx.manualAdd', 'nx.upload', 'nx.confirmWarehouse', 'sanpham.manage', 'doisoat.manage']
        },
        'kt': {
            modules: ['nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'doisoat'],
            actions: ['nx.upload', 'doisoat.manage']
        },
        'KHO': {
            modules: ['nhap', 'dukien', 'xuat', 'chuyenkho', 'sanphamkho'],
            actions: ['nx.confirmWarehouse']
        },
        'NPP': {
            modules: ['sanpham', 'xuat'],
            actions: []
        },
        'KD': {
            modules: ['sanpham'],
            actions: []
        },
        'NVKD': {
            modules: ['sanpham'],
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

function normalizeExpectedStatus(value) {
    const normalized = (value || '').toString().trim().toUpperCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/Đ/g, 'D');
    if (normalized.includes('DAT HANG')) return 'DAT_HANG';
    return 'HANG_DA_VE';
}

function getExpectedStatusLabel(value) {
    return normalizeExpectedStatus(value) === 'DAT_HANG' ? 'Đã đặt hàng' : 'Hàng đã về';
}

function matchesDetailModuleStatus(moduleName, row) {
    if (moduleName === 'nhap') return normalizeExpectedStatus(row && row[16]) === 'HANG_DA_VE';
    return true;
}
