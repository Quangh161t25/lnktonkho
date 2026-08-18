window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.sanpham = {
    sheetName: () => CONFIG.productSheetName,
    range: 'A1:F10000',
    cacheKey: 'erp_product_cache',
    columns: ['id', 'ten_sp', 'model', 'anh', 'gia_ban', 'ghi_chu']
};

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
