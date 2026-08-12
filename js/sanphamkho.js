window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.sanphamkho = {
    sheetName: () => CONFIG.warehouseProductSheetName,
    range: 'A1:F50000',
    cacheKey: 'erp_warehouse_product_cache',
    columns: ['id', 'kho', 'id_sp', 'ten_sp', 'ton_dau', 'ton_sau']
};
