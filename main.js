import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

class DocumentGenerator {
    constructor() {
        this.currentPage = 'home';
        
        this.currentStampType = null;
        this.stampConfigs = { receipt: null, invoice: null, note: null };
        this.selectedStampTemplate = 'circular';

        this.currentBackgroundType = null;
        this.backgroundConfigs = { receipt: null, invoice: null, note: null };
        this.selectedBgClass = null;
        this.bgClasses = ['bg-minimalis', 'bg-profesional', 'bg-modern', 'bg-klasik', 'bg-geometris', 'bg-watermark'];

        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupForms();
        this.setupEventListeners();
        this.setupStampSystem();
        this.setupBackgroundSystem();
        this.setCurrentDate();
    }

    setupNavigation() {
        // Desktop navigation
        document.getElementById('home-nav').addEventListener('click', () => this.showPage('home'));
        document.getElementById('receipt-nav').addEventListener('click', () => this.showPage('receipt'));
        document.getElementById('invoice-nav').addEventListener('click', () => this.showPage('invoice'));
        document.getElementById('note-nav').addEventListener('click', () => this.showPage('note'));

        // Mobile menu toggle
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const mobileMenu = document.getElementById('mobile-menu');
        
        mobileMenuBtn?.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });

        // Mobile navigation
        const mobileNavBtns = document.querySelectorAll('.mobile-nav-btn');
        mobileNavBtns.forEach((btn, index) => {
            const pages = ['home', 'receipt', 'invoice', 'note'];
            btn.addEventListener('click', () => {
                this.showPage(pages[index]);
                mobileMenu.classList.add('hidden');
            });
        });

        // Home page cards
        const cards = document.querySelectorAll('[data-page]');
        cards.forEach(card => {
            card.addEventListener('click', () => {
                const page = card.getAttribute('data-page');
                this.showPage(page);
            });
        });
    }

    setupForms() {
        // Form submissions
        ['receipt', 'invoice', 'note'].forEach(type => {
            document.getElementById(`${type}-form`).addEventListener('submit', (e) => {
                e.preventDefault();
                this.generatePreview(type);
            });
        });

        // Add item buttons
        document.getElementById('add-receipt-item').addEventListener('click', () => this.addItemRow('receipt-items'));
        document.getElementById('add-invoice-item').addEventListener('click', () => this.addItemRow('invoice-items'));
    }

    setupEventListeners() {
        // PDF download buttons
        ['receipt', 'invoice', 'note'].forEach(type => {
            const typeIndo = type === 'receipt' ? 'kwitansi' : (type === 'invoice' ? 'faktur' : 'nota');
            document.getElementById(`download-${type}-pdf`).addEventListener('click', (e) => {
                this.downloadPDF(`${type}-preview`, typeIndo, e.target);
            });
        });

        // Item calculation listeners
        document.addEventListener('input', (e) => {
            if (e.target.classList.contains('item-quantity') || e.target.classList.contains('item-price')) {
                this.calculateTotals(e.target);
            }
        });
    }

    setupStampSystem() {
        ['receipt', 'invoice', 'note'].forEach(type => {
            document.getElementById(`select-${type}-stamp`).addEventListener('click', () => this.openStampModal(type));
            document.getElementById(`clear-${type}-stamp`).addEventListener('click', () => this.clearStamp(type));
        });

        // Modal controls
        document.getElementById('close-stamp-modal').addEventListener('click', () => this.closeStampModal());
        document.getElementById('cancel-stamp').addEventListener('click', () => this.closeStampModal());
        document.getElementById('apply-stamp').addEventListener('click', () => this.applyStamp());

        // Stamp customization inputs
        ['stamp-main-text', 'stamp-sub-text', 'stamp-status-text', 'stamp-color', 'stamp-size'].forEach(id => {
            document.getElementById(id).addEventListener('input', () => this.updateStampPreview());
        });

        this.createStampTemplates();
    }

    setupBackgroundSystem() {
        ['receipt', 'invoice', 'note'].forEach(type => {
            document.getElementById(`select-${type}-background`).addEventListener('click', () => this.openBackgroundModal(type));
            document.getElementById(`clear-${type}-background`).addEventListener('click', () => this.clearBackground(type));
        });

        // Modal controls
        document.getElementById('close-background-modal').addEventListener('click', () => this.closeBackgroundModal());
        document.getElementById('cancel-background').addEventListener('click', () => this.closeBackgroundModal());
        document.getElementById('apply-background').addEventListener('click', () => this.applyBackground());

        this.createBackgroundTemplates();
    }

    createStampTemplates() {
        const templates = [
            { id: 'circular', name: 'Lingkaran' },
            { id: 'rectangular', name: 'Persegi Panjang' },
            { id: 'square', name: 'Persegi' },
            { id: 'official', name: 'Resmi' },
            { id: 'vintage', name: 'Vintage' },
            { id: 'shield', name: 'Perisai' },
            { id: 'hexagon', name: 'Heksagon' },
            { id: 'starred', name: 'Bintang' }
        ];

        const container = document.getElementById('stamp-templates');
        container.innerHTML = templates.map(template => {
            const previewHTML = this.createStampHTML(template.id, 'CONTOH', 'Teks', 'STATUS', 'blue', 'small');
            return `
                <div class="stamp-template border-2 border-gray-200 rounded-lg p-2 cursor-pointer hover:border-primary-500 hover:bg-primary-50 transition-colors" data-template="${template.id}">
                    <div class="flex flex-col items-center justify-center h-full">
                        <div class="mb-2 scale-75 transform">${previewHTML}</div>
                        <span class="text-sm font-medium text-gray-700 text-center">${template.name}</span>
                    </div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.stamp-template').forEach(template => {
            template.addEventListener('click', () => {
                container.querySelectorAll('.stamp-template').forEach(t => t.classList.replace('border-primary-500', 'border-gray-200'));
                template.classList.replace('border-gray-200', 'border-primary-500');
                this.selectedStampTemplate = template.dataset.template;
                this.updateStampPreview();
            });
        });

        if (templates.length > 0) {
            container.querySelector('.stamp-template').click();
        }
    }

    createBackgroundTemplates() {
        const templates = [
            { id: 'bg-minimalis', name: 'Minimalis' },
            { id: 'bg-profesional', name: 'Profesional' },
            { id: 'bg-modern', name: 'Modern' },
            { id: 'bg-klasik', name: 'Klasik' },
            { id: 'bg-geometris', name: 'Geometris' },
            { id: 'bg-watermark', name: 'Watermark' }
        ];

        const container = document.getElementById('background-templates');
        container.innerHTML = templates.map(template => `
            <div class="w-full h-24 rounded-lg border-2 border-gray-200 cursor-pointer flex items-center justify-center text-center p-2 ${template.id}" data-bg-class="${template.id}">
                <span class="font-semibold text-gray-700 bg-white bg-opacity-50 px-2 py-1 rounded">${template.name}</span>
            </div>
        `).join('');

        container.querySelectorAll('[data-bg-class]').forEach(template => {
            template.addEventListener('click', () => {
                container.querySelectorAll('[data-bg-class]').forEach(t => t.classList.replace('border-primary-500', 'border-gray-200'));
                template.classList.replace('border-gray-200', 'border-primary-500');
                this.selectedBgClass = template.dataset.bgClass;
            });
        });
    }

    openStampModal(type) {
        this.currentStampType = type;
        const modal = document.getElementById('stamp-modal');
        modal.classList.replace('hidden', 'flex');

        const config = this.stampConfigs[type] || { mainText: 'NAMA PERUSAHAAN', subText: 'Alamat Perusahaan', statusText: 'LUNAS', color: 'blue', size: 'medium', template: 'circular' };
        
        document.getElementById('stamp-main-text').value = config.mainText;
        document.getElementById('stamp-sub-text').value = config.subText;
        document.getElementById('stamp-status-text').value = config.statusText;
        document.getElementById('stamp-color').value = config.color;
        document.getElementById('stamp-size').value = config.size;
        
        const templateButton = document.querySelector(`.stamp-template[data-template="${config.template}"]`);
        if (templateButton) templateButton.click();
        else document.querySelector('.stamp-template').click();

        this.updateStampPreview();
    }

    closeStampModal() {
        document.getElementById('stamp-modal').classList.replace('flex', 'hidden');
        this.currentStampType = null;
    }

    updateStampPreview() {
        const mainText = document.getElementById('stamp-main-text').value;
        const subText = document.getElementById('stamp-sub-text').value;
        const statusText = document.getElementById('stamp-status-text').value;
        const color = document.getElementById('stamp-color').value;
        const size = document.getElementById('stamp-size').value;

        document.getElementById('stamp-preview-modal').innerHTML = this.createStampHTML(this.selectedStampTemplate, mainText, subText, statusText, color, size);
    }

    applyStamp() {
        const type = this.currentStampType;
        if (!type) return;

        this.stampConfigs[type] = {
            template: this.selectedStampTemplate,
            mainText: document.getElementById('stamp-main-text').value,
            subText: document.getElementById('stamp-sub-text').value,
            statusText: document.getElementById('stamp-status-text').value,
            color: document.getElementById('stamp-color').value,
            size: document.getElementById('stamp-size').value
        };

        const previewContainer = document.getElementById(`${type}-stamp-preview`);
        previewContainer.innerHTML = this.createStampHTML(
            this.stampConfigs[type].template, 
            this.stampConfigs[type].mainText, 
            this.stampConfigs[type].subText, 
            this.stampConfigs[type].statusText, 
            this.stampConfigs[type].color, 
            'small' // Always use small for form preview
        );
        previewContainer.classList.remove('hidden');
        document.getElementById(`clear-${type}-stamp`).classList.remove('hidden');

        this.closeStampModal();
        this.generatePreview(type, false);
    }

    clearStamp(type) {
        this.stampConfigs[type] = null;
        document.getElementById(`${type}-stamp-preview`).classList.add('hidden');
        document.getElementById(`clear-${type}-stamp`).classList.add('hidden');
        this.generatePreview(type, false);
    }

    openBackgroundModal(type) {
        this.currentBackgroundType = type;
        const modal = document.getElementById('background-modal');
        modal.classList.replace('hidden', 'flex');

        const currentBg = this.backgroundConfigs[type];
        document.querySelectorAll('[data-bg-class]').forEach(t => t.classList.replace('border-primary-500', 'border-gray-200'));
        if (currentBg) {
            const templateButton = document.querySelector(`[data-bg-class="${currentBg}"]`);
            if (templateButton) templateButton.click();
        } else {
            this.selectedBgClass = null;
        }
    }

    closeBackgroundModal() {
        document.getElementById('background-modal').classList.replace('flex', 'hidden');
        this.currentBackgroundType = null;
    }

    applyBackground() {
        const type = this.currentBackgroundType;
        if (!type) return;

        this.backgroundConfigs[type] = this.selectedBgClass;
        document.getElementById(`clear-${type}-background`).classList.toggle('hidden', !this.selectedBgClass);
        this.updateDocumentBackground(type);
        this.closeBackgroundModal();
    }

    clearBackground(type) {
        this.backgroundConfigs[type] = null;
        document.getElementById(`clear-${type}-background`).classList.add('hidden');
        this.updateDocumentBackground(type);
    }

    updateDocumentBackground(type) {
        const previewEl = document.getElementById(`${type}-preview`);
        if (!previewEl) return;

        // Remove all possible background classes
        previewEl.classList.remove(...this.bgClasses);
        
        const newBgClass = this.backgroundConfigs[type];
        if (newBgClass) {
            previewEl.classList.add(newBgClass);
        }
        this.generatePreview(type, false);
    }

    getStampHTML(type) {
        const stamp = this.stampConfigs[type];
        if (!stamp) return '';

        return `
            <div class="relative z-10 float-right ml-4 mb-4 stamp-container">
                ${this.createStampHTML(stamp.template, stamp.mainText, stamp.subText, stamp.statusText, stamp.color, stamp.size)}
            </div>
        `;
    }

    createStampHTML(template, mainText, subText, statusText, color, size) {
        const colors = {
            blue:   { border: 'border-blue-600', text: 'text-blue-600', rgb: '59, 130, 246', stroke: 'stroke-blue-600', fill: 'fill-blue-500' },
            red:    { border: 'border-red-600', text: 'text-red-600', rgb: '239, 68, 68', stroke: 'stroke-red-600', fill: 'fill-red-500' },
            green:  { border: 'border-green-600', text: 'text-green-600', rgb: '34, 197, 94', stroke: 'stroke-green-600', fill: 'fill-green-500' },
            purple: { border: 'border-purple-600', text: 'text-purple-600', rgb: '168, 85, 247', stroke: 'stroke-purple-600', fill: 'fill-purple-500' },
            black:  { border: 'border-gray-800', text: 'text-gray-800', rgb: '55, 65, 81', stroke: 'stroke-black', fill: 'fill-gray-700' }
        };
        const selectedColor = colors[color];

        const sizeClasses = { small: 'w-20 h-20 text-xs', medium: 'w-24 h-24 text-sm', large: 'w-28 h-28 text-base' };
        const rectSizeClasses = { small: 'w-24 text-xs', medium: 'w-28 text-sm', large: 'w-32 text-base' };
        
        const baseClass = `${selectedColor.border} ${selectedColor.text}`;
        const styleAttr = `style="--stamp-bg-color: ${selectedColor.rgb};"`;

        const circularBaseClasses = 'inline-flex items-center justify-center border-4 rounded-full font-bold text-center leading-tight select-none';
        const rectangularBaseClasses = 'inline-block border-4 rounded px-3 py-2 font-bold text-center leading-tight select-none';
        const squareBaseClasses = 'inline-flex items-center justify-center border-4 rounded font-bold text-center leading-tight select-none aspect-square';

        switch (template) {
            case 'circular': return `<div class="${circularBaseClasses} ${baseClass} ${sizeClasses[size]} p-1">${this.stampText(mainText, subText, statusText)}</div>`;
            case 'rectangular': return `<div class="${rectangularBaseClasses} ${baseClass} ${rectSizeClasses[size]}">${this.stampText(mainText, subText, statusText)}</div>`;
            case 'square': return `<div class="${squareBaseClasses} ${baseClass} ${sizeClasses[size]} p-1">${this.stampText(mainText, subText, statusText)}</div>`;
            case 'official': return `<div class="stamp-official ${baseClass} ${rectSizeClasses[size]}" ${styleAttr}>${this.stampOfficialText(mainText, subText, statusText)}</div>`;
            case 'vintage': return `<div class="stamp-vintage ${circularBaseClasses} border-double border-8 ${baseClass} ${sizeClasses[size]} p-1">${this.stampText(mainText, subText, statusText, 'tracking-widest')}</div>`;
            case 'shield': return `<div class="stamp-shield relative ${sizeClasses[size]} ${selectedColor.text} flex items-center justify-center font-bold"><svg class="absolute w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"><path d="M50 0 L100 10 L100 60 L50 100 L0 60 L0 10 Z" class="${selectedColor.fill}" fill-opacity="0.1"></path><path d="M50 0 L100 10 L100 60 L50 100 L0 60 L0 10 Z" fill="none" class="${selectedColor.stroke}" stroke-width="5"></path></svg><div class="relative text-center leading-tight p-2">${this.stampText(mainText, subText, statusText)}</div></div>`;
            case 'hexagon': return `<div class="stamp-hexagon ${baseClass} ${sizeClasses[size]} flex items-center justify-center p-2 font-bold leading-tight" ${styleAttr}><div class="text-center">${this.stampText(mainText, subText, statusText)}</div></div>`;
            case 'starred': return `<div class="${circularBaseClasses} ${baseClass} ${sizeClasses[size]} p-1">${this.stampText(mainText, subText, `<span class="text-amber-500">${statusText}</span>`)}</div>`;
            default: return '';
        }
    }

    stampText(main, sub, status, statusClass = '') {
        return `
            <div class="flex flex-col items-center justify-center h-full text-center font-bold leading-tight">
                <div>${main}</div>
                ${sub ? `<div class="text-xs opacity-75 font-medium">${sub}</div>` : ''}
                ${status ? `<div class="text-xs font-black mt-1 ${statusClass}">${status}</div>` : ''}
            </div>
        `;
    }

    stampOfficialText(main, sub, status) {
        return `
            <div class="font-bold text-center leading-tight">
                <div class="border-b border-current pb-1">${main}</div>
                ${sub ? `<div class="text-xs opacity-75 py-1 font-medium">${sub}</div>` : ''}
                ${status ? `<div class="text-xs font-black border-t border-current pt-1">${status}</div>` : ''}
            </div>
        `;
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        ['receipt-date', 'invoice-date', 'note-date'].forEach(id => document.getElementById(id).value = today);
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + 30);
        document.getElementById('invoice-due-date').value = dueDate.toISOString().split('T')[0];
    }

    showPage(page) {
        document.querySelectorAll('.page-content').forEach(p => p.classList.add('hidden'));
        document.getElementById(`${page}-page`).classList.remove('hidden');
        this.updateNavigation(page);
        this.currentPage = page;
    }

    updateNavigation(activePage) {
        document.querySelectorAll('.nav-btn, .mobile-nav-btn').forEach(btn => {
            const isMatch = btn.id === `${activePage}-nav` || (btn.classList.contains('mobile-nav-btn') && btn.textContent.toLowerCase().includes(activePage));
            btn.classList.toggle('text-primary-600', isMatch);
            btn.classList.toggle('border-primary-600', isMatch && !btn.classList.contains('mobile-nav-btn'));
            btn.classList.toggle('border-b-2', isMatch && !btn.classList.contains('mobile-nav-btn'));
            btn.classList.toggle('font-medium', isMatch);
            btn.classList.toggle('text-gray-500', !isMatch);
        });
    }

    addItemRow(containerId) {
        const container = document.getElementById(containerId);
        const itemRow = document.createElement('div');
        itemRow.className = 'item-row grid grid-cols-12 gap-2';
        itemRow.innerHTML = `
            <input type="text" placeholder="Deskripsi barang/jasa" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors duration-200 col-span-6 item-description">
            <input type="number" placeholder="Qty" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors duration-200 col-span-2 item-quantity" min="1" value="1">
            <input type="number" placeholder="${containerId === 'invoice-items' ? 'Tarif' : 'Harga'}" class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-colors duration-200 col-span-3 item-price" step="0.01">
            <button type="button" class="bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:bg-gray-200 col-span-1 remove-item">×</button>
        `;
        container.appendChild(itemRow);
        itemRow.querySelector('.remove-item').addEventListener('click', () => {
            itemRow.remove();
            this.calculateTotals();
        });
        container.querySelectorAll('.remove-item').forEach(btn => btn.classList.remove('hidden'));
    }

    calculateTotals() { /* Unchanged */ }

    generatePreview(type, checkForm = true) {
        const form = document.getElementById(`${type}-form`);
        if (checkForm && !form.checkValidity()) {
            form.reportValidity();
            return;
        }
        switch(type) {
            case 'receipt': this.generateReceiptPreview(); break;
            case 'invoice': this.generateInvoicePreview(); break;
            case 'note': this.generateNotePreview(); break;
        }
    }

    generateReceiptPreview() {
        const formData = this.getFormData('receipt');
        const preview = document.getElementById('receipt-preview');
        preview.classList.remove(...this.bgClasses);
        if (this.backgroundConfigs.receipt) preview.classList.add(this.backgroundConfigs.receipt);
        
        let itemsHTML = '';
        let total = 0;
        formData.items.forEach(item => {
            const itemTotal = item.quantity * item.price;
            total += itemTotal;
            itemsHTML += `<tr class="border-b border-gray-200"><td class="py-2">${item.description}</td><td class="py-2 text-center">${item.quantity}</td><td class="py-2 text-right">Rp ${this.formatCurrency(item.price)}</td><td class="py-2 text-right font-medium">Rp ${this.formatCurrency(itemTotal)}</td></tr>`;
        });

        preview.innerHTML = `
            <div class="relative z-10">
                <div class="text-center mb-8">
                    <h1 class="text-3xl font-bold text-gray-800 mb-2">KWITANSI</h1>
                    <div class="text-sm text-gray-600"><p class="font-medium">GeneratorDok</p><p>Solusi Dokumen Profesional</p><p>kontak@generatordok.com</p></div>
                </div>
                <div class="grid grid-cols-2 gap-8 mb-8">
                    <div><h3 class="font-semibold text-gray-800 mb-2">Informasi Pelanggan</h3><p class="text-gray-700">${formData.customerName}</p>${formData.customerAddress ? `<p class="text-gray-600 text-sm">${formData.customerAddress}</p>` : ''}</div>
                    <div class="text-right"><p class="text-sm text-gray-600">No. Kwitansi: <span class="font-medium">${formData.receiptNumber}</span></p><p class="text-sm text-gray-600">Tanggal: <span class="font-medium">${this.formatDate(formData.date)}</span></p></div>
                </div>
                <table class="w-full mb-8"><thead><tr class="border-b-2 border-gray-800"><th class="text-left py-2">Deskripsi</th><th class="text-center py-2">Qty</th><th class="text-right py-2">Harga</th><th class="text-right py-2">Total</th></tr></thead><tbody>${itemsHTML}</tbody></table>
                <div class="text-right mb-8"><div class="inline-block"><div class="flex justify-between w-48 border-t-2 border-gray-800 pt-2"><span class="font-bold">TOTAL:</span><span class="font-bold">Rp ${this.formatCurrency(total)}</span></div></div></div>
                ${formData.notes ? `<div class="border-t border-gray-200 pt-4 mb-8"><p class="text-sm text-gray-600">${formData.notes}</p></div>` : ''}
                ${this.getStampHTML('receipt')}<div class="clear-both"></div>
                <div class="text-center mt-8 text-xs text-gray-500"><p>Terima kasih atas kepercayaan Anda!</p></div>
            </div>`;
    }

    generateInvoicePreview() {
        const formData = this.getFormData('invoice');
        const preview = document.getElementById('invoice-preview');
        preview.classList.remove(...this.bgClasses);
        if (this.backgroundConfigs.invoice) preview.classList.add(this.backgroundConfigs.invoice);

        let itemsHTML = '';
        let subtotal = 0;
        formData.items.forEach(item => {
            const itemTotal = item.quantity * item.price;
            subtotal += itemTotal;
            itemsHTML += `<tr class="border-b border-gray-200"><td class="py-2">${item.description}</td><td class="py-2 text-center">${item.quantity}</td><td class="py-2 text-right">Rp ${this.formatCurrency(item.price)}</td><td class="py-2 text-right font-medium">Rp ${this.formatCurrency(itemTotal)}</td></tr>`;
        });
        const discount = subtotal * (formData.discountRate / 100);
        const afterDiscount = subtotal - discount;
        const tax = afterDiscount * (formData.taxRate / 100);
        const total = afterDiscount + tax;

        preview.innerHTML = `
            <div class="relative z-10">
                <div class="flex justify-between items-start mb-8">
                    <div><h1 class="text-3xl font-bold text-gray-800 mb-2">FAKTUR</h1><div class="text-sm text-gray-600"><p class="font-medium">GeneratorDok</p><p>Solusi Dokumen Profesional</p><p>kontak@generatordok.com</p></div></div>
                    <div class="text-right"><p class="text-sm text-gray-600">No. Faktur: <span class="font-medium">${formData.invoiceNumber}</span></p><p class="text-sm text-gray-600">Tanggal: <span class="font-medium">${this.formatDate(formData.date)}</span></p><p class="text-sm text-gray-600">Jatuh Tempo: <span class="font-medium">${this.formatDate(formData.dueDate)}</span></p><p class="text-sm text-gray-600">Syarat: <span class="font-medium">${this.translatePaymentTerms(formData.paymentTerms)}</span></p></div>
                </div>
                <div class="mb-8"><h3 class="font-semibold text-gray-800 mb-2">Ditagih Kepada:</h3><p class="text-gray-700 font-medium">${formData.billToName}</p>${formData.billToAddress ? `<p class="text-gray-600 text-sm whitespace-pre-line">${formData.billToAddress}</p>` : ''}</div>
                <table class="w-full mb-8"><thead><tr class="border-b-2 border-gray-800"><th class="text-left py-2">Deskripsi</th><th class="text-center py-2">Qty</th><th class="text-right py-2">Tarif</th><th class="text-right py-2">Jumlah</th></tr></thead><tbody>${itemsHTML}</tbody></table>
                <div class="flex justify-end mb-8"><div class="w-64"><div class="flex justify-between py-1"><span>Subtotal:</span><span>Rp ${this.formatCurrency(subtotal)}</span></div>${formData.discountRate > 0 ? `<div class="flex justify-between py-1 text-red-600"><span>Diskon (${formData.discountRate}%):</span><span>-Rp ${this.formatCurrency(discount)}</span></div>` : ''}${formData.taxRate > 0 ? `<div class="flex justify-between py-1"><span>Pajak (${formData.taxRate}%):</span><span>Rp ${this.formatCurrency(tax)}</span></div>` : ''}<div class="flex justify-between border-t-2 border-gray-800 pt-2 font-bold text-lg"><span>TOTAL:</span><span>Rp ${this.formatCurrency(total)}</span></div></div></div>
                ${formData.notes ? `<div class="border-t border-gray-200 pt-4 mb-8"><h4 class="font-semibold text-gray-800 mb-2">Catatan:</h4><p class="text-sm text-gray-600">${formData.notes}</p></div>` : ''}
                ${this.getStampHTML('invoice')}<div class="clear-both"></div>
                <div class="text-center mt-8 text-xs text-gray-500"><p>Terima kasih atas kepercayaan Anda!</p></div>
            </div>`;
    }

    generateNotePreview() {
        const formData = this.getFormData('note');
        const preview = document.getElementById('note-preview');
        preview.classList.remove(...this.bgClasses);
        if (this.backgroundConfigs.note) preview.classList.add(this.backgroundConfigs.note);

        preview.innerHTML = `
            <div class="relative z-10">
                <div class="text-center mb-8"><h1 class="text-3xl font-bold text-gray-800 mb-2">NOTA DINAS</h1><div class="text-sm text-gray-600"><p class="font-medium">GeneratorDok</p><p>Solusi Dokumen Profesional</p></div></div>
                <div class="mb-8 space-y-2">
                    <div class="grid grid-cols-3 gap-4">
                        <div class="border-b border-gray-300 pb-1"><span class="text-sm font-semibold text-gray-700">KEPADA:</span><p class="text-gray-800">${formData.to}</p></div>
                        <div class="border-b border-gray-300 pb-1"><span class="text-sm font-semibold text-gray-700">DARI:</span><p class="text-gray-800">${formData.from || 'GeneratorDok'}</p></div>
                        <div class="border-b border-gray-300 pb-1"><span class="text-sm font-semibold text-gray-700">TANGGAL:</span><p class="text-gray-800">${this.formatDate(formData.date)}</p></div>
                    </div>
                    <div class="border-b border-gray-300 pb-1"><span class="text-sm font-semibold text-gray-700">SUBJEK:</span><p class="text-gray-800 font-medium">${formData.subject}</p></div>
                    <div class="border-b border-gray-300 pb-1"><span class="text-sm font-semibold text-gray-700">NO. NOTA:</span><p class="text-gray-800">${formData.noteNumber}</p></div>
                </div>
                <div class="mb-8"><div class="text-gray-800 leading-relaxed whitespace-pre-line">${formData.message}</div></div>
                ${this.getStampHTML('note')}<div class="clear-both"></div>
                <div class="text-center mt-12 text-xs text-gray-500"><p>Dokumen ini dibuat secara elektronik dan sah tanpa tanda tangan.</p></div>
            </div>`;
    }

    getFormData(type) {
        const getItems = (containerId) => {
            const items = [];
            document.querySelectorAll(`#${containerId} .item-row`).forEach(row => {
                const description = row.querySelector('.item-description').value;
                const quantity = parseFloat(row.querySelector('.item-quantity').value) || 0;
                const price = parseFloat(row.querySelector('.item-price').value) || 0;
                if (description && quantity > 0 && price > 0) items.push({ description, quantity, price });
            });
            return items;
        };

        switch (type) {
            case 'receipt': return {
                receiptNumber: document.getElementById('receipt-number').value, date: document.getElementById('receipt-date').value,
                customerName: document.getElementById('customer-name').value, customerAddress: document.getElementById('customer-address').value,
                items: getItems('receipt-items'), notes: document.getElementById('receipt-notes').value
            };
            case 'invoice': return {
                invoiceNumber: document.getElementById('invoice-number').value, date: document.getElementById('invoice-date').value,
                dueDate: document.getElementById('invoice-due-date').value, paymentTerms: document.getElementById('payment-terms').value,
                billToName: document.getElementById('bill-to-name').value, billToAddress: document.getElementById('bill-to-address').value,
                items: getItems('invoice-items'), taxRate: parseFloat(document.getElementById('tax-rate').value) || 0,
                discountRate: parseFloat(document.getElementById('discount-rate').value) || 0, notes: document.getElementById('invoice-notes').value
            };
            case 'note': return {
                noteNumber: document.getElementById('note-number').value, date: document.getElementById('note-date').value,
                to: document.getElementById('note-to').value, from: document.getElementById('note-from').value,
                subject: document.getElementById('note-subject').value, message: document.getElementById('note-message').value
            };
        }
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID').format(amount);
    }

    translatePaymentTerms(terms) {
        const translations = { 'Net 30': '30 Hari', 'Net 15': '15 Hari', 'Due on Receipt': 'Bayar Saat Diterima', 'Cash': 'Tunai' };
        return translations[terms] || terms;
    }

    async downloadPDF(previewId, documentType, button) {
        const elementToRender = document.getElementById(previewId);
        if (!elementToRender || !elementToRender.innerHTML.trim()) {
            alert('Silakan buat pratinjau terlebih dahulu!');
            return;
        }

        const originalText = button.textContent;
        button.textContent = 'Membuat PDF...';
        button.disabled = true;

        // Temporarily remove box-shadow for cleaner capture
        const originalShadow = elementToRender.style.boxShadow;
        elementToRender.style.boxShadow = 'none';

        try {
            const canvas = await html2canvas(elementToRender, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff', // Use white background for JPEG
            });
            
            elementToRender.style.boxShadow = originalShadow; // Restore shadow immediately after capture

            const imgData = canvas.toDataURL('image/jpeg', 0.95); // Use JPEG format for better compatibility
            
            const pdf = new jsPDF({
                orientation: 'p',
                unit: 'mm',
                format: 'a4'
            });

            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const canvasRatio = canvasWidth / canvasHeight;

            // Calculate image dimensions to fit A4 with margins
            let imgWidth = pdfWidth - 20; // 10mm margin each side
            let imgHeight = imgWidth / canvasRatio;
            if (imgHeight > pdfHeight - 20) {
                imgHeight = pdfHeight - 20; // 10mm margin top/bottom
                imgWidth = imgHeight * canvasRatio;
            }

            const x = (pdfWidth - imgWidth) / 2; // Center horizontally
            const y = 10; // 10mm margin from top

            pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

            const documentNumber = this.getDocumentNumber(documentType);
            const timestamp = new Date().toISOString().slice(0, 10);
            pdf.save(`${documentType}-${documentNumber || timestamp}.pdf`);

        } catch (error) {
            console.error('Error generating PDF:', error);
            elementToRender.style.boxShadow = originalShadow; // Restore shadow in case of error
            
            if (confirm('Gagal membuat PDF. Apakah Anda ingin menggunakan fungsi cetak browser sebagai gantinya?')) {
                this.printDocument(previewId);
            } else {
                alert('Terjadi kesalahan saat membuat PDF. Silakan coba lagi.');
            }
        } finally {
            button.textContent = originalText;
            button.disabled = false;
        }
    }

    printDocument(previewId) {
        const elementToPrint = document.getElementById(previewId);
        if (!elementToPrint) return;

        const printWindow = window.open('', '_blank', 'height=800,width=800');
        
        printWindow.document.write('<html><head><title>Cetak Dokumen</title>');
        
        // Link existing stylesheets
        Array.from(document.styleSheets).forEach(sheet => {
            if (sheet.href) {
                printWindow.document.write(`<link rel="stylesheet" href="${sheet.href}">`);
            }
        });

        // Add print-specific styles
        printWindow.document.write(`
            <style>
                body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                .receipt-template { 
                    border: none !important; 
                    box-shadow: none !important; 
                    margin: 0 auto; 
                    padding: 0 !important;
                    max-width: 100%;
                }
                @page { size: A4; margin: 20mm; }
            </style>
        `);
        
        printWindow.document.write('</head><body>');
        printWindow.document.write(elementToPrint.outerHTML);
        printWindow.document.write('</body></html>');
        
        printWindow.document.close();
        
        printWindow.onload = function() {
            printWindow.focus();
            printWindow.print();
            // The window can be closed by the user. No need to force it.
        };
    }

    getDocumentNumber(type) {
        const typeMap = { 'kwitansi': 'receipt', 'faktur': 'invoice', 'nota': 'note' };
        return document.getElementById(`${typeMap[type]}-number`)?.value;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new DocumentGenerator();
});
