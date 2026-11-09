console.log('script.js підключено');

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

const addMoodForm = document.querySelector('#add-mood-form');
const moodDateInput = document.querySelector('#mood-date');
const moodLevelInput = document.querySelector('#mood-level');
const moodNoteInput = document.querySelector('#mood-note');
const noteCounterOutput = document.querySelector('#note-counter');

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
    await moodHistoryApp.refresh();
  } catch (error) {
    console.error('Не вдалося зберегти запис у IndexedDB:', error);
  }

  addMoodForm.reset();
  noteCounterOutput.textContent = `Залишилось символів: ${NOTE_MAX_LENGTH}`;
});

// ===== Практична робота №9: клієнт для API (fetch) =====

const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=1';

const apiNotesList = document.querySelector('#api-notes-list');
const apiStatus = document.querySelector('#api-status');
const reloadApiBtn = document.querySelector('#reload-api-btn');

function renderApiNotes(records) {
  apiNotesList.innerHTML = '';

  records.forEach(record => {
    const card = document.createElement('article');
    card.classList.add('card');

    const title = document.createElement('h3');
    title.textContent = record.name;

    const note = document.createElement('p');
    note.textContent = record.body;

    const author = document.createElement('p');
    author.classList.add('meta');
    author.textContent = record.email;

    card.append(title, note, author);
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
loadData();

// ===== Практична робота №10: компонент MoodEntry на Vue 3 =====
// Обрала Vue 3, а не React: глобальна CDN-збірка не потребує Babel/JSX-транспіляції
// прямо в браузері, а синтаксис шаблону ближчий до HTML — простіше для роботи без збірки.

const MoodEntry = {
  props: ['recordId', 'date', 'mood', 'note'],
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
}).mount('#mood-history');

// Практична робота №12: Canvas-графік динаміки настрою 
// Обрала Canvas, а не CSS-анімацію: ламаної лінії з довільною кількістю точок немає
// готовим DOM-елементом, а кількість точок залежить від числа записів у базі.

const chartCanvas = document.querySelector('#mood-chart');
const chartToggleBtn = document.querySelector('#chart-toggle-btn');
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

initStorage();