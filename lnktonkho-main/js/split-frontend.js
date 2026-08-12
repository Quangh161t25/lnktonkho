const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const indexPath = path.join(root, 'index.html');
const appPath = path.join(root, 'js', 'app.source.js');

function ensureDir(filePath) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
}

function write(filePath, content) {
    ensureDir(filePath);
    fs.writeFileSync(filePath, content.replace(/\r?\n/g, '\n'), 'utf8');
}

function findDivBlock(source, id) {
    const marker = `<div id="${id}"`;
    const start = source.indexOf(marker);
    if (start < 0) throw new Error(`Cannot find #${id}`);

    const tagPattern = /<\/?div\b[^>]*>/gi;
    tagPattern.lastIndex = start;
    let depth = 0;
    let match;
    while ((match = tagPattern.exec(source))) {
        depth += match[0].startsWith('</') ? -1 : 1;
        if (depth === 0) {
            return { start, end: tagPattern.lastIndex, html: source.slice(start, tagPattern.lastIndex) };
        }
    }
    throw new Error(`Unclosed #${id}`);
}

if (false) {
const fragments = [
    ['module-home', 'view-home.html'],
    ['module-nhapxuat', 'view-nhapxuat.html'],
    ['module-nhap', 'view-nhap.html'],
    ['module-dukien', 'view-dukien.html'],
    ['module-xuat', 'view-xuat.html'],
    ['module-sanpham', 'view-sanpham.html'],
    ['module-sanphamkho', 'view-sanphamkho.html'],
    ['module-chuyenkho', 'view-chuyenkho.html'],
    ['module-anhdonhang', 'view-anhdonhang.html'],
    ['module-doisoat', 'view-doisoat.html'],
    ['module-nhanvien', 'view-nhanvien.html'],
    ['module-khachhang', 'view-khachhang.html'],
    ['module-giuhang', 'view-giuhang.html'],
    ['module-kiemkho', 'view-kiemkho.html'],
    ['module-dashboard', 'view-dashboard.html']
];

const legacyFragmentPaths = {
    'modules/home/home.html': 'view-home.html',
    'modules/nhapxuat/nhapxuat.html': 'view-nhapxuat.html',
    'modules/nhap/nhap.html': 'view-nhap.html',
    'modules/dukien/dukien.html': 'view-dukien.html',
    'modules/xuat/xuat.html': 'view-xuat.html',
    'modules/sanpham/sanpham.html': 'view-sanpham.html',
    'modules/sanphamkho/sanphamkho.html': 'view-sanphamkho.html',
    'modules/chuyenkho/chuyenkho.html': 'view-chuyenkho.html',
    'modules/anhdonhang/anhdonhang.html': 'view-anhdonhang.html',
    'modules/doisoat/doisoat.html': 'view-doisoat.html',
    'modules/nhanvien/nhanvien.html': 'view-nhanvien.html',
    'modules/khachhang/khachhang.html': 'view-khachhang.html',
    'modules/giuhang/giuhang.html': 'view-giuhang.html',
    'modules/kiemkho/kiemkho.html': 'view-kiemkho.html',
    'modules/dashboard/dashboard.html': 'view-dashboard.html'
};

let index = fs.readFileSync(indexPath, 'utf8');
const loginPath = path.join(root, 'login.html');
const currentLogin = fs.readFileSync(loginPath, 'utf8');
const loginView = currentLogin.includes('<div id="loginScreen"')
    ? findDivBlock(currentLogin, 'loginScreen').html
    : findDivBlock(index, 'loginScreen').html;
Object.entries(legacyFragmentPaths).forEach(([oldPath, newPath]) => {
    index = index.split(oldPath).join(newPath);
});
fragments.forEach(([, viewFile]) => {
    const oldFile = viewFile.replace(/^view-/, '');
    index = index
        .split(`data-fragment="${oldFile}"`).join(`data-fragment="${viewFile}"`)
        .split(`data-fragment-template="${oldFile}"`).join(`data-fragment-template="${viewFile}"`);
});
index = index
    .replace(/\s*<!-- Màn hình đăng nhập \(Mặc định hiện\) -->\s*<div data-fragment="(?:login|view-login)\.html"><\/div>\s*/g, '\n')
    .replace(/\s*<div data-fragment="(?:login|view-login)\.html"><\/div>\s*/g, '\n');

let extracted;
if (fragments.some(([id]) => index.includes(`<div id="${id}"`))) {
    extracted = fragments.map(([id, file]) => ({ id, file, ...findDivBlock(index, id) }));
    extracted.sort((a, b) => b.start - a.start).forEach(item => {
        write(path.join(root, item.file), `${item.html}\n`);
        index = `${index.slice(0, item.start)}<div data-fragment="${item.file}"></div>${index.slice(item.end)}`;
    });
} else {
    extracted = fragments.map(([id, file]) => ({
        id,
        file,
        html: fs.readFileSync(path.join(root, file), 'utf8').trim()
    }));
}

index = index.replace(
    /\s*<!-- Custom Application Logic -->\s*<script src="app\.js"><\/script>/,
    '\n    <!-- Fragment and application bootstrap -->\n    <script src="js/bootstrap.js"></script>'
);
index = index.replace(/<script src="(?:js\/)?bootstrap\.js"><\/script>/, '<script src="js/bootstrap.js"></script>');
index = index.replace(/\s*<script src="fragments\.bundle\.js"><\/script>/, '');
index = index.replace(
    /\s*<!-- Generated local (?:fragment templates|fallback:[\s\S]*?) -->[\s\S]*?<!-- End generated local fragment templates -->/,
    ''
);

const inlineTemplateBlock = extracted.map(item =>
    `<template data-fragment-template="${item.file}">\n${item.html}\n</template>`
).join('\n');
index = index.replace(
    '    <!-- Fragment and application bootstrap -->',
    `    <!-- Generated local fallback: edit the separate HTML files, then run node js/split-frontend.js -->\n${inlineTemplateBlock}\n    <!-- End generated local fragment templates -->\n\n    <!-- Fragment and application bootstrap -->`
);
write(indexPath, index);

const entryPages = {
    nhap: 'nhap.html',
    dukien: 'dukien.html',
    xuat: 'xuat.html',
    chuyenkho: 'chuyenkho.html',
    anhdonhang: 'anhdonhang.html',
    sanpham: 'sanpham.html',
    sanphamkho: 'sanphamkho.html',
    doisoat: 'doisoat.html',
    nhanvien: 'nhanvien.html',
    khachhang: 'khachhang.html',
    giuhang: 'giuhang.html',
    kiemkho: 'kiemkho.html',
    dashboard: 'dashboard.html',
    nhapxuat: 'nhapxuat.html'
};
index = index.replace('<body>', '<body data-entry-module="home">');
const loginGuard = `    <script>
        if (!localStorage.getItem('erp_user_session')) {
            window.location.replace('login.html');
        }
    </script>`;
if (!index.includes("window.location.replace('login.html')")) {
    index = index.replace(/(<body data-entry-module="home">)/, `$1\n${loginGuard}`);
}
write(indexPath, index);
Object.entries(entryPages).forEach(([moduleName, file]) => {
    const page = index.replace('data-entry-module="home"', `data-entry-module="${moduleName}"`);
    write(path.join(root, file), page);
});

const head = index.match(/<head>[\s\S]*?<\/head>/)?.[0];
if (!head) throw new Error('Cannot find document head');
const loginPage = `<!DOCTYPE html>
<html lang="vi">
${head}
<body data-entry-module="login">
${loginView}

    <script src="js/bootstrap.js"></script>
</body>
</html>
`;
write(loginPath, loginPage);
}

