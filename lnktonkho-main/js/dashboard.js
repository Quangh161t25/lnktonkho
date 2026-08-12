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
