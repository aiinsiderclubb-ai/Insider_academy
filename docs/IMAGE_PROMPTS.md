# AI Insider — промпты для генерации картинок по слотам

Одна и та же `ai-insider-mentor.png` сейчас в 12 местах. Ниже — уникальный промпт под каждый слот.
Генерировать в EN (модели понимают лучше), стиль-ядро вставлять в начало каждого промпта.

---

## 🧬 CHARACTER DNA — вставлять в начало КАЖДОГО промпта

```
The AI Insider mascot: a mysterious figure in a black tactical hoodie with glowing
"AI INSIDER" print (gradient purple-to-orange), wearing a segmented obsidian-black
armored face mask with fine glowing circuit engravings. Heterochromatic glowing eyes:
LEFT eye violet (#8B5CF6), RIGHT eye ember orange (#F28B43). Behind him a thin neon
ring (violet fading to orange). Dark space background (#08060F) with faint circuit-board
traces and floating data particles. Purple and orange rim lighting, cinematic contrast,
high detail, digital art, moody atmosphere. No visible skin, no human face.
```

Негатив (если модель поддерживает): `text artifacts, watermark, deformed mask, human face, bright background, low detail`

---

## Слоты и промпты

### 1. Главная — hero (`Home.jsx:178`) — оставить текущую
Текущая картинка здесь хороша, это её родное место. Не трогаем.

### 2. Главная — карта основателя (`Home.jsx:530`) · 4:5 портрет
```
[DNA] Close-up portrait, chest-up, arms crossed confidently like a mentor
welcoming students. Head slightly tilted, both glowing eyes looking directly
at the viewer. Behind him a soft holographic classroom: floating lesson cards
and progress rings, blurred. Warm confident pose, subtle orange glow from the
right side. Vertical portrait 4:5.
```
→ `public/design/mentor-founder.png`

### 3. Кабинет — hero-баннер (`CabinetDashboard.jsx:144`) · 21:9 широкий
```
[DNA] Wide cinematic banner. The figure stands at a futuristic command bridge,
seen from behind at three-quarter angle, looking at a huge holographic dashboard
wall with glowing progress charts, orbital rings and course modules. His silhouette
is on the LEFT third, screens fill the right side. Deep violet ambience with ember
accents. Ultra-wide 21:9, space on the right for UI text overlay.
```
→ `public/design/mentor-bridge.png`

### 4. Кабинет — аватар ментора (`CabinetDashboard.jsx:155`) · 1:1 крупный план
```
[DNA] Extreme close-up avatar: mask only, centered, symmetrical, both glowing
eyes visible, thin neon ring perfectly circular behind the head. Clean dark
vignette, crisp details of circuit engravings on the mask. Square 1:1,
readable at 64px size.
```
→ `public/design/mentor-avatar.png`

### 5. Onboarding — приветствие (`Onboarding.jsx:209`) · 4:5
```
[DNA] The figure extends an open gloved hand toward the viewer, palm up, with
a small glowing holographic key floating above the palm. Welcoming gesture,
slight bow of the head. Particles rise softly. Feels like an invitation to
enter the academy. Vertical 4:5.
```
→ `public/design/mentor-welcome.png`

### 6. Постер видео урока (`Course.jsx:517`) · 16:9
```
[DNA] The figure sits at a sleek desk in a dark studio, one hand on a
holographic control panel, teaching pose, facing the camera like a streamer.
Behind him a large screen with abstract code and node graphs (n8n-style
workflow nodes). A subtle "play" glow in the center of the composition.
Wide 16:9, center-weighted, works as a video poster.
```
→ `public/design/mentor-lesson-poster.png`

### 7. Страница курса — декор (`Course.jsx:575`) · 1:1
```
[DNA] The figure in profile, looking right, holding a glowing holographic
book/tablet that projects ascending skill bars. Study-focused mood, quieter
lighting, more violet than orange. Square 1:1, soft edges for decorative use.
```
→ `public/design/mentor-study.png`