const modules = [
    ['home', 'module-home', null],
    ['nhap', 'module-nhap', 'nhap.html'],
    ['dukien', 'module-dukien', 'dukien.html'],
    ['xuat', 'module-xuat', 'xuat.html'],
    ['sanpham', 'module-sanpham', 'sanpham.html'],
    ['sanphamkho', 'module-sanphamkho', 'sanphamkho.html'],
    ['chuyenkho', 'module-chuyenkho', 'chuyenkho.html'],
    ['doisoat', 'module-doisoat', 'doisoat.html'],
    ['nhanvien', 'module-nhanvien', 'nhanvien.html'],
    ['khachhang', 'module-khachhang', 'khachhang.html']
];

function findTemplate(source, attribute, value) {
    const escapedValue = value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`<template\\s+${attribute}="${escapedValue}"[^>]*>([\\s\\S]*?)<\\/template>`, 'i');
    return source.match(pattern)?.[1]?.trim() || '';
}

function readModuleSource(indexSource, moduleName, id, file) {
    const legacyView = path.join(root, `view-${moduleName}.html`);
    if (fs.existsSync(legacyView)) return fs.readFileSync(legacyView, 'utf8').trim();

    if (file && fs.existsSync(path.join(root, file))) {
        const current = fs.readFileSync(path.join(root, file), 'utf8');
        const wrapped = findTemplate(current, 'data-module-fragment', moduleName);
        if (wrapped) return wrapped;
        if (!current.includes('<!DOCTYPE html')) return current.trim();
    }

    for (const templateFile of [file, `view-${moduleName}.html`].filter(Boolean)) {
        const template = findTemplate(indexSource, 'data-fragment-template', templateFile);
        if (template) return template;
    }
    if (indexSource.includes(`<div id="${id}"`)) return findDivBlock(indexSource, id).html;
    throw new Error(`Cannot find HTML source for module ${moduleName}`);
}

