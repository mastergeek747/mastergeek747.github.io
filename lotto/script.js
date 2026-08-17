/**
 * LUCKY 6/45 - PREMIUM LOTTO GENERATOR SCRIPT
 * Full-featured physics simulator, strategy algorithms, audio synth, and ticket renderer
 */

document.addEventListener('DOMContentLoaded', () => {
    // --- State Management ---
    const state = {
        mode: 'random', // 'random', 'balanced', 'ai-stats', 'custom'
        gameCount: 5,
        includedNumbers: new Set(),
        excludedNumbers: new Set(),
        currentGames: [],
        savedTickets: JSON.parse(localStorage.getItem('lucky645_saved') || '[]'),
        soundEnabled: true,
        customTab: 'include' // 'include' or 'exclude'
    };

    // --- Web Audio API Synthesizer ---
    class AudioEngine {
        constructor() {
            this.ctx = null;
        }

        init() {
            if (!this.ctx) {
                const AudioCtx = window.AudioContext || window.webkitAudioContext;
                this.ctx = new AudioCtx();
            }
        }

        playBallPop(freq = 440) {
            if (!state.soundEnabled) return;
            this.init();
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'sine';
                osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
                osc.frequency.exponentialRampToValueAtTime(freq * 1.5, this.ctx.currentTime + 0.08);

                gain.gain.setValueAtTime(0.3, this.ctx.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.ctx.currentTime + 0.08);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + 0.08);
            } catch (e) { console.error(e); }
        }

        playChamberRoll() {
            if (!state.soundEnabled) return;
            this.init();
            try {
                const osc = this.ctx.createOscillator();
                const gain = this.ctx.createGain();

                osc.type = 'triangle';
                osc.frequency.setValueAtTime(120, this.ctx.currentTime);
                osc.frequency.linearRampToValueAtTime(80, this.ctx.currentTime + 0.15);

                gain.gain.setValueAtTime(0.1, this.ctx.currentTime);
                gain.gain.linearRampToValueAtTime(0.01, this.ctx.currentTime + 0.15);

                osc.connect(gain);
                gain.connect(this.ctx.destination);

                osc.start();
                osc.stop(this.ctx.currentTime + 0.15);
            } catch (e) {}
        }

        playFanfare() {
            if (!state.soundEnabled) return;
            this.init();
            const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
            notes.forEach((freq, idx) => {
                setTimeout(() => this.playBallPop(freq), idx * 100);
            });
        }
    }

    const audio = new AudioEngine();

    // --- Ball Utility Helpers ---
    function getBallColorClass(num) {
        if (num <= 10) return 'ball-yellow';
        if (num <= 20) return 'ball-blue';
        if (num <= 30) return 'ball-red';
        if (num <= 40) return 'ball-gray';
        return 'ball-green';
    }

    function getBallHexColor(num) {
        if (num <= 10) return '#ffb300';
        if (num <= 20) return '#0288d1';
        if (num <= 30) return '#e53935';
        if (num <= 40) return '#616161';
        return '#43a047';
    }

    // --- 3D Ball Chamber Physics Simulator ---
    class ChamberSimulator {
        constructor(canvasId) {
            this.canvas = document.getElementById(canvasId);
            this.ctx = this.canvas.getContext('2d');
            this.balls = [];
            this.isSpinning = false;
            this.animFrameId = null;

            this.initBalls();
            this.startLoop();
        }

        initBalls() {
            this.balls = [];
            for (let i = 1; i <= 45; i++) {
                this.balls.push({
                    number: i,
                    x: 60 + Math.random() * (this.canvas.width - 120),
                    y: 60 + Math.random() * (this.canvas.height - 120),
                    vx: (Math.random() - 0.5) * 4,
                    vy: (Math.random() - 0.5) * 4,
                    radius: 14,
                    color: getBallHexColor(i)
                });
            }
        }

        setSpinSpeed(highSpeed) {
            this.isSpinning = highSpeed;
            const mult = highSpeed ? 4 : 1;
            this.balls.forEach(b => {
                b.vx = (Math.random() - 0.5) * 6 * mult;
                b.vy = (Math.random() - 0.5) * 6 * mult;
            });
        }

        update() {
            const w = this.canvas.width;
            const h = this.canvas.height;

            this.balls.forEach(b => {
                b.x += b.vx;
                b.y += b.vy;

                // Simple gravity effect if low speed
                if (!this.isSpinning) {
                    b.vy += 0.05;
                } else {
                    // Wind turbulence
                    b.vx += (Math.random() - 0.5) * 1.5;
                    b.vy += (Math.random() - 0.5) * 1.5;
                }

                // Wall collisions (chamber sphere bounds)
                if (b.x - b.radius < 20) { b.x = 20 + b.radius; b.vx *= -0.8; }
                if (b.x + b.radius > w - 20) { b.x = w - 20 - b.radius; b.vx *= -0.8; }
                if (b.y - b.radius < 20) { b.y = 20 + b.radius; b.vy *= -0.8; }
                if (b.y + b.radius > h - 20) { b.y = h - 20 - b.radius; b.vy *= -0.8; }
            });

            if (this.isSpinning && Math.random() < 0.2) {
                audio.playChamberRoll();
            }
        }

        draw() {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

            // Draw balls
            this.balls.forEach(b => {
                this.ctx.beginPath();
                this.ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
                
                // Gradient sphere effect
                const grad = this.ctx.createRadialGradient(
                    b.x - b.radius * 0.3, b.y - b.radius * 0.3, b.radius * 0.1,
                    b.x, b.y, b.radius
                );
                grad.addColorStop(0, '#ffffff');
                grad.addColorStop(0.3, b.color);
                grad.addColorStop(1, '#000000');

                this.ctx.fillStyle = grad;
                this.ctx.fill();

                // Ball number text
                this.ctx.fillStyle = (b.number <= 10) ? '#000' : '#fff';
                this.ctx.font = '900 10px Outfit, sans-serif';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(b.number, b.x, b.y + 1);
            });
        }

        startLoop() {
            const loop = () => {
                this.update();
                this.draw();
                this.animFrameId = requestAnimationFrame(loop);
            };
            loop();
        }
    }

    const simulator = new ChamberSimulator('ballCanvas');

    // --- Lotto Algorithm Generator ---
    function generateSingleLottoCombination(mode, includeSet, excludeSet) {
        let pool = [];
        for (let i = 1; i <= 45; i++) {
            if (!excludeSet.has(i)) {
                pool.push(i);
            }
        }

        let attempts = 0;
        const maxAttempts = 1000;

        while (attempts < maxAttempts) {
            attempts++;
            let numbers = Array.from(includeSet);
            let availablePool = pool.filter(n => !includeSet.has(n));
            
            // Shuffle pool
            for (let i = availablePool.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [availablePool[i], availablePool[j]] = [availablePool[j], availablePool[i]];
            }

            // Fill up to 6 numbers
            while (numbers.length < 6 && availablePool.length > 0) {
                numbers.push(availablePool.pop());
            }

            if (numbers.length < 6) break;

            numbers.sort((a, b) => a - b);

            // Filter check depending on mode
            if (mode === 'balanced') {
                const oddCount = numbers.filter(n => n % 2 !== 0).length;
                const highCount = numbers.filter(n => n >= 23).length;
                // Golden ratio odd:even is 2:4, 3:3, 4:2
                if (oddCount >= 2 && oddCount <= 4 && highCount >= 2 && highCount <= 4) {
                    return numbers;
                }
            } else if (mode === 'ai-stats') {
                const sum = numbers.reduce((acc, curr) => acc + curr, 0);
                const has4Consecutive = numbers.some((n, idx) => idx <= 2 && numbers[idx+1] === n+1 && numbers[idx+2] === n+2 && numbers[idx+3] === n+3);
                // Statistical sweet spot sum range: 100 ~ 175
                if (sum >= 100 && sum <= 175 && !has4Consecutive) {
                    return numbers;
                }
            } else {
                // Random or custom fallback
                return numbers;
            }
        }

        // Fallback standard selection if filters too strict
        let fallback = Array.from(includeSet);
        let remPool = pool.filter(n => !includeSet.has(n));
        while (fallback.length < 6 && remPool.length > 0) {
            const idx = Math.floor(Math.random() * remPool.length);
            fallback.push(remPool.splice(idx, 1)[0]);
        }
        return fallback.sort((a, b) => a - b);
    }

    function generateBonusNumber(drawnSet, excludeSet) {
        const pool = [];
        for (let i = 1; i <= 45; i++) {
            if (!drawnSet.has(i) && !excludeSet.has(i)) {
                pool.push(i);
            }
        }
        return pool[Math.floor(Math.random() * pool.length)];
    }

    // --- UI Renderers ---
    function renderNumberGridSelector() {
        const grid = document.getElementById('numberGridSelector');
        grid.innerHTML = '';
        for (let i = 1; i <= 45; i++) {
            const cell = document.createElement('div');
            cell.className = 'num-cell';
            cell.textContent = i;
            
            if (state.includedNumbers.has(i)) cell.classList.add('inc-selected');
            if (state.excludedNumbers.has(i)) cell.classList.add('exc-selected');

            cell.addEventListener('click', () => handleNumberGridClick(i));
            grid.appendChild(cell);
        }
    }

    function handleNumberGridClick(num) {
        if (state.customTab === 'include') {
            if (state.includedNumbers.has(num)) {
                state.includedNumbers.delete(num);
            } else {
                if (state.includedNumbers.size >= 5) {
                    alert('고정수는 최대 5개까지만 선택 가능합니다.');
                    return;
                }
                state.excludedNumbers.delete(num);
                state.includedNumbers.add(num);
            }
        } else {
            if (state.excludedNumbers.has(num)) {
                state.excludedNumbers.delete(num);
            } else {
                if (state.excludedNumbers.size >= 39) {
                    alert('제외수가 너무 많습니다.');
                    return;
                }
                state.includedNumbers.delete(num);
                state.excludedNumbers.add(num);
            }
        }
        updateFilterSummaryText();
        renderNumberGridSelector();
    }

    function updateFilterSummaryText() {
        const incTxt = document.getElementById('includeListText');
        const excTxt = document.getElementById('excludeListText');

        incTxt.textContent = state.includedNumbers.size ? Array.from(state.includedNumbers).sort((a,b)=>a-b).join(', ') : '없음';
        excTxt.textContent = state.excludedNumbers.size ? Array.from(state.excludedNumbers).sort((a,b)=>a-b).join(', ') : '없음';
    }

    function renderTicket(games) {
        const container = document.getElementById('ticketRowsContainer');
        container.innerHTML = '';

        if (!games || games.length === 0) {
            container.innerHTML = `
                <div class="empty-ticket-msg">
                    <i class="fa-solid fa-dice"></i>
                    <p>'추첨 시작하기' 버튼을 눌러 로또 번호를 생성하세요.</p>
                </div>`;
            return;
        }

        const labels = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J'];

        games.forEach((game, idx) => {
            const row = document.createElement('div');
            row.className = 'ticket-row';
            row.style.animationDelay = `${idx * 0.08}s`;

            const typeLabel = state.mode === 'custom' && state.includedNumbers.size > 0 ? '반자동' : '자 동';

            let ballsHtml = game.numbers.map(num => `
                <div class="ticket-ball ${getBallColorClass(num)}">${num}</div>
            `).join('');

            row.innerHTML = `
                <span class="row-label">${labels[idx % labels.length]}</span>
                <span class="row-type">${typeLabel}</span>
                <div class="row-balls">${ballsHtml}</div>
            `;
            container.appendChild(row);
        });

        updateTicketTimestamp();
        calculateAndRenderStats(games);
    }

    function updateTicketTimestamp() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        const daysKr = ['일', '월', '화', '수', '목', '금', '토'];
        const dayKr = daysKr[now.getDay()];
        const hours = String(now.getHours()).padStart(2, '0');
        const mins = String(now.getMinutes()).padStart(2, '0');

        document.getElementById('ticketDate').textContent = `발행일: ${year}/${month}/${day} (${dayKr}) ${hours}:${mins}`;
    }

    function updateLiveTray(numbers, bonus) {
        const tray = document.getElementById('liveBallsTray');
        tray.innerHTML = '';

        numbers.forEach(num => {
            const ball = document.createElement('div');
            ball.className = `lotto-ball ${getBallColorClass(num)}`;
            ball.textContent = num;
            tray.appendChild(ball);
        });

        if (bonus) {
            const plus = document.createElement('span');
            plus.className = 'plus-sign';
            plus.textContent = '+';
            tray.appendChild(plus);

            const bonusBall = document.createElement('div');
            bonusBall.className = `lotto-ball ${getBallColorClass(bonus)}`;
            bonusBall.textContent = bonus;
            tray.appendChild(bonusBall);
        }
    }

    function calculateAndRenderStats(games) {
        if (!games || games.length === 0) return;

        let totalSum = 0;
        let totalOdd = 0;
        let totalEven = 0;
        let colorCounts = { yellow: 0, blue: 0, red: 0, gray: 0, green: 0 };
        let consecutiveCount = 0;

        games.forEach(g => {
            const nums = g.numbers;
            const sum = nums.reduce((a, b) => a + b, 0);
            totalSum += sum;

            nums.forEach((n, i) => {
                if (n % 2 !== 0) totalOdd++; else totalEven++;
                
                if (n <= 10) colorCounts.yellow++;
                else if (n <= 20) colorCounts.blue++;
                else if (n <= 30) colorCounts.red++;
                else if (n <= 40) colorCounts.gray++;
                else colorCounts.green++;

                if (i > 0 && n === nums[i-1] + 1) {
                    consecutiveCount++;
                }
            });
        });

        const avgSum = Math.round(totalSum / games.length);
        const oddRatio = (totalOdd / (totalOdd + totalEven) * 100).toFixed(0);
        
        let maxColorKey = 'yellow';
        let maxColorVal = 0;
        Object.keys(colorCounts).forEach(k => {
            if (colorCounts[k] > maxColorVal) {
                maxColorVal = colorCounts[k];
                maxColorKey = k;
            }
        });
        const colorNames = { yellow: '노랑(1~10)', blue: '파랑(11~20)', red: '빨강(21~30)', gray: '검정(31~40)', green: '초록(41~45)' };

        document.getElementById('statAvgSum').textContent = avgSum;
        document.getElementById('statOddEven').textContent = `${oddRatio}% : ${100-oddRatio}%`;
        document.getElementById('statTopColor').textContent = colorNames[maxColorKey];
        document.getElementById('statConsecutive').textContent = consecutiveCount > 0 ? `${consecutiveCount}회 감지` : '없음';
    }

    // --- Execution Trigger & Animation Flow ---
    let isDrawing = false;

    async function triggerDrawProcess() {
        if (isDrawing) return;
        isDrawing = true;

        const triggerBtn = document.getElementById('generateTriggerBtn');
        const statusText = document.getElementById('chamberStatusText');

        triggerBtn.disabled = true;
        triggerBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> 추첨 진행 중...`;
        statusText.textContent = '강력 회전 추첨 중...';

        simulator.setSpinSpeed(true);

        // Generate full game batch
        const newGames = [];
        for (let i = 0; i < state.gameCount; i++) {
            const nums = generateSingleLottoCombination(state.mode, state.includedNumbers, state.excludedNumbers);
            newGames.push({ numbers: nums });
        }

        // Live Tray Animation for First Game
        const showcaseGame = newGames[0].numbers;
        const drawnSet = new Set(showcaseGame);
        const bonusNum = generateBonusNumber(drawnSet, state.excludedNumbers);

        // Clear tray placeholders
        const tray = document.getElementById('liveBallsTray');
        tray.innerHTML = '';
        for (let i = 0; i < 6; i++) {
            const ph = document.createElement('div');
            ph.className = 'ball-placeholder';
            ph.textContent = '?';
            tray.appendChild(ph);
        }
        const plus = document.createElement('span');
        plus.className = 'plus-sign';
        plus.textContent = '+';
        tray.appendChild(plus);
        const phBonus = document.createElement('div');
        phBonus.className = 'ball-placeholder bonus';
        phBonus.textContent = '?';
        tray.appendChild(phBonus);

        // Pop balls out one by one
        for (let i = 0; i < 6; i++) {
            await new Promise(r => setTimeout(r, 280));
            audio.playBallPop(300 + showcaseGame[i] * 12);
            tray.children[i].className = `lotto-ball ${getBallColorClass(showcaseGame[i])}`;
            tray.children[i].textContent = showcaseGame[i];
        }

        await new Promise(r => setTimeout(r, 350));
        audio.playBallPop(750);
        tray.lastElementChild.className = `lotto-ball ${getBallColorClass(bonusNum)}`;
        tray.lastElementChild.textContent = bonusNum;

        audio.playFanfare();

        // Slow down chamber
        simulator.setSpinSpeed(false);
        statusText.textContent = '추첨 완료';

        state.currentGames = newGames;
        renderTicket(newGames);

        triggerBtn.disabled = false;
        triggerBtn.innerHTML = `<i class="fa-solid fa-play"></i> 추첨 시작하기`;
        isDrawing = false;
    }

    // --- Saved Collections Management ---
    function renderSavedTickets() {
        const grid = document.getElementById('savedTicketsGrid');
        const countSpan = document.getElementById('savedCount');
        countSpan.textContent = state.savedTickets.length;

        if (state.savedTickets.length === 0) {
            grid.innerHTML = `<div class="empty-saved-msg">저장된 행운의 로또 조합이 없습니다.</div>`;
            return;
        }

        grid.innerHTML = '';
        state.savedTickets.forEach((item, idx) => {
            const card = document.createElement('div');
            card.className = 'saved-card';

            let rowsHtml = item.games.map(g => `
                <div style="display:flex; gap:4px; margin-bottom:4px;">
                    ${g.numbers.map(n => `<div class="ticket-ball ${getBallColorClass(n)}" style="width:24px; height:24px; font-size:10px;">${n}</div>`).join('')}
                </div>
            `).join('');

            card.innerHTML = `
                <div class="saved-card-header">
                    <span>${item.date} (${item.games.length}게임)</span>
                    <button class="delete-saved-btn" data-idx="${idx}"><i class="fa-solid fa-xmark"></i></button>
                </div>
                ${rowsHtml}
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.delete-saved-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const idx = parseInt(e.currentTarget.getAttribute('data-idx'));
                state.savedTickets.splice(idx, 1);
                localStorage.setItem('lucky645_saved', JSON.stringify(state.savedTickets));
                renderSavedTickets();
            });
        });
    }

    // --- Event Listeners Binding ---
    // Mode Chips
    document.querySelectorAll('.chip-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.chip-btn').forEach(b => b.classList.remove('active'));
            const target = e.currentTarget;
            target.classList.add('active');
            state.mode = target.getAttribute('data-mode');

            const customBox = document.getElementById('customFilterBox');
            if (state.mode === 'custom') {
                customBox.classList.remove('hidden');
                renderNumberGridSelector();
            } else {
                customBox.classList.add('hidden');
            }
        });
    });

    // Custom Filter Tabs
    document.getElementById('tabIncludeBtn').addEventListener('click', (e) => {
        state.customTab = 'include';
        document.getElementById('tabIncludeBtn').classList.add('active');
        document.getElementById('tabExcludeBtn').classList.remove('active');
    });

    document.getElementById('tabExcludeBtn').addEventListener('click', (e) => {
        state.customTab = 'exclude';
        document.getElementById('tabExcludeBtn').classList.add('active');
        document.getElementById('tabIncludeBtn').classList.remove('active');
    });

    document.getElementById('resetFiltersBtn').addEventListener('click', () => {
        state.includedNumbers.clear();
        state.excludedNumbers.clear();
        updateFilterSummaryText();
        renderNumberGridSelector();
    });

    // Game Counter
    document.getElementById('cntDecBtn').addEventListener('click', () => {
        if (state.gameCount > 1) {
            state.gameCount--;
            document.getElementById('gameCountVal').textContent = `${state.gameCount}게임`;
        }
    });

    document.getElementById('cntIncBtn').addEventListener('click', () => {
        if (state.gameCount < 10) {
            state.gameCount++;
            document.getElementById('gameCountVal').textContent = `${state.gameCount}게임`;
        }
    });

    // Generate Button
    document.getElementById('generateTriggerBtn').addEventListener('click', triggerDrawProcess);

    // Header Actions
    document.getElementById('soundToggleBtn').addEventListener('click', (e) => {
        state.soundEnabled = !state.soundEnabled;
        const icon = e.currentTarget.querySelector('i');
        icon.className = state.soundEnabled ? 'fa-solid fa-volume-high' : 'fa-solid fa-volume-xmark';
    });

    // Copy / Save / Print Ticket Actions
    document.getElementById('copyAllBtn').addEventListener('click', () => {
        if (!state.currentGames.length) return;
        const text = state.currentGames.map((g, i) => `[${String.fromCharCode(65+i)}] ` + g.numbers.join(', ')).join('\n');
        navigator.clipboard.writeText(`[럭키 6/45 번호 조합]\n${text}`).then(() => {
            alert('클립보드에 로또 번호가 복사되었습니다!');
        });
    });

    document.getElementById('saveTicketBtn').addEventListener('click', () => {
        if (!state.currentGames.length) {
            alert('저장할 번호 조합이 없습니다.');
            return;
        }
        const now = new Date();
        const dateStr = `${now.getMonth()+1}/${now.getDate()} ${now.getHours()}:${String(now.getMinutes()).padStart(2,'0')}`;
        state.savedTickets.unshift({
            date: dateStr,
            games: state.currentGames
        });
        localStorage.setItem('lucky645_saved', JSON.stringify(state.savedTickets));
        renderSavedTickets();
        alert('행운 보관함에 저장되었습니다!');
    });

    document.getElementById('printTicketBtn').addEventListener('click', () => {
        window.print();
    });

    document.getElementById('clearSavedBtn').addEventListener('click', () => {
        if (confirm('보관함의 모든 번호를 삭제하시겠습니까?')) {
            state.savedTickets = [];
            localStorage.removeItem('lucky645_saved');
            renderSavedTickets();
        }
    });

    // Modal: Fortune Reading
    const fortuneModal = document.getElementById('fortuneModal');
    document.getElementById('fortuneModalBtn').addEventListener('click', () => {
        generateFortune();
        fortuneModal.classList.remove('hidden');
    });

    document.getElementById('closeFortuneModal').addEventListener('click', () => {
        fortuneModal.classList.add('hidden');
    });

    function generateFortune() {
        const fortunes = [
            "오늘 당신의 직감 지수가 최고조에 달합니다! 황금빛 기운이 넘칩니다.",
            "뜻밖의 행운이 찾아오는 날입니다. 낮은 번호대에 주목하세요.",
            "재물운의 축이 크게 기울고 있습니다. 균형 잡힌 조합이 승리합니다.",
            "동쪽에서 귀인의 기운이 느껴집니다. 통계 추천 모드를 활용해 보세요."
        ];
        const times = ["오전 10:00 ~ 12:00", "오후 02:30 ~ 04:30", "오후 05:00 ~ 07:00", "오후 07:30 ~ 09:00"];
        const directions = ["동남쪽 복권 판매점", "서북쪽 로또 명당", "남쪽 교차로 부근 판매점", "북동쪽 대형 마트 판매점"];

        const randomIdx = Math.floor(Math.random() * fortunes.length);
        document.getElementById('fortuneTitle').textContent = `"${fortunes[randomIdx]}"`;
        document.getElementById('fortuneTime').textContent = times[randomIdx];
        document.getElementById('fortuneDirection').textContent = directions[randomIdx];

        // Generate 3 lucky numbers
        const luckyNums = [];
        while (luckyNums.length < 3) {
            const r = Math.floor(Math.random() * 45) + 1;
            if (!luckyNums.includes(r)) luckyNums.push(r);
        }
        luckyNums.sort((a, b) => a - b);

        const container = document.getElementById('fortuneLuckyBalls');
        container.innerHTML = luckyNums.map(n => `<div class="lotto-ball ${getBallColorClass(n)}" style="width:32px; height:32px; font-size:12px;">${n}</div>`).join('');

        document.getElementById('applyFortuneBallsBtn').onclick = () => {
            state.includedNumbers.clear();
            luckyNums.forEach(n => state.includedNumbers.add(n));
            state.mode = 'custom';
            document.querySelectorAll('.chip-btn').forEach(b => {
                if (b.getAttribute('data-mode') === 'custom') b.classList.add('active');
                else b.classList.remove('active');
            });
            document.getElementById('customFilterBox').classList.remove('hidden');
            updateFilterSummaryText();
            renderNumberGridSelector();
            fortuneModal.classList.add('hidden');
            alert(`행운의 번호 (${luckyNums.join(', ')})가 고정수로 적용되었습니다!`);
        };
    }

    // Initialize View
    renderSavedTickets();
});
