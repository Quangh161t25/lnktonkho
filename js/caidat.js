// ============================================================
// caidat.js - Cài đặt & Phân quyền Hệ thống (Kết nối Google Sheet CAI_DAT)
// ============================================================

let caidatWorkingPermissions = null;
let caidatWorkingSettings = null;
let caidatWorkingRows = [];
let caidatActiveTab = 'system';
let caidatSelectedRole = 'ADMIN';
let caidatIsModified = false;
let caidatTableFilterGroup = 'ALL';
let caidatTableSearchTerm = '';
let caidatIsSyncing = false;

const CAIDAT_AVAILABLE_MODULES = [
    { key: 'home', name: 'Trang chủ', desc: 'Bảng điều khiển & tổng quan lối tắt', icon: '🏠', color: 'blue' },
    { key: 'nhap', name: 'Danh sách nhập', desc: 'Xem & quản lý phiếu nhập kho', icon: '↓', color: 'blue' },
    { key: 'dukien', name: 'Dự kiến hàng về', desc: 'Theo dõi đơn hàng dự kiến về kho', icon: 'DK', color: 'amber' },
    { key: 'xuat', name: 'Danh sách xuất', desc: 'Xem & quản lý phiếu xuất kho', icon: '↑', color: 'orange' },
    { key: 'chuyenkho', name: 'Điều chuyển kho', desc: 'Điều chuyển hàng giữa các kho', icon: '⇄', color: 'cyan' },
    { key: 'sanpham', name: 'Danh sách sản phẩm', desc: 'Danh mục sản phẩm & tồn kho tổng', icon: 'SP', color: 'emerald' },
    { key: 'sanphamkho', name: 'Sản phẩm kho', desc: 'Tồn kho chi tiết theo từng kho', icon: 'K', color: 'indigo' },
    { key: 'ton_npp', name: 'Tồn NPP', desc: 'Báo cáo tồn Nhà phân phối', icon: 'NPP', color: 'teal' },
    { key: 'doisoat', name: 'Đối soát', desc: 'Đối chiếu tồn hệ thống với MISA', icon: 'ĐS', color: 'rose' },
    { key: 'nhanvien', name: 'Danh sách nhân viên', desc: 'Danh bạ nhân viên từ DSNV', icon: 'NV', color: 'sky' },
    { key: 'khachhang', name: 'Danh sách khách hàng', desc: 'Khách hàng NPP và NCC', icon: 'KH', color: 'violet' },
    { key: 'caidat', name: 'Cài đặt & Phân quyền', desc: 'Quản trị hệ thống & thiết kế phân quyền', icon: '⚙️', color: 'slate' }
];

const CAIDAT_AVAILABLE_ACTIONS = [
    { key: 'nx.manualAdd', name: 'Thêm thủ công đơn Nhập / Xuất', desc: 'Cho phép tạo mới dòng phiếu nhập xuất bằng tay' },
    { key: 'nx.upload', name: 'Tải lên dữ liệu Excel', desc: 'Cho phép upload file Excel nhập/xuất/trả lại' },
    { key: 'nx.confirmWarehouse', name: 'Xác nhận trạng thái kho', desc: 'Cập nhật trạng thái: Đã nhặt hàng, Đã lên xe, Hoàn thành' },
    { key: 'nx.delete', name: 'Xóa đơn hàng / Bản ghi Tồn NPP', desc: 'Cho phép xóa đơn Nhập, Xuất, Tồn NPP và các bản ghi chi tiết' },
    { key: 'sanpham.manage', name: 'Quản lý Sản phẩm', desc: 'Thêm mới, sửa thông tin & giá bán sản phẩm' },
    { key: 'doisoat.manage', name: 'Quản lý Đối soát', desc: 'Thao tác tải lên và đối chiếu chênh lệch MISA' },
    { key: 'caidat.manage', name: 'Quản trị Phân quyền', desc: 'Thiết kế vai trò và lưu cấu hình phân quyền' }
];

const CAIDAT_GROUPS = [
    { key: 'ALL', name: 'Tất cả nhóm' },
    { key: 'HE_THONG', name: 'Hệ thống' },
    { key: 'KHO_HANG', name: 'Kho hàng' },
    { key: 'PHAN_QUYEN_KHO', name: 'Phân quyền kho' },
    { key: 'VAI_TRO', name: 'Vai trò' },
    { key: 'QUYEN_THAO_TAC', name: 'Quyền thao tác' },
    { key: 'GIOI_HAN_USER', name: 'Giới hạn User' },
    { key: 'PHAM_VI_DU_LIEU', name: 'Phạm vi dữ liệu' },
    { key: 'CANH_BAO', name: 'Cảnh báo tồn' }
];

function initCaidatWorkingCopy() {
    caidatWorkingPermissions = JSON.parse(JSON.stringify(appPermissions || DEFAULT_PERMISSIONS));
    if (!caidatWorkingPermissions.roles) caidatWorkingPermissions.roles = {};
    if (!caidatWorkingPermissions.userRestrictions) caidatWorkingPermissions.userRestrictions = {};
    if (!caidatWorkingPermissions.userWarehouses) caidatWorkingPermissions.userWarehouses = {};
    if (!caidatWorkingPermissions.dataScopes) caidatWorkingPermissions.dataScopes = {};
    if (!caidatWorkingPermissions.modules) caidatWorkingPermissions.modules = {};

    caidatWorkingSettings = JSON.parse(JSON.stringify(appSettings || {
        appName: "LNK TỒN KHO - ERP SYSTEM",
        appVersion: "2.0.0",
        pageSize: 200,
        warehouses: ['KHO 1', 'KHO 2', 'KHO 3', 'KHO 4', 'KHO 5'],
        defaultWarehouse: 'KHO 1',
        lowStockThreshold: 10,
        allowNegativeStock: 'CANH_BAO',
        holdOrderExpiryDays: 7,
        autoRefreshIntervalSec: 300,
        kiemKhoStatuses: ['Chờ kiểm', 'Đã kiểm', 'Lệch kho', 'Hoàn thành'],
        xuatConfirmStatuses: ['Đã nhặt hàng', 'Đã lên xe', 'Hoàn thành']
    }));

    // Ensure all standard modules exist
    CAIDAT_AVAILABLE_MODULES.forEach(m => {
        if (!caidatWorkingPermissions.modules[m.key]) {
            caidatWorkingPermissions.modules[m.key] = m.name;
        }
    });

    const roleKeys = Object.keys(caidatWorkingPermissions.roles);
    if (roleKeys.length > 0 && !caidatWorkingPermissions.roles[caidatSelectedRole]) {
        caidatSelectedRole = roleKeys[0];
    }

    refreshWorkingSheetRows();
}

