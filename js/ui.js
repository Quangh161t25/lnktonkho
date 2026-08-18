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
    const visibleModule = ['home', 'nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'ton_npp', 'doisoat', 'nhanvien', 'khachhang']
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
    return ['home', 'nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'ton_npp', 'doisoat', 'nhanvien', 'khachhang']
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
        } else if (['nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'ton_npp', 'doisoat'].includes(moduleName)) {
            await renderSimpleSheetModule(moduleName, false, true);
        } else if (['nhanvien', 'khachhang'].includes(moduleName)) {
            await fetchAuthData();
            renderDsnvDirectory(moduleName);
        } else if (moduleName === 'caidat') {
            if (typeof renderCaidatModule === 'function') renderCaidatModule();
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
    ['home', 'nhapxuat', 'nhap', 'dukien', 'xuat', 'chuyenkho', 'anhdonhang', 'sanpham', 'sanphamkho', 'ton_npp', 'doisoat', 'nhanvien', 'khachhang', 'giuhang', 'kiemkho', 'dashboard', 'caidat'].forEach(m => {
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
    dukien: { inputId: 'dukienSearchInput', placeholder: 'Tìm trong dự kiến hàng về...' },
    xuat: { inputId: 'xuatSearchInput', placeholder: 'Tìm trong danh sách xuất...' },
    chuyenkho: { inputId: 'chuyenkhoSearchInput', placeholder: 'Tìm trong điều chuyển kho...' },
    sanpham: { inputId: 'sanphamSearchInput', placeholder: 'Tìm sản phẩm...' },
    sanphamkho: { inputId: 'sanphamkhoSearchInput', placeholder: 'Tìm sản phẩm theo kho...' },
    ton_npp: { inputId: 'ton_nppSearchInput', placeholder: 'Tìm trong tồn NPP...' },
    doisoat: { inputId: 'doisoatSearchInput', placeholder: 'Tìm dữ liệu đối soát...' },
    nhanvien: { inputId: 'nhanvienSearchInput', placeholder: 'Tìm nhân viên...' },
    khachhang: { inputId: 'khachhangSearchInput', placeholder: 'Tìm khách hàng...' },
    giuhang: { inputId: 'giuHangSearchInput', placeholder: 'Tìm tên nhân viên, sản phẩm...' },
    kiemkho: { inputId: 'kiemKhoSearchInput', placeholder: 'Tìm ngày, mã SP, vị trí...' }
};
let activeHeaderSearchModule = '';
const MODULE_PAGE_PATHS = {
    home: 'index.html',
    nhap: 'nhap.html',
    dukien: 'dukien.html',
    xuat: 'xuat.html',
    chuyenkho: 'chuyenkho.html',
    sanpham: 'sanpham.html',
    sanphamkho: 'sanphamkho.html',
    ton_npp: 'ton_npp.html',
    anhdonhang: 'anhdonhang.html',
    doisoat: 'doisoat.html',
    nhanvien: 'nhanvien.html',
    khachhang: 'khachhang.html',
    giuhang: 'giuhang.html',
    kiemkho: 'kiemkho.html',
    dashboard: 'dashboard.html',
    caidat: 'caidat.html'
};

function getPageEntryModule() {
    const requestedModule = new URLSearchParams(window.location.search).get('module');
    if (requestedModule && MODULE_PAGE_PATHS[requestedModule]) return requestedModule;
    const currentPage = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    const pageModule = Object.entries(MODULE_PAGE_PATHS)
        .find(([, file]) => file.toLowerCase() === currentPage)?.[0];
    return pageModule || document.body?.dataset.entryModule || 'home';
}

function getInitialModuleForCurrentUser() {
    const requestedModule = getPageEntryModule();
    const allowed = getAllowedModules(currentUser?.role);
    return allowed.includes(requestedModule) ? requestedModule : getDefaultModuleForCurrentUser();
}

function navigateToModulePage(moduleName) {
    const targetPage = MODULE_PAGE_PATHS[moduleName] || MODULE_PAGE_PATHS.home;
    const currentPage = decodeURIComponent(window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
    if (getPageEntryModule() === 'login') {
        window.location.href = `index.html?module=${encodeURIComponent(moduleName)}`;
        return true;
    }
    document.body.dataset.entryModule = moduleName;
    const targetUrl = window.location.protocol === 'file:'
        ? `index.html?module=${encodeURIComponent(moduleName)}`
        : targetPage;
    if (currentPage !== targetPage.toLowerCase() || window.location.protocol === 'file:') {
        try {
            window.history.pushState({ moduleName }, '', targetUrl);
        } catch (error) {
            console.warn('Không thể đổi URL module, tiếp tục hiển thị trong trang hiện tại.', error);
        }
    }
    return false;
}

function replaceModulePageUrl(moduleName) {
    const targetPage = MODULE_PAGE_PATHS[moduleName] || MODULE_PAGE_PATHS.home;
    document.body.dataset.entryModule = moduleName;
    const targetUrl = window.location.protocol === 'file:'
        ? `index.html?module=${encodeURIComponent(moduleName)}`
        : targetPage;
    try {
        window.history.replaceState({ moduleName }, '', targetUrl);
    } catch (error) {
        console.warn('Không thể đồng bộ URL module.', error);
    }
}

window.addEventListener('popstate', () => {
    if (!document.getElementById('mainApp')) return;
    const moduleName = getPageEntryModule();
    document.body.dataset.entryModule = moduleName;
    switchModule(moduleName, { renderOnly: true });
});

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
    else if (['nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'ton_npp', 'doisoat'].includes(activeHeaderSearchModule)) renderSimpleSheetModule(activeHeaderSearchModule, true);
    else if (['nhanvien', 'khachhang'].includes(activeHeaderSearchModule)) renderDsnvDirectory(activeHeaderSearchModule);
    else if (activeHeaderSearchModule === 'giuhang') applyGiuHangFilters();
    else if (activeHeaderSearchModule === 'kiemkho') applyKiemKhoFilters(true);
}

function switchModule(moduleName, options = {}) {
    if (!currentUser) return;
    const allowed = getAllowedModules(currentUser.role);
    if (!allowed.includes(moduleName)) {
        alert("Bạn không có quyền truy cập vào mục này.");
        return;
    }
    if (!options.renderOnly && navigateToModulePage(moduleName)) return;

    activeModuleName = moduleName;
    ['home', 'nhapxuat', 'nhap', 'dukien', 'xuat', 'chuyenkho', 'anhdonhang', 'sanpham', 'sanphamkho', 'ton_npp', 'doisoat', 'nhanvien', 'khachhang', 'giuhang', 'kiemkho', 'dashboard', 'caidat'].forEach(m => {
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
        'dukien': 'Dự kiến hàng về',
        'xuat': 'Danh sách xuất',
        'chuyenkho': 'Điều chuyển kho',
        'sanpham': 'Danh sách sản phẩm',
        'sanphamkho': 'Danh sách sản phẩm kho',
        'ton_npp': 'Tồn NPP',
        'doisoat': 'Đối soát',
        'nhanvien': 'Danh sách nhân viên',
        'khachhang': 'Danh sách khách hàng',
        'giuhang': 'Quản lý giữ hàng',
        'dashboard': 'Báo cáo & Phân tích',
        'caidat': 'Cài đặt & Phân quyền'
    };
    titles['anhdonhang'] = 'Ảnh đơn hàng';
    titles['kiemkho'] = 'Kiểm kho';
    document.getElementById('headerTitle').textContent = titles[moduleName] || 'Hệ thống';
    updateHeaderSearch(moduleName);
    updateHeaderRefreshButton(moduleName);

    if (moduleName === 'nhapxuat') {
        if (nxDataRaw && nxDataRaw.length > 0) applyFilters();
        else renderNXModule();
    } else if (['nhap', 'dukien', 'xuat', 'chuyenkho', 'sanpham', 'sanphamkho', 'ton_npp', 'doisoat'].includes(moduleName)) {
        renderSimpleSheetModule(moduleName, false, true);
    } else if (['nhanvien', 'khachhang'].includes(moduleName)) {
        renderDsnvDirectory(moduleName);
    } else if (moduleName === 'caidat') {
        if (typeof renderCaidatModule === 'function') renderCaidatModule();
    }
}
