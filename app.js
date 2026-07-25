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
                slotDisplay.textContent = custom + ' ' + region;
                slotDisplay.className = 'slot-result generated';
                state.isGenerated = true;
                document.getElementById('btnGenerateSlot').disabled = true;
                showToast('✅ Номер сгенерирован!', 'success');
            } else {
                showToast('Введите корректный номер', 'error');
            }
            return;
        }

        const letters = 'АВЕКМНОРСТУХ'.split('');
        const digits = '0123456789'.split('');

        function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

        let result = '';

        if (selectedGosType === 'Обычный') {
            const l1 = randomItem(letters);
            const d1 = randomItem(digits);
            const d2 = randomItem(digits);
            const d3 = randomItem(digits);
            const l2 = randomItem(letters);
            const l3 = randomItem(letters);
            result = l1 + d1 + d2 + d3 + l2 + l3;
        } else if (selectedGosType === 'Премиум') {
            const isMirror = Math.random() > 0.5;
            let letterPart = '';
            let digitPart = '';

            if (isMirror) {
                const useLetters = Math.random() > 0.5;
                if (useLetters) {
                    const l1 = randomItem(letters);
                    const l2 = randomItem(letters);
                    letterPart = l1 + l2 + l1;
                    digitPart = randomItem(digits) + randomItem(digits) + randomItem(digits);
                } else {
                    const d1 = randomItem(digits);
                    const d2 = randomItem(digits);
                    digitPart = d1 + d2 + d1;
                    letterPart = randomItem(letters) + randomItem(letters) + randomItem(letters);
                }
            } else {
                const useLetters = Math.random() > 0.5;
                if (useLetters) {
                    const l = randomItem(letters);
                    letterPart = l + l + l;
                    digitPart = randomItem(digits) + randomItem(digits) + randomItem(digits);
                } else {
                    const d = randomItem(digits);
                    digitPart = d + d + d;
                    letterPart = randomItem(letters) + randomItem(letters) + randomItem(letters);
                }
            }
            result = letterPart + digitPart;
        }

        state.currentGeneratedNumber = result + ' | ' + region;
        slotDisplay.textContent = result + ' ' + region;
        slotDisplay.className = 'slot-result generated';
        state.isGenerated = true;
        document.getElementById('btnGenerateSlot').disabled = true;
        showToast('✅ Номер сгенерирован!', 'success');
    });

    document.getElementById('btnBuyGosnumber').addEventListener('click', function() {
        if (!state.currentGeneratedNumber) {
            showToast('Сначала сгенерируйте номер!', 'error');
            return;
        }
        if (!state.passport) {
            showToast('Паспорт не найден! Получите паспорт.', 'error');
            return;
        }

        const fio = getFullName();
        const msg = `🚘 <b>НОВЫЙ ГОСНОМЕР</b>\n\n🔢 Номер: ${state.currentGeneratedNumber}\n👤 Пользователь: ${fio}\n💰 К оплате: ${state.currentPrice.toLocaleString()} ₽\n🏷 Тип: ${selectedGosType}`;

        sendToTelegram(msg, CONFIG.TOPICS.GOSNUMBER)
            .then(() => {
                showToast('✅ Госномер отправлен!', 'success');
                state.isGenerated = false;
                document.getElementById('btnGenerateSlot').disabled = false;
                document.getElementById('slotDisplay').textContent = '???';
                document.getElementById('slotDisplay').className = 'slot-result';
                state.currentGeneratedNumber = '';
                showPage('site');
            })
            .catch(() => {
                showToast('❌ Ошибка отправки', 'error');
            });
    });
}

