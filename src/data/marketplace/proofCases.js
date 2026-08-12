const CASES = {
  'voice-agents': [
    ['Demo 01', 'Салон красоты', 'Входящий звонок → проверка слота → подтверждённая запись', 'Happy path + duplicate webhook'],
    ['Demo 02', 'Занятый слот', 'Агент предлагает 2 ближайшие альтернативы', 'Fallback behavior'],
    ['Demo 03', 'Ошибка calendar API', 'Без фальшивого подтверждения; handoff человеку', 'Failure recovery'],
  ],
  default: [
    ['Demo 01', 'Базовый сценарий', 'Входные данные проходят валидацию; результат соответствует acceptance criteria', 'Functional sample'],
    ['Demo 02', 'Неполные данные', 'Система запрашивает недостающее, не выдумывает факты', 'Input safety'],
    ['Demo 03', 'Сбой интеграции', 'Retry с лимитом → log → human alert / rollback', 'Recovery sample'],
  ],
}

export function getDemoProofCases(categoryId) {
  return (CASES[categoryId] || CASES.default).map(([id, titleRu, resultRu, evidence]) => ({ id, titleRu, resultRu, evidence }))
}