function refreshWorkingSheetRows() {
    if (typeof convertPermissionsAndSettingsToSheetRows === 'function') {
        const raw = convertPermissionsAndSettingsToSheetRows(caidatWorkingPermissions, caidatWorkingSettings);
        if (raw && raw.length > 1) {
            caidatWorkingRows = raw.slice(1).map(r => ({
                id: r[0] || '',
                ten_thiet_lap: r[1] || '',
                gia_tri: r[2] || '',
                nhom: r[3] || 'HE_THONG',
                kieu_du_lieu: r[4] || 'text',
                mo_ta: r[5] || '',
                ngay_cap_nhat: r[6] || '',
                nguoi_cap_nhat: r[7] || ''
            }));
        }
    }
}

function setCaidatModified(isMod) {
    caidatIsModified = isMod;
    const badge = document.getElementById('caidatModifiedBadge');
    if (badge) {
        if (isMod) badge.classList.remove('hidden');
        else badge.classList.add('hidden');
    }
    if (isMod) {
        refreshWorkingSheetRows();
    }
}

function renderCaidatModule() {
    if (!caidatWorkingPermissions || !caidatWorkingSettings || !caidatIsModified) {
        initCaidatWorkingCopy();
    }
    renderCaidatSystemSettings();
    renderCaidatRolePills();
    renderCaidatActiveRoleDetails();
    renderCaidatUserWarehouses();
    renderCaidatUserRestrictions();
    renderCaidatDataScopes();
    renderCaidatDataTable();
    renderCaidatRawJson();
    updateCaidatBadges();
    updateCaidatSyncStatusUI();
}

function updateCaidatBadges() {
    const roleCount = Object.keys(caidatWorkingPermissions?.roles || {}).length;
    const userRestCount = Object.keys(caidatWorkingPermissions?.userRestrictions || {}).length;
    const userWhCount = Object.keys(caidatWorkingPermissions?.userWarehouses || {}).length;
    const rowsCount = caidatWorkingRows.length || 0;

    const roleBadge = document.getElementById('caidatTabRoleCount');
    if (roleBadge) roleBadge.textContent = roleCount;

    const userBadge = document.getElementById('caidatTabUserCount');
    if (userBadge) userBadge.textContent = userWhCount + userRestCount;

    const rowsBadge = document.getElementById('caidatTabRowsCount');
    if (rowsBadge) rowsBadge.textContent = rowsCount;
}

function updateCaidatSyncStatusUI() {
    const syncBadge = document.getElementById('caidatSyncStatusBadge');
    if (!syncBadge) return;

    if (caidatIsSyncing) {
        syncBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-blue-500 animate-pulse mr-1"></span> Đang đồng bộ Sheet...';
        syncBadge.className = 'px-2.5 py-1 text-[11px] font-bold rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center';
        return;
    }

    if (appSettings && appSettings.lastSyncedTime) {
        const timeStr = new Date(appSettings.lastSyncedTime).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
        syncBadge.innerHTML = `<span class="inline-block w-2 h-2 rounded-full bg-emerald-500 mr-1"></span> Đã kết nối Google Sheet (${timeStr})`;
        syncBadge.className = 'px-2.5 py-1 text-[11px] font-bold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center';
    } else {
        syncBadge.innerHTML = '<span class="inline-block w-2 h-2 rounded-full bg-slate-400 mr-1"></span> Sẵn sàng lưu lên Google Sheet';
        syncBadge.className = 'px-2.5 py-1 text-[11px] font-bold rounded-full bg-slate-100 text-slate-600 border border-slate-200 flex items-center';
    }
}

function switchCaidatTab(tabName) {
    caidatActiveTab = tabName;
    ['system', 'roles', 'users', 'scopes', 'sheetdata', 'json'].forEach(t => {
        const btn = document.getElementById(`caidat-tab-btn-${t}`);
        const content = document.getElementById(`caidat-tab-content-${t}`);
        if (btn) {
            if (t === tabName) {
                btn.classList.add('active', 'border-blue-600', 'text-blue-600');
                btn.classList.remove('border-transparent', 'text-slate-500');
            } else {
                btn.classList.remove('active', 'border-blue-600', 'text-blue-600');
                btn.classList.add('border-transparent', 'text-slate-500');
            }
        }
        if (content) {
            if (t === tabName) content.classList.remove('hidden');
            else content.classList.add('hidden');
        }
    });

    if (tabName === 'users') {
        renderCaidatUserWarehouses();
        renderCaidatUserRestrictions();
    } else if (tabName === 'sheetdata') {
        renderCaidatDataTable();
    } else if (tabName === 'json') {
        renderCaidatRawJson();
    }
}

// ─── TAB 1: SYSTEM SETTINGS ─────────────────────────────────

function renderCaidatSystemSettings() {
    if (!caidatWorkingSettings) return;

    const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = (val !== undefined && val !== null) ? val : '';
    };

    setVal('cfgAppName', caidatWorkingSettings.appName);
    setVal('cfgAppVersion', caidatWorkingSettings.appVersion);
    setVal('cfgPageSize', caidatWorkingSettings.pageSize || 200);
    setVal('cfgWarehouseList', Array.isArray(caidatWorkingSettings.warehouses) ? caidatWorkingSettings.warehouses.join(', ') : 'KHO 1, KHO 2, KHO 3, KHO 4, KHO 5');
    setVal('cfgDefaultWarehouse', caidatWorkingSettings.defaultWarehouse || 'KHO 1');
    setVal('cfgLowStockThreshold', caidatWorkingSettings.lowStockThreshold || 10);
    setVal('cfgAllowNegativeStock', caidatWorkingSettings.allowNegativeStock || 'CANH_BAO');
    setVal('cfgHoldOrderExpiryDays', caidatWorkingSettings.holdOrderExpiryDays || 7);
    setVal('cfgAutoRefreshIntervalSec', caidatWorkingSettings.autoRefreshIntervalSec || 300);
    setVal('cfgKiemKhoStatuses', Array.isArray(caidatWorkingSettings.kiemKhoStatuses) ? caidatWorkingSettings.kiemKhoStatuses.join(', ') : 'Chờ kiểm, Đã kiểm, Lệch kho, Hoàn thành');
    setVal('cfgXuatConfirmStatuses', Array.isArray(caidatWorkingSettings.xuatConfirmStatuses) ? caidatWorkingSettings.xuatConfirmStatuses.join(', ') : 'Đã nhặt hàng, Đã lên xe, Hoàn thành');
}

