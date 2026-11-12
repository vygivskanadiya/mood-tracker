console.log('script.js підключено');

const app = document.querySelector('#app');

function cloneTemplate(templateId) {
  const template = document.getElementById(templateId);
  return template.content.firstElementChild.cloneNode(true);
}

const homeView = cloneTemplate('tpl-home');
const historyView = cloneTemplate('tpl-history');
const statsView = cloneTemplate('tpl-stats');
const communityView = cloneTemplate('tpl-community');

const seedRecords = [
  { date: '07.09.2026', mood: 5, note: 'Чудовий день, усе вдалося!' },
  { date: '08.09.2026', mood: 2, note: 'Було важко зосередитися.' },
  { date: '09.09.2026', mood: 3, note: 'Звичайний робочий день.' },
  { date: '10.09.2026', mood: 4, note: 'Продуктивний день.' },
  { date: '11.09.2026', mood: 1, note: 'Дуже втомилась, важкий день.' },
  { date: '12.09.2026', mood: 4, note: 'Зустріч із друзями.' },
  { date: '13.09.2026', mood: 5, note: 'Гарний вихідний.' },
];

const avgMoodOutput = document.querySelector('#avg-mood');
const recordsCountOutput = document.querySelector('#records-count');

function calcAverageMood(records) {
  let sum = 0;
  for (const record of records) {
    sum += record.mood;
  }
  return sum / records.length;
}

const averageMood = calcAverageMood(seedRecords);
console.log(`Середній настрій за період: ${averageMood.toFixed(2)}`);

const weekLabel = averageMood >= 3.5 ? 'гарний тиждень' : 'важкий тиждень';
console.log(`Оцінка тижня: ${weekLabel}`);

const moodToLabel = mood => {
  if (mood === 1) return 'Дуже сумний';
  if (mood === 2) return 'Сумний';
  if (mood === 3) return 'Нейтральний';
  if (mood === 4) return 'Радісний';
  return 'Дуже радісний';
};

for (const record of seedRecords) {
  console.log(`${record.date}: ${moodToLabel(record.mood)} (${record.mood})`);
}

function updateSummary() {
  const records = moodHistoryApp.moodRecords;
  if (!records || records.length === 0) {
    avgMoodOutput.textContent = 'Середній настрій: —';
    recordsCountOutput.textContent = 'Записів за тиждень: 0';
    return;
  }
  const currentAverage = calcAverageMood(records);
  const currentWeekLabel = currentAverage >= 3.5 ? 'гарний тиждень' : 'важкий тиждень';
  avgMoodOutput.textContent = `Середній настрій: ${currentAverage.toFixed(2)} (${currentWeekLabel})`;
  recordsCountOutput.textContent = `Записів за тиждень: ${records.length}`;
}

// ===== Практична робота №11: локальні сховища даних =====

const STORAGE_KEY = 'moodTrackerEntries';
const MIGRATED_FLAG = 'moodTrackerMigratedToIDB';

function saveToLocalStorage(items) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    console.error('Пошкоджені дані в localStorage:', error);
    return [];
  }
}

const DB_NAME = 'MoodTrackerDB';
const DB_VERSION = 1;
const STORE_NAME = 'moodEntries';

// Відкриває базу; object store створюється лише в onupgradeneeded.
function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Додає новий запис або оновлює наявний (put); id без значення генерує autoIncrement.
function addItem(item) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(item);
    request.onsuccess = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  }));
}

// Оновлює наявний запис — той самий put, але об'єкт уже містить свій id.
function updateItem(item) {
  return addItem(item);
}

