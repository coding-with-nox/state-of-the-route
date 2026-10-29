(function () {
  "use strict";
  var P = window.PSD, el = P.el;
  var list = document.getElementById("list"), q = document.getElementById("q"), city = document.getElementById("city"), count = document.getElementById("count");
  var items = [];

  function render() {
    var t = P.norm(q.value.trim()), c = city.value;
    var rows = items.filter(function (e) {
      return (!c || e.citta === c) && (!t || P.norm(e.nome + " " + e.locale + " " + e.citta).indexOf(t) >= 0);
    });
    count.textContent = rows.length === items.length ? P.plural(items.length, "torneo", "tornei") : rows.length + " di " + items.length + " tornei (filtro attivo)";
    P.clear(list);
    if (!rows.length) { list.appendChild(P.empty("Nessun torneo trovato", "Prova a cambiare ricerca o localita.")); return; }
    var ul = null, key = null;
    rows.forEach(function (e) {
      if (e.d.key !== key) {
        key = e.d.key;
        list.appendChild(el("h2", { "class": "monthhead", text: P.MESI[e.d.m - 1] + " " + e.d.y }));
        ul = list.appendChild(el("ul", { "class": "events" }));
      }
      ul.appendChild(el("li", { "class": "ev" }, [
        el("div", { "class": "date", "aria-hidden": "true" }, [el("small", { text: e.d.mon }), el("b", { text: e.d.d })]),
        el("div", { "class": "what" }, [
          el("h3", { text: e.nome }),
          el("p", { text: e.d.d + " " + P.MESI[e.d.m - 1].toLowerCase() + (e.d.time ? ", ore " + e.d.time : "") + " - " + e.locale + (e.citta ? " (" + e.citta + ")" : "") })
        ]),
        el("a", { "class": "btn btn-cta", href: "contatti.html#iscrizione", "aria-label": "Iscriviti: " + e.nome + ", " + e.locale + ", " + e.d.d + "/" + e.d.m }, "Iscriviti")
      ]));
    });
  }

  Promise.all([P.load("tornei"), P.load("locali")]).then(function (r) {
    P.setUpdated(r[0].aggiornato);
    var map = {};
    (r[1].locali || []).forEach(function (l) { if (l.citta) map[P.norm(l.nome)] = l.citta; });
    items = (r[0].tornei || []).map(function (e) {
      return { nome: e.nome, locale: e.locale, citta: map[P.norm(e.locale)] || "", d: P.parseDate(e.data) };
    }).filter(function (e) { return e.d; }).sort(function (a, b) { return a.d.ts - b.d.ts; });
    var cities = {};
    items.forEach(function (e) { if (e.citta) cities[e.citta] = (cities[e.citta] || 0) + 1; });
    Object.keys(cities).sort(function (a, b) { return a.localeCompare(b, "it"); }).forEach(function (k) {
      city.appendChild(el("option", { value: k, text: k + " (" + cities[k] + ")" }));
    });
    render();
  }).catch(function () { P.error(list, "i tornei"); });

  q.addEventListener("input", P.debounce(render));
  city.addEventListener("change", render);
})();
