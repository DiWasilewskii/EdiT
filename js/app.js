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

  /* =================================================================
     АНІМОВАНИЙ ЛОГОТИП У ШАПЦІ
     Слова по колу, буква за буквою: EdiT → Education → Digital → Innovation → Technology → EdiT …
     Щоб змінити слова чи швидкість — правте значення нижче.
     ================================================================= */
  const СЛОВА_ЛОГО = ["EdiT", "Education", "Digital", "Innovation", "Technology"];
  const ПАУЗА_EDIT = 2600;   // скільки мс показується «EdiT»
  const ПАУЗА_СЛОВА = 1500;  // скільки мс показується кожне інше слово
  const ШВИДКІСТЬ_ДРУКУ = 90;  // мс між появою букв
  const ШВИДКІСТЬ_СТИРАННЯ = 55; // мс між зникненням букв

  (function анімуватиЛого() {
    const лого = document.getElementById("headerLogo");
    if (!лого) return;
    // Якщо людина вимкнула анімацію в системі — лишаємо просто «EdiT»
    if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let номерСлова = 0;

    function надрукувати(слово, далі) {
      лого.textContent = "";
      let і = 0;
      (function крок() {
        if (і >= слово.length) return далі();
        const буква = document.createElement("span");
        // У словах-розшифруваннях перша буква помаранчева, решта світліші
        буква.className = "ch" + (номерСлова > 0 && і > 0 ? " ch--rest" : "");
        буква.textContent = слово[і];
        лого.appendChild(буква);
        і++;
        setTimeout(крок, ШВИДКІСТЬ_ДРУКУ);
      })();
    }

    function стерти(далі) {
      const букви = Array.prototype.slice.call(лого.children);
      (function крок() {
        const остання = букви.pop();
        if (!остання) return далі();
        остання.classList.add("ch--out");
        setTimeout(function () { остання.remove(); крок(); }, ШВИДКІСТЬ_СТИРАННЯ);
      })();
    }

    function цикл() {
      надрукувати(СЛОВА_ЛОГО[номерСлова], function () {
        setTimeout(function () {
          стерти(function () {
            номерСлова = (номерСлова + 1) % СЛОВА_ЛОГО.length;
            цикл();
          });
        }, номерСлова === 0 ? ПАУЗА_EDIT : ПАУЗА_СЛОВА);
      });
    }

    // Спочатку показуємо готове «EdiT», а потім запускаємо зміну слів
    setTimeout(function () {
      стерти(function () { номерСлова = 1; цикл(); });
    }, ПАУЗА_EDIT);
    // Перетворюємо початковий текст на букви-спани, щоб їх можна було стерти по одній
    лого.innerHTML = "";
    СЛОВА_ЛОГО[0].split("").forEach(function (б) {
      const s = document.createElement("span");
      s.className = "ch";
      s.textContent = б;
      лого.appendChild(s);
    });
  })();

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
    return значок(к ? к.іконка : "📌", "ico--sm");
  }

  // Українська множина: 1 вправа, 3 вправи, 5 вправ, 21 вправа
  function множина(n, одна, кілька, багато) {
    const д = n % 10, с = n % 100;
    if (д === 1 && с !== 11) return одна;
    if (д >= 2 && д <= 4 && (с < 12 || с > 14)) return кілька;
    return багато;
  }

  // Іконка: шлях до SVG-файлу (img/icons/…) або емодзі
  function значок(значення, клас) {
    const к = клас ? " " + клас : "";
    if (/\.svg$/i.test(String(значення || ""))) {
      return '<img class="ico' + к + '" src="' + esc(значення) + '" alt="" aria-hidden="true">';
    }
    return '<span class="ico-emoji' + к + '" aria-hidden="true">' + esc(значення || "") + "</span>";
  }
  // Іконка інтерфейсу з img/icons/ui-….svg
  function ui(назва) { return значок("img/icons/ui-" + назва + ".svg", "ico--ui"); }
  function назваВіку(код) {
    const г = ВІКОВІ_ГРУПИ.find(function (г) { return г.код === код; });
    return г ? г.назва : код;
  }

  /* =================================================================
     ТАЙГЕР — маскот (малюнок + бульбашка з підказкою)
     Малюнки лежать у папці img/tiger/ (зроблені у Figma):
       hello — вітається      tip   — дає підказку
       happy — радіє          think — думає
       oops  — здивований
     ================================================================= */
  function тайгер(текст, поза) {
    return '<aside class="tiger" aria-label="Підказка">' +
      '<img class="tiger__pic" src="img/tiger/' + (поза || "tip") + '.svg" alt="" width="96" height="96">' +
      '<div class="tiger__bubble"><span class="tiger__name">Тайгер</span>' + текст + "</div></aside>";
  }

  /* =================================================================
     НАВІГАЦІЯ: меню, хлібні крихти, кнопка «Назад»
     ================================================================= */
  function намалюватиМеню(поточнийКлас, позаВідкрито) {
    let html = '<div class="menu__grid">' +
      '<a href="#/"' + (!поточнийКлас && !позаВідкрито ? ' class="is-current"' : "") + ">Головна</a>";
    КЛАСИ.forEach(function (к) {
      html += '<a href="#/klas/' + к + '"' + (к === поточнийКлас ? ' class="is-current"' : "") + ">" + к + " клас</a>";
    });
    html += '<a href="#/poza" class="menu__extra">Корисне поза програмою</a></div>';
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
    const слова = [["E", "Education"], ["d", "Digital"], ["i", "Innovation"], ["T", "Technology"]];

    let html = '<section class="hero">' +
      '<h1 class="logo" aria-label="EdiT: Education, Digital, Innovation, Technology" lang="en">';
    слова.forEach(function (с) {
      html += '<span class="logo__item" aria-hidden="true"><span class="logo__letter">' + с[0] +
        '</span><span class="logo__word">' + с[1] + "</span></span>";
    });
    html += "</h1>" +
      '<p class="hero__hello">Привіт! Тут ти навчишся впевнено працювати з комп\'ютером, ' +
      "створювати власні проєкти й безпечно користуватися інтернетом.</p></section>";

    html += тайгер("Привіт! Я Тайгер. Обери свій клас, щоб побачити теми.", "hello");

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

    html += '<a class="extra-btn" href="#/poza">' + значок("img/icons/ui-star-light.svg", "ico--lg") + ' Корисне поза програмою</a>';

    app.innerHTML = html;
    намалюватиМеню(null, false);
  }

  /* ---------- Картка теми (спільна для класів і «Поза програмою») ---------- */
  function карткаТеми(тема, посилання, готово, мітка) {
    return '<a class="topic-card' + (готово ? " is-done" : "") + '" href="' + посилання + '">' +
      (готово ? '<span class="topic-card__done">пройдено ✓</span>' : "") +
      '<span class="topic-card__top"><span class="topic-card__icon">' + значок(тема.іконка || "img/icons/ui-book.svg") +
      '</span><span class="topic-card__num">Тема ' + esc(тема.номер) + "</span></span>" +
      (мітка ? '<span class="topic-card__tag">' + мітка + "</span>" : "") +
      '<h3 class="topic-card__title">' + esc(тема.назва) + "</h3>" +
      '<p class="topic-card__desc">' + esc(тема.опис) + "</p></a>";
  }

  function порожньо(текст) {
    return '<div class="empty">' +
      "<h2>" + текст + "</h2>" + тайгер("Загляни сюди трохи згодом — тут з'являться нові завдання.", "think") + "</div>";
  }

  /* ---------- Сторінка класу ---------- */
  function сторінкаКласу(клас) {
    встановитиВік(вікКласу(клас));
    const теми = темиКласу(клас);

    let html = навігація([{ назва: "Головна", посилання: "#/" }, { назва: клас + " клас" }], "#/") +
      '<div class="page-head"><h1>' + клас + ' клас</h1>' +
      '<a class="btn btn--orange" href="#/">' + ui("home") + ' На головну</a></div>';

    if (!теми.length) {
      html += порожньо("Теми скоро з'являться");
    } else {
      // Групуємо теми за полем «розділ» (у порядку появи). Теми без розділу — в окремій групі.
      const групи = [];
      теми.forEach(function (т) {
        const назва = т.розділ || "";
        let група = групи.find(function (г) { return г.назва === назва; });
        if (!група) { група = { назва: назва, теми: [] }; групи.push(група); }
        група.теми.push(т);
      });
      групи.forEach(function (г) {
        if (г.назва) html += '<h2 class="section-title">' + esc(г.назва) + "</h2>";
        html += '<div class="topics">';
        г.теми.forEach(function (т) {
          const мітка = урокДля(клас + "-" + т.номер) ? значок("img/icons/ui-play.svg", "ico--sm") + " Інтерактивний урок" : "";
          html += карткаТеми(т, "#/klas/" + клас + "/tema/" + т.номер, пройдено(ключКласу(т)), мітка);
        });
        html += "</div>";
      });
    }

    app.innerHTML = html;
    намалюватиМеню(клас, false);
  }

  /* ---------- «Корисне поза програмою» ---------- */
  function сторінкаПоза() {
    const фільтр = прочитати(КЛЮЧ_ФІЛЬТРІВ, { вік: "", категорія: "" });
    встановитиВік(фільтр.вік || null);

    let html = навігація([{ назва: "Головна", посилання: "#/" }, { назва: "Корисне поза програмою" }], "#/") +
      '<div class="page-head"><h1>Корисне поза програмою</h1>' +
      '<a class="btn btn--orange" href="#/">' + ui("home") + ' На головну</a></div>' +
      "<p>Цікаві теми, яких немає в підручнику. Обери свій вік і те, що тобі до вподоби.</p>";

    // Фільтр за віком
    html += '<div class="filters"><p class="filters__label">Вік:</p><div class="chips">' +
      кнопкаФільтра("вік", "", "Усі", фільтр.вік);
    ВІКОВІ_ГРУПИ.forEach(function (г) { html += кнопкаФільтра("вік", г.код, г.назва, фільтр.вік); });
    html += '</div><p class="filters__label">Категорія:</p><div class="chips">' +
      кнопкаФільтра("категорія", "", "Усі", фільтр.категорія);
    КАТЕГОРІЇ.forEach(function (к) {
      html += кнопкаФільтра("категорія", к.назва, значок(к.іконка, "ico--sm") + " " + esc(к.назва), фільтр.категорія);
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
      '" aria-pressed="' + (значення === поточне) + '">' + підпис + "</button>";
  }

  /* ---------- Сторінка теми (Пояснення / Покрокове завдання / Перевір себе) ---------- */
  // урок — список слайдів інтерактивного уроку з js/lessons.js (або null)
  function сторінкаТеми(тема, ключ, крихти, назад, вік, урок) {
    встановитиВік(вік);
    const абзаци = Array.isArray(тема.пояснення) ? тема.пояснення : [тема.пояснення || ""];
    const кроки = тема.кроки || [];
    const питання = тема.питання || [];

    let html = навігація(крихти, назад) +
      '<div class="topic-head"><span class="topic-head__icon">' + значок(тема.іконка || "img/icons/ui-book.svg") + "</span>" +
      '<div><div class="topic-head__meta">Тема ' + esc(тема.номер) + "</div><h1>" + esc(тема.назва) + "</h1></div></div>" +
      "<p>" + esc(тема.опис) + "</p>";

    // Кнопка, що прокручує до інтерактивного уроку на цій сторінці
    if (урок) {
      const вправ = урок.filter(function (с) { return ВПРАВИ.indexOf(с.тип) !== -1; }).length;
      html += '<button type="button" class="lesson-cta" data-to-urok>' +
        '<span class="lesson-cta__play">' + значок("img/icons/ui-play-orange.svg") + "</span>" +
        '<span class="lesson-cta__text"><b>Інтерактивний урок</b><small>' + вправ + " " +
        множина(вправ, "вправа", "вправи", "вправ") + " — нижче на цій сторінці ↓</small></span>" +
        (пройдено("u-" + ключ) ? '<span class="lesson-cta__done">пройдено ✓</span>' : "") + "</button>";
    }

    // 1. Пояснення
    html += '<section class="block"><h2>' + ui("book") + ' Пояснення</h2>' +
      абзаци.map(function (а) { return "<p>" + а + "</p>"; }).join("") + "</section>";

    // 2. Інтерактивний урок (вправи прямо на сторінці)
    if (урок) html += урокНаСторінці(урок, ключ);

    // 3. Покрокове завдання
    if (кроки.length) {
      html += '<section class="block"><h2>' + ui("steps") + ' Покрокове завдання</h2>' +
        '<p class="steps-hint">Натискай на крок, коли виконаєш його.</p><ol class="steps">';
      кроки.forEach(function (к, і) {
        html += '<li><button type="button" class="step" aria-pressed="false">' +
          '<span class="step__num">' + (і + 1) + '</span><span class="step__text">' + к + "</span></button></li>";
      });
      html += "</ol></section>";
    }

    if (тема.підказка) html += тайгер(тема.підказка);

    // 4. Перевір себе
    if (питання.length) {
      html += '<section class="block"><h2>' + ui("quiz") + ' Перевір себе</h2>';
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

    // --- Інтерактивний урок ---
    if (урок) {
      запуститиУрок(урок, ключ);
      app.querySelector("[data-to-urok]").addEventListener("click", function () {
        document.getElementById("urok").scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }

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
        if (щойно) панель.insertAdjacentHTML("afterbegin", тайгер("Чудова робота! Усі відповіді правильні.", "happy"));
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

  /* =================================================================
     ІНТЕРАКТИВНИЙ УРОК: пояснення + вправи прямо на сторінці теми
     Дані уроків — у файлі js/lessons.js (об'єкт УРОКИ).
     Тут тільки «двигун», який показує слайди різних типів.
     ================================================================= */

  // Шукає урок за ключем: "5-3" (5 клас, тема 3) або "poza-1"
  function урокДля(ключУроку) {
    return (typeof УРОКИ !== "undefined" && Array.isArray(УРОКИ[ключУроку])) ? УРОКИ[ключУроку] : null;
  }

  // Прибирання таймерів і обробників клавіш, коли слайд або сторінка змінюється
  let доПрибирання = [];
  function прибрати() {
    доПрибирання.forEach(function (ф) { ф(); });
    доПрибирання = [];
  }

  // Перемішує масив (і стежить, щоб порядок справді змінився)
  function перемішати(масив) {
    const а = масив.slice();
    for (let спроба = 0; спроба < 6; спроба++) {
      for (let і = а.length - 1; і > 0; і--) {
        const j = Math.floor(Math.random() * (і + 1));
        const т = а[і]; а[і] = а[j]; а[j] = т;
      }
      if (а.length < 2 || а.some(function (x, і) { return x !== масив[і]; })) break;
    }
    return а;
  }

  // Порівняння відповідей без урахування регістру, пробілів і виду апострофа
  function нормалізувати(текст) {
    return String(текст).trim().toLowerCase()
      .replace(/[’ʼ`]/g, "'").replace(/°/g, "").replace(/\s+/g, " ");
  }

  function заголовокВправи(с) {
    return '<p class="slide__kind">' + ui("puzzle") + ' Вправа</p><h3>' + (с.завдання || "") + "</h3>";
  }

  /* ---------- Типи слайдів ----------
     Кожна функція отримує: с — дані слайда, el — місце на сторінці,
     готово — викликати, коли вправу виконано правильно. */
  const ТИПИ_СЛАЙДІВ = {

    /* Звичайний слайд з поясненням */
    "слайд": function (с, el) {
      const текст = (Array.isArray(с.текст) ? с.текст : [с.текст || ""])
        .map(function (п) { return "<p>" + п + "</p>"; }).join("");
      el.innerHTML = (с.іконка ? '<div class="slide__icon">' + значок(с.іконка) + "</div>" : "") +
        "<h3>" + (с.заголовок || "") + "</h3>" + текст + (с.тайгер ? тайгер(с.тайгер) : "");
    },

    /* Картки, які перевертаються */
    "картки": function (с, el) {
      el.innerHTML = (с.іконка ? '<div class="slide__icon">' + значок(с.іконка) + "</div>" : "") +
        "<h3>" + (с.заголовок || "") + "</h3>" +
        '<p class="slide__hint">Натискай на картки, щоб перевернути їх.</p><div class="flip-grid">' +
        с.картки.map(function (к) {
          return '<button type="button" class="flip" aria-pressed="false"><span class="flip__front">' + к.лице +
            '</span><span class="flip__back">' + к.зворот + "</span></button>";
        }).join("") + "</div>";
      el.querySelectorAll(".flip").forEach(function (б) {
        б.addEventListener("click", function () {
          б.setAttribute("aria-pressed", String(б.getAttribute("aria-pressed") !== "true"));
        });
      });
    },

    /* Вибір однієї правильної відповіді */
    "вибір": function (с, el, готово) {
      el.innerHTML = '<p class="slide__kind">' + ui("question") + ' Запитання</p><h3>' + с.питання + "</h3>" +
        '<div class="options options--col">' + с.варіанти.map(function (в, і) {
          return '<button type="button" class="option" data-v="' + і + '">' + в + "</button>";
        }).join("") + '</div><p class="feedback" aria-live="polite"></p>';
      const відгук = el.querySelector(".feedback");
      el.querySelectorAll(".option").forEach(function (к) {
        к.addEventListener("click", function () {
          if (Number(к.dataset.v) === с.правильна) {
            к.classList.add("is-right");
            el.querySelectorAll(".option").forEach(function (о) { о.disabled = true; });
            відгук.className = "feedback feedback--right";
            відгук.innerHTML = "Правильно! 🎉" + (с.пояснення ? " " + с.пояснення : "");
            готово();
          } else {
            к.classList.add("is-wrong");
            к.disabled = true;
            відгук.className = "feedback feedback--wrong";
            відгук.textContent = "Ще ні. Спробуй інший варіант!";
          }
        });
      });
    },

    /* Розклади картки по групах (натисни картку, потім групу; або перетягни) */
    "сортування": function (с, el, готово) {
      const елементи = перемішати(с.елементи.map(function (е, і) { return { текст: е.текст, група: е.група, і: і }; }));
      el.innerHTML = заголовокВправи(с) +
        '<p class="slide__hint">Натисни на картку, а потім на групу, куди вона належить. На комп\'ютері картки можна перетягувати.</p>' +
        '<div class="sort-pool" data-group="-1">' + елементи.map(function (е) {
          return '<button type="button" class="chip-item" draggable="true" data-g="' + е.група + '">' + е.текст + "</button>";
        }).join("") + "</div>" +
        '<div class="sort-groups">' + с.групи.map(function (г, гі) {
          return '<div class="sort-group" data-group="' + гі + '"><div class="sort-group__title">' + г +
            '</div><div class="sort-group__items"></div></div>';
        }).join("") + "</div>" +
        '<div class="ex-actions"><button type="button" class="btn btn--orange" data-check>Перевірити</button></div>' +
        '<p class="feedback" aria-live="polite"></p>';

      const пул = el.querySelector(".sort-pool");
      const відгук = el.querySelector(".feedback");
      let вибрана = null;

      function вибрати(к) {
        if (вибрана) вибрана.classList.remove("is-selected");
        вибрана = (вибрана === к) ? null : к;
        if (вибрана) вибрана.classList.add("is-selected");
      }
      function перенести(к, зона) {
        const куди = зона.classList.contains("sort-pool") ? зона : зона.querySelector(".sort-group__items");
        куди.appendChild(к);
        к.classList.remove("is-selected", "is-wrong");
        вибрана = null;
      }

      el.querySelectorAll(".chip-item").forEach(function (к) {
        к.addEventListener("click", function (e) { e.stopPropagation(); if (!к.disabled) вибрати(к); });
        к.addEventListener("dragstart", function (e) {
          вибрана = к;
          e.dataTransfer.setData("text/plain", "");
        });
      });
      el.querySelectorAll(".sort-group, .sort-pool").forEach(function (зона) {
        зона.addEventListener("click", function () { if (вибрана) перенести(вибрана, зона); });
        зона.addEventListener("dragover", function (e) { e.preventDefault(); зона.classList.add("is-over"); });
        зона.addEventListener("dragleave", function () { зона.classList.remove("is-over"); });
        зона.addEventListener("drop", function (e) {
          e.preventDefault();
          зона.classList.remove("is-over");
          if (вибрана) перенести(вибрана, зона);
        });
      });

      el.querySelector("[data-check]").addEventListener("click", function () {
        if (пул.children.length) {
          відгук.className = "feedback feedback--wrong";
          відгук.textContent = "Спочатку розклади всі картки по групах.";
          return;
        }
        let помилок = 0;
        el.querySelectorAll(".sort-group").forEach(function (група) {
          група.querySelectorAll(".chip-item").forEach(function (к) {
            if (к.dataset.g === група.dataset.group) {
              к.classList.add("is-right");
            } else {
              помилок++;
              к.classList.add("is-wrong");
            }
          });
        });
        if (!помилок) {
          el.querySelectorAll(".chip-item").forEach(function (к) { к.disabled = true; к.draggable = false; });
          el.querySelector("[data-check]").disabled = true;
          відгук.className = "feedback feedback--right";
          відгук.textContent = "Усе правильно! 🎉";
          готово();
        } else {
          відгук.className = "feedback feedback--wrong";
          відгук.textContent = "Помилок: " + помилок + ". Червоні картки повернуться назад — спробуй ще раз.";
          const таймер = setTimeout(function () {
            el.querySelectorAll(".chip-item.is-wrong").forEach(function (к) { перенести(к, пул); });
          }, 1200);
          доПрибирання.push(function () { clearTimeout(таймер); });
        }
      });
    },

    /* З'єднай пари: ліва картка + права картка */
    "пари": function (с, el, готово) {
      const праві = перемішати(с.пари.map(function (п, і) { return { текст: п[1], і: і }; }));
      el.innerHTML = заголовокВправи(с) +
        '<p class="slide__hint">Натисни картку ліворуч, а потім її пару праворуч.</p>' +
        '<div class="pairs"><div class="pairs__col">' + с.пари.map(function (п, і) {
          return '<button type="button" class="pair-btn" data-side="л" data-i="' + і + '">' + п[0] + "</button>";
        }).join("") + '</div><div class="pairs__col">' + праві.map(function (п) {
          return '<button type="button" class="pair-btn" data-side="п" data-i="' + п.і + '">' + п.текст + "</button>";
        }).join("") + '</div></div><p class="feedback" aria-live="polite"></p>';

      const відгук = el.querySelector(".feedback");
      const вибрані = { "л": null, "п": null };
      let знайдено = 0;

      el.querySelectorAll(".pair-btn").forEach(function (к) {
        к.addEventListener("click", function () {
          const бік = к.dataset.side;
          if (вибрані[бік]) вибрані[бік].classList.remove("is-selected");
          вибрані[бік] = к;
          к.classList.add("is-selected");
          if (!вибрані["л"] || !вибрані["п"]) return;

          const л = вибрані["л"], п = вибрані["п"];
          вибрані["л"] = вибрані["п"] = null;
          л.classList.remove("is-selected"); п.classList.remove("is-selected");
          if (л.dataset.i === п.dataset.i) {
            л.classList.add("is-right"); п.classList.add("is-right");
            л.disabled = п.disabled = true;
            знайдено++;
            if (знайдено === с.пари.length) {
              відгук.className = "feedback feedback--right";
              відгук.textContent = "Усі пари знайдено! 🎉";
              готово();
            } else {
              відгук.className = "feedback feedback--right";
              відгук.textContent = "Так! Залишилось пар: " + (с.пари.length - знайдено);
            }
          } else {
            л.classList.add("is-wrong"); п.classList.add("is-wrong");
            відгук.className = "feedback feedback--wrong";
            відгук.textContent = "Це не пара. Спробуй ще!";
            const таймер = setTimeout(function () { л.classList.remove("is-wrong"); п.classList.remove("is-wrong"); }, 700);
            доПрибирання.push(function () { clearTimeout(таймер); });
          }
        });
      });
    },

    /* Розстав у правильному порядку (кнопки ↑ ↓) */
    "порядок": function (с, el, готово) {
      let список = перемішати(с.елементи.map(function (е, і) { return { текст: е, і: і }; }));
      el.innerHTML = заголовокВправи(с) +
        '<p class="slide__hint">Пересувай рядки кнопками ↑ і ↓, а потім натисни «Перевірити».</p>' +
        '<ol class="order-list"></ol>' +
        '<div class="ex-actions"><button type="button" class="btn btn--orange" data-check>Перевірити</button></div>' +
        '<p class="feedback" aria-live="polite"></p>';
      const ol = el.querySelector(".order-list");
      const відгук = el.querySelector(".feedback");
      let завершено = false;

      function намалювати() {
        ol.innerHTML = список.map(function (е, поз) {
          return '<li class="order-item" data-i="' + е.і + '"><span class="order-item__num">' + (поз + 1) + "</span>" +
            '<span class="order-item__text">' + е.текст + "</span>" +
            '<span class="order-item__btns"><button type="button" data-move="-1" aria-label="Вище"' + (поз === 0 || завершено ? " disabled" : "") + ">↑</button>" +
            '<button type="button" data-move="1" aria-label="Нижче"' + (поз === список.length - 1 || завершено ? " disabled" : "") + ">↓</button></span></li>";
        }).join("");
        ol.querySelectorAll("[data-move]").forEach(function (б, k) {
          б.addEventListener("click", function () {
            const поз = Math.floor(k / 2);
            const нова = поз + Number(б.dataset.move);
            const т = список[поз]; список[поз] = список[нова]; список[нова] = т;
            намалювати();
          });
        });
      }
      намалювати();

      el.querySelector("[data-check]").addEventListener("click", function () {
        let помилок = 0;
        ol.querySelectorAll(".order-item").forEach(function (li, поз) {
          const добре = Number(li.dataset.i) === поз;
          li.classList.toggle("is-right", добре);
          li.classList.toggle("is-wrong", !добре);
          if (!добре) помилок++;
        });
        if (!помилок) {
          завершено = true;
          намалювати();
          ol.querySelectorAll(".order-item").forEach(function (li) { li.classList.add("is-right"); });
          el.querySelector("[data-check]").disabled = true;
          відгук.className = "feedback feedback--right";
          відгук.textContent = "Порядок правильний! 🎉";
          готово();
        } else {
          відгук.className = "feedback feedback--wrong";
          відгук.textContent = "Червоні рядки стоять не на своєму місці. Спробуй ще!";
        }
      });
    },

    /* Заповни пропуски: у тексті ___ замінюються полями для відповіді */
    "пропуск": function (с, el, готово) {
      const частини = с.текст.split("___");
      let html = заголовокВправи(с) + '<p class="blank-text">';
      частини.forEach(function (ч, і) {
        html += ч;
        if (і < частини.length - 1) html += '<input type="text" class="blank-input" data-i="' + і + '" autocomplete="off" aria-label="Пропуск ' + (і + 1) + '">';
      });
      html += "</p>";
      if (с.слова) {
        html += '<p class="slide__hint">Натисни на слово, щоб вставити його в порожнє поле:</p><div class="word-bank">' +
          перемішати(с.слова).map(function (с) { return '<button type="button" class="chip-item">' + с + "</button>"; }).join("") + "</div>";
      }
      html += '<div class="ex-actions"><button type="button" class="btn btn--orange" data-check>Перевірити</button></div>' +
        '<p class="feedback" aria-live="polite"></p>';
      el.innerHTML = html;

      const поля = Array.prototype.slice.call(el.querySelectorAll(".blank-input"));
      const відгук = el.querySelector(".feedback");
      let останнє = null;
      поля.forEach(function (п) { п.addEventListener("focus", function () { останнє = п; }); });
      el.querySelectorAll(".word-bank .chip-item").forEach(function (к) {
        к.addEventListener("click", function () {
          const ціль = (останнє && !останнє.value) ? останнє : (поля.find(function (п) { return !п.value; }) || останнє || поля[0]);
          ціль.value = к.textContent;
          ціль.classList.remove("is-wrong");
          const наступне = поля.find(function (п) { return !п.value; });
          останнє = наступне || null;
        });
      });

      el.querySelector("[data-check]").addEventListener("click", function () {
        let помилок = 0;
        поля.forEach(function (п, і) {
          const правильні = [].concat(с.відповіді[і]).map(нормалізувати);
          const добре = правильні.indexOf(нормалізувати(п.value)) !== -1;
          п.classList.toggle("is-right", добре);
          п.classList.toggle("is-wrong", !добре);
          if (!добре) помилок++;
        });
        if (!помилок) {
          поля.forEach(function (п) { п.readOnly = true; });
          el.querySelector("[data-check]").disabled = true;
          відгук.className = "feedback feedback--right";
          відгук.textContent = "Правильно! 🎉";
          готово();
        } else {
          відгук.className = "feedback feedback--wrong";
          відгук.textContent = "Перевір червоні поля і спробуй ще раз.";
        }
      });
    },

    /* Черепашка: програма з блоків, як у Скретчі, малює на полотні */
    "черепашка": function (с, el, готово) {
      const п = Object.assign({ повторень: 4, кроків: 100, кут: 90 }, с.поля);
      const вкладений = п.зовнішніх !== undefined;
      const змінні = с.змінні || [];

      function поле(назва) {
        return змінні.indexOf(назва) !== -1
          ? '<input type="number" class="blk-input" data-f="' + назва + '" value="' + п[назва] + '" aria-label="' + назва + '">'
          : '<span class="blk-val" data-show="' + назва + '">' + п[назва] + "</span>";
      }
      function пара(перша) {
        return '<div class="blk blk--motion">перемістити на ' + (перша ? поле("кроків") : '<span class="blk-val" data-show="кроків">' + п.кроків + "</span>") + " кроків</div>" +
          '<div class="blk blk--motion">поворот ↻ на ' + (перша ? поле("кут") : '<span class="blk-val" data-show="кут">' + п.кут + "</span>") + " градусів</div>";
      }

      let програма = '<div class="blk blk--event">коли натиснуто 🏴</div>';
      if (с.лінійно) {
        for (let і = 0; і < п.повторень; і++) програма += пара(і === 0);
      } else {
        let внутрішній = '<div class="blk blk--control">повторити ' + поле("повторень") + '<div class="blk-body">' + пара(true) + "</div></div>";
        if (вкладений) {
          внутрішній = '<div class="blk blk--control">повторити ' + поле("зовнішніх") + '<div class="blk-body">' + внутрішній +
            '<div class="blk blk--motion">поворот ↻ на ' + поле("поворот") + " градусів</div></div></div>";
        }
        програма += внутрішній;
      }

      el.innerHTML = заголовокВправи(с) +
        (с.підказкаЗавдання ? '<p class="slide__hint">' + с.підказкаЗавдання + "</p>" : "") +
        '<div class="turtle"><div class="turtle__code">' + програма +
        '<button type="button" class="btn btn--orange turtle__run" data-run>🏴 Запустити</button></div>' +
        '<canvas class="turtle__canvas" width="320" height="320" aria-label="Малюнок черепашки"></canvas></div>' +
        '<p class="feedback" aria-live="polite"></p>';

      const полотно = el.querySelector("canvas");
      const ctx = полотно.getContext("2d");
      const відгук = el.querySelector(".feedback");
      let кадр = null;
      доПрибирання.push(function () { if (кадр) cancelAnimationFrame(кадр); });

      function прочитатиПоля() {
        el.querySelectorAll(".blk-input").forEach(function (і) {
          const ч = Number(і.value);
          п[і.dataset.f] = isFinite(ч) ? ч : 0;
        });
        // Обмеження, щоб малюнок не «зависав»
        п.повторень = Math.max(1, Math.min(60, Math.round(п.повторень)));
        if (вкладений) п.зовнішніх = Math.max(1, Math.min(60, Math.round(п.зовнішніх)));
        п.кроків = Math.max(1, Math.min(400, п.кроків));
        el.querySelectorAll("[data-show]").forEach(function (с) { с.textContent = п[с.dataset.show]; });
      }

      function точки() {
        let x = 0, y = 0, a = 0;
        const т = [[0, 0]];
        const зовн = вкладений ? п.зовнішніх : 1;
        for (let о = 0; о < зовн; о++) {
          for (let і = 0; і < п.повторень; і++) {
            x += п.кроків * Math.cos(a * Math.PI / 180);
            y += п.кроків * Math.sin(a * Math.PI / 180);
            т.push([x, y]);
            a += п.кут;
          }
          if (вкладений) a += п.поворот;
        }
        return т;
      }

      function намалювати(перевірити) {
        if (кадр) cancelAnimationFrame(кадр);
        прочитатиПоля();
        const т = точки();
        const xs = т.map(function (p) { return p[0]; }), ys = т.map(function (p) { return p[1]; });
        const minX = Math.min.apply(null, xs), maxX = Math.max.apply(null, xs);
        const minY = Math.min.apply(null, ys), maxY = Math.max.apply(null, ys);
        const W = полотно.width, H = полотно.height, відступ = 24;
        const масштаб = Math.min((W - 2 * відступ) / Math.max(maxX - minX, 1), (H - 2 * відступ) / Math.max(maxY - minY, 1), 1.6);
        const зсувX = (W - (maxX - minX) * масштаб) / 2 - minX * масштаб;
        const зсувY = (H - (maxY - minY) * масштаб) / 2 - minY * масштаб;
        function X(p) { return p[0] * масштаб + зсувX; }
        function Y(p) { return p[1] * масштаб + зсувY; }

        const початок = performance.now();
        const тривалість = Math.min(2200, 250 + т.length * 40);
        (function крок(зараз) {
          // Math.max(0, …): час першого кадру буває трохи меншим за «початок»
          const скільки = Math.max(0, Math.min(т.length - 1, Math.floor((зараз - початок) / тривалість * (т.length - 1))));
          ctx.clearRect(0, 0, W, H);
          ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.lineCap = "round";
          ctx.strokeStyle = "#E8731C";
          ctx.beginPath(); ctx.moveTo(X(т[0]), Y(т[0]));
          for (let і = 1; і <= скільки; і++) ctx.lineTo(X(т[і]), Y(т[і]));
          ctx.stroke();
          // «Черепашка» — темне коло на кінці лінії
          ctx.fillStyle = "#1F3A2B";
          ctx.beginPath(); ctx.arc(X(т[скільки]), Y(т[скільки]), 6, 0, Math.PI * 2); ctx.fill();
          if (скільки < т.length - 1) { кадр = requestAnimationFrame(крок); return; }
          кадр = null;
          if (перевірити) оцінити();
        })(початок);
      }

      function оцінити() {
        const ціль = с.ціль || {};
        const добре = Object.keys(ціль).every(function (к) { return Number(п[к]) === Number(ціль[к]); });
        if (добре) {
          відгук.className = "feedback feedback--right";
          відгук.innerHTML = с.успіх || "Чудово! Саме так! 🎉";
          готово();
        } else {
          відгук.className = "feedback feedback--wrong";
          відгук.innerHTML = с.підказка || "Ще не зовсім. Зміни числа і запусти знову.";
        }
      }

      el.querySelector("[data-run]").addEventListener("click", function () { намалювати(true); });
      el.querySelectorAll(".blk-input").forEach(function (і) {
        і.addEventListener("keydown", function (e) { if (e.key === "Enter") намалювати(true); });
      });
      намалювати(false);
    },

    /* Міні-гра: керуй стрілками, збирай зірки. Показує, як працює розгалуження */
    "стрілки": function (с, el, готово) {
      const N = с.розмір || 5;
      const потрібно = с.зірок || 3;
      let гравець = { x: 0, y: 0 }, зірка = null, зібрано = 0;
      const команди = {
        "ArrowRight": { dx: 1, dy: 0, умова: "клавішу стрілка вправо натиснуто?", дія: "змінити x на 1" },
        "ArrowLeft":  { dx: -1, dy: 0, умова: "клавішу стрілка вліво натиснуто?", дія: "змінити x на -1" },
        "ArrowUp":    { dx: 0, dy: 1, умова: "клавішу стрілка вгору натиснуто?", дія: "змінити y на 1" },
        "ArrowDown":  { dx: 0, dy: -1, умова: "клавішу стрілка вниз натиснуто?", дія: "змінити y на -1" }
      };

      el.innerHTML = заголовокВправи(с) +
        '<div class="game"><div class="game__play"><div class="game__board" style="--n:' + N + '"></div>' +
        '<p class="game__info"></p>' +
        '<div class="game__pad"><button type="button" data-key="ArrowUp" aria-label="Вгору">↑</button>' +
        '<button type="button" data-key="ArrowLeft" aria-label="Ліворуч">←</button>' +
        '<button type="button" data-key="ArrowDown" aria-label="Вниз">↓</button>' +
        '<button type="button" data-key="ArrowRight" aria-label="Праворуч">→</button></div></div>' +
        '<div class="game__side"><p class="slide__hint">Клацни по полю, щоб керувати стрілками на клавіатурі. Ось програма цієї гри. Блок, що спрацював, підсвічується:</p>' +
        '<div class="game__code"><div class="blk blk--event">коли натиснуто 🏴</div>' +
        '<div class="blk blk--control">завжди<div class="blk-body">' +
        Object.keys(команди).map(function (к) {
          return '<div class="blk blk--control blk--if" data-key="' + к + '">якщо <span class="blk-cond">' + команди[к].умова +
            '</span> то<div class="blk-body"><div class="blk blk--motion">' + команди[к].дія + "</div></div></div>";
        }).join("") + "</div></div></div></div></div>" +
        '<p class="feedback" aria-live="polite"></p>';

      const дошка = el.querySelector(".game__board");
      const інфо = el.querySelector(".game__info");
      const відгук = el.querySelector(".feedback");

      function новаЗірка() {
        do { зірка = { x: Math.floor(Math.random() * N), y: Math.floor(Math.random() * N) }; }
        while (зірка.x === гравець.x && зірка.y === гравець.y);
      }
      function намалювати() {
        let html = "";
        for (let ряд = N - 1; ряд >= 0; ряд--) {        // y зростає вгору, як у Скретчі
          for (let x = 0; x < N; x++) {
            const тут = гравець.x === x && гравець.y === ряд;
            const зіркаТут = зірка && зірка.x === x && зірка.y === ряд;
            html += '<div class="game__cell">' + (тут ? '<img class="game__tiger" src="img/tiger/hello.svg" alt="Тайгер">' : зіркаТут ? "⭐" : "") + "</div>";
          }
        }
        дошка.innerHTML = html;
        інфо.innerHTML = "x: <b>" + гравець.x + "</b>, y: <b>" + гравець.y + "</b> · Зірок: <b>" + зібрано + " / " + потрібно + "</b>";
      }
      function натиснуто(клавіша) {
        const к = команди[клавіша];
        if (!к || зібрано >= потрібно) return;
        гравець.x = Math.max(0, Math.min(N - 1, гравець.x + к.dx));
        гравець.y = Math.max(0, Math.min(N - 1, гравець.y + к.dy));
        // Підсвічуємо блок «якщо», який спрацював
        el.querySelectorAll(".blk--if").forEach(function (б) { б.classList.toggle("is-active", б.dataset.key === клавіша); });
        if (гравець.x === зірка.x && гравець.y === зірка.y) {
          зібрано++;
          if (зібрано >= потрібно) {
            зірка = null;
            відгук.className = "feedback feedback--right";
            відгук.textContent = "Усі зірки зібрано! Кожне натискання перевіряли блоки «якщо». 🎉";
            готово();
          } else {
            новаЗірка();
          }
        }
        намалювати();
      }

      el.querySelectorAll(".game__pad button").forEach(function (б) {
        б.addEventListener("click", function () { натиснуто(б.dataset.key); });
      });
      // Стрілки на клавіатурі працюють, коли гра «у фокусі» (після клацання по ній),
      // щоб в інших місцях сторінки стрілки й далі гортали сторінку
      const гра = el.querySelector(".game");
      гра.tabIndex = 0;
      гра.addEventListener("click", function () { гра.focus({ preventScroll: true }); });
      гра.addEventListener("keydown", function (e) {
        if (команди[e.key]) {
          e.preventDefault();
          натиснуто(e.key);
        }
      });

      новаЗірка();
      намалювати();
    }
  };

  // Типи, які є вправами (їх треба виконати; решта — пояснення)
  const ВПРАВИ = ["вибір", "сортування", "пари", "порядок", "пропуск", "черепашка", "стрілки"];

  /* ---------- Інтерактивний урок прямо на сторінці теми ----------
     Усі пояснення й вправи уроку йдуть одна за одною (без слайдів).
     Коли всі вправи виконано — урок позначається пройденим. */
  function урокНаСторінці(слайди, ключ) {
    const html = слайди.map(function (с, і) {
      const вправа = ВПРАВИ.indexOf(с.тип) !== -1;
      return '<div class="lesson-item' + (вправа ? " lesson-item--ex" : "") + '" data-i="' + і + '"><div class="slide"></div></div>';
    }).join("");
    const вправ = слайди.filter(function (с) { return ВПРАВИ.indexOf(с.тип) !== -1; }).length;
    return '<section class="block lesson-inline" id="urok">' +
      "<h2>" + ui("puzzle") + " Інтерактивний урок</h2>" +
      '<div class="lesson-inline__status"><div class="lesson__bar" aria-hidden="true"><div class="lesson__bar-fill"></div></div>' +
      '<p class="lesson-inline__count" aria-live="polite">Виконано вправ: <b>0 з ' + вправ + "</b></p></div>" +
      html + '<div class="lesson-inline__done"></div></section>';
  }

  function запуститиУрок(слайди, ключ) {
    const блок = document.getElementById("urok");
    if (!блок) return;
    const ключУроку = "u-" + ключ;
    const вправ = слайди.filter(function (с) { return ВПРАВИ.indexOf(с.тип) !== -1; }).length;
    const виконані = new Set();
    const лічильник = блок.querySelector(".lesson-inline__count");
    const смуга = блок.querySelector(".lesson__bar-fill");
    const фінал = блок.querySelector(".lesson-inline__done");

    function оновити() {
      лічильник.innerHTML = "Виконано вправ: <b>" + виконані.size + " з " + вправ + "</b>" +
        (пройдено(ключУроку) && виконані.size < вправ ? " · раніше урок уже пройдено ✓" : "");
      смуга.style.width = (вправ ? виконані.size / вправ * 100 : 100) + "%";
      if (вправ && виконані.size === вправ) {
        позначити(ключУроку, true);
        фінал.innerHTML = тайгер("Усі вправи уроку виконано! Тепер пройди «Перевір себе» внизу сторінки.", "happy");
      }
    }

    let номерВправи = 0;
    блок.querySelectorAll(".lesson-item").forEach(function (пункт) {
      const і = Number(пункт.dataset.i);
      const с = слайди[і];
      (ТИПИ_СЛАЙДІВ[с.тип] || ТИПИ_СЛАЙДІВ["слайд"])(с, пункт.firstChild, function () {
        виконані.add(і);
        пункт.classList.add("is-done");
        const мітка = пункт.querySelector(".slide__kind");
        if (мітка) мітка.insertAdjacentText("beforeend", " ✓");
        оновити();
      });
      // Мітка «Вправа 2 з 5», щоб було видно, скільки ще залишилось
      if (ВПРАВИ.indexOf(с.тип) !== -1) {
        номерВправи++;
        const мітка = пункт.querySelector(".slide__kind");
        if (мітка) мітка.innerHTML = ui(с.тип === "вибір" ? "question" : "puzzle") + " Вправа " + номерВправи + " з " + вправ;
      }
    });
    оновити();
  }


  /* ---------- Сторінка «не знайдено» ---------- */
  function сторінкаНемає() {
    встановитиВік(null);
    app.innerHTML = '<div class="empty"><h2>Такої сторінки немає</h2>' +
      тайгер("Здається, ми заблукали в джунглях. Повернімося на головну.", "oops") +
      '<a class="btn btn--orange" href="#/">' + ui("home") + ' На головну</a></div>';
    намалюватиМеню(null, false);
  }

  /* =================================================================
     МАРШРУТИЗАЦІЯ: вибір сторінки за адресою після #
     ================================================================= */
  function маршрут() {
    const частини = location.hash.replace(/^#\/?/, "").split("/").filter(Boolean);
    закритиМеню();
    прибрати();
    // Старі посилання …/urok відкривають тему й прокручують до інтерактивного уроку
    let доУроку = false;

    if (!частини.length) {
      сторінкаГоловна();

    } else if (частини[0] === "klas" && КЛАСИ.includes(Number(частини[1]))) {
      const клас = Number(частини[1]);
      if (частини[2] === "tema") {
        const тема = темиКласу(клас).find(function (т) { return String(т.номер) === частини[3]; });
        if (!тема) return сторінкаНемає();
        сторінкаТеми(тема, ключКласу(тема),
          [{ назва: "Головна", посилання: "#/" }, { назва: клас + " клас", посилання: "#/klas/" + клас }, { назва: тема.назва }],
          "#/klas/" + клас, вікКласу(клас), урокДля(клас + "-" + тема.номер));
        доУроку = частини[4] === "urok";
        намалюватиМеню(клас, false);
      } else {
        сторінкаКласу(клас);
      }

    } else if (частини[0] === "poza") {
      if (частини[1] === "tema") {
        const тема = ТЕМИ_ПОЗА_ПРОГРАМОЮ.find(function (т) { return String(т.номер) === частини[2]; });
        if (!тема) return сторінкаНемає();
        сторінкаТеми(тема, ключПоза(тема),
          [{ назва: "Головна", посилання: "#/" }, { назва: "Поза програмою", посилання: "#/poza" }, { назва: тема.назва }],
          "#/poza", тема.вік, урокДля("poza-" + тема.номер));
        доУроку = частини[3] === "urok";
        намалюватиМеню(null, true);
      } else {
        сторінкаПоза();
      }

    } else {
      сторінкаНемає();
    }

    const урок = доУроку && document.getElementById("urok");
    if (урок) урок.scrollIntoView(); else window.scrollTo(0, 0);
    app.focus({ preventScroll: true });
  }

  window.addEventListener("hashchange", маршрут);
  маршрут();
})();
