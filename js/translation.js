// js/translation.js — 語言切換邏輯

window.currentLang = localStorage.getItem('lang') || 'zh-TW';

function applyLang(lang) {
    window.currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    const t = window.UI_TRANSLATIONS[lang];
    if (!t) return;

    // <title>
    document.title = t.pageTitle || document.title;

    // data-i18n-key 文字節點
    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        if (t[key] !== undefined) el.textContent = t[key];
    });

    // 語言按鈕 active 狀態
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.lang === lang);
    });

    // 通知其他模組語言已切換（calc.js 監聽此事件）
    document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
}

document.addEventListener('DOMContentLoaded', () => {
    // 掛載語言按鈕
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.addEventListener('click', () => applyLang(btn.dataset.lang));
    });
    applyLang(window.currentLang);
});