function handleSystemSettingChange(field, value) {
    if (!caidatWorkingSettings) return;

    if (field === 'pageSize' || field === 'lowStockThreshold' || field === 'holdOrderExpiryDays' || field === 'autoRefreshIntervalSec') {
        caidatWorkingSettings[field] = parseInt(value, 10) || 0;
    } else if (field === 'warehouses' || field === 'kiemKhoStatuses' || field === 'xuatConfirmStatuses') {
        caidatWorkingSettings[field] = value.split(',').map(s => s.trim()).filter(Boolean);
    } else {
        caidatWorkingSettings[field] = value;
    }

    setCaidatModified(true);
}

// ─── TAB 2: ROLES & PERMISSIONS ──────────────────────────────

function renderCaidatRolePills() {
    const container = document.getElementById('caidatRolePillsContainer');
    if (!container || !caidatWorkingPermissions) return;

    const roles = Object.keys(caidatWorkingPermissions.roles || {});
    container.innerHTML = roles.map(rKey => {
        const isSelected = rKey === caidatSelectedRole;
        const isDefault = ['ADMIN', 'kt', 'KHO', 'NPP', 'KD', 'NVKD'].includes(rKey);
        return `
            <button onclick="selectCaidatRole('${escAttr(rKey)}')"
                class="px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${isSelected 
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-200' 
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}">
                <span>${escAttr(rKey)}</span>
                ${isDefault ? '' : '<span class="w-1.5 h-1.5 rounded-full bg-amber-400" title="Vai trò tùy chỉnh"></span>'}
            </button>
        `;
    }).join('');
}

function selectCaidatRole(roleKey) {
    caidatSelectedRole = roleKey;
    renderCaidatRolePills();
    renderCaidatActiveRoleDetails();
}

function renderCaidatActiveRoleDetails() {
    if (!caidatWorkingPermissions) return;
    const roleKey = caidatSelectedRole;
    const roleConfig = caidatWorkingPermissions.roles[roleKey] || { modules: [], actions: [] };
    const isDefault = ['ADMIN', 'kt', 'KHO', 'NPP', 'KD', 'NVKD'].includes(roleKey);

    const roleCodeEl = document.getElementById('caidatActiveRoleCode');
    if (roleCodeEl) roleCodeEl.textContent = roleKey;

    const typeBadge = document.getElementById('caidatRoleTypeBadge');
    if (typeBadge) {
        typeBadge.textContent = isDefault ? 'Hệ thống' : 'Tùy chỉnh';
        typeBadge.className = isDefault 
            ? 'px-2 py-0.5 text-[10px] font-bold rounded-md bg-slate-100 text-slate-600'
            : 'px-2 py-0.5 text-[10px] font-bold rounded-md bg-amber-100 text-amber-700 border border-amber-200';
    }

    const deleteBtn = document.getElementById('caidatDeleteRoleBtn');
    if (deleteBtn) {
        if (!isDefault && roleKey !== 'ADMIN') {
            deleteBtn.classList.remove('hidden');
        } else {
            deleteBtn.classList.add('hidden');
        }
    }

    const descEl = document.getElementById('caidatRoleDescText');
    if (descEl) {
        const descMap = {
            'ADMIN': 'Quản trị viên toàn quyền hệ thống, quản lý người dùng và phân quyền',
            'kt': 'Bộ phận Kế toán - xem xuất nhập, tồn kho, quản lý đối soát',
            'KHO': 'Bộ phận Kho - duyệt kho, điều chuyển, giữ hàng và kiểm kê',
            'NPP': 'Nhà phân phối - xem sản phẩm, xuất hàng và tồn kho thuộc đơn vị',
            'KD': 'Kinh doanh - xem danh mục sản phẩm và tồn tổng',
            'NVKD': 'Nhân viên kinh doanh - xem sản phẩm và xuất nhập phụ trách'
        };
        descEl.textContent = descMap[roleKey] || 'Vai trò tùy chỉnh người dùng thiết lập';
    }

    // Role Users list
    const usersListEl = document.getElementById('caidatRoleUsersList');
    if (usersListEl) {
        const assignedUsers = (usersData || []).filter(u => resolveRoleKey(u.role) === roleKey);
        if (assignedUsers.length === 0) {
            usersListEl.innerHTML = '<span class="text-slate-400 italic">Chưa có tài khoản nào gán vai trò này</span>';
        } else {
            usersListEl.innerHTML = assignedUsers.map(u => `
                <div class="flex items-center justify-between p-1.5 rounded-lg bg-slate-50 border border-slate-100">
                    <span class="font-semibold text-slate-700">${escAttr(u.id)}</span>
                    <span class="text-[11px] text-slate-500">${escAttr(u.name || '')}</span>
                </div>
            `).join('');
        }
    }

    // Render Module Checkboxes
    const moduleGrid = document.getElementById('caidatModuleCardsGrid');
    const roleModules = roleConfig.modules || [];
    if (moduleGrid) {
        moduleGrid.innerHTML = CAIDAT_AVAILABLE_MODULES.map(mod => {
            const isChecked = roleModules.includes(mod.key);
            const isSystemAdmin = roleKey === 'ADMIN' && (mod.key === 'caidat' || mod.key === 'home');
            return `
                <label class="relative flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${isChecked 
                    ? 'border-blue-500/40 bg-blue-50/40 hover:bg-blue-50/70' 
                    : 'border-slate-200 bg-white hover:border-slate-300'}">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} ${isSystemAdmin ? 'disabled' : ''}
                        onchange="toggleCaidatRoleModule('${escAttr(mod.key)}', this.checked)"
                        class="mt-0.5 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="font-bold text-xs text-slate-800">${escAttr(mod.name)}</span>
                        </div>
                        <p class="text-[11px] text-slate-400 leading-tight mt-0.5 line-clamp-1">${escAttr(mod.desc)}</p>
                    </div>
                </label>
            `;
        }).join('');
    }

    const modCountBadge = document.getElementById('caidatSelectedModulesCount');
    if (modCountBadge) modCountBadge.textContent = `${roleModules.length} module`;

    // Render Action Checkboxes
    const actionGrid = document.getElementById('caidatActionCardsGrid');
    const roleActions = roleConfig.actions || [];
    if (actionGrid) {
        actionGrid.innerHTML = CAIDAT_AVAILABLE_ACTIONS.map(act => {
            const isChecked = roleActions.includes(act.key);
            const isSystemAdmin = roleKey === 'ADMIN' && act.key === 'caidat.manage';
            return `
                <label class="relative flex items-start gap-3 p-3.5 rounded-xl border transition cursor-pointer select-none ${isChecked 
                    ? 'border-emerald-500/40 bg-emerald-50/40 hover:bg-emerald-50/70' 
                    : 'border-slate-200 bg-white hover:border-slate-300'}">
                    <input type="checkbox" ${isChecked ? 'checked' : ''} ${isSystemAdmin ? 'disabled' : ''}
                        onchange="toggleCaidatRoleAction('${escAttr(act.key)}', this.checked)"
                        class="mt-0.5 w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center gap-1.5">
                            <span class="font-bold text-xs text-slate-800">${escAttr(act.name)}</span>
                            <span class="text-[9px] font-mono text-slate-400 bg-slate-100 px-1 py-0.2 rounded">${escAttr(act.key)}</span>
                        </div>
                        <p class="text-[11px] text-slate-400 leading-tight mt-0.5">${escAttr(act.desc)}</p>
                    </div>
                </label>
            `;
        }).join('');
    }

    const actCountBadge = document.getElementById('caidatSelectedActionsCount');
    if (actCountBadge) actCountBadge.textContent = `${roleActions.length} hành động`;
}