// Повертає всю історію записів зі сховища.
function getAllItems() {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

function getItem(id) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

// Видаляє один запис за ключем id.
function deleteItem(id) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

// Одноразово переносить дані з localStorage у IndexedDB; прапорець не дає повторити міграцію.
async function migrateFromLocalStorage() {
  if (localStorage.getItem(MIGRATED_FLAG) === 'true') return;

  const existing = await getAllItems();
  if (existing.length > 0) {
    localStorage.setItem(MIGRATED_FLAG, 'true');
    return;
  }

  const legacy = loadFromLocalStorage();
  for (const record of legacy) {
    const { id, ...rest } = record;
    await addItem(rest);
  }
  localStorage.setItem(MIGRATED_FLAG, 'true');
  console.log(`Міграція з localStorage завершена: перенесено записів — ${legacy.length}`);
}

// ===== Практична робота №8: обробка подій, форми, валідація =====

const addMoodForm = homeView.querySelector('#add-mood-form');
const moodDateInput = homeView.querySelector('#mood-date');
const moodLevelInput = homeView.querySelector('#mood-level');
const moodNoteInput = homeView.querySelector('#mood-note');
const noteCounterOutput = homeView.querySelector('#note-counter');
const formStatus = homeView.querySelector('#form-status');

const NOTE_MAX_LENGTH = 200;

moodLevelInput.addEventListener('input', () => {
  const value = Number(moodLevelInput.value);
  if (moodLevelInput.value !== '' && (value < 1 || value > 5)) {
    moodLevelInput.setCustomValidity('Настрій оцінюється числом від 1 до 5');
  } else {
    moodLevelInput.setCustomValidity('');
  }
});

moodNoteInput.addEventListener('input', () => {
  const remaining = NOTE_MAX_LENGTH - moodNoteInput.value.length;
  noteCounterOutput.textContent = `Залишилось символів: ${remaining}`;
  noteCounterOutput.classList.toggle('near-limit', remaining <= 20);
});

function formatDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

function showFormStatus(message, isSuccess) {
  formStatus.textContent = message;
  formStatus.classList.toggle('error', !isSuccess);

  if (isSuccess) {
    const historyLink = document.createElement('a');
    historyLink.href = '#/history';
    historyLink.setAttribute('data-link', '');
    historyLink.textContent = ' Переглянути в історії';
    formStatus.append(historyLink);
  }
}

addMoodForm.addEventListener('input', () => {
  formStatus.textContent = '';
  formStatus.classList.remove('error');
});

addMoodForm.addEventListener('submit', async event => {
  event.preventDefault();

  const isoDate = moodDateInput.value;
  const moodValue = Number(moodLevelInput.value);
  const noteValue = moodNoteInput.value.trim();

  const newRecord = {
    date: formatDisplayDate(isoDate),
    mood: moodValue,
    note: noteValue || 'Без коментаря',
  };

  try {
    await addItem(newRecord);
  } catch (error) {
    console.error('Не вдалося зберегти запис у IndexedDB:', error);
    showFormStatus('Не вдалося зберегти запис. Текст у формі не втрачено — спробуйте ще раз.', false);
    return;
  }

  addMoodForm.reset();
  noteCounterOutput.textContent = `Залишилось символів: ${NOTE_MAX_LENGTH}`;
  noteCounterOutput.classList.remove('near-limit');
  showFormStatus('Запис збережено.', true);

  try {
    await moodHistoryApp.refresh();
  } catch (error) {
    console.error('Не вдалося оновити історію:', error);
  }
});

// ===== Практична робота №9 і №14: клієнт для API (fetch) =====

const API_URL = '/api/mood-entries?limit=5';

const apiNotesList = communityView.querySelector('#api-notes-list');
const apiStatus = communityView.querySelector('#api-status');
const reloadApiBtn = communityView.querySelector('#reload-api-btn');

let apiLoaded = false;

function renderApiNotes(records) {
  apiNotesList.innerHTML = '';

  records.forEach(record => {
    const card = document.createElement('article');
    card.classList.add('card');

    const title = document.createElement('h3');
    title.textContent = record.date;

    const note = document.createElement('p');
    note.textContent = record.note;

    const level = document.createElement('p');
    level.classList.add('meta');
    level.textContent = `Настрій: ${record.mood} — ${moodToLabel(record.mood)}`;

    card.append(title, note, level);
    apiNotesList.append(card);
  });
}

async function loadData() {
  apiStatus.textContent = 'Завантаження…';
  apiStatus.classList.remove('error');
  reloadApiBtn.disabled = true;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      throw new Error(`Сервер відповів кодом ${response.status}`);
    }

    const data = await response.json();
    console.log('Отримані дані з API:', data);

    renderApiNotes(data);
    apiLoaded = true;
    apiStatus.textContent = `Завантажено записів: ${data.length}`;
  } catch (error) {
    apiStatus.textContent = 'Записи тимчасово недоступні.';
    apiStatus.classList.add('error');
    console.error('Помилка завантаження даних з API:', error);
  } finally {
    reloadApiBtn.disabled = false;
  }
}

