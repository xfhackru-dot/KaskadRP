// Управление страницами
const PAGES = {
    main: document.getElementById('page-main'),
    register: document.getElementById('page-register'),
    login: document.getElementById('page-login'),
    site: document.getElementById('page-site'),
    passport: document.getElementById('page-passport'),
    passportEdit: document.getElementById('page-passport-edit'),
    passportReady: document.getElementById('page-passport-ready'),
    gosnumber: document.getElementById('page-gosnumber'),
    generator: document.getElementById('page-generator'),
    job: document.getElementById('page-job'),
    jobHire: document.getElementById('page-job-hire'),
    jobHireSub: document.getElementById('page-job-hire-sub'),
    jobFire: document.getElementById('page-job-fire'),
    cardealer: document.getElementById('page-cardealer'),
    cardealerSub: document.getElementById('page-cardealer-sub'),
    pts: document.getElementById('page-pts'),
    tuning: document.getElementById('page-tuning')
};

function showPage(name) {
    Object.keys(PAGES).forEach(key => {
        PAGES[key].classList.toggle('active', key === name);
    });
}

// Настройка кнопок навигации
function setupNavigation() {
    const buttons = {
        'btnToRegister': 'register',
        'btnToLogin': 'login',
        'btnBackToMain': 'main',
        'btnBackFromLogin': 'main',
        'btnBackToSite': 'site',
        'btnBackToSiteGos': 'site',
        'btnBackToSiteFromPass': 'site',
        'btnBackToSiteJob': 'site',
        'btnBackToSiteCar': 'site',
        'btnBackToSitePTS': 'site',
        'btnBackToSiteTuning': 'site',
        'btnBackToGosType': 'gosnumber',
        'btnBackToJob': 'job',
        'btnBackToHire': 'jobHire',
        'btnBackToJobFire': 'job',
        'btnBackToCarClasses': 'cardealer',
        'btnBackToPassport': 'passportReady',
        'btnBackToPassportEdit': 'passportReady'
    };

    Object.keys(buttons).forEach(btnId => {
        const btn = document.getElementById(btnId);
        if (btn) {
            btn.addEventListener('click', () => showPage(buttons[btnId]));
        }
    });
}