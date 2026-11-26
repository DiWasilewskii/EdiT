/* =====================================================================
   EdiT — ЛОГІКА САЙТУ
   ---------------------------------------------------------------------
   Тут НЕ потрібно нічого змінювати, щоб додати тему.
   Теми лежать у файлі js/topics.js.

   Як влаштовано:
   • Сайт — одна сторінка. Адреса після # показує, що відкрито:
       #/                     — головна
       #/klas/5               — 5 клас
       #/klas/5/tema/1        — тема №1 у 5 класі
       #/poza                 — «Корисне поза програмою»
       #/poza/tema/1          — тема №1 «Поза програмою»
   • Прогрес («тема пройдена ✓») зберігається в браузері (localStorage).
   ===================================================================== */

(function () {
  "use strict";

  /* ---------- Налаштування ---------- */
  const КЛАСИ = [2, 3, 4, 5, 6, 7, 8, 9];
  const ВІКОВІ_ГРУПИ = [
    { код: "2-4", назва: "2–4 клас" },
    { код: "5-6", назва: "5–6 клас" },
    { код: "7-9", назва: "7–9 клас" }
  ];
  const КЛЮЧ_ПРОГРЕСУ = "edit-progress";
  const КЛЮЧ_ФІЛЬТРІВ = "edit-filters";

  const app = document.getElementById("app");
  const menu = document.getElementById("mainMenu");
  const menuBtn = document.getElementById("menuBtn");

  /* ---------- Перевірка, що файл з темами завантажився ---------- */
  if (typeof ТЕМИ_КЛАСІВ === "undefined" || typeof ТЕМИ_ПОЗА_ПРОГРАМОЮ === "undefined" || typeof КАТЕГОРІЇ === "undefined") {
    app.innerHTML =
      '<div class="block"><h2>Ой! Не вдалося прочитати теми</h2>' +
      "<p>Схоже, у файлі <b>js/topics.js</b> є помилка: пропущена кома, лапка або дужка. " +
      "Перевірте останню додану тему.</p></div>";
    return;
  }

  /* =================================================================
     ДОПОМІЖНІ ФУНКЦІЇ
     ================================================================= */

  // Захищає звичайний текст (назва, опис) від випадкових HTML-тегів
  function esc(text) {
    return String(text == null ? "" : text)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  // Вік за номером класу: 2–4, 5–6 або 7–9
  function вікКласу(клас) {
    if (клас <= 4) return "2-4";
    if (клас <= 6) return "5-6";
    return "7-9";
  }

  // Змінює стиль сторінки під вік (розмір шрифту, кнопок тощо)
  function встановитиВік(вік) {
    document.body.classList.remove("vik-2-4", "vik-5-6", "vik-7-9");
    if (вік) document.body.classList.add("vik-" + вік);
  }

  // Безпечна робота з пам'яттю браузера (у приватному режимі може не працювати)
  function прочитати(ключ, запасне) {
    try {
      const дані = JSON.parse(localStorage.getItem(ключ));
      return дані == null ? запасне : дані;
    } catch (e) { return запасне; }
  }
  function записати(ключ, значення) {
    try { localStorage.setItem(ключ, JSON.stringify(значення)); } catch (e) { /* без збереження */ }
  }

  /* ---------- Прогрес ---------- */
  function ключКласу(тема) { return "k" + тема.клас + "-" + тема.номер; }
  function ключПоза(тема) { return "p-" + тема.номер; }

  function пройдено(ключ) { return !!прочитати(КЛЮЧ_ПРОГРЕСУ, {})[ключ]; }
  function позначити(ключ, значення) {
    const прогрес = прочитати(КЛЮЧ_ПРОГРЕСУ, {});
    if (значення) прогрес[ключ] = true; else delete прогрес[ключ];
    записати(КЛЮЧ_ПРОГРЕСУ, прогрес);
  }

  /* ---------- Пошук тем ---------- */
  function темиКласу(клас) {
    return ТЕМИ_КЛАСІВ
      .filter(function (т) { return т.клас === клас; })
      .sort(function (а, б) { return а.номер - б.номер; });
  }
  function іконкаКатегорії(назва) {
    const к = КАТЕГОРІЇ.find(function (к) { return к.назва === назва; });
    return к ? к.іконка : "📌";
  }
  function назваВіку(код) {
    const г = ВІКОВІ_ГРУПИ.find(function (г) { return г.код === код; });
    return г ? г.назва : код;
  }

  /* =================================================================
     ТАЙГЕР — маскот (малюнок SVG + бульбашка з підказкою)
     ================================================================= */
  const ТАЙГЕР_SVG =
    '<svg class="tiger__pic" viewBox="0 0 100 100" aria-hidden="true">' +
      // вуха
      '<path d="M14 30 L22 6 L40 22 Z" fill="#E8731C" stroke="#1C1A17" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M86 30 L78 6 L60 22 Z" fill="#E8731C" stroke="#1C1A17" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M21 24 L24 13 L32 21 Z" fill="#FAF8F3"/>' +
      '<path d="M79 24 L76 13 L68 21 Z" fill="#FAF8F3"/>' +
      // голова
      '<ellipse cx="50" cy="55" rx="40" ry="37" fill="#E8731C" stroke="#1C1A17" stroke-width="3"/>' +
      // чубчик (підліток)
      '<path d="M40 20 Q46 8 52 18 Q56 6 62 19" fill="none" stroke="#1C1A17" stroke-width="3" stroke-linecap="round"/>' +
      // смужки
      '<path d="M50 19 L46 32 L54 32 Z" fill="#1C1A17"/>' +
      '<path d="M11 48 Q20 50 24 46" stroke="#1C1A17" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M12 60 Q20 60 23 56" stroke="#1C1A17" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M89 48 Q80 50 76 46" stroke="#1C1A17" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      '<path d="M88 60 Q80 60 77 56" stroke="#1C1A17" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      // біла мордочка
      '<path d="M26 66 Q30 50 50 56 Q70 50 74 66 Q70 88 50 88 Q30 88 26 66 Z" fill="#FAF8F3"/>' +
      // очі
      '<ellipse cx="36" cy="46" rx="6" ry="7" fill="#1C1A17"/>' +
      '<ellipse cx="64" cy="46" rx="6" ry="7" fill="#1C1A17"/>' +
      '<circle cx="38" cy="43" r="2.2" fill="#fff"/>' +
      '<circle cx="66" cy="43" r="2.2" fill="#fff"/>' +
      // брови
      '<path d="M29 36 Q35 33 41 36" stroke="#1C1A17" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M59 35 Q65 31 71 35" stroke="#1C1A17" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      // ніс і усмішка
      '<path d="M44 62 L56 62 L50 69 Z" fill="#1C1A17" stroke="#1C1A17" stroke-width="2" stroke-linejoin="round"/>' +
      '<path d="M50 69 Q50 76 42 75" stroke="#1C1A17" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
      '<path d="M50 69 Q51 77 60 74" stroke="#1C1A17" stroke-width="2.5" fill="none" stroke-linecap="round"/>' +
    "</svg>";

  function тайгер(текст) {
    return '<aside class="tiger" aria-label="Підказка">' + ТАЙГЕР_SVG +
      '<div class="tiger__bubble"><span class="tiger__name">Тайгер</span>' + текст + "</div></aside>";
  }

  /* =================================================================
     НАВІГАЦІЯ: меню, хлібні крихти, кнопка «Назад»
     ================================================================= */
  function намалюватиМеню(поточнийКлас, позаВідкрито) {
    let html = '<div class="menu__grid">' +
      '<a href="#/"' + (!поточнийКлас && !позаВідкрито ? ' class="is-current"' : "") + ">🏠 Головна</a>";
    КЛАСИ.forEach(function (к) {
      html += '<a href="#/klas/' + к + '"' + (к === поточнийКлас ? ' class="is-current"' : "") + ">" + к + " клас</a>";
    });
    html += '<a href="#/poza" class="menu__extra">⭐ Корисне поза програмою</a></div>';
    menu.innerHTML = html;
  }

  function закритиМеню() {
    menu.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  menuBtn.addEventListener("click", function () {
    const відкрите = menu.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(відкрите));
  });
  menu.addEventListener("click", function (e) { if (e.target.closest("a")) закритиМеню(); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") закритиМеню(); });

  // крихти: масив [{назва, посилання}], останній — поточна сторінка
  // назад: адреса, куди веде кнопка «Назад»
  function навігація(крихти, назад) {
    let html = '<div class="navline">';
    if (назад) html += '<a class="btn btn--ghost back-btn" href="' + назад + '">← Назад</a>';
    html += '<nav aria-label="Ви тут"><ol class="crumbs">';
    крихти.forEach(function (к, і) {
      if (і === крихти.length - 1) html += '<li><span aria-current="page">' + esc(к.назва) + "</span></li>";
      else html += '<li><a href="' + к.посилання + '">' + esc(к.назва) + "</a></li>";
    });
    return html + "</ol></nav></div>";
  }

  /* =================================================================
     СТОРІНКИ
     ================================================================= */

  /* ---------- Головна ---------- */
  function сторінкаГоловна() {
    встановитиВік(null);
    const слова = [["E", "Енергія"], ["d", "Досвід"], ["i", "Ідеї"], ["T", "Технології"]];

    let html = '<section class="hero">' +
      '<h1 class="logo" aria-label="EdiT: Енергія, Досвід, Ідеї, Технології">';
    слова.forEach(function (с) {
      html += '<span class="logo__item" aria-hidden="true"><span class="logo__letter">' + с[0] +
        '</span><span class="logo__word">' + с[1] + "</span></span>";
    });
    html += "</h1>" +
      '<p class="hero__hello">Привіт! Тут ти навчишся впевнено працювати з комп\'ютером, ' +
      "створювати власні проєкти й безпечно користуватися інтернетом.</p></section>";

    html += тайгер("Обери свій клас, щоб побачити теми.");

    html += '<h2>Обери клас</h2><div class="grades">';
    КЛАСИ.forEach(function (к) {
      const теми = темиКласу(к);
      const готово = теми.filter(function (т) { return пройдено(ключКласу(т)); }).length;
      const вид = к <= 4 ? " grade-card--young" : (к >= 7 ? " grade-card--older" : "");
      html += '<a class="grade-card' + вид + '" href="#/klas/' + к + '">' +
        (теми.length ? '<span class="grade-card__progress">' + готово + "/" + теми.length + " ✓</span>" : "") +
        '<span class="grade-card__num">' + к + '</span><span class="grade-card__label">клас</span></a>';
    });
    html += "</div>";

    html += '<a class="extra-btn" href="#/poza"><span aria-hidden="true">⭐</span> Корисне поза програмою</a>';

    app.innerHTML = html;
    намалюватиМеню(null, false);
  }

  /* ---------- Картка теми (спільна для класів і «Поза програмою») ---------- */
  function карткаТеми(тема, посилання, готово, мітка) {
    return '<a class="topic-card' + (готово ? " is-done" : "") + '" href="' + посилання + '">' +
      (готово ? '<span class="topic-card__done">пройдено ✓</span>' : "") +
      '<span class="topic-card__top"><span class="topic-card__icon" aria-hidden="true">' + esc(тема.іконка || "📘") +
      '</span><span class="topic-card__num">Тема ' + esc(тема.номер) + "</span></span>" +
      (мітка ? '<span class="topic-card__tag">' + мітка + "</span>" : "") +
      '<h3 class="topic-card__title">' + esc(тема.назва) + "</h3>" +
      '<p class="topic-card__desc">' + esc(тема.опис) + "</p></a>";
  }

  function порожньо(текст) {
    return '<div class="empty"><div class="empty__icon" aria-hidden="true">🌱</div>' +
      "<h2>" + текст + "</h2>" + тайгер("Загляни сюди трохи згодом — тут з'являться нові завдання.") + "</div>";
  }

  /* ---------- Сторінка класу ---------- */
  function сторінкаКласу(клас) {
    встановитиВік(вікКласу(клас));
    const теми = темиКласу(клас);

    let html = навігація([{ назва: "Головна", посилання: "#/" }, { назва: клас + " клас" }], "#/") +
      '<div class="page-head"><h1>' + клас + ' клас</h1>' +
      '<a class="btn btn--orange" href="#/">🏠 На головну</a></div>';

    if (!теми.length) {
      html += порожньо("Теми скоро з'являться");
    } else {
      html += '<div class="topics">';
      теми.forEach(function (т) {
        html += карткаТеми(т, "#/klas/" + клас + "/tema/" + т.номер, пройдено(ключКласу(т)));
      });
      html += "</div>";
    }

    app.innerHTML = html;
    намалюватиМеню(клас, false);
  }

  /* ---------- «Корисне поза програмою» ---------- */
  function сторінкаПоза() {
    const фільтр = прочитати(КЛЮЧ_ФІЛЬТРІВ, { вік: "", категорія: "" });
    встановитиВік(фільтр.вік || null);

    let html = навігація([{ назва: "Головна", посилання: "#/" }, { назва: "Корисне поза програмою" }], "#/") +
      '<div class="page-head"><h1>⭐ Корисне поза програмою</h1>' +
      '<a class="btn btn--orange" href="#/">🏠 На головну</a></div>' +
      "<p>Цікаві теми, яких немає в підручнику. Обери свій вік і те, що тобі до вподоби.</p>";

    // Фільтр за віком
    html += '<div class="filters"><p class="filters__label">Вік:</p><div class="chips">' +
      кнопкаФільтра("вік", "", "Усі", фільтр.вік);
    ВІКОВІ_ГРУПИ.forEach(function (г) { html += кнопкаФільтра("вік", г.код, г.назва, фільтр.вік); });
    html += '</div><p class="filters__label">Категорія:</p><div class="chips">' +
      кнопкаФільтра("категорія", "", "Усі", фільтр.категорія);
    КАТЕГОРІЇ.forEach(function (к) {
      html += кнопкаФільтра("категорія", к.назва, к.іконка + " " + к.назва, фільтр.категорія);
    });
    html += "</div></div>";

    const теми = ТЕМИ_ПОЗА_ПРОГРАМОЮ
      .filter(function (т) {
        return (!фільтр.вік || т.вік === фільтр.вік) && (!фільтр.категорія || т.категорія === фільтр.категорія);
      })
      .sort(function (а, б) { return а.номер - б.номер; });

    if (!теми.length) {
      html += порожньо("Теми скоро з'являться");
    } else {
      html += '<div class="topics">';
      теми.forEach(function (т) {
        const мітка = іконкаКатегорії(т.категорія) + " " + esc(т.категорія) + " · " + esc(назваВіку(т.вік));
        html += карткаТеми(т, "#/poza/tema/" + т.номер, пройдено(ключПоза(т)), мітка);
      });
      html += "</div>";
    }

    app.innerHTML = html;
    намалюватиМеню(null, true);

    // Натискання на фільтри
    app.querySelectorAll(".chip").forEach(function (кнопка) {
      кнопка.addEventListener("click", function () {
        фільтр[кнопка.dataset.pole] = кнопка.dataset.value;
        записати(КЛЮЧ_ФІЛЬТРІВ, фільтр);
        сторінкаПоза();
      });
    });
  }

  function кнопкаФільтра(поле, значення, підпис, поточне) {
    return '<button type="button" class="chip" data-pole="' + поле + '" data-value="' + esc(значення) +
      '" aria-pressed="' + (значення === поточне) + '">' + esc(підпис) + "</button>";
  }

  /* ---------- Сторінка теми (Пояснення / Покрокове завдання / Перевір себе) ---------- */
  function сторінкаТеми(тема, ключ, крихти, назад, вік) {
    встановитиВік(вік);
    const абзаци = Array.isArray(тема.пояснення) ? тема.пояснення : [тема.пояснення || ""];
    const кроки = тема.кроки || [];
    const питання = тема.питання || [];

    let html = навігація(крихти, назад) +
      '<div class="topic-head"><span class="topic-head__icon" aria-hidden="true">' + esc(тема.іконка || "📘") + "</span>" +
      '<div><div class="topic-head__meta">Тема ' + esc(тема.номер) + "</div><h1>" + esc(тема.назва) + "</h1></div></div>" +
      "<p>" + esc(тема.опис) + "</p>";

    // 1. Пояснення
    html += '<section class="block"><h2><span aria-hidden="true">📖</span> Пояснення</h2>' +
      абзаци.map(function (а) { return "<p>" + а + "</p>"; }).join("") + "</section>";

    // 2. Покрокове завдання
    if (кроки.length) {
      html += '<section class="block"><h2><span aria-hidden="true">🛠️</span> Покрокове завдання</h2>' +
        '<p class="steps-hint">Натискай на крок, коли виконаєш його.</p><ol class="steps">';
      кроки.forEach(function (к, і) {
        html += '<li><button type="button" class="step" aria-pressed="false">' +
          '<span class="step__num">' + (і + 1) + '</span><span class="step__text">' + к + "</span></button></li>";
      });
      html += "</ol></section>";
    }

    if (тема.підказка) html += тайгер(тема.підказка);

    // 3. Перевір себе
    if (питання.length) {
      html += '<section class="block"><h2><span aria-hidden="true">✅</span> Перевір себе</h2>';
      питання.forEach(function (п, і) {
        html += '<div class="question" data-q="' + і + '"><p class="question__text">' + (і + 1) + ". " + п.текст + "</p>" +
          '<div class="options">';
        п.варіанти.forEach(function (в, вІ) {
          html += '<button type="button" class="option" data-v="' + вІ + '">' + в + "</button>";
        });
        html += '</div><p class="feedback" aria-live="polite"></p></div>';
      });
      html += "</section>";
    }

    // Позначка «пройдено»
    html += '<div class="done-bar" id="doneBar"></div>';

    app.innerHTML = html;

    // --- Кроки: відмітка виконаного ---
    app.querySelectorAll(".step").forEach(function (к) {
      к.addEventListener("click", function () {
        к.setAttribute("aria-pressed", String(к.getAttribute("aria-pressed") !== "true"));
      });
    });

    // --- Питання: перевірка відповіді ---
    const правильні = new Set();
    app.querySelectorAll(".question").forEach(function (блок) {
      const п = питання[Number(блок.dataset.q)];
      const відгук = блок.querySelector(".feedback");
      блок.querySelectorAll(".option").forEach(function (кнопка) {
        кнопка.addEventListener("click", function () {
          const вибір = Number(кнопка.dataset.v);
          if (вибір === п.правильна) {
            кнопка.classList.add("is-right");
            блок.querySelectorAll(".option").forEach(function (к) { к.disabled = true; });
            відгук.className = "feedback feedback--right";
            відгук.innerHTML = "Правильно! 🎉" + (п.пояснення ? " " + п.пояснення : "");
            правильні.add(блок.dataset.q);
            if (правильні.size === питання.length) {
              позначити(ключ, true);
              оновитиПанель(true);
            }
          } else {
            кнопка.classList.add("is-wrong");
            кнопка.disabled = true;
            відгук.className = "feedback feedback--wrong";
            відгук.textContent = "Ще ні. Спробуй інший варіант!";
          }
        });
      });
    });

    // --- Панель «Тему пройдено» ---
    const панель = document.getElementById("doneBar");
    function оновитиПанель(щойно) {
      if (пройдено(ключ)) {
        панель.innerHTML = '<span class="done-badge">Тему пройдено ✓</span>' +
          '<button type="button" class="btn btn--ghost" id="undoBtn">Пройти ще раз</button>' +
          '<a class="btn btn--orange" href="' + назад + '">До списку тем</a>';
        if (щойно) панель.insertAdjacentHTML("afterbegin", тайгер("Чудова робота! Усі відповіді правильні."));
        document.getElementById("undoBtn").addEventListener("click", function () {
          позначити(ключ, false);
          оновитиПанель(false);
        });
      } else {
        панель.innerHTML = '<button type="button" class="btn btn--orange" id="doneBtn">Позначити тему пройденою ✓</button>' +
          '<a class="btn btn--ghost" href="' + назад + '">До списку тем</a>';
        document.getElementById("doneBtn").addEventListener("click", function () {
          позначити(ключ, true);
          оновитиПанель(false);
        });
      }
    }
    оновитиПанель(false);
  }

  /* ---------- Сторінка «не знайдено» ---------- */
  function сторінкаНемає() {
    встановитиВік(null);
    app.innerHTML = '<div class="empty"><h2>Такої сторінки немає</h2>' +
      тайгер("Здається, ми заблукали в джунглях. Повернімося на головну.") +
      '<a class="btn btn--orange" href="#/">🏠 На головну</a></div>';
    намалюватиМеню(null, false);
  }

  /* =================================================================
     МАРШРУТИЗАЦІЯ: вибір сторінки за адресою після #
     ================================================================= */
  function маршрут() {
    const частини = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    закритиМеню();

    if (!частини.length) {
      сторінкаГоловна();

    } else if (частини[0] === "klas" && КЛАСИ.includes(Number(частини[1]))) {
      const клас = Number(частини[1]);
      if (частини[2] === "tema") {
        const тема = темиКласу(клас).find(function (т) { return String(т.номер) === частини[3]; });
        if (!тема) return сторінкаНемає();
        сторінкаТеми(тема, ключКласу(тема),
          [{ назва: "Головна", посилання: "#/" },
           { назва: клас + " клас", посилання: "#/klas/" + клас },
           { назва: тема.назва }],
          "#/klas/" + клас, вікКласу(клас));
        намалюватиМеню(клас, false);
      } else {
        сторінкаКласу(клас);
      }

    } else if (частини[0] === "poza") {
      if (частини[1] === "tema") {
        const тема = ТЕМИ_ПОЗА_ПРОГРАМОЮ.find(function (т) { return String(т.номер) === частини[2]; });
        if (!тема) return сторінкаНемає();
        сторінкаТеми(тема, ключПоза(тема),
          [{ назва: "Головна", посилання: "#/" },
           { назва: "Поза програмою", посилання: "#/poza" },
           { назва: тема.назва }],
          "#/poza", тема.вік);
        намалюватиМеню(null, true);
      } else {
        сторінкаПоза();
      }

    } else {
      сторінкаНемає();
    }

    window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  window.addEventListener("hashchange", маршрут);
  маршрут();
})();