reloadApiBtn.addEventListener('click', loadData);

// ===== Практична робота №10: компонент MoodEntry на Vue 3 =====
// Обрала Vue 3, а не React: глобальна CDN-збірка не потребує Babel/JSX-транспіляції
// прямо в браузері, а синтаксис шаблону ближчий до HTML — простіше для роботи без збірки.

const MoodEntry = {
  props: {
    recordId: Number,
    date: String,
    mood: Number,
    note: String,
    linkable: { type: Boolean, default: true },
  },
  emits: ['delete'],
  computed: {
    emoji() {
      const emojiByMood = { 1: '😞', 2: '🙁', 3: '😐', 4: '🙂', 5: '😄' };
      return emojiByMood[this.mood] || '😐';
    },
    moodLabel() {
      const labelByMood = {
        1: 'Дуже сумний', 2: 'Сумний', 3: 'Нейтральний', 4: 'Радісний', 5: 'Дуже радісний',
      };
      return labelByMood[this.mood] || 'Нейтральний';
    },
    moodClass() {
      const classByMood = {
        1: 'mood-very-sad', 2: 'mood-sad', 3: 'mood-neutral', 4: 'mood-happy', 5: 'mood-very-happy',
      };
      return classByMood[this.mood] || 'mood-neutral';
    },
  },
  template: `
    <article class="card" :class="moodClass" :data-mood="mood">
      <button class="card-delete" type="button" title="Видалити запис" @click="$emit('delete', recordId)">×</button>
      <div class="card-head">
        <h3>{{ date }}</h3>
        <span class="mood-badge">{{ emoji }} {{ moodLabel }}</span>
      </div>
      <p>{{ note }}</p>
      <a v-if="linkable" class="card-link" data-link
         :href="'#/history/' + recordId">Докладніше →</a>
    </article>
  `,
};

const moodHistoryApp = Vue.createApp({
  components: { MoodEntry },
  data() {
    return {
      moodRecords: [],
      storageError: '',
    };
  },
  methods: {
    async refresh() {
      this.moodRecords = await getAllItems();
      updateSummary();
      updateStatsView();
      startChartAnimation();
    },
    async removeRecord(id) {
      try {
        await deleteItem(id);
        await this.refresh();
      } catch (error) {
        console.error('Не вдалося видалити запис:', error);
      }
    },
  },
}).mount(historyView.querySelector('#mood-history'));

// ===== Практична робота №12: Canvas-графік динаміки настрою =====
// Обрала Canvas, а не CSS-анімацію: ламаної лінії з довільною кількістю точок немає
// готовим DOM-елементом, а кількість точок залежить від числа записів у базі.

const chartCanvas = statsView.querySelector('#mood-chart');
const chartToggleBtn = statsView.querySelector('#chart-toggle-btn');
const chartCtx = chartCanvas.getContext('2d');

const CHART_POINTS = 7;
const CHART_DURATION = 900;
const MOOD_MIN = 1;
const MOOD_MAX = 5;
const CHART_PADDING = { top: 18, right: 16, bottom: 30, left: 34 };

let chartAnimationId = null;
let chartState = 'running';
let chartVisible = true;
let chartStartTime = null;
let chartElapsed = 0;
let chartProgress = 0;