function toggleCaidatRoleModule(modKey, isChecked) {
    if (!caidatWorkingPermissions || !caidatWorkingPermissions.roles[caidatSelectedRole]) return;
    const roleConfig = caidatWorkingPermissions.roles[caidatSelectedRole];
    if (!Array.isArray(roleConfig.modules)) roleConfig.modules = [];

    if (isChecked) {
        if (!roleConfig.modules.includes(modKey)) roleConfig.modules.push(modKey);
    } else {
        if (caidatSelectedRole === 'ADMIN' && (modKey === 'caidat' || modKey === 'home')) return;
        roleConfig.modules = roleConfig.modules.filter(k => k !== modKey);
    }

    setCaidatModified(true);
    renderCaidatActiveRoleDetails();
}

function toggleCaidatRoleAction(actKey, isChecked) {
    if (!caidatWorkingPermissions || !caidatWorkingPermissions.roles[caidatSelectedRole]) return;
    const roleConfig = caidatWorkingPermissions.roles[caidatSelectedRole];
    if (!Array.isArray(roleConfig.actions)) roleConfig.actions = [];

    if (isChecked) {
        if (!roleConfig.actions.includes(actKey)) roleConfig.actions.push(actKey);
    } else {
        if (caidatSelectedRole === 'ADMIN' && actKey === 'caidat.manage') return;
        roleConfig.actions = roleConfig.actions.filter(k => k !== actKey);
    }

    setCaidatModified(true);
    renderCaidatActiveRoleDetails();
}

function applyCaidatRolePreset(presetType) {
    if (!caidatWorkingPermissions || !caidatWorkingPermissions.roles[caidatSelectedRole]) return;
    const roleConfig = caidatWorkingPermissions.roles[caidatSelectedRole];

    if (presetType === 'all') {
        roleConfig.modules = CAIDAT_AVAILABLE_MODULES.map(m => m.key);
        roleConfig.actions = CAIDAT_AVAILABLE_ACTIONS.map(a => a.key);
    } else if (presetType === 'none') {
        roleConfig.modules = caidatSelectedRole === 'ADMIN' ? ['home', 'caidat'] : ['home'];
        roleConfig.actions = caidatSelectedRole === 'ADMIN' ? ['caidat.manage'] : [];
    } else if (presetType === 'viewOnly') {
        roleConfig.modules = ['home', 'sanpham', 'ton_npp'];
        roleConfig.actions = [];
    } else if (presetType === 'warehouse') {
        roleConfig.modules = ['home', 'nhap', 'dukien', 'xuat', 'chuyenkho', 'sanphamkho', 'ton_npp', 'giuhang', 'kiemkho'];
        roleConfig.actions = ['nx.confirmWarehouse', 'giuhang.manage', 'kiemkho.manage'];
    }

    setCaidatModified(true);
    renderCaidatActiveRoleDetails();
}

function openCaidatAddRoleModal() {
    const keyInput = document.getElementById('caidatNewRoleKey');
    const descInput = document.getElementById('caidatNewRoleDesc');
    if (keyInput) keyInput.value = '';
    if (descInput) descInput.value = '';
    document.getElementById('caidatAddRoleModal')?.classList.remove('hidden');
}

function closeCaidatAddRoleModal() {
    document.getElementById('caidatAddRoleModal')?.classList.add('hidden');
}

function submitCaidatNewRole() {
    const rawKey = document.getElementById('caidatNewRoleKey').value.trim();
    if (!rawKey) return alert("Vui lòng nhập mã vai trò.");
    const roleKey = rawKey.toUpperCase().replace(/\s+/g, '_');

    if (caidatWorkingPermissions.roles[roleKey]) {
        return alert(`Vai trò "${roleKey}" đã tồn tại trên hệ thống.`);
    }

    const template = document.getElementById('caidatNewRoleTemplate').value;
    let initialModules = ['home'];
    let initialActions = [];

    if (template !== 'empty' && caidatWorkingPermissions.roles[template]) {
        initialModules = [...(caidatWorkingPermissions.roles[template].modules || ['home'])];
        initialActions = [...(caidatWorkingPermissions.roles[template].actions || [])];
    }

    caidatWorkingPermissions.roles[roleKey] = {
        modules: initialModules,
        actions: initialActions
    };

    setCaidatModified(true);
    caidatSelectedRole = roleKey;
    closeCaidatAddRoleModal();
    renderCaidatRolePills();
    renderCaidatActiveRoleDetails();
    updateCaidatBadges();
}

function deleteCaidatActiveRole() {
    const roleKey = caidatSelectedRole;
    if (['ADMIN', 'kt', 'KHO', 'NPP', 'KD', 'NVKD'].includes(roleKey)) {
        alert("Không thể xóa vai trò mặc định của hệ thống.");
        return;
    }
    if (!confirm(`Bạn có chắc chắn muốn xóa vai trò "${roleKey}" không?`)) return;

    delete caidatWorkingPermissions.roles[roleKey];
    setCaidatModified(true);
    caidatSelectedRole = 'ADMIN';
    renderCaidatRolePills();
    renderCaidatActiveRoleDetails();
    updateCaidatBadges();
}

// ─── TAB 3: USER RESTRICTIONS & WAREHOUSE PERMISSIONS ─────────

