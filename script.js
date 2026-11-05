console.log('script.js підключено');

const moodRecords = [
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

// підраховує середній настрій за період (цикл for...of)
function calcAverageMood(records) {
  let sum = 0;
  for (const record of records) {
    sum += record.mood;
  }
  return sum / records.length;
}

const averageMood = calcAverageMood(moodRecords);
console.log(`Середній настрій за період: ${averageMood.toFixed(2)}`);

// класифікує середній настрій тижня (умовний оператор)
const weekLabel = averageMood >= 3.5 ? 'гарний тиждень' : 'важкий тиждень';
console.log(`Оцінка тижня: ${weekLabel}`);

// стрілкова функція — переводить числовий рівень настрою (1-5) у текстову назву
const moodToLabel = mood => {
  if (mood === 1) return 'Дуже сумний';
  if (mood === 2) return 'Сумний';
  if (mood === 3) return 'Нейтральний';
  if (mood === 4) return 'Радісний';
  return 'Дуже радісний';
};

// виводимо кожен запис разом із текстовою назвою настрою
for (const record of moodRecords) {
  console.log(`${record.date}: ${moodToLabel(record.mood)} (${record.mood})`);
}

// ===== Практична робота №7: маніпуляція DOM =====
// Крок 7 практикуму 10: ручний рендер картки історії (createElement/innerHTML/append)
// тут більше не потрібен — цю ділянку інтерфейсу з практикуму 10 рендерить
// Vue-компонент MoodEntry (дивись розділ «Практична робота №10» нижче).
// Функції labelToClass() і renderMoodHistory(), які раніше створювали article/h3/p
// вручну через DOM API, видалені — їхню роботу тепер виконує компонент декларативно.

// оновлює підсумкові елементи поза списком на основі поточного стану moodHistoryApp.moodRecords
// (використовує реактивний масив Vue-застосунку, а не початкову константу moodRecords,
// бо саме через нього й відбуваються всі подальші зміни — дивись практикум 10)
function updateSummary() {
  const currentAverage = calcAverageMood(moodHistoryApp.moodRecords);
  const currentWeekLabel = currentAverage >= 3.5 ? 'гарний тиждень' : 'важкий тиждень';
  avgMoodOutput.textContent = `Середній настрій: ${currentAverage.toFixed(2)} (${currentWeekLabel})`;
  recordsCountOutput.textContent = `Записів за тиждень: ${moodHistoryApp.moodRecords.length}`;
}

// ===== Практична робота №8: обробка подій, форми, валідація =====

const addMoodForm = document.querySelector('#add-mood-form');
const moodDateInput = document.querySelector('#mood-date');
const moodLevelInput = document.querySelector('#mood-level');
const moodNoteInput = document.querySelector('#mood-note');
const noteCounterOutput = document.querySelector('#note-counter');

const NOTE_MAX_LENGTH = 200;

// Додаткова валідація поля mood понад стандартний min/max:
// власне повідомлення, якщо введене число виходить за межі 1-5
moodLevelInput.addEventListener('input', () => {
  const value = Number(moodLevelInput.value);
  if (moodLevelInput.value !== '' && (value < 1 || value > 5)) {
    moodLevelInput.setCustomValidity('Настрій оцінюється числом від 1 до 5');
  } else {
    moodLevelInput.setCustomValidity('');
  }
});

// Крок 9. Друга подія варіанта: лічильник символів коментаря,
// оновлюється на кожне натискання клавіші (подія input, не submit)
moodNoteInput.addEventListener('input', () => {
  const remaining = NOTE_MAX_LENGTH - moodNoteInput.value.length;
  noteCounterOutput.textContent = `Залишилось символів: ${remaining}`;
  noteCounterOutput.classList.toggle('near-limit', remaining <= 20);
});

// переводить yyyy-mm-dd (значення input[type="date"]) у dd.mm.yyyy — формат масиву moodRecords
function formatDisplayDate(isoDate) {
  const [year, month, day] = isoDate.split('-');
  return `${day}.${month}.${year}`;
}

// Кроки 2-7. Обробка надсилання форми додавання нового запису
addMoodForm.addEventListener('submit', event => {
  event.preventDefault(); // Крок 3: без цього сторінка перезавантажиться і стан скинеться

  // Крок 4: зчитуємо значення полів форми
  const isoDate = moodDateInput.value;
  const moodValue = Number(moodLevelInput.value);
  const noteValue = moodNoteInput.value.trim();

  // Крок 5: формуємо новий об'єкт у тому самому форматі, що й елементи moodRecords, і додаємо в масив
  const newRecord = {
    id: nextMoodId++, // практикум 10: :key у v-for потребує стабільний id
    date: formatDisplayDate(isoDate),
    mood: moodValue,
    note: noteValue || 'Без коментаря',
  };
  // практикум 10: пушимо в реактивний масив Vue-застосунку (moodHistoryApp.moodRecords) —
  // Vue сам перемальовує список карток, ручний виклик рендеру тут більше не потрібен
  moodHistoryApp.moodRecords.push(newRecord);

  // Крок 6: оновлюємо підсумок за новим станом масиву
  updateSummary();

  // Крок 7: очищуємо форму та лічильник символів після успішного додавання
  addMoodForm.reset();
  noteCounterOutput.textContent = `Залишилось символів: ${NOTE_MAX_LENGTH}`;
});

// ===== Практична робота №9: клієнт для API (fetch) =====
// Джерело даних: JSONPlaceholder (https://jsonplaceholder.typicode.com) — навчальний мок-API.
// За варіантом коментарі до посту №1 трактуються як нотатки спільноти:
// name — заголовок запису, body — текст нотатки, email — автор запису.
const API_URL = 'https://jsonplaceholder.typicode.com/comments?postId=1';

const apiNotesList = document.querySelector('#api-notes-list');
const apiStatus = document.querySelector('#api-status');
const reloadApiBtn = document.querySelector('#reload-api-btn');

// рендер нотаток спільноти: той самий патерн, що й renderMoodHistory з практикуму 7
// (querySelector контейнера → innerHTML='' → forEach → createElement → append),
// але під форму відповіді API (name/body/email замість date/mood/note) —
// ці записи не мають власного числового рівня настрою, тому без data-mood і без класу mood-*
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

// Крок 2-8: асинхронна функція запиту — fetch, перевірка статусу, розбір JSON,
// рендер результату й обробка і мережевої помилки, і помилки HTTP-статусу
async function loadData() {
  // Крок 7: показуємо стан завантаження до початку запиту
  apiStatus.textContent = 'Завантаження…';
  apiStatus.classList.remove('error');
  reloadApiBtn.disabled = true;

  try {
    // Крок 3: виконуємо запит і чекаємо відповідь
    const response = await fetch(API_URL);

    // Крок 4: fetch не вважає 404/500 помилкою — перевіряємо response.ok самі
    if (!response.ok) {
      throw new Error(`Сервер відповів кодом ${response.status}`);
    }

    // Крок 5: розбираємо тіло відповіді як JSON
    const data = await response.json();
    console.log('Отримані дані з API:', data);

    // Крок 6: виводимо отримані записи в DOM
    renderApiNotes(data);
    apiStatus.textContent = `Завантажено записів: ${data.length}`;
  } catch (error) {
    // Крок 8: зрозуміле повідомлення користувачу + деталі в консоль для розробника
    apiStatus.textContent = 'Записи тимчасово недоступні.';
    apiStatus.classList.add('error');
    console.error('Помилка завантаження даних з API:', error);
  } finally {
    // Крок 7: ховаємо стан завантаження незалежно від результату
    reloadApiBtn.disabled = false;
  }
}

// Крок 10: кнопка «Оновити» дозволяє повторити запит після збою без перезавантаження сторінки
reloadApiBtn.addEventListener('click', loadData);

// перший запит одразу під час завантаження сторінки
loadData();

// ===== Практична робота №10: компонент MoodEntry на Vue 3 (CDN, без збірки) =====
// Крок 1: обрала Vue 3, а не React, — глобальна CDN-збірка не потребує Babel/JSX-
// транспіляції прямо в браузері, а синтаксис шаблону (v-for, {{ }}) ближчий до
// вже знайомого HTML, тому простіший для навчального прикладу без збірки.

// кожному запису потрібен стабільний id для :key у v-for — призначаємо його
// початковим записам один раз тут; нові записи з форми лаб.8 отримують id так само
let nextMoodId = 1;
moodRecords.forEach(record => { record.id = nextMoodId++; });

// Крок 4: компонент одного запису історії отримує дані лише через props
// (date, mood, note) і не звертається до жодних глобальних змінних чи функцій.
// Крок 6 (похідне значення варіанта): emoji, moodLabel і moodClass обчислюються
// з props.mood у computed — ніде не зберігаються окремим станом.
const MoodEntry = {
  props: ['date', 'mood', 'note'],
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
      // ті самі класи, що вже описані в css/style.css (--mood-color на картці)
      const classByMood = {
        1: 'mood-very-sad', 2: 'mood-sad', 3: 'mood-neutral', 4: 'mood-happy', 5: 'mood-very-happy',
      };
      return classByMood[this.mood] || 'mood-neutral';
    },
  },
  template: `
    <article class="card" :class="moodClass" :data-mood="mood">
      <div class="card-head">
        <h3>{{ date }}</h3>
        <span class="mood-badge">{{ emoji }} {{ moodLabel }}</span>
      </div>
      <p>{{ note }}</p>
    </article>
  `,
};

// Крок 3: масив moodRecords переноситься в реактивний стан застосунку (data()),
// а не лишається звичайною зовнішньою змінною — відтепер зміни в ньому автоматично
// перемальовують список. Крок 2: мала б тут бути ще й розмітка CDN-скрипта Vue —
// вона додана в index.html перед script.js.
// Крок 5: цикл v-for :key="record.id" лишається прямо в index.html (in-DOM шаблон).
const moodHistoryApp = Vue.createApp({
  components: { MoodEntry },
  data() {
    return { moodRecords };
  },
}).mount('#mood-history');

// перший підрахунок підсумку — вже за реактивним масивом застосунку
updateSummary();