// ===== РАБОТА =====
function setupJob() {
    document.getElementById('btnJob').addEventListener('click', function() {
        if (!state.passport) {
            showToast('Сначала получите паспорт!', 'error');
            return;
        }
        updateJobStatus();
        showPage('job');
    });

    document.getElementById('btnJobHire').addEventListener('click', function() {
        const container = document.getElementById('jobLevelsContainer');
        container.innerHTML = '';
        const levels = Object.keys(DATA.jobs);
        levels.forEach(level => {
            const div = document.createElement('div');
            div.className = 'job-item';
            div.innerHTML = `
                <div class="job-info">
                    <span style="font-size:18px; margin-right:8px;">📂</span>
                    <span class="job-name">${level}</span>
                    <span class="job-badge">${DATA.jobs[level].length} вакансий</span>
                </div>
                <span style="opacity:0.3;">→</span>
            `;
            div.addEventListener('click', function() {
                state.selectedJobLevel = level;
                showJobSubLevels(level);
            });
            container.appendChild(div);
        });
        showPage('jobHire');
    });

    function showJobSubLevels(level) {
        const container = document.getElementById('jobSubContainer');
        container.innerHTML = '';
        document.getElementById('jobSubTitle').textContent = `📋 ${level}`;

        const jobs = DATA.jobs[level] || [];
        jobs.forEach(job => {
            const div = document.createElement('div');
            div.className = 'job-item';
            div.innerHTML = `
                <div class="job-info">
                    <span class="job-emoji">${job.emoji}</span>
                    <span class="job-name">${job.name}</span>
                </div>
                <span class="job-salary">${job.salary}</span>
            `;
            div.addEventListener('click', function() {
                if (state.job && state.job.name === job.name && state.job.level === level) {
                    showToast('⚠️ Вы уже устроены на эту работу!', 'error');
                    return;
                }
                hireJob(level, job);
            });
            container.appendChild(div);
        });
        showPage('jobHireSub');
    }

    function hireJob(level, job) {
        const fio = getFullName();
        const msg = `💼 <b>ТРУДОУСТРОЙСТВО</b>\n\n👤 Пользователь: ${fio}\n📂 Уровень: ${level}\n💼 Работа: ${job.emoji} ${job.name}\n💰 Зарплата: ${job.salary}`;

        sendToTelegram(msg, CONFIG.TOPICS.JOB)
            .then(() => {
                state.job = {
                    level: level,
                    name: job.name,
                    salary: job.salary,
                    emoji: job.emoji
                };
                localStorage.setItem('activity_kaskad_job', JSON.stringify(state.job));
                showToast(`✅ Вы устроились на работу: ${job.name}!`, 'success');
                updateJobStatus();
                showPage('job');
            })
            .catch(() => {
                showToast('❌ Ошибка отправки', 'error');
            });
    }

    document.getElementById('btnJobFire').addEventListener('click', function() {
        if (!state.job) {
            showToast('⚠️ Вы нигде не работаете!', 'error');
            return;
        }
        document.getElementById('fireJobDisplay').textContent = `Работа: ${state.job.emoji} ${state.job.name} (${state.job.level})`;
        showPage('jobFire');
    });

    document.getElementById('btnFireConfirm').addEventListener('click', function() {
        if (!state.job) {
            showToast('⚠️ Вы нигде не работаете!', 'error');
            showPage('job');
            return;
        }

        const fio = getFullName();
        const jobName = `${state.job.emoji} ${state.job.name}`;
        const msg = `🚫 <b>УВОЛЬНЕНИЕ</b>\n\n👤 Пользователь: ${fio}\n💼 Уволился с работы: ${jobName}`;

        sendToTelegram(msg, CONFIG.TOPICS.JOB)
            .then(() => {
                const oldJob = state.job.name;
                state.job = null;
                localStorage.removeItem('activity_kaskad_job');
                showToast(`✅ Вы уволились с работы: ${oldJob}`, 'success');
                updateJobStatus();
                showPage('job');
            })
            .catch(() => {
                showToast('❌ Ошибка отправки', 'error');
            });
    });

    document.getElementById('btnFireCancel').addEventListener('click', function() {
        showPage('job');
    });
}

