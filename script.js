// перевірка підключення файлу до сторінки
console.log('script.js підключено');

// дані варіанта — масив записів настрою за період
// mood: число від 1 (дуже сумний) до 5 (дуже радісний)
const moodRecords = [
  { date: '07.09.2026', mood: 5 },
  { date: '08.09.2026', mood: 2 },
  { date: '09.09.2026', mood: 3 },
  { date: '10.09.2026', mood: 4 },
  { date: '11.09.2026', mood: 1 },
  { date: '12.09.2026', mood: 4 },
  { date: '13.09.2026', mood: 5 },
];

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

// Виводимо кожен запис разом із текстовою назвою настрою
for (const record of moodRecords) {
  console.log(`${record.date}: ${moodToLabel(record.mood)} (${record.mood})`);
}