### 8. Розыгрыши и события (`Giveaway.jsx:113`, Events) · 16:9
```
[DNA] Celebration scene: the figure tosses a glowing holographic gift box into
the air with confetti made of tiny neon circuit chips (violet and orange).
Dynamic pose, energy trails, festive but still dark and premium. The ring
behind him pulses brighter. Wide 16:9.
```
→ `public/design/mentor-giveaway.png`

### 9. 404 (`NotFound.jsx:28`) · 1:1
```
[DNA] The figure shrugs with both hands raised, a glitching holographic "404"
floating broken above his palm, pieces of the digits scattering as particles.
Playful confusion, head tilted. Glitch effect on the neon ring. Square 1:1.
```
→ `public/design/mentor-404.png`

### 10. Подписки / Memberships (`MembershipPlan.jsx:76`) · 4:5
```
[DNA] The figure holds a glowing membership card between two fingers, presenting
it to the viewer. The card emits a soft golden-orange light onto the mask.
A second and third translucent card levitate behind. Premium, exclusive mood,
stronger ember accents. Vertical 4:5.
```
→ `public/design/mentor-membership.png`

### 11. Карта обучения — ядро (`LearningMap.jsx:259`) · 1:1 под круглый кроп
```
[DNA] The figure meditates cross-legged, floating in zero gravity at the center
of an orbital system: small glowing planets (course modules) orbit around him
on thin neon rings. Symmetrical composition, centered, calm power. Square 1:1,
main subject within inner 70% circle (will be cropped round).
```
→ `public/design/mentor-core.png`

### 12. Заявка в Accelerator (`AcceleratorApply.jsx:196`) · 4:5
```
[DNA] Intense recruiting pose: the figure points directly at the viewer
("you're next"), other hand behind his back. Both eyes flare brighter than
usual. Behind him a rocket-trail of light ascends diagonally. Determined,
ambitious energy. Vertical 4:5.
```
→ `public/design/mentor-accelerator.png`

---

## Обложки курсов (сейчас 4 картинки на 9 курсов)

Стиль обложек: без персонажа или персонаж мелко; главное — предметный символ направления. Общий хвост промпта:

```
...dark background #08060F, violet and ember neon palette, faint circuit traces,
cinematic light, high detail, no text. Wide 16:10.
```

| Курс | Символ | Промпт-ядро |
|---|---|---|
| AI Agent Engineer | рой агентов | `A swarm of small glowing geometric drones connected by neon threads forming a network around a central orb` |
| AI Automation Engineer | конвейер нод | `A luminous assembly line of floating workflow nodes connected by data pipes, gears made of light` |
| First Automation in n8n | первая нода | `A single large glowing hexagonal node being plugged into a socket of light, sparks of data` |
| AI Chatbot Engineer | диалог | `Two holographic chat bubbles exchanging streams of glowing particles, neural filaments between them` |
| AI Content Creator | перо+экран | `A luminous quill drawing a glowing video timeline in the air, floating media frames around` |
| AI Business Builder | башня | `A rising tower built from glowing blocks of light with an ember crown, small builder drones around` |
| AI for Productivity | время | `A translucent hourglass where falling sand turns into completed glowing checkmarks` |
| AI Productivity Master | оркестр задач | `A conductor's baton of light directing an orchestra of floating task cards in perfect formation` |
| AI Insider Accelerator | взлёт | `A neon rocket silhouette launching from an open palm, trail of violet-to-ember light` |

---

## Технические требования

- Формат: PNG → конвертнуть в **WebP q80** перед выкладкой (текущие PNG по 1.5–2.3MB — убивают LCP)
- Размеры: hero/banner 1600px по длинной стороне, аватар 512px, обложки 1200×750
- Один seed/референс на все генерации персонажа — иначе маска «поплывёт»
- В Midjourney: `--cref <url текущей mentor.png> --cw 100` для консистентности персонажа
- Проверять: глаза строго левый=violet, правый=ember (модели любят путать)
