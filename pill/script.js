/**
 * DIABETES PILL TRACKER & GALAXY WIDGET LOGIC
 * High contrast daily check-in, streak counter, monthly history, PWA support
 */

document.addEventListener('DOMContentLoaded', () => {
    // Format Date string YYYY-MM-DD
    function getTodayKey() {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    function formatKoreanDate(dateObj) {
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth() + 1;
        const d = dateObj.getDate();
        const days = ['일', '월', '화', '수', '목', '금', '토'];
        const dayName = days[dateObj.getDay()];
        return `${y}년 ${m}월 ${d}일 (${dayName})`;
    }

    // State Storage Structure:
    // { "2026-08-17": { morning: true, morningTime: "08:15", evening: false, eveningTime: null } }
    const storeKey = 'diabetes_pill_history_v1';
    let history = JSON.parse(localStorage.getItem(storeKey) || '{}');

    let currentYear = new Date().getFullYear();
    let currentMonth = new Date().getMonth();

    function getTodayData() {
        const today = getTodayKey();
        if (!history[today]) {
            history[today] = { morning: false, morningTime: null, evening: false, eveningTime: null };
            saveHistory();
        }
        return history[today];
    }

    function saveHistory() {
        localStorage.setItem(storeKey, JSON.stringify(history));
    }

    // --- UI Update Renderers ---
    function updateTodayHeader() {
        document.getElementById('currentDateText').textContent = formatKoreanDate(new Date());
    }

    function renderTodayStatus() {
        const data = getTodayData();

        // Morning Pill Card
        const morningCard = document.getElementById('morningCard');
        const morningTitle = document.getElementById('morningStatusTitle');
        const morningTime = document.getElementById('morningTimeText');
        const morningBtn = document.getElementById('toggleMorningBtn');

        if (data.morning) {
            morningCard.classList.add('completed');
            morningTitle.textContent = '아침 약 복용 완료! 💊';
            morningTime.textContent = `복용 시간: 오늘 ${data.morningTime}`;
            morningBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> 복용 취소하기`;
        } else {
            morningCard.classList.remove('completed');
            morningTitle.textContent = '아침 약 미복용';
            morningTime.textContent = '아직 복용하지 않았습니다';
            morningBtn.innerHTML = `<i class="fa-solid fa-check"></i> 아침 약 복용 완료!`;
        }

        // Evening Pill Card
        const eveningCard = document.getElementById('eveningCard');
        const eveningTitle = document.getElementById('eveningStatusTitle');
        const eveningTime = document.getElementById('eveningTimeText');
        const eveningBtn = document.getElementById('toggleEveningBtn');

        if (data.evening) {
            eveningCard.classList.add('completed');
            eveningTitle.textContent = '저녁 약 복용 완료! 💊';
            eveningTime.textContent = `복용 시간: 오늘 ${data.eveningTime}`;
            eveningBtn.innerHTML = `<i class="fa-solid fa-circle-check"></i> 복용 취소하기`;
        } else {
            eveningCard.classList.remove('completed');
            eveningTitle.textContent = '저녁 약 미복용';
            eveningTime.textContent = '아직 복용하지 않았습니다';
            eveningBtn.innerHTML = `<i class="fa-solid fa-check"></i> 저녁 약 복용 완료!`;
        }

        calculateStreak();
        renderCalendar();
    }

    // --- Streak Calculation ---
    function calculateStreak() {
        let streak = 0;
        let d = new Date();

        while (true) {
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const key = `${y}-${m}-${day}`;

            const entry = history[key];
            if (entry && (entry.morning || entry.evening)) {
                streak++;
                d.setDate(d.getDate() - 1);
            } else {
                // If today is not checked yet, look at yesterday before breaking streak
                if (key === getTodayKey()) {
                    d.setDate(d.getDate() - 1);
                    continue;
                }
                break;
            }
        }

        document.getElementById('streakBadge').innerHTML = `<i class="fa-solid fa-fire"></i> ${streak}일 연속 복용 중`;
    }

    // --- Action Handlers ---
    function triggerHapticFeedback() {
        if (navigator.vibrate) {
            navigator.vibrate([40, 60, 40]);
        }
    }

    function getCurrentTimeString() {
        const d = new Date();
        let hours = d.getHours();
        const mins = String(d.getMinutes()).padStart(2, '0');
        const ampm = hours >= 12 ? 'PM' : 'AM';
        hours = hours % 12 || 12;
        return `${ampm} ${String(hours).padStart(2, '0')}:${mins}`;
    }

    document.getElementById('toggleMorningBtn').addEventListener('click', () => {
        const data = getTodayData();
        data.morning = !data.morning;
        data.morningTime = data.morning ? getCurrentTimeString() : null;
        saveHistory();
        triggerHapticFeedback();
        renderTodayStatus();
    });

    document.getElementById('toggleEveningBtn').addEventListener('click', () => {
        const data = getTodayData();
        data.evening = !data.evening;
        data.eveningTime = data.evening ? getCurrentTimeString() : null;
        saveHistory();
        triggerHapticFeedback();
        renderTodayStatus();
    });

    // --- Calendar Renderer ---
    function renderCalendar() {
        const grid = document.getElementById('calendarDaysGrid');
        grid.innerHTML = '';

        document.getElementById('calendarMonthTitle').textContent = `${currentYear}년 ${currentMonth + 1}월`;

        const firstDayIndex = new Date(currentYear, currentMonth, 1).getDay();
        const totalDays = new Date(currentYear, currentMonth + 1, 0).getDate();
        const todayStr = getTodayKey();

        // Empty cells before start of month
        for (let i = 0; i < firstDayIndex; i++) {
            const emptyCell = document.createElement('div');
            emptyCell.className = 'day-cell empty';
            grid.appendChild(emptyCell);
        }

        // Month days
        for (let d = 1; d <= totalDays; d++) {
            const dayCell = document.createElement('div');
            dayCell.className = 'day-cell';

            const mStr = String(currentMonth + 1).padStart(2, '0');
            const dStr = String(d).padStart(2, '0');
            const dateKey = `${currentYear}-${mStr}-${dStr}`;

            if (dateKey === todayStr) {
                dayCell.classList.add('today');
            }

            dayCell.textContent = d;

            // Status Dot
            const entry = history[dateKey];
            const dot = document.createElement('div');
            dot.className = 'day-status-dot';

            if (entry) {
                if (entry.morning && entry.evening) {
                    dot.classList.add('full');
                } else if (entry.morning || entry.evening) {
                    dot.classList.add('half');
                } else {
                    dot.classList.add('none');
                }
            } else {
                dot.classList.add('none');
            }

            dayCell.appendChild(dot);
            grid.appendChild(dayCell);
        }
    }

    document.getElementById('prevMonthBtn').addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        renderCalendar();
    });

    document.getElementById('nextMonthBtn').addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        renderCalendar();
    });

    // --- PWA Installation Support ---
    let deferredPrompt;
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        const installBtn = document.getElementById('pwaInstallBtn');
        installBtn.style.display = 'flex';
    });

    document.getElementById('pwaInstallBtn').addEventListener('click', () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted Galaxy home screen install');
                }
                deferredPrompt = null;
            });
        } else {
            alert('갤럭시 브라우저 우측 상단/하단 메뉴(⋮)에서 "홈 화면에 추가"를 누르시면 됩니다!');
        }
    });

    // Initial setup & auto refresh check at midnight
    updateTodayHeader();
    renderTodayStatus();

    // Check date tick every 1 minute
    setInterval(() => {
        updateTodayHeader();
        renderTodayStatus();
    }, 60000);
});