// Читає кольори рівнів настрою з CSS-змінних, щоб графік збігався з оформленням карток.
let chartColors = null;
function getChartColors() {
  if (!chartColors) {
    const styles = getComputedStyle(document.documentElement);
    const read = (name, fallback) => styles.getPropertyValue(name).trim() || fallback;
    chartColors = {
      1: read('--mood-very-sad', '#51708a'),
      2: read('--mood-sad', '#6f7197'),
      3: read('--mood-neutral', '#787468'),
      4: read('--mood-happy', '#4f7c64'),
      5: read('--mood-very-happy', '#ad5d37'),
      grid: read('--lavender', '#e6defa'),
      line: read('--lavender-dark', '#b9a6e8'),
      text: read('--text-muted', '#71687c'),
    };
  }
  return chartColors;
}

// Обчислює область побудови — полотно за вирахуванням полів під підписи осей.
function chartGeometry() {
  return {
    plotLeft: CHART_PADDING.left,
    plotTop: CHART_PADDING.top,
    plotWidth: chartCanvas.width - CHART_PADDING.left - CHART_PADDING.right,
    plotHeight: chartCanvas.height - CHART_PADDING.top - CHART_PADDING.bottom,
  };
}

// Переводить рівень настрою 1-5 у координату Y: 5 угорі, 1 унизу.
function yForMood(mood, geometry) {
  const ratio = (mood - MOOD_MIN) / (MOOD_MAX - MOOD_MIN);
  return geometry.plotTop + (1 - ratio) * geometry.plotHeight;
}

// Будує точки графіка з останніх CHART_POINTS записів, прочитаних з IndexedDB.
function getChartPoints() {
  const lastRecords = moodHistoryApp.moodRecords.slice(-CHART_POINTS);
  const geometry = chartGeometry();
  const stepX = lastRecords.length > 1 ? geometry.plotWidth / (lastRecords.length - 1) : 0;

  return lastRecords.map((record, index) => ({
    x: lastRecords.length > 1
      ? geometry.plotLeft + index * stepX
      : geometry.plotLeft + geometry.plotWidth / 2,
    y: yForMood(record.mood, geometry),
    mood: record.mood,
    label: record.date.slice(0, 5),
  }));
}

// Малює сітку рівнів настрою 1-5 із підписами по осі Y.
function drawChartGrid(geometry) {
  const colors = getChartColors();
  chartCtx.strokeStyle = colors.grid;
  chartCtx.lineWidth = 1;
  chartCtx.fillStyle = colors.text;
  chartCtx.font = '12px system-ui, sans-serif';
  chartCtx.textAlign = 'right';
  chartCtx.textBaseline = 'middle';

  for (let mood = MOOD_MIN; mood <= MOOD_MAX; mood++) {
    const y = yForMood(mood, geometry);
    chartCtx.beginPath();
    chartCtx.moveTo(geometry.plotLeft, y);
    chartCtx.lineTo(geometry.plotLeft + geometry.plotWidth, y);
    chartCtx.stroke();
    chartCtx.fillText(String(mood), geometry.plotLeft - 8, y);
  }
}