// ===== АВТОСАЛОН =====
function setupCarDealer() {
    document.getElementById('btnCarDealer').addEventListener('click', function() {
        if (!state.passport) {
            showToast('Сначала получите паспорт!', 'error');
            return;
        }
        showCarClasses();
    });

    function showCarClasses() {
        const container = document.getElementById('carClassesContainer');
        container.innerHTML = '';
        const classes = Object.keys(DATA.cars);
        classes.forEach(cls => {
            const div = document.createElement('div');
            div.className = 'job-item';
            div.innerHTML = `
                <div class="job-info">
                    <span style="font-size:18px; margin-right:8px;">🏎️</span>
                    <span class="job-name">${cls}</span>
                    <span class="job-badge">${DATA.cars[cls].length} авто</span>
                </div>
                <span style="opacity:0.3;">→</span>
            `;
            div.addEventListener('click', function() {
                state.selectedCarClass = cls;
                showCarSubLevels(cls);
            });
            container.appendChild(div);
        });
        showPage('cardealer');
    }

    function showCarSubLevels(cls) {
        const container = document.getElementById('carSubContainer');
        container.innerHTML = '';
        document.getElementById('carSubTitle').textContent = `🏎️ ${cls}`;
        document.getElementById('carSearch').value = '';
        renderCars(cls);
        showPage('cardealerSub');
    }

    function renderCars(cls, filter = '') {
        const container = document.getElementById('carSubContainer');
        container.innerHTML = '';
        
        const cars = DATA.cars[cls] || [];
        const filtered = cars.filter(car => 
            car.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = `<div style="text-align:center; opacity:0.4; padding:20px;">🚫 Автомобили не найдены</div>`;
            return;
        }

        filtered.forEach(car => {
            const div = document.createElement('div');
            div.className = 'car-item';
            div.innerHTML = `
                <div class="car-info">
                    <span class="car-emoji">🚗</span>
                    <span class="car-name">${car.name}</span>
                    ${car.hp ? `<span class="car-hp">${car.hp}</span>` : ''}
                </div>
                <span class="car-price">${car.price}</span>
            `;
            div.addEventListener('click', function() {
                buyCar(cls, car);
            });
            container.appendChild(div);
        });
    }

    document.getElementById('carSearch').addEventListener('input', function() {
        const filter = this.value;
        const cls = state.selectedCarClass;
        renderCars(cls, filter);
    });

    function buyCar(cls, car) {
        const fio = getFullName();
        const msg = `🏎️ <b>ПОКУПКА АВТОМОБИЛЯ</b>\n\n👤 Пользователь: ${fio}\n📂 Класс: ${cls}\n🚗 Автомобиль: ${car.name}\n💰 Цена: ${car.price}`;

        sendToTelegram(msg, CONFIG.TOPICS.CARDEALER)
            .then(() => {
                showToast(`✅ Чек отправлен! Авто: ${car.name}`, 'success');
                showPage('cardealer');
            })
            .catch(() => {
                showToast('❌ Ошибка отправки чека', 'error');
            });
    }
}

// ===== ПТС =====
function setupPTS() {
    function getAllCarsForPTS() {
        const allCars = [];
        Object.keys(DATA.cars).forEach(cls => {
            DATA.cars[cls].forEach(car => {
                allCars.push({
                    class: cls,
                    name: car.name,
                    hp: car.hp || 'N/A',
                    price: car.price
                });
            });
        });
        return allCars;
    }

    let allCarsList = getAllCarsForPTS();

    function renderPTSList(filter = '') {
        const container = document.getElementById('ptsContainer');
        container.innerHTML = '';
        
        const filtered = allCarsList.filter(car => 
            car.name.toLowerCase().includes(filter.toLowerCase())
        );

        if (filtered.length === 0) {
            container.innerHTML = `<div style="text-align:center; opacity:0.4; padding:20px;">🚫 Автомобили не найдены</div>`;
            return;
        }

        filtered.forEach(car => {
            const div = document.createElement('div');
            div.className = 'pts-item';
            div.innerHTML = `
                <div class="car-info">
                    <span style="font-size:18px; margin-right:8px;">🚗</span>
                    <span class="car-name">${car.name}</span>
                    <span class="car-hp">${car.hp}</span>
                </div>
                <span class="car-class">${car.class}</span>
            `;
            div.addEventListener('click', function() {
                sendPTS(car);
            });
            container.appendChild(div);
        });
    }

    function sendPTS(car) {
        if (!state.passport) {
            showToast('Сначала получите паспорт!', 'error');
            return;
        }

        const fio = getFullName();
        const vin = generateRandomVIN();
        const year = generateRandomYear();
        const date = generateRandomDate();

        let brand = car.name;
        let model = '';
        const parts = car.name.split(' ');
        if (parts.length > 1) {
            brand = parts[0];
            model = parts.slice(1).join(' ');
        } else {
            model = car.name;
        }

        const msg = `📄 <b>ПТС</b>\n\n👤 Пользователь: ${fio}\n🚗 Марка: ${brand}\n🚙 Модель: ${model}\n📅 Год выпуска: ${year}\n🔑 VIN: ${vin}\n📆 Дата выдачи: ${date}`;

        sendToTelegram(msg, CONFIG.TOPICS.PTS)
            .then(() => {
                showToast(`✅ ПТС отправлен для: ${car.name}`, 'success');
                showPage('site');
            })
            .catch(() => {
                showToast('❌ Ошибка отправки ПТС', 'error');
            });
    }

    document.getElementById('btnPTS').addEventListener('click', function() {
        if (!state.passport) {
            showToast('Сначала получите паспорт!', 'error');
            return;
        }
        allCarsList = getAllCarsForPTS();
        renderPTSList();
        showPage('pts');
    });

    document.getElementById('ptsSearch').addEventListener('input', function() {
        renderPTSList(this.value);
    });
}

