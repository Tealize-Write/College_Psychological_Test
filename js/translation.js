// js/translation.js — 語言切換邏輯

window.currentLang = localStorage.getItem('lang') || 'zh-TW';

let _langBtns;

function applyLang(lang) {
    window.currentLang = lang;
    localStorage.setItem('lang', lang);
    document.documentElement.lang = lang;

    const t = window.UI_TRANSLATIONS[lang];
    if (!t) return;

    document.title = t.pageTitle || document.title;

    document.querySelectorAll('[data-i18n-key]').forEach(el => {
        const key = el.getAttribute('data-i18n-key');
        if (t[key] !== undefined) el.textContent = t[key];
    });

    _langBtns?.forEach(btn => btn.classList.toggle('active', btn.dataset.lang === lang));

    document.dispatchEvent(new CustomEvent('langChanged', { detail: { lang } }));
}

document.addEventListener('DOMContentLoaded', () => {
    _langBtns = document.querySelectorAll('.lang-btn');
    _langBtns.forEach(btn => btn.addEventListener('click', () => applyLang(btn.dataset.lang)));
    applyLang(window.currentLang);
});
