(async function bootstrapApplication() {
    const fragmentHosts = Array.from(document.querySelectorAll('[data-fragment]'));

    async function loadFragment(host) {
        const file = host.dataset.fragment;
        const template = document.querySelector(`template[data-fragment-template="${file}"]`);
        let html = '';

        if (window.location.protocol !== 'file:') {
            try {
                const response = await fetch(file, { cache: 'no-cache' });
                if (response.ok) {
                    html = await response.text();
                    const documentFragment = new DOMParser().parseFromString(html, 'text/html');
                    const moduleTemplate = documentFragment.querySelector('template[data-module-fragment]');
                    if (moduleTemplate) html = moduleTemplate.innerHTML;
                }
            } catch (error) {
                console.warn(`Không thể tải ${file}, dùng bản local dự phòng.`, error);
            }
        }

        html ||= template?.innerHTML || '';
        if (!html) throw new Error(`Không thể tải fragment: ${file}`);
        host.outerHTML = html;
    }

    function loadScript(file) {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = file;
            script.onload = resolve;
            script.onerror = () => reject(new Error(`Không thể tải script: ${file}`));
            document.body.appendChild(script);
        });
    }

    try {
        await Promise.all(fragmentHosts.map(loadFragment));
        const scripts = [
            'js/core.js',
            'js/login.js',
            'js/ui.js',
            'js/home.js',
            'js/nhapxuat.js',
            'js/nhap.js',
            'js/dukien.js',
            'js/xuat.js',
            'js/chuyenkho.js',
            'js/sanpham.js',
            'js/sanphamkho.js',
            'js/doisoat.js',
            'js/nhanvien.js',
            'js/khachhang.js',
            'js/anhdonhang.js',
            'js/inventory.js',
            'js/kiemkho.js',
            'js/giuhang.js',
            'js/dashboard.js',
            'js/init.js'
        ];
        for (const file of scripts) await loadScript(file);
    } catch (error) {
        console.error('Khởi tạo ứng dụng thất bại:', error);
        document.body.innerHTML = `<div style="padding:24px;font-family:Arial;color:#b91c1c">Không thể khởi tạo ứng dụng: ${error.message}</div>`;
    }
})();
