/**
 * GLOBAL FINANCIAL HEATMAP DASHBOARD SCRIPT
 * Dynamic Treemap rendering, live web socket simulator, search filter, sparkline chart
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- Initial Financial Dataset ---
    const initialAssets = [
        // US Tech Megacaps
        { symbol: 'NVDA', name: '엔비디아 (NVIDIA)', price: 128.50, change: 4.25, currency: '$', category: 'us-tech', cap: '3.15조 USD', volume: '48.2M', size: 'lg' },
        { symbol: 'AAPL', name: '애플 (Apple)', price: 224.30, change: 1.15, currency: '$', category: 'us-tech', cap: '3.42조 USD', volume: '32.1M', size: 'lg' },
        { symbol: 'MSFT', name: '마이크로소프트', price: 448.90, change: -0.45, currency: '$', category: 'us-tech', cap: '3.33조 USD', volume: '21.5M', size: 'lg' },
        { symbol: 'GOOGL', name: '알파벳 (구글)', price: 179.20, change: 2.30, currency: '$', category: 'us-tech', cap: '2.21조 USD', volume: '18.9M', size: 'md' },
        { symbol: 'AMZN', name: '아마존 (Amazon)', price: 186.40, change: 1.80, currency: '$', category: 'us-tech', cap: '1.94조 USD', volume: '24.3M', size: 'md' },
        { symbol: 'META', name: '메타 (Meta)', price: 512.60, change: 3.90, currency: '$', category: 'us-tech', cap: '1.30조 USD', volume: '15.6M', size: 'md' },
        { symbol: 'TSLA', name: '테슬라 (Tesla)', price: 248.50, change: -2.10, currency: '$', category: 'us-tech', cap: '780억 USD', volume: '54.2M', size: 'md' },

        // Korean Major Stocks
        { symbol: '005930', name: '삼성전자', price: 78500, change: 1.42, currency: '₩', category: 'kr-stock', cap: '468조 원', volume: '12.8M', size: 'lg' },
        { symbol: '000660', name: 'SK하이닉스', price: 193000, change: 3.76, currency: '₩', category: 'kr-stock', cap: '140조 원', volume: '4.5M', size: 'lg' },
        { symbol: '035420', name: 'NAVER', price: 172500, change: -0.86, currency: '₩', category: 'kr-stock', cap: '28조 원', volume: '850K', size: 'md' },
        { symbol: '035720', name: '카카오', price: 41200, change: -1.20, currency: '₩', category: 'kr-stock', cap: '18조 원', volume: '1.2M', size: 'sm' },
        { symbol: '005380', name: '현대차', price: 245000, change: 2.08, currency: '₩', category: 'kr-stock', cap: '51조 원', volume: '980K', size: 'md' },
        { symbol: '373220', name: 'LG에너지솔루션', price: 340000, change: -0.29, currency: '₩', category: 'kr-stock', cap: '79조 원', volume: '320K', size: 'md' },

        // Major Indices
        { symbol: 'S&P 500', name: 'S&P 500 지수', price: 5550.80, change: 0.85, currency: 'pt', category: 'indices', cap: '글로벌 지수', volume: '3.8B', size: 'lg' },
        { symbol: 'NASDAQ', name: '나스닥 종합지수', price: 17600.20, change: 1.45, currency: 'pt', category: 'indices', cap: '기술주 지수', volume: '4.2B', size: 'lg' },
        { symbol: 'DOW', name: '다우존스 지수', price: 40800.50, change: 0.20, currency: 'pt', category: 'indices', cap: '우량주 지수', volume: '420M', size: 'md' },
        { symbol: 'KOSPI', name: '코스피 지수', price: 2680.40, change: 1.12, currency: 'pt', category: 'indices', cap: '국내 대표', volume: '520M', size: 'md' },
        { symbol: 'KOSDAQ', name: '코스닥 지수', price: 785.30, change: 0.65, currency: 'pt', category: 'indices', cap: '국내 벤처', volume: '890M', size: 'sm' },
        { symbol: 'NIKKEI', name: '니케이 225', price: 38100.00, change: 1.80, currency: 'pt', category: 'indices', cap: '일본 지수', volume: '1.2B', size: 'sm' },

        // Forex & Commodities
        { symbol: 'USD/KRW', name: '달러 / 원 환율', price: 1372.50, change: -0.35, currency: '원', category: 'forex', cap: '외환', volume: '$12B', size: 'md' },
        { symbol: 'EUR/KRW', name: '유로 / 원 환율', price: 1502.80, change: 0.15, currency: '원', category: 'forex', cap: '외환', volume: '€4B', size: 'sm' },
        { symbol: 'JPY/KRW', name: '엔 / 원 (100엔)', price: 928.40, change: -0.42, currency: '원', category: 'forex', cap: '외환', volume: '¥18B', size: 'sm' },
        { symbol: 'GOLD', name: '금 선물 (Gold)', price: 2460.50, change: 0.75, currency: '$', category: 'forex', cap: '원자재', volume: '180K', size: 'md' },
        { symbol: 'WTI', name: 'WTI 원유 선물', price: 78.40, change: -1.25, currency: '$', category: 'forex', cap: '에너지', volume: '340K', size: 'sm' },
        { symbol: 'BTC/USD', name: '비트코인 (BTC)', price: 62400.00, change: 4.80, currency: '$', category: 'forex', cap: '1.2조 USD', volume: '$28B', size: 'lg' }
    ];

    // --- State Management ---
    const state = {
        assets: JSON.parse(localStorage.getItem('heatmap_assets') || JSON.stringify(initialAssets)),
        watchlist: new Set(JSON.parse(localStorage.getItem('heatmap_watchlist') || '["NVDA", "005930", "USD/KRW", "S&P 500"]')),
        currentCategory: 'all',
        period: '1D',
        colorMode: localStorage.getItem('heatmap_color_mode') || 'western', // 'western' or 'asian'
        searchQuery: '',
        selectedAsset: null
    };

    // Apply saved color mode to body
    if (state.colorMode === 'asian') {
        document.body.classList.add('mode-asian');
        document.getElementById('colorAsianBtn').classList.add('active');
        document.getElementById('colorWesternBtn').classList.remove('active');
    }

    // Save Assets & Watchlist
    function saveState() {
        localStorage.setItem('heatmap_assets', JSON.stringify(state.assets));
        localStorage.setItem('heatmap_watchlist', JSON.stringify(Array.from(state.watchlist)));
    }

    // --- Tile Color Classifier Helper ---
    function getTileBgClass(change) {
        if (change >= 3.0) return 'bg-up-strong';
        if (change > 0.5) return 'bg-up-mild';
        if (change >= -0.5) return 'bg-neutral';
        if (change > -3.0) return 'bg-down-mild';
        return 'bg-down-strong';
    }

    function formatPrice(val, currency) {
        if (currency === '₩' || currency === '원') {
            return `${currency} ${val.toLocaleString('ko-KR')}`;
        }
        return `${currency}${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    // --- Render Marquee Bar ---
    function renderMarquee() {
        const track = document.getElementById('marqueeTrack');
        track.innerHTML = '';
        
        // Duplicate list for seamless infinite loop
        const displayItems = [...state.assets, ...state.assets];
        displayItems.forEach(item => {
            const el = document.createElement('div');
            el.className = 'ticker-item';
            const sign = item.change >= 0 ? '+' : '';
            const isPos = item.change >= 0;
            const colorClass = isPos ? 'pos' : 'neg';

            el.innerHTML = `
                <span class="ticker-symbol">${item.symbol}</span>
                <span class="ticker-price">${formatPrice(item.price, item.currency)}</span>
                <span class="ticker-change ${colorClass}">${sign}${item.change.toFixed(2)}%</span>
            `;
            el.addEventListener('click', () => openDetailModal(item));
            track.appendChild(el);
        });
    }

    // --- Render Heatmap Grid ---
    function renderHeatmap() {
        const container = document.getElementById('heatmapContainer');
        container.innerHTML = '';

        let filtered = state.assets.filter(a => {
            // Category Filter
            if (state.currentCategory === 'watchlist') {
                if (!state.watchlist.has(a.symbol)) return false;
            } else if (state.currentCategory !== 'all') {
                if (a.category !== state.currentCategory) return false;
            }

            // Search Query Filter
            if (state.searchQuery) {
                const q = state.searchQuery.toLowerCase();
                const matchSymbol = a.symbol.toLowerCase().includes(q);
                const matchName = a.name.toLowerCase().includes(q);
                if (!matchSymbol && !matchName) return false;
            }

            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = `<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 50px 0;">검색 결과 또는 관심 종목이 없습니다.</div>`;
            updateStatsBar([]);
            return;
        }

        filtered.forEach(asset => {
            const tile = document.createElement('div');
            const bgClass = getTileBgClass(asset.change);
            const sizeClass = asset.size ? `tile-${asset.size}` : 'tile-sm';
            tile.className = `tile ${bgClass} ${sizeClass}`;

            const sign = asset.change >= 0 ? '+' : '';
            const starIcon = state.watchlist.has(asset.symbol) ? '★' : '';

            tile.innerHTML = `
                <div class="tile-header">
                    <div>
                        <span class="tile-symbol">${asset.symbol}</span> ${starIcon ? `<span style="color:#ffd700; font-size:12px;">${starIcon}</span>` : ''}
                    </div>
                    <span class="tile-cat-badge">${asset.category.toUpperCase()}</span>
                </div>
                <div class="tile-name">${asset.name}</div>
                <div class="tile-footer">
                    <span class="tile-price">${formatPrice(asset.price, asset.currency)}</span>
                    <span class="tile-change">${sign}${asset.change.toFixed(2)}%</span>
                </div>
            `;

            tile.addEventListener('click', () => openDetailModal(asset));
            container.appendChild(tile);
        });

        updateStatsBar(filtered);
        document.getElementById('watchlistBadgeCount').textContent = state.watchlist.size;
    }

    // --- Update Market Status Bar ---
    function updateStatsBar(items) {
        let gainers = 0, losers = 0, flat = 0, sumChange = 0;
        items.forEach(a => {
            sumChange += a.change;
            if (a.change > 0.5) gainers++;
            else if (a.change < -0.5) losers++;
            else flat++;
        });

        document.getElementById('statGainersCount').textContent = gainers;
        document.getElementById('statLosersCount').textContent = losers;
        document.getElementById('statFlatCount').textContent = flat;

        const avg = items.length ? (sumChange / items.length).toFixed(2) : '0.00';
        const avgEl = document.getElementById('statAvgChange');
        const sign = avg >= 0 ? '+' : '';
        avgEl.textContent = `${sign}${avg}%`;
        avgEl.className = `card-val ${avg >= 0 ? 'pos' : 'neg'}`;

        const now = new Date();
        document.getElementById('lastUpdateTime').textContent = `${now.getHours()}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')} 실시간`;
    }

    // --- Live Simulator Tick Engine ---
    function startLiveSimEngine() {
        setInterval(() => {
            state.assets.forEach(asset => {
                // Random walk price shift (-0.3% to +0.3%)
                const delta = (Math.random() - 0.49) * 0.4;
                asset.change = parseFloat((asset.change + delta).toFixed(2));
                
                // Adjust price according to change
                const factor = 1 + (delta / 100);
                asset.price = parseFloat((asset.price * factor).toFixed(2));
            });

            renderHeatmap();
            renderMarquee();
        }, 2500);
    }

    // --- Detail Modal & Interactive Canvas Chart ---
    function openDetailModal(asset) {
        state.selectedAsset = asset;
        const modal = document.getElementById('detailModal');

        document.getElementById('modalSymbolBadge').textContent = asset.symbol;
        document.getElementById('modalAssetName').textContent = asset.name;
        document.getElementById('modalCategoryTag').textContent = `${asset.category.toUpperCase()} · 실시간 데이터`;
        document.getElementById('modalCurrentPrice').textContent = formatPrice(asset.price, asset.currency);

        const sign = asset.change >= 0 ? '+' : '';
        const changePill = document.getElementById('modalPriceChange');
        changePill.textContent = `${sign}${(asset.price * (asset.change/100)).toFixed(2)} (${sign}${asset.change.toFixed(2)}%)`;
        changePill.style.color = asset.change >= 0 ? 'var(--color-up-strong)' : 'var(--color-down-strong)';

        document.getElementById('modalCap').textContent = asset.cap || 'N/A';
        document.getElementById('modalVolume').textContent = asset.volume || 'N/A';
        document.getElementById('modalDayHigh').textContent = formatPrice(asset.price * 1.02, asset.currency);
        document.getElementById('modalDayLow').textContent = formatPrice(asset.price * 0.98, asset.currency);

        const toggleBtn = document.getElementById('toggleWatchlistBtn');
        if (state.watchlist.has(asset.symbol)) {
            toggleBtn.innerHTML = `<i class="fa-solid fa-star" style="color:#ffd700;"></i> 관심종목에서 제거`;
        } else {
            toggleBtn.innerHTML = `<i class="fa-regular fa-star"></i> 관심종목에 추가`;
        }

        drawDetailChart(asset);
        modal.classList.remove('hidden');
    }

    function drawDetailChart(asset) {
        const canvas = document.getElementById('detailChartCanvas');
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        // Generate synthetic price points trend
        const points = [];
        let cur = asset.price * (1 - (asset.change / 100));
        for (let i = 0; i < 30; i++) {
            cur += (Math.random() - 0.48) * (asset.price * 0.01);
            points.push(cur);
        }
        points.push(asset.price);

        const min = Math.min(...points);
        const max = Math.max(...points);
        const range = (max - min) || 1;

        // Draw Line
        ctx.beginPath();
        points.forEach((p, idx) => {
            const x = (idx / (points.length - 1)) * (w - 20) + 10;
            const y = h - 20 - ((p - min) / range) * (h - 40);
            if (idx === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });

        const strokeColor = asset.change >= 0 ? '#00e676' : '#ff1744';
        ctx.strokeStyle = strokeColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // Area Gradient Fill
        const grad = ctx.createLinearGradient(0, 0, 0, h);
        grad.addColorStop(0, strokeColor + '44');
        grad.addColorStop(1, strokeColor + '00');

        ctx.lineTo(w - 10, h - 10);
        ctx.lineTo(10, h - 10);
        ctx.closePath();
        ctx.fillStyle = grad;
        ctx.fill();
    }

    // --- Event Listeners Binding ---
    // Search Bar
    const searchInput = document.getElementById('searchInput');
    const clearSearchBtn = document.getElementById('clearSearchBtn');

    searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value.trim();
        if (state.searchQuery) clearSearchBtn.classList.remove('hidden');
        else clearSearchBtn.classList.add('hidden');
        renderHeatmap();
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        state.searchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderHeatmap();
    });

    // Category Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.currentCategory = target.getAttribute('data-cat');
            renderHeatmap();
        });
    });

    // Period Selectors
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            state.period = e.currentTarget.getAttribute('data-period');
            renderHeatmap();
        });
    });

    // Color Mode Toggle (Western vs Asian)
    document.getElementById('colorWesternBtn').addEventListener('click', () => {
        state.colorMode = 'western';
        document.body.classList.remove('mode-asian');
        document.getElementById('colorWesternBtn').classList.add('active');
        document.getElementById('colorAsianBtn').classList.remove('active');
        localStorage.setItem('heatmap_color_mode', 'western');
        renderHeatmap();
    });

    document.getElementById('colorAsianBtn').addEventListener('click', () => {
        state.colorMode = 'asian';
        document.body.classList.add('mode-asian');
        document.getElementById('colorAsianBtn').classList.add('active');
        document.getElementById('colorWesternBtn').classList.remove('active');
        localStorage.setItem('heatmap_color_mode', 'asian');
        renderHeatmap();
    });

    // Watchlist Toggle inside Modal
    document.getElementById('toggleWatchlistBtn').addEventListener('click', () => {
        if (!state.selectedAsset) return;
        const sym = state.selectedAsset.symbol;
        if (state.watchlist.has(sym)) {
            state.watchlist.delete(sym);
        } else {
            state.watchlist.add(sym);
        }
        saveState();
        openDetailModal(state.selectedAsset);
        renderHeatmap();
    });

    // Close Modals
    document.getElementById('closeDetailModal').addEventListener('click', () => {
        document.getElementById('detailModal').classList.add('hidden');
    });

    // Add Custom Asset Modal
    const addAssetModal = document.getElementById('addAssetModal');
    document.getElementById('addCustomAssetBtn').addEventListener('click', () => {
        addAssetModal.classList.remove('hidden');
    });
    document.getElementById('closeAddAssetModal').addEventListener('click', () => {
        addAssetModal.classList.add('hidden');
    });

    document.getElementById('addAssetForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('newAssetName').value.trim();
        const symbol = document.getElementById('newAssetSymbol').value.trim().toUpperCase();
        const category = document.getElementById('newAssetCategory').value;
        const priceInput = document.getElementById('newAssetPrice').value;
        const price = priceInput ? parseFloat(priceInput) : 100.0;

        const newAsset = {
            symbol,
            name,
            price,
            change: parseFloat((Math.random() * 4 - 2).toFixed(2)),
            currency: category === 'kr-stock' ? '₩' : '$',
            category,
            cap: '신규 추가',
            volume: '100K',
            size: 'md'
        };

        state.assets.unshift(newAsset);
        state.watchlist.add(symbol);
        saveState();

        document.getElementById('addAssetForm').reset();
        addAssetModal.classList.add('hidden');
        renderHeatmap();
        renderMarquee();
        alert(`${name} (${symbol})이(가) 관심종목에 추가되었습니다!`);
    });

    // Initial Load
    renderMarquee();
    renderHeatmap();
    startLiveSimEngine();
});
