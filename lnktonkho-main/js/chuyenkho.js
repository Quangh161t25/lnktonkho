window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.chuyenkho = {
    sheetName: () => CONFIG.transferSheetName,
    range: 'A1:K60000',
    cacheKey: 'erp_transfer_cache',
    columns: ['id', 'ngay', 'mdh', 'id_sp', 'ten_sp', 'slg', 'kho_di', 'kho_nhan', 'ghi_chu', 'tinh_trang', 'trang_thai']
};