// Малює один кадр; progress 0..1 задає, яка частина ламаної вже показана.
// clearRect на початку обов'язковий — інакше кадри накладаються один на одного.
function drawChartFrame(points, progress) {
  const colors = getChartColors();
  const geometry = chartGeometry();

  chartCtx.clearRect(0, 0, chartCanvas.width, chartCanvas.height);
  drawChartGrid(geometry);

  if (points.length === 0) {
    chartCtx.fillStyle = colors.text;
    chartCtx.font = '14px system-ui, sans-serif';
    chartCtx.textAlign = 'center';
    chartCtx.textBaseline = 'middle';
    chartCtx.fillText(
      'Ще немає записів для графіка',
      geometry.plotLeft + geometry.plotWidth / 2,
      geometry.plotTop + geometry.plotHeight / 2,
    );
    return;
  }

  const shownSegments = progress * Math.max(points.length - 1, 0);

  if (points.length > 1) {
    chartCtx.beginPath();
    chartCtx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      if (shownSegments >= i) {
        chartCtx.lineTo(points[i].x, points[i].y);
      } else {
        const partial = shownSegments - (i - 1);
        if (partial > 0) {
          const previous = points[i - 1];
          const current = points[i];
          chartCtx.lineTo(
            previous.x + (current.x - previous.x) * partial,
            previous.y + (current.y - previous.y) * partial,
          );
        }
        break;
      }
    }
    chartCtx.strokeStyle = colors.line;
    chartCtx.lineWidth = 2;
    chartCtx.lineJoin = 'round';
    chartCtx.lineCap = 'round';
    chartCtx.stroke();
  }

  chartCtx.font = '11px system-ui, sans-serif';
  chartCtx.textAlign = 'center';
  points.forEach((point, index) => {
    if (index > shownSegments && index !== 0) return;

    chartCtx.beginPath();
    chartCtx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    chartCtx.fillStyle = colors[point.mood] || colors[3];
    chartCtx.fill();
    chartCtx.strokeStyle = '#ffffff';
    chartCtx.lineWidth = 2;
    chartCtx.stroke();

    chartCtx.fillStyle = colors.text;
    chartCtx.textBaseline = 'top';
    chartCtx.fillText(point.label, point.x, geometry.plotTop + geometry.plotHeight + 8);
  });
}

// Оновлює напис кнопки відповідно до стану анімації.
function updateChartButton() {
  if (chartState === 'running') {
    chartToggleBtn.textContent = 'Пауза';
  } else if (chartState === 'paused') {
    chartToggleBtn.textContent = 'Продовжити';
  } else {
    chartToggleBtn.textContent = 'Відтворити';
  }
}

// Кадр циклу анімації; після досягнення progress = 1 наступний кадр не замовляється.
function animateChart(timestamp) {
  if (chartStartTime === null) chartStartTime = timestamp;

  const elapsed = chartElapsed + (timestamp - chartStartTime);
  chartProgress = Math.min(elapsed / CHART_DURATION, 1);
  drawChartFrame(getChartPoints(), chartProgress);

  if (chartProgress < 1) {
    chartAnimationId = requestAnimationFrame(animateChart);
  } else {
    chartAnimationId = null;
    chartStartTime = null;
    chartElapsed = CHART_DURATION;
    chartState = 'finished';
    updateChartButton();
  }
}

// Замовляє наступний кадр, якщо анімація має йти і полотно видно на екрані.
function scheduleChartFrame() {
  if (chartAnimationId !== null) return;
  if (!chartVisible || chartState !== 'running') return;
  chartStartTime = null;
  chartAnimationId = requestAnimationFrame(animateChart);
}

// Скасовує замовлений кадр через cancelAnimationFrame і запам'ятовує пройдений час.
function cancelChartFrame() {
  if (chartAnimationId === null) return;
  cancelAnimationFrame(chartAnimationId);
  chartAnimationId = null;
  if (chartStartTime !== null) {
    chartElapsed += performance.now() - chartStartTime;
    chartStartTime = null;
  }
}

// Запускає анімацію з нуля — викликається щоразу, коли змінюються дані застосунку.
function startChartAnimation() {
  cancelChartFrame();
  chartElapsed = 0;
  chartProgress = 0;
  chartState = 'running';
  updateChartButton();
  drawChartFrame(getChartPoints(), 0);
  scheduleChartFrame();
}

chartToggleBtn.addEventListener('click', () => {
  if (chartState === 'running') {
    cancelChartFrame();
    chartState = 'paused';
    updateChartButton();
  } else if (chartState === 'paused') {
    chartState = 'running';
    updateChartButton();
    scheduleChartFrame();
  } else {
    startChartAnimation();
  }
});