let shell = fs.readFileSync(indexPath, 'utf8');
const moduleSources = modules.map(([moduleName, id, file]) => ({
    moduleName,
    id,
    file,
    html: readModuleSource(shell, moduleName, id, file)
}));

shell = shell.replace(
    /\s*<!-- Generated local (?:fragment templates|fallback:[\s\S]*?) -->[\s\S]*?<!-- End generated local fragment templates -->/,
    ''
);
shell = shell.replace(
    /\s*<!-- Custom Application Logic -->\s*<script src="app\.js"><\/script>/,
    '\n    <!-- Fragment and application bootstrap -->\n    <script src="js/bootstrap.js"></script>'
);
shell = shell.replace(/<script src="(?:js\/)?bootstrap\.js"><\/script>/, '<script src="js/bootstrap.js"></script>');
shell = shell.replace(/\s*<script src="fragments\.bundle\.js"><\/script>/, '');
['nhapxuat', 'anhdonhang', 'giuhang', 'kiemkho', 'dashboard'].forEach(moduleName => {
    shell = shell.replace(
        new RegExp(`\\s*<div data-fragment="(?:view-)?${moduleName}\\.html"><\\/div>`, 'g'),
        ''
    );
});

moduleSources.forEach(({ moduleName, id, file, html }) => {
    const legacyHost = `<div data-fragment="view-${moduleName}.html"></div>`;
    if (moduleName === 'home') {
        shell = shell.split(legacyHost).join(html);
        if (!shell.includes(`<div id="${id}"`)) throw new Error('Cannot place home module in index.html');
        return;
    }
    shell = shell
        .split(legacyHost).join(`<div data-fragment="${file}"></div>`)
        .split(`<div data-fragment="${file}"></div>`).join(`<div data-fragment="${file}"></div>`);
});

shell = shell.replace('<body>', '<body data-entry-module="home">');
const loginGuard = `    <script>
        const requestedModule = new URLSearchParams(window.location.search).get('module');
        if (requestedModule) document.body.dataset.entryModule = requestedModule;
        if (!localStorage.getItem('erp_user_session')) {
            window.location.replace('login.html');
        }
    </script>`;
shell = shell.replace(
    /<body data-entry-module="home">(?:\s*<script>[\s\S]*?window\.location\.replace\('login\.html'\);[\s\S]*?<\/script>)?/,
    `<body data-entry-module="home">\n${loginGuard}`
);

const fragmentModules = moduleSources.filter(module => module.file);
const fallbackTemplates = fragmentModules.map(module =>
    `<template data-fragment-template="${module.file}">\n${module.html}\n</template>`
).join('\n');
shell = shell.replace(
    '    <!-- Fragment and application bootstrap -->',
    `    <!-- Generated local fallback: edit module HTML, then run node js/split-frontend.js -->\n${fallbackTemplates}\n    <!-- End generated local fragment templates -->\n\n    <!-- Fragment and application bootstrap -->`
);
write(indexPath, shell);

fragmentModules.forEach(({ moduleName, file, html }) => {
    const modulePage = `<!DOCTYPE html>
<html lang="vi">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${moduleName}</title>
</head>
<body>
    <script>
        window.location.replace('index.html?module=${moduleName}');
    </script>
    <template data-module-fragment="${moduleName}">
${html}
    </template>
</body>
</html>
`;
    write(path.join(root, file), modulePage);
});

const app = fs.readFileSync(appPath, 'utf8').replace(/\r\n/g, '\n');
const markers = [
    ['auth', '// ─── Auth & Token'],
    ['ui', '// ─── UI Helpers'],
    ['inventory', '// ─── Module: Nhập Xuất'],
    ['kiemkho', '// ─── Module: Kiểm Kho'],
    ['giuhang', '// ─── Module: Giữ Hàng'],
    ['dashboard', '// ─── Dashboard Helpers'],
    ['init', '// ─── App Init']
];
const positions = markers.map(([name, marker]) => {
    const position = app.indexOf(marker);
    if (position < 0) throw new Error(`Cannot find JS marker: ${marker}`);
    return { name, marker, position };
});

const jsParts = {
    'js/core.js': app.slice(0, positions[0].position),
    'js/login.js': app.slice(positions[0].position, positions[1].position),
    'js/ui.js': app.slice(positions[1].position, positions[2].position),
    'js/inventory.js': app.slice(positions[2].position, positions[3].position),
    'js/kiemkho.js': app.slice(positions[3].position, positions[4].position),
    'js/giuhang.js': app.slice(positions[4].position, positions[5].position),
    'js/dashboard.js': app.slice(positions[5].position, positions[6].position),
    'js/init.js': app.slice(positions[6].position)
};
jsParts['js/inventory.js'] = jsParts['js/inventory.js'].replace(
    /const SIMPLE_SHEET_MODULES = \{[\s\S]*?\n\};\nlet simpleSheetUploadModule/,
    'const SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};\nlet simpleSheetUploadModule'
);
jsParts['js/init.js'] = jsParts['js/init.js']
    .replace("window.addEventListener('load', async () => {", 'async function initializeApplication() {')
    .replace(
        /\n\}\);\n\n\/\/ Open warehouse view/,
        "\n}\n\nif (document.readyState === 'complete') initializeApplication();\nelse window.addEventListener('load', initializeApplication, { once: true });\n\n// Open warehouse view"
    );
