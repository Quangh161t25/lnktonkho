window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.ton_npp = {
    sheetName: () => CONFIG.tonNppSheetName,
    range: 'A1:E60000',
    cacheKey: 'erp_ton_npp_cache',
    columns: ['id', 'ngay', 'ma_kh', 'id_sp', 'ton_cuoi']
};
