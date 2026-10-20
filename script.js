console.log('script.js підключено');

const staticCard = document.querySelector('#mood-history .card');
if (staticCard) {
  staticCard.remove();
}

const moodRecords = [
  { date: '07.09.2026', mood: 5, note: 'Чудовий день, усе вдалося!' },
  { date: '08.09.2026', mood: 2, note: 'Було важко зосередитися.' },
  { date: '09.09.2026', mood: 3, note: 'Звичайний робочий день.' },
  { date: '10.09.2026', mood: 4, note: 'Продуктивний день.' },
  { date: '11.09.2026', mood: 1, note: 'Дуже втомилась, важкий день.' },
  { date: '12.09.2026', mood: 4, note: 'Зустріч із друзями.' },
  { date: '13.09.2026', mood: 5, note: 'Гарний вихідний.' },
];

const historyContainer = document.querySelector('#mood-history');
const avgMoodOutput = document.querySelector('#avg-mood');
const recordsCountOutput = document.querySelector('#records-count');

function calcAverageMood(records) {
  let sum = 0;
  for (const record of records) {
    sum += record.mood;
  }
  return sum / records.length;
}

const averageMood = calcAverageMood(moodRecords);
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

for (const record of moodRecords) {
  console.log(`${record.date}: ${moodToLabel(record.mood)} (${record.mood})`);
}

// повертає клас картки за текстовою назвою настрою (результат moodToLabel)
function labelToClass(label) {
  if (label === 'Радісний' || label === 'Дуже радісний') return 'good';
  if (label === 'Нейтральний') return 'neutral';
  return 'hard';
}
// рендер історії: очищає контейнер і створює article для кожного запису масиву
function renderMoodHistory(records) {
  historyContainer.innerHTML = '';

  records.forEach(record => {
    const card = document.createElement('article');
    card.classList.add('card');

    const title = document.createElement('h3');
    title.textContent = record.date;

    const note = document.createElement('p');
    note.textContent = record.note;

    card.dataset.mood = record.mood;
    card.classList.add(labelToClass(moodToLabel(record.mood)));

    card.append(title, note);
    historyContainer.append(card);
  });
}

renderMoodHistory(moodRecords);

avgMoodOutput.textContent = `Середній настрій: ${averageMood.toFixed(2)} (${weekLabel})`;
recordsCountOutput.textContent = `Записів за тиждень: ${moodRecords.length}`;
