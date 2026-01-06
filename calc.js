// calc.js - 最終優化版 (含自動存檔與模組化邏輯)

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
        // 存檔用的 Key
        storageKey: "author_quiz_progress_v1" 
    };

    const form = document.getElementById("quiz-form");
    if (!form) return;

    // 1. 嘗試讀取進度 (自動填入上次的答案)
    loadProgress();

    // 2. 監聽變動 (一選就存)
    form.addEventListener('change', saveProgress);

    // 3. 監聽送出
    form.addEventListener('submit', handleFormSubmit);

    // --- 主邏輯 ---
    function handleFormSubmit(event) {
        event.preventDefault();

        const unanswered = checkUnanswered();

        if (unanswered.length > 0) {
            alertUnanswered(unanswered);
            scrollToQuestion(unanswered[0]);
            return;
        }

        const scores = calculateScores();
        displayResults(scores);
        // 如果想在送出後清空紀錄，可 uncomment 下一行
        // localStorage.removeItem(CONFIG.storageKey);
    }

    // --- 存檔與讀取 ---
    function saveProgress() {
        const formData = new FormData(form);
        const data = {};
        for (const [key, value] of formData.entries()) {
            data[key] = value;
        }
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(data));
    }

    function loadProgress() {
        const saved = localStorage.getItem(CONFIG.storageKey);
        if (saved) {
            try {
                const data = JSON.parse(saved);
                for (const [key, value] of Object.entries(data)) {
                    // 找到對應的 input 並勾選
                    const input = form.querySelector(`input[name="${key}"][value="${value}"]`);
                    if (input) input.checked = true;
                }
            } catch (e) {
                console.error("讀取進度失敗", e);
            }
        }
    }

    // --- 輔助邏輯 ---
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
        // 填入表格
        CONFIG.academies.forEach((academy, index) => {
            const el = document.getElementById(academy.id);
            if (el) el.innerText = scores[index];
        });

        // 找出最高分
        const maxScore = Math.max(...scores);
        const topAcademyNames = CONFIG.academies
            .filter((_, index) => scores[index] === maxScore)
            .map(a => a.name);

        // 顯示最高分學院名稱
        const topAcademyEl = document.getElementById("top-academy");
        if (topAcademyEl) {
            topAcademyEl.innerText = topAcademyNames.join(" & ");
        }

        // 顯示結果區塊
        const resultSection = document.getElementById("result-section");
        if (resultSection) {
            resultSection.style.display = "block";
            setTimeout(() => {
                resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 100);
        }
    }
});