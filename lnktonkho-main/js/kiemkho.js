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
