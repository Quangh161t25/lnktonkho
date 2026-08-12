window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.sanpham = {
    sheetName: () => CONFIG.productSheetName,
    range: 'A1:F10000',
    cacheKey: 'erp_product_cache',
    columns: ['id', 'ten_sp', 'model', 'anh', 'gia_ban', 'ghi_chu']
};