// Поки полотно поза екраном, кадри не замовляються — анімація не працює даремно.
if ('IntersectionObserver' in window) {
  const chartObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      chartVisible = entry.isIntersecting;
      if (chartVisible) {
        scheduleChartFrame();
      } else {
        cancelChartFrame();
      }
    });
  });
  chartObserver.observe(chartCanvas);
}

async function initStorage() {
  try {
    if (loadFromLocalStorage().length === 0 && localStorage.getItem(MIGRATED_FLAG) !== 'true') {
      saveToLocalStorage(seedRecords);
    }

    await migrateFromLocalStorage();
    await moodHistoryApp.refresh();
  } catch (error) {
    console.error('Помилка ініціалізації локального сховища:', error);
    moodHistoryApp.storageError = 'Локальне сховище недоступне — записи не збережуться між сеансами.';
  }
}

// ===== Практична робота №13: SPA та клієнтська маршрутизація =====

const statsPeriodSelect = statsView.querySelector('#stats-period');
const statsRangeOutput = statsView.querySelector('#stats-range');
const statsCountOutput = statsView.querySelector('#stats-count');
const statsAverageOutput = statsView.querySelector('#stats-average');

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function parseDisplayDate(displayDate) {
  const [day, month, year] = displayDate.split('.').map(Number);
  return Date.UTC(year, month - 1, day);
}

function getRecordsForPeriod(records, periodDays) {
  const byDate = (a, b) => parseDisplayDate(a.date) - parseDisplayDate(b.date);
  const sorted = [...records].sort(byDate);
  if (periodDays === 0 || sorted.length === 0) return sorted;

  const latest = parseDisplayDate(sorted[sorted.length - 1].date);
  const start = latest - (periodDays - 1) * MS_PER_DAY;
  return sorted.filter(record => parseDisplayDate(record.date) >= start);
}

function updateStatsView() {
  const periodDays = Number(statsPeriodSelect.value);
  const allRecords = moodHistoryApp.moodRecords;
  const periodRecords = getRecordsForPeriod(allRecords, periodDays);

  if (periodRecords.length === 0) {
    statsRangeOutput.textContent = 'Період: немає записів';
    statsCountOutput.textContent = 'Записів у періоді: 0';
    statsAverageOutput.textContent = 'Середній настрій: —';
    return;
  }

  const average = calcAverageMood(periodRecords);
  const firstDate = periodRecords[0].date;
  const lastDate = periodRecords[periodRecords.length - 1].date;

  statsRangeOutput.textContent = `Період: ${firstDate} – ${lastDate}`;
  statsCountOutput.textContent = `Записів у періоді: ${periodRecords.length}`;
  const averageText = average.toFixed(2);
  const moodLabel = moodToLabel(Math.round(average));
  statsAverageOutput.textContent =
    `Середній настрій: ${averageText} — ${moodLabel}`;
}

statsPeriodSelect.addEventListener('change', updateStatsView);

let renderId = 0;
let unmountCurrentView = null;

function clearApp() {
  if (unmountCurrentView) {
    unmountCurrentView();
    unmountCurrentView = null;
  }
  app.innerHTML = '';
}

function reloadFromStorage() {
  return moodHistoryApp.refresh().catch(error => {
    console.error('Не вдалося прочитати історію зі сховища:', error);
  });
}

function renderHome() {
  clearApp();
  app.append(homeView);
}

function renderHistory() {
  clearApp();
  app.append(historyView);
  reloadFromStorage();
}

function renderStats() {
  clearApp();
  app.append(statsView);
  reloadFromStorage();
}

function renderCommunity() {
  clearApp();
  app.append(communityView);
  if (!apiLoaded && !reloadApiBtn.disabled) loadData();
}

