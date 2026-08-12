window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.doisoat = {
    sheetName: () => CONFIG.reconciliationSheetName,
    range: 'A1:C50000',
    cacheKey: 'erp_reconciliation_cache',
    columns: ['id', 'ten_sp', 'ton_misa']
};
