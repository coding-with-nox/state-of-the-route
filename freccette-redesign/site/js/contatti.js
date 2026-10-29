(function () {
  "use strict";
  var P = window.PSD, el = P.el;
  var ul = document.getElementById("venues"), q = document.getElementById("q"), city = document.getElementById("city"), count = document.getElementById("count");
  var items = [];

  function tel(raw) {
    var d = String(raw || "").replace(/\D/g, "");
    if (d.length < 6) return null;
    var pre = /^(00|39)/.test(d) || d.length > 11 ? (d.slice(0, 2) === "39" ? "+" : "") : "+39";
    return { href: "tel:" + pre + d, show: d.length === 10 && d.charAt(0) === "3" ? d.slice(0, 3) + " " + d.slice(3, 6) + " " + d.slice(6) : d };
  }
  function render() {
    var t = P.norm(q.value.trim()), c = city.value;
    var rows = items.filter(function (v) {
      return (!c || v.citta === c) && (!t || P.norm(v.nome + " " + v.citta + " " + (v.indirizzo || "")).indexOf(t) >= 0);
    });
    count.textContent = rows.length === items.length ? P.plural(items.length, "locale", "locali") : rows.length + " di " + items.length + " locali (filtro attivo)";
    P.clear(ul);
    if (!rows.length) { ul.appendChild(el("li", { style: "grid-column:1/-1" }, [P.empty("Nessun locale trovato", "Prova a cambiare ricerca o citta.")])); return; }
    rows.forEach(function (v) {
      var tl = tel(v.tel);
      ul.appendChild(el("li", { "class": "venue" }, [
        el("h3", { text: v.nome }),
        el("p", { "class": "city", text: v.citta || "Citta non indicata" }),
        v.indirizzo ? el("p", { text: v.indirizzo }) : null,
        v.macchine ? el("p", { text: P.plural(+v.macchine, "macchina", "macchine") }) : null,
        v.chiusura ? el("p", { text: "Chiuso: " + v.chiusura.toLowerCase() }) : null,
        tl ? el("a", { "class": "btn btn-ghost", href: tl.href, "aria-label": "Chiama " + v.nome + " al " + tl.show }, "Chiama " + tl.show)
           : el("p", null, ["Telefono: ", P.tbc()])
      ]));
    });
  }

  P.load("locali").then(function (r) {
    items = (r.locali || []).slice().sort(function (a, b) { return String(a.nome).localeCompare(String(b.nome), "it", { sensitivity: "base" }); });
    var cities = {};
    items.forEach(function (v) { if (v.citta) cities[v.citta] = (cities[v.citta] || 0) + 1; });
    Object.keys(cities).sort(function (a, b) { return a.localeCompare(b, "it"); }).forEach(function (k) {
      city.appendChild(el("option", { value: k, text: k + " (" + cities[k] + ")" }));
    });
    render();
  }).catch(function () { P.error(ul, "i locali"); });
  P.load("home").then(function (h) { P.setUpdated(h.aggiornato); P.applyRegs(h.regolamenti); }).catch(function () {});

  q.addEventListener("input", P.debounce(render));
  city.addEventListener("change", render);
})();
