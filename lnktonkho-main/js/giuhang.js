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
