# Morning Timer v2.4-a.8 — Visible Bank Countdown Fix

Flat-сборка без подпапок.

## Главное изменение

В редакторе задач подпись больше не редактируется вручную.

Теперь логика такая:

```text
выбираешь emoji → подпись подставляется автоматически
```

Например:

```text
🪥 → зубы / teeth / שיניים
🍱 → ланч / lunch / אוכל
🎒 → рюкзак / bag / תיק
```

## Добавлено

- автоматические подписи к emoji на RU / EN / HE;
- расширенная библиотека emoji;
- подписи обновляются сразу на главном экране;
- экран выбора emoji показывает не только смайлик, но и автоматическую подпись;
- шаблоны задач:
  - Классика;
  - Школа;
  - Сад;
  - Быстро;
- сброс иконок к дефолтному набору.

## Сохранено

- v2.3-c/v2.3-e mechanics;
- запуск таймера через иконки;
- чекбоксы;
- автозавершение этапа;
- achievement badge;
- копилка времени;
- RU / EN / HE;
- RTL для иврита;
- `684` — сброс;
- `684100` — тестовый режим.

## Тест после загрузки

Открыть GitHub Pages с параметром:

```text
?v=24a
```

## Future idea

Позже: анимация перелёта сэкономленных минут в сундук / сейф / копилку после нажатия `Выхожу`.


## v2.4-a.1 fix

Исправлена механика перехода между этапами.

### Было

Если таймер этапа доходил до `00:00`, но выполнены были не все задачи, таймер останавливался, а следующий этап не запускался.

### Стало

Если таймер этапа дошёл до `00:00`:

- текущий этап считается завершённым по времени;
- сэкономленное время этапа = `0`;
- следующий этап запускается автоматически;
- после 4-го этапа открывается экран `Выхожу / Вернуться`.

Если все задачи этапа выполнены раньше:

- этап завершается досрочно;
- сэкономленное время сохраняется;
- следующий этап запускается автоматически.

## Тест

Открыть GitHub Pages с параметром:

```text
?v=24a1
```

Для быстрой проверки использовать сервисный код:

```text
684100
```


## v2.4-a.2 changes

### 1. Post-timeout checklist completion

Scenario:

1. Time runs out before all checkboxes are marked.
2. The app opens `Leave / Back`.
3. The user taps `Back`.
4. The child marks all remaining checkboxes.

Expected result:

- when all 12 tasks are checked, the app automatically opens `Leave / Back` again.

### 2. Free emoji library

In Free version:

- all stages use the same shared emoji library;
- no rubric filtering is applied.

### 3. Pro rubricator preparation

In Pro version concept:

- emoji set is filtered and expanded by rubrics:
  - Hygiene;
  - Clothes;
  - Food;
  - Exit;
  - Universal / Other.

In current Free build:

- Pro rubricator is shown as a locked layer in the picker;
- it does not filter the emoji set yet.

### 4. Entity naming

Added `APP_ENTITY_TAXONOMY_RU.md`.


## v2.4-a.3 changes

### 1. Exit screen opens only after all tasks are checked

Previously, after all timers ended, the app could open `Leave / Back` even if some checkboxes were still unchecked.

Now:

- timers may finish;
- stages may advance by timeout;
- but the final `Leave / Back` screen opens only when all 12 tasks are checked.

### 2. Morning limit continues through the bank

The morning limit starts from the first checked task.

The top bank now behaves like a countdown:

```text
morning limit + saved stage time - elapsed real time
```

### 3. Late mode

If the bank reaches zero:

- the bank changes to `Опоздание / Late`;
- late time starts accumulating second by second.

### 4. Exit screen graphic

Added a soft flat-style happy child with backpack on the exit screen.

## Test

Open GitHub Pages with:

```text
?v=24a3
```

Quick test:

```text
684100
```


## v2.4-a.4 changes

### Pro focus

Finalized the Pro benefit list:

- Child profiles;
- Task and icon rubricator;
- Change number of stages;
- Change stage durations and total morning limit;
- Change number of tasks per stage;
- Routine templates;
- Parent reports.

### Technical changes

- The `Morning Timer Pro` button in Settings no longer opens a separate Pro screen.
- It scrolls down to the `Pro settings` section.
- Expanded the Pro settings section.
- Fixed row layout: title and subtitle are separated into different lines.
- Added Pro test toggle code:

```text
684168
```

### Pro mode

Code `684168` toggles Pro mode on/off.

When Pro is enabled:

- lock badges become `✓ Pro`;
- Pro rows are visually highlighted;
- this is a test unlock layer, not yet the final functional implementation of every Pro control.


## v2.4-a.5 fix

### Static savings bank

Копилка больше не обновляется ежесекундно.

Новое поведение:

- копилка появляется только после первого накопления сэкономленного времени;
- значение копилки статично;
- копилка увеличивается только при новом досрочном завершении этапа;
- посекундное обновление включается только когда исчерпан `утренний лимит + копилка`;
- тогда плашка меняется на `Опоздание` и начинает посекундно накапливать late time.

### Formula

```text
копилка = сумма сэкономленного времени этапов
опоздание = прошедшее реальное время - (утренний лимит + копилка)
```


## v2.4-a.6 fix

### Final-stage bank countdown

New behavior:

- before the last stage timer ends, the savings bank is static;
- when the timer of the last stage reaches `00:00`, the savings bank starts decreasing second by second;
- this countdown happens only if the bank has saved time;
- if the bank reaches zero, the app switches to the existing `Late / Опоздание` pill;
- if the bank is empty when the last stage ends, `Late / Опоздание` starts immediately.

### Logic

```text
bank = total saved stage time
after last stage timeout:
visible bank = bank - seconds after final stage timeout
late = seconds after final stage timeout - bank
```

Before the final stage timeout, the bank remains static.


## v2.4-a.7 fix

### Fixed critical render bug

In v2.4-a.6, `visibleBankAmount()` accidentally called itself:

```js
var bank = visibleBankAmount();
```

This caused a recursive loop and broke `render()`.

### Fixed behavior

Now the internal bank calculation uses:

```js
var bank = bankAmount();
```

Expected result:

- timers update normally again;
- checking a checkbox no longer only forces a one-time update;
- the savings bank appears again;
- after the final stage timer reaches `00:00`, the bank counts down if it contains saved time;
- after the bank reaches zero, the existing `Late / Опоздание` pill starts working.

## Test

Open GitHub Pages with:

```text
?v=24a7
```

Quick test:

```text
684100
```


## v2.4-a.8 fix

### Visible final-stage bank countdown

In v2.4-a.7, `Late / Опоздание` worked, but the visible savings bank did not start counting down after the last stage timer reached `00:00`.

### Fixed behavior

When the last stage timer reaches `00:00` and not all tasks are checked:

- if the savings bank has time, the visible bank starts decreasing second by second;
- when it reaches zero, the pill switches to `Late / Опоздание`;
- if the bank is already empty, `Late / Опоздание` starts immediately.

### Technical fix

Added `ensureFinalStageCountdownStarted()`.

It starts the final countdown whenever:

```text
stage 4 timer = 00:00
AND not all tasks are checked
AND finalStageEndedAt is still empty
```

## Test

Open GitHub Pages with:

```text
?v=24a8
```

Quick mode:

```text
684100
```