function renderCaidatUserWarehouses() {
    const tbody = document.getElementById('caidatUserWarehousesTableBody');
    if (!tbody || !caidatWorkingPermissions) return;

    const userWhs = caidatWorkingPermissions.userWarehouses || {};
    const userIds = Object.keys(userWhs);

    if (userIds.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-8 text-center text-slate-400">
                    Tất cả tài khoản đang áp dụng phân quyền kho mặc định theo Vai trò (Toàn bộ kho).
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = userIds.map(uid => {
        const whList = Array.isArray(userWhs[uid]) ? userWhs[uid] : [];
        const userObj = (usersData || []).find(u => u.id === uid);
        const userName = userObj ? userObj.name : '---';
        const userRole = userObj ? userObj.role : '---';

        return `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-4 font-bold text-slate-800">${escAttr(uid)}</td>
                <td class="px-6 py-4 text-slate-600">${escAttr(userName)}</td>
                <td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">${escAttr(userRole)}</span></td>
                <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1.5">
                        ${whList.length > 0
                            ? whList.map(k => `<span class="px-2.5 py-0.5 rounded-lg bg-blue-50 border border-blue-200 text-blue-700 font-bold text-[11px]">${escAttr(k)}</span>`).join('')
                            : '<span class="text-slate-400 italic">Chưa gán kho (mặc định toàn bộ)</span>'}
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="openCaidatUserWarehouseModal('${escAttr(uid)}')"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Chỉnh sửa">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button onclick="deleteCaidatUserWarehouse('${escAttr(uid)}')"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Xóa phân quyền kho (về mặc định)">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openCaidatUserWarehouseModal(existingUserId = '') {
    const select = document.getElementById('caidatWarehouseUserSelect');
    const container = document.getElementById('caidatWarehouseCheckboxesContainer');
    const title = document.getElementById('caidatUserWarehouseModalTitle');

    if (select) {
        select.innerHTML = (usersData || []).map(u => `
            <option value="${escAttr(u.id)}">${escAttr(u.id)}${u.name ? ` - ${escAttr(u.name)}` : ''}${u.role ? ` (${escAttr(u.role)})` : ''}</option>
        `).join('');
        if (existingUserId) select.value = existingUserId;
    }

    const currentUserId = existingUserId || (select ? select.value : '');
    const currentWhs = (caidatWorkingPermissions.userWarehouses && caidatWorkingPermissions.userWarehouses[currentUserId]) || [];
    const allWarehouses = (caidatWorkingSettings && caidatWorkingSettings.warehouses) || ['KHO 1', 'KHO 2', 'KHO 3', 'KHO 4', 'KHO 5'];

    if (container) {
        container.innerHTML = allWarehouses.map(k => {
            const isChecked = currentWhs.map(w => w.toUpperCase()).includes(k.toUpperCase());
            return `
                <label class="flex items-center gap-2 p-2 rounded-lg bg-white border border-slate-200 hover:border-blue-300 cursor-pointer transition">
                    <input type="checkbox" name="caidatUserWarehouseOption" value="${escAttr(k)}" ${isChecked ? 'checked' : ''}
                        class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300">
                    <span class="font-bold text-slate-700 text-xs">${escAttr(k)}</span>
                </label>
            `;
        }).join('');
    }

    if (title) {
        title.textContent = existingUserId ? `Phân quyền kho cho tài khoản ${existingUserId}` : 'Phân quyền Kho cho Người dùng';
    }

    document.getElementById('caidatUserWarehouseModal')?.classList.remove('hidden');
}

function closeCaidatUserWarehouseModal() {
    document.getElementById('caidatUserWarehouseModal')?.classList.add('hidden');
}

function handleCaidatWarehouseUserSelectChange(userId) {
    const currentWhs = (caidatWorkingPermissions.userWarehouses && caidatWorkingPermissions.userWarehouses[userId]) || [];
    const checkboxes = document.querySelectorAll('input[name="caidatUserWarehouseOption"]');
    checkboxes.forEach(cb => {
        cb.checked = currentWhs.map(w => w.toUpperCase()).includes(cb.value.toUpperCase());
    });
}

function selectAllCaidatWarehouseCheckboxes(selectAll) {
    const checkboxes = document.querySelectorAll('input[name="caidatUserWarehouseOption"]');
    checkboxes.forEach(cb => {
        cb.checked = !!selectAll;
    });
}

function saveCaidatUserWarehouseFromModal() {
    const select = document.getElementById('caidatWarehouseUserSelect');
    const userId = select ? select.value.trim() : '';
    if (!userId) return alert("Vui lòng chọn người dùng.");

    const checkboxes = document.querySelectorAll('input[name="caidatUserWarehouseOption"]:checked');
    const selectedWarehouses = Array.from(checkboxes).map(cb => cb.value.trim());

    if (selectedWarehouses.length === 0) {
        return alert("Vui lòng chọn ít nhất 1 kho phụ trách (hoặc đóng nếu không muốn giới hạn).");
    }

    if (!caidatWorkingPermissions.userWarehouses) caidatWorkingPermissions.userWarehouses = {};
    caidatWorkingPermissions.userWarehouses[userId] = selectedWarehouses;

    setCaidatModified(true);
    closeCaidatUserWarehouseModal();
    renderCaidatUserWarehouses();
    updateCaidatBadges();
}

function deleteCaidatUserWarehouse(userId) {
    if (!confirm(`Bạn có chắc chắn muốn hủy phân quyền kho riêng cho tài khoản "${userId}" (trở về mặc định theo vai trò) không?`)) return;
    if (caidatWorkingPermissions.userWarehouses) {
        delete caidatWorkingPermissions.userWarehouses[userId];
    }
    setCaidatModified(true);
    renderCaidatUserWarehouses();
    updateCaidatBadges();
}

function renderCaidatUserRestrictions() {
    const tbody = document.getElementById('caidatUserRestrictionsTableBody');
    if (!tbody || !caidatWorkingPermissions) return;

    const restrictions = caidatWorkingPermissions.userRestrictions || {};
    const userIds = Object.keys(restrictions);

    if (userIds.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-6 py-10 text-center text-slate-400">
                    Chưa có tài khoản nào được cấu hình giới hạn đặc biệt.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = userIds.map(uid => {
        const item = restrictions[uid] || {};
        const hiddenIds = Array.isArray(item.hiddenProductIds) ? item.hiddenProductIds : [];
        const userObj = (usersData || []).find(u => u.id === uid);
        const userName = userObj ? userObj.name : '---';
        const userRole = userObj ? userObj.role : '---';

        return `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="px-6 py-4 font-bold text-slate-800">${escAttr(uid)}</td>
                <td class="px-6 py-4 text-slate-600">${escAttr(userName)}</td>
                <td class="px-6 py-4"><span class="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">${escAttr(userRole)}</span></td>
                <td class="px-6 py-4">
                    <div class="flex flex-wrap gap-1">
                        ${hiddenIds.length > 0 
                            ? hiddenIds.map(id => `<span class="px-2 py-0.5 rounded-md bg-rose-50 border border-rose-200 text-rose-700 font-mono text-[11px]">${escAttr(id)}</span>`).join('')
                            : '<span class="text-slate-400 italic">Không có mã sản phẩm ẩn</span>'}
                    </div>
                </td>
                <td class="px-6 py-4 text-center">
                    <div class="flex items-center justify-center gap-2">
                        <button onclick="openCaidatAddUserRestrictionModal('${escAttr(uid)}')"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition" title="Chỉnh sửa">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                            </svg>
                        </button>
                        <button onclick="deleteCaidatUserRestriction('${escAttr(uid)}')"
                            class="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition" title="Xóa giới hạn">
                            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function openCaidatAddUserRestrictionModal(existingUserId = '') {
    const select = document.getElementById('caidatRestrictionUserSelect');
    const textarea = document.getElementById('caidatRestrictionHiddenIds');
    const title = document.getElementById('caidatUserRestrictionModalTitle');

    if (select) {
        select.innerHTML = (usersData || []).map(u => `
            <option value="${escAttr(u.id)}">${escAttr(u.id)}${u.name ? ` - ${escAttr(u.name)}` : ''}${u.role ? ` (${escAttr(u.role)})` : ''}</option>
        `).join('');
        if (existingUserId) select.value = existingUserId;
    }

    if (existingUserId && caidatWorkingPermissions.userRestrictions[existingUserId]) {
        const item = caidatWorkingPermissions.userRestrictions[existingUserId];
        const ids = Array.isArray(item.hiddenProductIds) ? item.hiddenProductIds : [];
        if (textarea) textarea.value = ids.join(', ');
        if (title) title.textContent = `Chỉnh sửa giới hạn cho tài khoản ${existingUserId}`;
    } else {
        if (textarea) textarea.value = '';
        if (title) title.textContent = 'Thêm giới hạn sản phẩm cho Người dùng';
    }

    document.getElementById('caidatUserRestrictionModal')?.classList.remove('hidden');
}

function closeCaidatUserRestrictionModal() {
    document.getElementById('caidatUserRestrictionModal')?.classList.add('hidden');
}

function saveCaidatUserRestrictionFromModal() {
    const userId = document.getElementById('caidatRestrictionUserSelect').value.trim();
    const rawIds = document.getElementById('caidatRestrictionHiddenIds').value;
    if (!userId) return alert("Vui lòng chọn một tài khoản.");

    const hiddenProductIds = rawIds.split(',')
        .map(s => s.trim().toUpperCase())
        .filter(s => s.length > 0);

    if (!caidatWorkingPermissions.userRestrictions) {
        caidatWorkingPermissions.userRestrictions = {};
    }
    caidatWorkingPermissions.userRestrictions[userId] = {
        hiddenProductIds: hiddenProductIds
    };

    setCaidatModified(true);
    closeCaidatUserRestrictionModal();
    renderCaidatUserRestrictions();
    updateCaidatBadges();
}

function deleteCaidatUserRestriction(userId) {
    if (!confirm(`Xóa cấu hình giới hạn của tài khoản "${userId}"?`)) return;
    if (caidatWorkingPermissions.userRestrictions) {
        delete caidatWorkingPermissions.userRestrictions[userId];
    }
    setCaidatModified(true);
    renderCaidatUserRestrictions();
    updateCaidatBadges();
}

// ─── TAB 4: DATA SCOPES ──────────────────────────────────────

function renderCaidatDataScopes() {
    const container = document.getElementById('caidatDataScopesContainer');
    if (!container || !caidatWorkingPermissions) return;

    const dataScopes = caidatWorkingPermissions.dataScopes || {};
    const roles = Object.keys(caidatWorkingPermissions.roles || {});

    container.innerHTML = roles.map(rKey => {
        const roleScope = dataScopes[rKey] || {};
        const scopeEntries = Object.entries(roleScope);

        return `
            <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                <div class="flex items-center justify-between">
                    <h4 class="text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                        <span class="w-2 h-2 rounded-full bg-indigo-600"></span>
                        Vai trò: ${escAttr(rKey)}
                    </h4>
                    <button onclick="addCaidatScopeRule('${escAttr(rKey)}')"
                        class="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1">
                        + Thêm quy tắc
                    </button>
                </div>
                ${scopeEntries.length === 0 ? `
                    <p class="text-xs text-slate-400 italic">Chưa thiết lập quy tắc phạm vi đặc biệt (mặc định xem theo quyền module).</p>
                ` : `
                    <div class="space-y-2">
                        ${scopeEntries.map(([modKey, scopeText]) => `
                            <div class="flex flex-col sm:flex-row items-start sm:items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                                <span class="font-bold text-slate-700 w-24 shrink-0">${escAttr(modKey)}:</span>
                                <input type="text" value="${escAttr(scopeText)}"
                                    onchange="updateCaidatScopeRule('${escAttr(rKey)}', '${escAttr(modKey)}', this.value)"
                                    class="flex-1 min-w-0 w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                                <button onclick="deleteCaidatScopeRule('${escAttr(rKey)}', '${escAttr(modKey)}')"
                                    class="text-slate-400 hover:text-rose-600 p-1" title="Xóa quy tắc">✕</button>
                            </div>
                        `).join('')}
                    </div>
                `}
            </div>
        `;
    }).join('');
}

function updateCaidatScopeRule(roleKey, modKey, value) {
    if (!caidatWorkingPermissions.dataScopes) caidatWorkingPermissions.dataScopes = {};
    if (!caidatWorkingPermissions.dataScopes[roleKey]) caidatWorkingPermissions.dataScopes[roleKey] = {};
    caidatWorkingPermissions.dataScopes[roleKey][modKey] = value;
    setCaidatModified(true);
}

function addCaidatScopeRule(roleKey) {
    const modKey = prompt("Nhập mã module áp dụng (ví dụ: sanpham, xuat, ton_npp, nx):", "sanpham");
    if (!modKey) return;
    const cleanMod = modKey.trim().toLowerCase();
    const scopeDesc = prompt("Nhập mô tả / quy tắc phạm vi dữ liệu:", "Chỉ xem dữ liệu liên quan đến tài khoản");
    if (scopeDesc === null) return;

    if (!caidatWorkingPermissions.dataScopes) caidatWorkingPermissions.dataScopes = {};
    if (!caidatWorkingPermissions.dataScopes[roleKey]) caidatWorkingPermissions.dataScopes[roleKey] = {};
    caidatWorkingPermissions.dataScopes[roleKey][cleanMod] = scopeDesc;
    setCaidatModified(true);
    renderCaidatDataScopes();
}

function deleteCaidatScopeRule(roleKey, modKey) {
    if (caidatWorkingPermissions.dataScopes && caidatWorkingPermissions.dataScopes[roleKey]) {
        delete caidatWorkingPermissions.dataScopes[roleKey][modKey];
        if (Object.keys(caidatWorkingPermissions.dataScopes[roleKey]).length === 0) {
            delete caidatWorkingPermissions.dataScopes[roleKey];
        }
        setCaidatModified(true);
        renderCaidatDataScopes();
    }
}

// ─── TAB 5: DIRECT SHEET DATA TABLE ─────────────────────────

function setCaidatTableFilter(grp) {
    caidatTableFilterGroup = grp;
    renderCaidatDataTable();
}

function handleCaidatTableSearch(term) {
    caidatTableSearchTerm = (term || '').toLowerCase().trim();
    renderCaidatDataTable();
}

function renderCaidatDataTable() {
    const filterContainer = document.getElementById('caidatTableGroupFilters');
    if (filterContainer) {
        filterContainer.innerHTML = CAIDAT_GROUPS.map(g => {
            const isActive = g.key === caidatTableFilterGroup;
            return `
                <button onclick="setCaidatTableFilter('${escAttr(g.key)}')"
                    class="px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${isActive 
                        ? 'bg-blue-600 text-white shadow-sm' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}">
                    ${escAttr(g.name)}
                </button>
            `;
        }).join('');
    }

    const tbody = document.getElementById('caidatDataTableBody');
    if (!tbody) return;

    let filtered = caidatWorkingRows;
    if (caidatTableFilterGroup !== 'ALL') {
        filtered = filtered.filter(r => r.nhom === caidatTableFilterGroup);
    }
    if (caidatTableSearchTerm) {
        filtered = filtered.filter(r => 
            (r.id || '').toLowerCase().includes(caidatTableSearchTerm) ||
            (r.ten_thiet_lap || '').toLowerCase().includes(caidatTableSearchTerm) ||
            (r.gia_tri || '').toLowerCase().includes(caidatTableSearchTerm) ||
            (r.mo_ta || '').toLowerCase().includes(caidatTableSearchTerm)
        );
    }

    const countLabel = document.getElementById('caidatTableFilteredCount');
    if (countLabel) countLabel.textContent = `${filtered.length} / ${caidatWorkingRows.length} mục cấu hình`;

    if (filtered.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-12 text-center text-slate-400">
                    Không tìm thấy mục cài đặt nào phù hợp với bộ lọc.
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = filtered.map(row => {
        return `
            <tr class="hover:bg-slate-50/80 transition">
                <td class="px-5 py-3.5 font-mono font-bold text-slate-800 text-[11px]">${escAttr(row.id)}</td>
                <td class="px-5 py-3.5 font-semibold text-slate-700 text-xs">${escAttr(row.ten_thiet_lap)}</td>
                <td class="px-5 py-3.5">
                    <input type="text" value="${escAttr(row.gia_tri)}"
                        onchange="updateCaidatTableRowValue('${escAttr(row.id)}', this.value)"
                        class="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-blue-500">
                </td>
                <td class="px-5 py-3.5">
                    <span class="px-2 py-0.5 rounded text-[10px] font-bold ${getGroupBadgeClass(row.nhom)}">${escAttr(row.nhom)}</span>
                </td>
                <td class="px-5 py-3.5 text-slate-500 text-[11px] max-w-xs truncate" title="${escAttr(row.mo_ta)}">${escAttr(row.mo_ta)}</td>
                <td class="px-5 py-3.5 text-center">
                    <button onclick="editCaidatRowModal('${escAttr(row.id)}')"
                        class="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 transition" title="Xem chi tiết">
                        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

function getGroupBadgeClass(nhom) {
    switch (nhom) {
        case 'HE_THONG': return 'bg-blue-50 text-blue-700 border border-blue-200';
        case 'KHO_HANG': return 'bg-indigo-50 text-indigo-700 border border-indigo-200';
        case 'VAI_TRO': return 'bg-violet-50 text-violet-700 border border-violet-200';
        case 'QUYEN_THAO_TAC': return 'bg-emerald-50 text-emerald-700 border border-emerald-200';
        case 'GIOI_HAN_USER': return 'bg-rose-50 text-rose-700 border border-rose-200';
        case 'PHAM_VI_DU_LIEU': return 'bg-amber-50 text-amber-700 border border-amber-200';
        case 'CANH_BAO': return 'bg-orange-50 text-orange-700 border border-orange-200';
        default: return 'bg-slate-100 text-slate-700';
    }
}

function updateCaidatTableRowValue(id, newValue) {
    const row = caidatWorkingRows.find(r => r.id === id);
    if (row) {
        row.gia_tri = newValue;
        row.ngay_cap_nhat = new Date().toLocaleDateString('vi-VN');
        row.nguoi_cap_nhat = (currentUser && currentUser.name) || 'ADMIN';
        setCaidatModified(true);
    }
}

function editCaidatRowModal(id) {
    const row = caidatWorkingRows.find(r => r.id === id);
    if (!row) return;

    const modal = document.getElementById('caidatEditRowModal');
    if (!modal) return;

    document.getElementById('caidatEditRowId').value = row.id;
    document.getElementById('caidatEditRowName').value = row.ten_thiet_lap;
    document.getElementById('caidatEditRowValue').value = row.gia_tri;
    document.getElementById('caidatEditRowGroup').value = row.nhom;
    document.getElementById('caidatEditRowType').value = row.kieu_du_lieu || 'text';
    document.getElementById('caidatEditRowDesc').value = row.mo_ta || '';

    modal.classList.remove('hidden');
}

function closeCaidatEditRowModal() {
    document.getElementById('caidatEditRowModal')?.classList.add('hidden');
}

function saveCaidatEditRowModal() {
    const id = document.getElementById('caidatEditRowId').value.trim();
    if (!id) return;

    let row = caidatWorkingRows.find(r => r.id === id);
    if (!row) {
        row = { id };
        caidatWorkingRows.push(row);
    }

    row.ten_thiet_lap = document.getElementById('caidatEditRowName').value.trim();
    row.gia_tri = document.getElementById('caidatEditRowValue').value.trim();
    row.nhom = document.getElementById('caidatEditRowGroup').value;
    row.kieu_du_lieu = document.getElementById('caidatEditRowType').value;
    row.mo_ta = document.getElementById('caidatEditRowDesc').value.trim();
    row.ngay_cap_nhat = new Date().toLocaleDateString('vi-VN');
    row.nguoi_cap_nhat = (currentUser && currentUser.name) || 'ADMIN';

    setCaidatModified(true);
    closeCaidatEditRowModal();
    renderCaidatDataTable();
}

function openCaidatAddRowModal() {
    const modal = document.getElementById('caidatEditRowModal');
    if (!modal) return;

    document.getElementById('caidatEditRowId').value = '';
    document.getElementById('caidatEditRowName').value = '';
    document.getElementById('caidatEditRowValue').value = '';
    document.getElementById('caidatEditRowGroup').value = 'HE_THONG';
    document.getElementById('caidatEditRowType').value = 'text';
    document.getElementById('caidatEditRowDesc').value = '';

    modal.classList.remove('hidden');
}

// ─── TAB 6: RAW JSON & BACKUP ────────────────────────────────

function renderCaidatRawJson() {
    const textarea = document.getElementById('caidatRawJsonTextarea');
    if (!textarea || !caidatWorkingPermissions) return;
    textarea.value = JSON.stringify(caidatWorkingPermissions, null, 2);
    validateCaidatRawJson(textarea.value);
}

function validateCaidatRawJson(val) {
    const statusLabel = document.getElementById('caidatJsonStatusLabel');
    if (!statusLabel) return;
    try {
        JSON.parse(val);
        statusLabel.textContent = '● Cú pháp JSON hợp lệ';
        statusLabel.className = 'text-emerald-400 font-semibold';
    } catch (err) {
        statusLabel.textContent = `● Lỗi cú pháp JSON: ${err.message}`;
        statusLabel.className = 'text-rose-400 font-semibold';
    }
}

function applyCaidatRawJson() {
    const textarea = document.getElementById('caidatRawJsonTextarea');
    if (!textarea) return;
    try {
        const parsed = JSON.parse(textarea.value);
        if (!parsed.roles || typeof parsed.roles !== 'object') {
            throw new Error('Thiếu cấu trúc trường "roles" trong JSON.');
        }
        caidatWorkingPermissions = parsed;
        setCaidatModified(true);
        alert("Đã tải cấu trúc JSON vào bộ nhớ chỉnh sửa thành công!");
        renderCaidatModule();
    } catch (err) {
        alert(`Không thể áp dụng JSON: ${err.message}`);
    }
}

function copyCaidatJsonToClipboard() {
    const jsonStr = JSON.stringify(caidatWorkingPermissions || appPermissions, null, 2);
    navigator.clipboard.writeText(jsonStr).then(() => {
        alert("Đã sao chép toàn bộ mã permissions.json vào Clipboard!");
    }).catch(() => {
        alert("Không thể sao chép tự động. Bạn hãy chọn và sao chép thủ công từ khung soạn thảo.");
    });
}

// ─── PERSISTENCE & GOOGLE SHEETS SYNC ────────────────────────

async function saveCaidatPermissions() {
    const saveBtn = document.getElementById('btnSaveCaidat');
    const origHtml = saveBtn ? saveBtn.innerHTML : '';
    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.innerHTML = `
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang lưu lên Google Sheet...
            `;
        }

        caidatIsSyncing = true;
        updateCaidatSyncStatusUI();

        // 1. Build rows from working state
        const rows = convertPermissionsAndSettingsToSheetRows(caidatWorkingPermissions, caidatWorkingSettings);

        // 2. Save directly to Google Sheet CAI_DAT
        await saveCaiDatToGoogleSheet(rows);

        setCaidatModified(false);
        caidatIsSyncing = false;
        updateCaidatSyncStatusUI();
        renderCaidatModule();

        alert("✅ Đã lưu cấu hình và phân quyền lên Google Sheet CAI_DAT thành công! Hệ thống đã áp dụng các thiết lập mới.");
    } catch (err) {
        console.error("Save to Google Sheet error:", err);
        caidatIsSyncing = false;
        updateCaidatSyncStatusUI();
        
        // Fallback to local save
        savePermissionsConfig(caidatWorkingPermissions, caidatWorkingSettings);
        setCaidatModified(false);
        alert(`⚠️ Đã lưu cục bộ. Lưu lên Google Sheet gặp sự cố: ${err.message}`);
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.innerHTML = origHtml;
        }
    }
}

async function syncCaidatFromGoogleSheet() {
    const syncBtn = document.getElementById('btnSyncFromSheet');
    const origHtml = syncBtn ? syncBtn.innerHTML : '';
    try {
        if (syncBtn) {
            syncBtn.disabled = true;
            syncBtn.innerHTML = `
                <svg class="animate-spin h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang tải...
            `;
        }

        caidatIsSyncing = true;
        updateCaidatSyncStatusUI();

        const result = await loadCaiDatFromGoogleSheet();
        if (result) {
            initCaidatWorkingCopy();
            setCaidatModified(false);
            renderCaidatModule();
            alert("✅ Đã đồng bộ thành công dữ liệu mới nhất từ Google Sheet CAI_DAT!");
        } else {
            alert("⚠️ Không thể tải dữ liệu từ Google Sheet CAI_DAT. Vui lòng kiểm tra kết nối mạng.");
        }
    } catch (err) {
        console.error("Sync error:", err);
        alert(`Lỗi khi đồng bộ Google Sheet: ${err.message}`);
    } finally {
        caidatIsSyncing = false;
        updateCaidatSyncStatusUI();
        if (syncBtn) {
            syncBtn.disabled = false;
            syncBtn.innerHTML = origHtml;
        }
    }
}

function downloadCaidatPermissionsJson() {
    const jsonStr = JSON.stringify(caidatWorkingPermissions || appPermissions, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'permissions.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function triggerImportPermissionsJson() {
    const input = document.getElementById('caidatImportFileInput');
    if (input) input.click();
}

function handleImportPermissionsJsonFile(input) {
    const file = input.files && input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const parsed = JSON.parse(e.target.result);
            if (!parsed.roles) throw new Error('File JSON không đúng định dạng permissions.json (thiếu mục "roles").');
            caidatWorkingPermissions = parsed;
            setCaidatModified(true);
            renderCaidatModule();
            alert(`Đã nhập thành công cấu hình từ file "${file.name}"! Hãy bấm "Lưu lên Google Sheet" để áp dụng.`);
        } catch (err) {
            alert(`Lỗi khi đọc file JSON: ${err.message}`);
        } finally {
            input.value = '';
        }
    };
    reader.readAsText(file);
}

function resetCaidatPermissions() {
    if (!confirm("Bạn có chắc chắn muốn khôi phục toàn bộ phân quyền về trạng thái mặc định ban đầu không? Mọi tùy chỉnh hiện tại sẽ bị xóa.")) return;
    resetPermissionsConfig();
    initCaidatWorkingCopy();
    setCaidatModified(false);
    renderCaidatModule();
    alert("Đã khôi phục phân quyền về cấu hình mặc định!");
}
