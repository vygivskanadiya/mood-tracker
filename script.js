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

function addItem(item) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const request = tx.objectStore(STORE_NAME).put(item);
    request.onsuccess = () => resolve(request.result);
    tx.onerror = () => reject(tx.error);
  }));
}

function updateItem(item) {
  return addItem(item);
}

function getAllItems() {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  }));
}

function deleteItem(id) {
  return openDB().then(db => new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  }));
}

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
    if (!response.ok) throw new Error(`Сервер відповів кодом ${response.status}`);
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
    },
    // обробник події @delete від картки: видаляє запис із бази й перемальовує список
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