// ===== ТЮНИНГ =====
function setupTuning() {
    function renderTuningParts() {
        const container = document.getElementById('tuningPartsContainer');
        container.innerHTML = '';
        
        DATA.tuningParts.forEach(part => {
            const div = document.createElement('div');
            div.className = 'tuning-item';
            div.innerHTML = `
                <span class="part-name">${part.name}</span>
                <span class="part-price">${part.price.toLocaleString()} ₽</span>
            `;
            div.addEventListener('click', function() {
                addToCart(part);
            });
            container.appendChild(div);
        });
    }

    function addToCart(part) {
        const existing = state.tuningCart.find(item => item.name === part.name);
        if (existing) {
            existing.quantity += 1;
        } else {
            state.tuningCart.push({ ...part, quantity: 1 });
        }
        updateCartDisplay();
        showToast(`✅ Добавлено: ${part.name}`, 'success');
    }

    function updateCartDisplay() {
        const cartElement = document.getElementById('tuningCart');
        
        if (state.tuningCart.length === 0) {
            cartElement.innerHTML = `<div class="empty-cart">🛒 Корзина пуста</div>`;
            return;
        }

        let html = '';
        let total = 0;
        state.tuningCart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            html += `
                <div class="cart-item">
                    <span>${index + 1}. ${item.name} × ${item.quantity}</span>
                    <span>${itemTotal.toLocaleString()} ₽</span>
                </div>
            `;
        });
        
        html += `
            <div class="cart-total">
                <span>💰 Итого:</span>
                <span>${total.toLocaleString()} ₽</span>
            </div>
        `;
        
        cartElement.innerHTML = html;
    }

    document.getElementById('btnTuningClear').addEventListener('click', function() {
        state.tuningCart = [];
        updateCartDisplay();
        showToast('🗑️ Корзина очищена', '');
    });

    document.getElementById('btnTuningSubmit').addEventListener('click', function() {
        if (state.tuningCart.length === 0) {
            showToast('⚠️ Корзина пуста! Добавьте детали.', 'error');
            return;
        }

        if (!state.passport) {
            showToast('Сначала получите паспорт!', 'error');
            return;
        }

        const fio = getFullName();
        let total = 0;
        let itemsList = '';
        
        state.tuningCart.forEach((item, index) => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            itemsList += `${index + 1}. ${item.name} × ${item.quantity} — ${itemTotal.toLocaleString()} ₽\n`;
        });

        const msg = `🔧 <b>ЗАКАЗ НА ТЮНИНГ</b>\n\n👤 Пользователь: ${fio}\n\n📦 <b>Запчасти:</b>\n${itemsList}\n💰 <b>Общая стоимость:</b> ${total.toLocaleString()} ₽`;

        sendToTelegram(msg, CONFIG.TOPICS.TUNING)
            .then(() => {
                showToast('✅ Заказ отправлен в мастерскую!', 'success');
                state.tuningCart = [];
                updateCartDisplay();
                showPage('site');
            })
            .catch(() => {
                showToast('❌ Ошибка отправки заказа', 'error');
            });
    });

    document.getElementById('btnTuning').addEventListener('click', function() {
        if (!state.passport) {
            showToast('Сначала получите паспорт!', 'error');
            return;
        }
        renderTuningParts();
        updateCartDisplay();
        showPage('tuning');
    });
}

// ===== ЗАГРУЗКА СОСТОЯНИЯ =====
function loadState() {
    const saved = localStorage.getItem('activity_kaskad');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            if (data.authorized) {
                state.authorized = true;
                if (data.fio) state.fio = data.fio;
                if (data.age) state.age = data.age;
                if (data.other) state.other = data.other;
                showPage('site');
                document.getElementById('userStatus').textContent = '✅ активен';
            }
        } catch (e) { /* ignore */ }
    }

    const passportSaved = localStorage.getItem('passport_kaskad');
    if (passportSaved) {
        try {
            state.passport = JSON.parse(passportSaved);
        } catch (e) { /* ignore */ }
    }

    const jobSaved = localStorage.getItem('activity_kaskad_job');
    if (jobSaved) {
        try {
            state.job = JSON.parse(jobSaved);
        } catch (e) { /* ignore */ }
    }

    updateJobStatus();
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
document.addEventListener('DOMContentLoaded', function() {
    setupNavigation();
    setupAuth();
    setupPassport();
    setupGosnumber();
    setupJob();
    setupCarDealer();
    setupPTS();
    setupTuning();
    loadState();

    if (state.authorized && document.getElementById('page-main').classList.contains('active')) {
        showPage('site');
    }

    console.log('✅ Kaskad RP загружена!');
    console.log('🚗 Всего авто в автосалонах:', Object.values(DATA.cars).reduce((acc, arr) => acc + arr.length, 0));
    console.log('🔧 Доступно запчастей:', DATA.tuningParts.length);
});
