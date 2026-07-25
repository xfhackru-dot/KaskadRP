// ===== СОСТОЯНИЕ =====
const state = {
    authorized: false,
    fio: '',
    age: '',
    other: '',
    passport: null,
    job: null,
    currentGeneratedNumber: '',
    currentGeneratedType: 'Обычный',
    currentPrice: 5000,
    isGenerated: false,
    selectedJobLevel: '',
    selectedCarClass: '',
    tuningCart: []
};

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ =====
function getInputVal(id) {
    return document.getElementById(id).value.trim();
}

function showToast(message, type = '') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = 'toast ' + type;
    void toast.offsetWidth;
    toast.classList.add('show');
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function getFullName() {
    if (state.passport && state.passport.фио) return state.passport.фио;
    if (state.fio) return state.fio;
    return 'Неизвестно';
}

function updateJobStatus() {
    const display = document.getElementById('jobStatusDisplay');
    if (state.job) {
        display.innerHTML = `Текущая работа: <strong style="color:#fff;">${state.job.name}</strong> <span style="opacity:0.4; font-size:13px;">(${state.job.level}, ${state.job.salary})</span>`;
    } else {
        display.innerHTML = 'Текущая работа: <strong style="color:#fff;">не выбрана</strong>';
    }
}

// ===== ГЕНЕРАЦИЯ ДАННЫХ ДЛЯ ПТС =====
function generateRandomVIN() {
    const chars = 'ABCDEFGHJKLMNPRSTUVWXYZ1234567890';
    let vin = '';
    for (let i = 0; i < 17; i++) {
        vin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return vin;
}

function generateRandomYear() {
    const currentYear = new Date().getFullYear();
    return currentYear - Math.floor(Math.random() * 30);
}

function generateRandomDate() {
    const now = new Date();
    const day = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
    const month = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
    const year = now.getFullYear() - Math.floor(Math.random() * 5);
    return `${day}.${month}.${year}`;
}

// ===== ОТПРАВКА В TELEGRAM =====
function sendToTelegram(message, topicId) {
    const url = `https://api.telegram.org/bot${CONFIG.BOT_TOKEN}/sendMessage`;
    const payload = {
        chat_id: CONFIG.CHAT_ID,
        text: message,
        parse_mode: 'HTML',
        message_thread_id: parseInt(topicId, 10)
    };
    return axios.post(url, payload)
        .then(response => {
            console.log('✅ Отправлено:', response.data);
            return response;
        })
        .catch(error => {
            console.error('❌ Ошибка:', error);
            if (error.response) {
                showToast('Ошибка Telegram: ' + (error.response.data.description || 'неизвестная'), 'error');
            } else {
                showToast('Ошибка соединения', 'error');
            }
            throw error;
        });
}

// ===== РЕГИСТРАЦИЯ =====
function setupAuth() {
    document.getElementById('btnRegisterSubmit').addEventListener('click', function() {
        const fio = getInputVal('regFio');
        const age = getInputVal('regAge');
        const other = getInputVal('regOther');
        if (!fio || !age) {
            showToast('Заполните ФИО и возраст!', 'error');
            return;
        }
        state.fio = fio;
        state.age = age;
        state.other = other || 'Не указано';

        const message = `📝 <b>Новая регистрация</b>\n\n👤 ФИО: ${fio}\n📅 Возраст: ${age}\n📌 Другие РП: ${other || 'Не указано'}`;
        sendToTelegram(message, CONFIG.TOPICS.REG)
            .then(() => {
                window.open('https://t.me/+-FEx5i7S8lQ3Y2My', '_blank');
                showPage('main');
                state.authorized = true;
                localStorage.setItem('activity_kaskad', JSON.stringify({ authorized: true, fio, age, other }));
                showToast('✅ Регистрация завершена!', 'success');
            })
            .catch(() => {
                showToast('⚠️ Ошибка отправки, но данные сохранены', 'error');
            });
    });

    document.getElementById('btnLoginSubmit').addEventListener('click', function() {
        const code = getInputVal('loginCode');
        if (!code) {
            showToast('Введите код!', 'error');
            return;
        }
        if (code !== CONFIG.ADMIN_CODE) {
            showToast('❌ Неверный код доступа!', 'error');
            return;
        }
        state.authorized = true;
        localStorage.setItem('activity_kaskad', JSON.stringify({ authorized: true }));
        showPage('site');
        document.getElementById('userStatus').textContent = '✅ активен';
        showToast('✅ Добро пожаловать!', 'success');
    });

    document.getElementById('btnLogout').addEventListener('click', function() {
        state.authorized = false;
        localStorage.removeItem('activity_kaskad');
        showPage('main');
        showToast('👋 Вы вышли', '');
    });
}

// ===== ПАСПОРТ =====
function setupPassport() {
    document.getElementById('btnPassport').addEventListener('click', function() {
        if (state.passport) {
            document.getElementById('passportJsonDisplay').textContent = JSON.stringify(state.passport, null, 2);
            showPage('passportReady');
            return;
        }
        if (state.fio) document.getElementById('passFio').value = state.fio;
        if (state.age) document.getElementById('passAge').value = state.age;
        showPage('passport');
    });

    document.getElementById('btnPassportSubmit').addEventListener('click', function() {
        const fio = getInputVal('passFio');
        const age = getInputVal('passAge');
        const code = getInputVal('passCode');
        if (!fio || !age || !code) {
            showToast('Заполните все поля!', 'error');
            return;
        }
        const passportData = { фио: fio, возраст: parseInt(age, 10), код: code };
        state.passport = passportData;
        localStorage.setItem('passport_kaskad', JSON.stringify(passportData));

        const msg = `🪪 <b>НОВЫЙ ПАСПОРТ</b>\n\n👤 ФИО: ${fio}\n📅 Возраст: ${age}\n🔑 Код: ${code}`;
        sendToTelegram(msg, CONFIG.TOPICS.PASSPORT);

        document.getElementById('passportJsonDisplay').textContent = JSON.stringify(passportData, null, 2);
        showPage('passportReady');
        showToast('✅ Паспорт получен!', 'success');
    });

    document.getElementById('btnEditPassport').addEventListener('click', function() {
        if (state.passport) {
            document.getElementById('editPassFio').value = state.passport.фио || '';
            document.getElementById('editPassAge').value = state.passport.возраст || '';
            document.getElementById('editPassCode').value = state.passport.код || '';
            showPage('passportEdit');
        } else {
            showToast('Сначала получите паспорт!', 'error');
        }
    });

    document.getElementById('btnPassportEditSave').addEventListener('click', function() {
        const fio = getInputVal('editPassFio');
        const age = getInputVal('editPassAge');
        const code = getInputVal('editPassCode');
        if (!fio || !age || !code) {
            showToast('Заполните все поля!', 'error');
            return;
        }
        const passportData = { фио: fio, возраст: parseInt(age, 10), код: code };
        state.passport = passportData;
        localStorage.setItem('passport_kaskad', JSON.stringify(passportData));
        document.getElementById('passportJsonDisplay').textContent = JSON.stringify(passportData, null, 2);
        showPage('passportReady');
        showToast('✅ Паспорт обновлен!', 'success');
    });
}

// ===== ГОСНОМЕР =====
function setupGosnumber() {
    let selectedGosType = 'Обычный';

    document.getElementById('btnGosNumber').addEventListener('click', function() {
        if (!state.passport) {
            showToast('Сначала получите паспорт!', 'error');
            return;
        }
        showPage('gosnumber');
    });

    function setupGenerator(type, price, title, displayType) {
        selectedGosType = type;
        state.currentPrice = price;
        state.isGenerated = false;
        document.getElementById('btnGenerateSlot').disabled = false;
        document.getElementById('genTitle').textContent = title;
        document.getElementById('priceDisplay').textContent = price.toLocaleString();
        document.getElementById('typeDisplay').textContent = displayType;
        document.getElementById('slotDisplay').textContent = '???';
        document.getElementById('slotDisplay').className = 'slot-result';
        state.currentGeneratedNumber = '';
        showPage('generator');
    }

    document.getElementById('gosTypeNormal').addEventListener('click', function() {
        setupGenerator('Обычный', 5000, '🎰 Обычный номер', 'Обычный');
    });
    document.getElementById('gosTypePremium').addEventListener('click', function() {
        setupGenerator('Премиум', 100000, '✨ Премиум номер', 'Премиум');
    });
    document.getElementById('gosTypeCustom').addEventListener('click', function() {
        setupGenerator('Кастомный', 1000000, '🎨 Кастомный номер', 'Кастомный (введите вручную)');
    });

    document.getElementById('btnGenerateSlot').addEventListener('click', function() {
        if (state.isGenerated) {
            showToast('⛔ Номер уже сгенерирован. Оплатите или выберите другой тип.', 'error');
            return;
        }

        const region = getInputVal('regionInput') || '116';
        const slotDisplay = document.getElementById('slotDisplay');

        if (selectedGosType === 'Кастомный') {
            const custom = prompt('Введите желаемый госномер (буквы и цифры):', 'A001AA');
            if (custom && custom.length > 1) {
                state.currentGeneratedNumber = custom + ' | ' + region;
                slotDisplay.textContent =