Object.entries(jsParts).forEach(([file, content]) => write(path.join(root, file), `${content.trim()}\n`));

const moduleRegistrations = {
    nhap: `window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.nhap = {
    sheetName: () => CONFIG.nhapSheetName,
    range: 'A1:Q60000',
    cacheKey: 'erp_nhap_cache',
    columns: ['id', 'ngay', 'truong', 'mdh', 'ma_kh', 'ten_khach', 'id_sp', 'ten_sp', 'slg', 'don_gia', 'thanh_tien', 'kho', 'id_nv_nhan', 'ghi_chu', 'loai_hinh', 'ngay_dat_hang', 'tinh_trang']
};`,
    dukien: `window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.dukien = {
    sheetName: () => CONFIG.expectedSheetName,
    range: 'A1:M60000',
    cacheKey: 'erp_expected_cache',
    columns: ['id', 'stt', 'ngay_nhap', 'ma_po', 'id_sp', 'ten_sp', 'dvt', 'so_luong_du_kien', 'ngay_ve_du_kien', 'trang_thai', 'slg_thuc_nhan', 'chenh_lech', 'ghi_chu']
};`,
    xuat: `window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.xuat = {
    sheetName: () => CONFIG.xuatSheetName,
    range: 'A1:O60000',
    cacheKey: 'erp_xuat_cache',
    columns: ['id', 'ngay', 'truong', 'mdh', 'ma_kh', 'ten_khach', 'id_sp', 'ten_sp', 'slg', 'don_gia', 'thanh_tien', 'kho', 'id_nv_xuat', 'ghi_chu', 'loai_hinh']
};`,
    chuyenkho: `window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.chuyenkho = {
    sheetName: () => CONFIG.transferSheetName,
    range: 'A1:K60000',
    cacheKey: 'erp_transfer_cache',
    columns: ['id', 'ngay', 'mdh', 'id_sp', 'ten_sp', 'slg', 'kho_di', 'kho_nhan', 'ghi_chu', 'tinh_trang', 'trang_thai']
};`,
    sanpham: `window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.sanpham = {
    sheetName: () => CONFIG.productSheetName,
    range: 'A1:F10000',
    cacheKey: 'erp_product_cache',
    columns: ['id', 'ten_sp', 'model', 'anh', 'gia_ban', 'ghi_chu']
};`,
    sanphamkho: `window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.sanphamkho = {
    sheetName: () => CONFIG.warehouseProductSheetName,
    range: 'A1:F50000',
    cacheKey: 'erp_warehouse_product_cache',
    columns: ['id', 'kho', 'id_sp', 'ten_sp', 'ton_dau', 'ton_sau']
};`,
    doisoat: `window.APP_SIMPLE_SHEET_MODULES = window.APP_SIMPLE_SHEET_MODULES || {};
window.APP_SIMPLE_SHEET_MODULES.doisoat = {
    sheetName: () => CONFIG.reconciliationSheetName,
    range: 'A1:C50000',
    cacheKey: 'erp_reconciliation_cache',
    columns: ['id', 'ten_sp', 'ton_misa']
};`,
    nhanvien: `window.APP_MODULE_FILES = window.APP_MODULE_FILES || {};
window.APP_MODULE_FILES.nhanvien = ['nhanvien'];`,
    khachhang: `window.APP_MODULE_FILES = window.APP_MODULE_FILES || {};
window.APP_MODULE_FILES.khachhang = ['khachhang'];`,
    anhdonhang: `window.APP_MODULE_FILES = window.APP_MODULE_FILES || {};
window.APP_MODULE_FILES.anhdonhang = ['anhdonhang'];`,
    nhapxuat: `window.APP_MODULE_FILES = window.APP_MODULE_FILES || {};
window.APP_MODULE_FILES.nhapxuat = ['nhapxuat'];`,
    home: `window.APP_MODULE_FILES = window.APP_MODULE_FILES || {};
window.APP_MODULE_FILES.home = ['home'];`
};
Object.entries(moduleRegistrations).forEach(([folder, content]) => {
    const file = path.join(root, 'js', `${folder}.js`);
    write(file, `${content}\n`);
});

console.log(`Built ${fragmentModules.length} module HTML files and ${Object.keys(jsParts).length} JS sections.`);
