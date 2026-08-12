window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.dukien = {
    sheetName: () => CONFIG.expectedSheetName,
    range: 'A1:M60000',
    cacheKey: 'erp_expected_cache',
    columns: ['id', 'stt', 'ngay_nhap', 'ma_po', 'id_sp', 'ten_sp', 'dvt', 'so_luong_du_kien', 'ngay_ve_du_kien', 'trang_thai', 'slg_thuc_nhan', 'chenh_lech', 'ghi_chu']
};
