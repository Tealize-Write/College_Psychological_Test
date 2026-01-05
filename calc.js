document.addEventListener('DOMContentLoaded', () => {
    // --- 設定區 ---
    const CONFIG = {
        totalQuestions: 30,
        academies: [
            { name: "紅馳學院", id: "sred-text" },
            { name: "綠躍學院", id: "sgreen-text" },
            { name: "藍行學院", id: "sblue-text" },
            { name: "墨佇學院", id: "sblack-text" },
            { name: "銀倚學院", id: "swhite-text" }
        ],
        // 在瀏覽器中儲存資料的鑰匙名稱
        storageKey: "author_quiz_progress_v1" 
    };

    const form = document.getElementById("quiz-form");
    if (!form) return;

    // --- 1. 初始化：一進來就嘗試讀取上次的紀錄 ---
    loadProgress();

    // --- 2. 事件監聽 ---
    
    // 當表單有任何變動（使用者選了選項），就立刻存檔
    form.addEventListener('change', () => {
        saveProgress();
    });

    // 送出表單的處理
    form.addEventListener('submit', handleFormSubmit);


    // --- 主邏輯 ---
    function handleFormSubmit(event) {
        event.preventDefault();

        // 驗證是否有未填項目
        const unanswered = checkUnanswered();

        if (unanswered.length > 0) {
            alertUnanswered(unanswered);
            scrollToQuestion(unanswered[0]);
            return;
        }

        // 計算並顯示結果
        const scores = calculateScores();
        displayResults(scores);
        
        // 備註：因為使用者可能想修改答案再看結果，所以這裡「不」自動清空紀錄。
        // 如果你希望送出後就清空，可以把下面這行的註解拿掉：
        // localStorage.removeItem(CONFIG.storageKey);
    }

    // --- 新增功能：儲存與讀取 ---

    function saveProgress() {
        const formData = new FormData(form);
        const data = {};
        // 把所有選中的答案轉成物件 (例如: {degree1: "2_3_0_0_0", ...})
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        // 存入 localStorage (轉成字串)
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    }

    function loadProgress() {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                // 遍歷存檔資料，把對應的選項打勾
                for (const [key, value] of Object.entries(data)) {
                    const input = form.querySelector(`input[name="${key}"][value="${value}"]`);
                    if (input) input.checked = true;
                }
            } catch (e) {
                console.error("讀取進度失敗", e);
            }
        }
    }

    // --- 輔助函式 (保持原本邏輯) ---

    function checkUnanswered() {
        const missing = [];
        for (let i = 1; i <= CONFIG.totalQuestions; i++) {
            if (!form.querySelector(`input[name="degree${i}"]:checked`)) {
                missing.push(i);
            }
        }
        return missing;
    }

    function alertUnanswered(unanswered) {
        const part1 = unanswered.filter(n => n <= 20);
        const part2 = unanswered.filter(n => n > 20).map(n => n - 20);

        let msg = "還有題目沒有完成喔！\n";
        if (part1.length) msg += `\n第一大題：${part1.join(", ")}`;
        if (part2.length) msg += `\n第二大題：${part2.join(", ")}`;

        alert(msg);
    }

    function scrollToQuestion(index) {
        const input = form.querySelector(`input[name="degree${index}"]`);
        if (input) {
            const container = input.closest('.question, .choice-questions') || input.closest('div');
            container?.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    }

    function calculateScores() {
        const scores = new Array(CONFIG.academies.length).fill(0);

        for (let i = 1; i <= CONFIG.totalQuestions; i++) {
            const selected = form.querySelector(`input[name="degree${i}"]:checked`);
            if (selected) {
                const values = selected.value.split("_").map(Number);
                values.forEach((val, idx) => {
                    scores[idx] += val;
                });
            }
        }
        return scores;
    }

    function displayResults(scores) {
        // 填入表格分數
        CONFIG.academies.forEach((academy, index) => {
            const el = document.getElementById(academy.id);
            if (el) el.innerText = scores[index];
        });

        // 找出最高分學院
        const maxScore = Math.max(...scores);
        const topAcademyNames = CONFIG.academies
            .filter((_, index) => scores[index] === maxScore)
            .map(a => a.name);

        const topAcademyEl = document.getElementById("top-academy");
        if (topAcademyEl) {
            topAcademyEl.innerText = topAcademyNames.join(" & ");
        }

        // 顯示結果區塊並滑動
        const resultSection = document.getElementById("result-section");
        if (resultSection) {
            resultSection.style.display = "block";
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }
});