function mountEntryCard(container, record) {
  const detailApp = Vue.createApp({
    components: { MoodEntry },
    data() {
      return { record };
    },
    methods: {
      async removeRecord(idToDelete) {
        try {
          await deleteItem(idToDelete);
          await moodHistoryApp.refresh();
          navigate('/history');
        } catch (error) {
          console.error('Не вдалося видалити запис:', error);
        }
      },
    },
    template: `
      <mood-entry
        :record-id="record.id"
        :date="record.date"
        :mood="record.mood"
        :note="record.note"
        :linkable="false"
        @delete="removeRecord"
      ></mood-entry>
    `,
  });
  detailApp.mount(container);
  unmountCurrentView = () => detailApp.unmount();
}

async function renderEntryDetail({ id }) {
  clearApp();
  const currentRender = renderId;
  const recordId = Number(id);

  let record;
  try {
    record = Number.isInteger(recordId) ? await getItem(recordId) : undefined;
  } catch (error) {
    console.error('Не вдалося прочитати запис зі сховища:', error);
    if (currentRender === renderId) {
      renderNotFound('Не вдалося прочитати запис зі сховища.');
    }
    return;
  }

  if (currentRender !== renderId) return;
  if (!record) {
    renderNotFound(`Запис «${id}» не знайдено.`);
    return;
  }

  const section = document.createElement('section');
  section.classList.add('entry-detail');

  const title = document.createElement('h2');
  title.textContent = `Запис від ${record.date}`;

  const backLink = document.createElement('a');
  backLink.href = '#/history';
  backLink.setAttribute('data-link', '');
  backLink.classList.add('btn', 'btn-secondary');
  backLink.textContent = '← До історії';

  const cards = document.createElement('div');
  cards.classList.add('cards');

  section.append(title, backLink, cards);
  app.append(section);
  mountEntryCard(cards, record);
}

function renderNotFound(message) {
  clearApp();

  const section = document.createElement('section');
  section.classList.add('not-found');

  const title = document.createElement('h2');
  title.textContent = 'Не знайдено';

  const text = document.createElement('p');
  text.textContent = message;

  const homeLink = document.createElement('a');
  homeLink.href = '#/';
  homeLink.setAttribute('data-link', '');
  homeLink.classList.add('btn');
  homeLink.textContent = 'На головну';

  section.append(title, text, homeLink);
  app.append(section);
}

// Таблиця маршрутів: шлях-патерн → view; ":id" — параметр, який отримає view.
const routes = [
  { path: '/', view: renderHome },
  { path: '/history', view: renderHistory },
  { path: '/history/:id', view: renderEntryDetail },
  { path: '/stats', view: renderStats },
  { path: '/community', view: renderCommunity },
];

function matchRoute(path) {
  const pathParts = path.split('/').filter(Boolean);
  for (const route of routes) {
    const routeParts = route.path.split('/').filter(Boolean);
    if (routeParts.length !== pathParts.length) continue;
    const params = {};
    const isMatch = routeParts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = pathParts[i];
        return true;
      }
      return part === pathParts[i];
    });
    if (isMatch) return { view: route.view, params };
  }
  return null;
}

function currentPath() {
  return location.hash.slice(1) || '/';
}

function updateActiveLink(path) {
  document.querySelectorAll('.main-nav a').forEach(link => {
    const linkPath = link.getAttribute('href').slice(1);
    const isNested = linkPath !== '/' && path.startsWith(`${linkPath}/`);
    const isActive = path === linkPath || isNested;
    if (isActive) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  });
}

function render() {
  const path = currentPath();
  const match = matchRoute(path);
  renderId++;

  if (match) {
    match.view(match.params);
  } else {
    renderNotFound(`Сторінку «${path}» не знайдено.`);
  }
  updateActiveLink(path);
}

function navigate(path) {
  if (currentPath() !== path) {
    location.hash = path;
  }
}

window.addEventListener('hashchange', render);

document.addEventListener('click', event => {
  const hasModifier = event.ctrlKey || event.metaKey || event.shiftKey;
  if (event.button !== 0 || hasModifier) return;
  const link = event.target.closest('a[data-link]');
  if (!link) return;
  event.preventDefault();
  navigate(link.getAttribute('href').slice(1));
});

async function startApp() {
  await initStorage();
  render();
}

startApp();