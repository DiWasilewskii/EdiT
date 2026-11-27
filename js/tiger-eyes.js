/* =====================================================================
   ОЧІ ТАЙГЕРА — зіниці стежать за курсором (або пальцем на телефоні)
   Працює з усіма Тайгерами на сторінці (клас .tiger-svg з js/tiger-art.js).
   У кожному оці: білок — перший елемент .t-eye-l / .t-eye-r,
   зіниця з відблиском — група .t-pupil-l / .t-pupil-r, її ми й зсуваємо.
   ===================================================================== */
(function () {
  "use strict";

  var ЗСУВ_X = 6;     // наскільки далеко зіниця може відійти вбік (одиниці SVG)
  var ЗСУВ_Y = 5;     // і вгору-вниз
  var ПЛАВНІСТЬ = 140; // що більше, то повільніше зіниця «доходить» до краю ока

  var x = null, y = null;   // де зараз курсор (null — дивимося прямо)
  var чекає = false;

  function оновити() {
    чекає = false;
    var тигри = document.querySelectorAll(".tiger-svg");
    for (var i = 0; i < тигри.length; i++) {
      ["l", "r"].forEach(function (бік) {
        var око = тигри[i].querySelector(".t-eye-" + бік);
        var зіниця = тигри[i].querySelector(".t-pupil-" + бік);
        if (!око || !зіниця) return;
        if (x === null) { зіниця.style.transform = ""; return; }

        // центр білка ока на екрані
        var р = око.firstElementChild.getBoundingClientRect();
        if (!р.width) return;
        var dx = x - (р.left + р.width / 2);
        var dy = y - (р.top + р.height / 2);
        var відстань = Math.sqrt(dx * dx + dy * dy);
        if (відстань < 1) { зіниця.style.transform = ""; return; }

        // чим далі курсор — тим ближче зіниця до краю ока
        var сила = відстань / (відстань + ПЛАВНІСТЬ);
        var зx = (dx / відстань) * сила * ЗСУВ_X;
        var зy = (dy / відстань) * сила * ЗСУВ_Y;

        // не випускаємо зіницю за край білка (у різних позах зіниці стоять по-різному)
        var м = місце(око, зіниця);
        var рx = зx > 0 ? м.праворуч : м.ліворуч;
        var рy = зy > 0 ? м.вниз : м.вгору;
        var вихід = (рx > 0 ? (зx * зx) / (рx * рx) : (зx ? Infinity : 0)) +
                    (рy > 0 ? (зy * зy) / (рy * рy) : (зy ? Infinity : 0));
        if (вихід > 1) {
          var к = isFinite(вихід) ? 1 / Math.sqrt(вихід) : 0;
          зx *= к; зy *= к;
        }
        зіниця.style.transform = "translate(" + зx.toFixed(2) + "px," + зy.toFixed(2) + "px)";
      });
    }
  }

  // Скільки місця має зіниця всередині білка в кожен бік (одиниці SVG).
  // Рахуємо один раз для кожного ока і запам'ятовуємо.
  var ЗАПАС = 3.5; // половина обведення білка + трохи повітря
  var кеш = new WeakMap();
  function місце(око, зіниця) {
    var м = кеш.get(зіниця);
    if (м) return м;
    var б = око.firstElementChild.getBBox();
    var з = зіниця.firstElementChild.getBBox();
    м = {
      ліворуч:  Math.max(0, з.x - б.x - ЗАПАС),
      праворуч: Math.max(0, (б.x + б.width) - (з.x + з.width) - ЗАПАС),
      вгору:    Math.max(0, з.y - б.y - ЗАПАС),
      вниз:     Math.max(0, (б.y + б.height) - (з.y + з.height) - ЗАПАС)
    };
    кеш.set(зіниця, м);
    return м;
  }

  function запланувати() {
    if (!чекає) { чекає = true; requestAnimationFrame(оновити); }
  }

  function дивисьНа(новийX, новийY) { x = новийX; y = новийY; запланувати(); }

  document.addEventListener("mousemove", function (е) { дивисьНа(е.clientX, е.clientY); }, { passive: true });
  document.addEventListener("touchstart", function (е) {
    var т = е.touches[0]; if (т) дивисьНа(т.clientX, т.clientY);
  }, { passive: true });
  document.addEventListener("touchmove", function (е) {
    var т = е.touches[0]; if (т) дивисьНа(т.clientX, т.clientY);
  }, { passive: true });

  // курсор пішов за межі вікна — Тайгер знову дивиться прямо
  document.addEventListener("mouseout", function (е) {
    if (!е.relatedTarget) дивисьНа(null, null);
  });

  // сторінку прокрутили або перемалювали — очі мають дивитися туди ж
  window.addEventListener("scroll", запланувати, { passive: true });
  window.addEventListener("hashchange", function () { setTimeout(запланувати, 50); });
})();
