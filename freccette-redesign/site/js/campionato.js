(function () {
  "use strict";
  var P = window.PSD, el = P.el;
  var IDS = ["3", "11", "25"], CATS = ["A", "B", "C", "Mix"];
  var S = { c: "25", cat: "A", tab: "sq" };
  var camp, sing, tabsApi;
  var $ = function (id) { return document.getElementById(id); };
  var panel = $("panel"), q = $("q"), count = $("count");

  /* ---------- tabella generica ---------- */
  function table(caption, cols, rows, podium) {
    var thead = el("tr", null, cols.map(function (c) { return el("th", { scope: "col", "class": c.n ? "n" : null, text: c.h, title: c.t || null }); }));
    var tbody = el("tbody");
    rows.forEach(function (r) {
      if (r.group) {
        tbody.appendChild(el("tr", { "class": "grouphead" }, [el("th", { colspan: cols.length, scope: "colgroup", text: r.group })]));
        return;
      }
      var tr = el("tr", { "class": podium && r.p && +r.p <= 3 ? "p" + (+r.p) : null });
      cols.forEach(function (c, i) {
        var v = c.v(r), cls = [c.n ? "n" : "", c.cls || ""].join(" ").trim() || null;
        var cell = c.pos ? el("span", { "class": "pos", text: v }) : v;
        tr.appendChild(i === c.rowhead ? el("th", { scope: "row", "class": cls }, [cell]) : el("td", { "class": cls }, [cell]));
      });
      tbody.appendChild(tr);
    });
    var wrap = el("div", { "class": "tablewrap", tabindex: "0", role: "region", "aria-label": caption }, [
      el("table", null, [el("caption", { text: caption }), el("thead", null, [thead]), tbody])
    ]);
    return el("div", null, [el("p", { "class": "hint", text: "Scorri di lato per vedere tutte le colonne." }), wrap]);
  }
  var colsSq = [
    { h: "Pos", v: function (r) { return r.pos; }, pos: true },
    { h: "Squadra", v: function (r) { return r.squadra; }, cls: "name", rowhead: 1 },
    { h: "G", t: "Partite giocate", n: true, v: function (r) { return r.partite; } },
    { h: "Punti", n: true, cls: "pts", v: function (r) { return r.punti; } },
    { h: "Set", n: true, v: function (r) { return r.sets; } },
    { h: "Leg", n: true, v: function (r) { return r.legs; } }
  ];
  var colsGi = [
    { h: "Pos", v: function (r) { return r.pos; }, pos: true },
    { h: "Giocatore", v: function (r) { return r.nome; }, cls: "name", rowhead: 1 },
    { h: "G", t: "Partite giocate", n: true, v: function (r) { return r.partite; } },
    { h: "Punti", n: true, cls: "pts", v: function (r) { return r.punti; } },
    { h: "Set", n: true, v: function (r) { return r.sets; } },
    { h: "Leg", n: true, v: function (r) { return r.legs; } },
    { h: "Media", n: true, v: function (r) { return r.media; } }
  ];
  var colsSg = [
    { h: "Pos", v: function (r) { return r.pos; }, pos: true },
    { h: "Giocatore", v: function (r) { return r.nome; }, cls: "name", rowhead: 1 },
    { h: "Zona", v: function (r) { return r.zona || ""; } },
    { h: "Punti", n: true, cls: "pts", v: function (r) { return r.punti; } },
    { h: "Partite", n: true, v: function (r) { return r.partite; } },
    { h: "Media", n: true, v: function (r) { return r.media; } },
    { h: "Tessera", n: true, v: function (r) { return r.tessera || ""; } }
  ];
  function colsCal() {
    return [
      { h: "Data", v: function (r) { return r.data; } },
      { h: "Casa", cls: "name", v: function (r) { return r.casa; } },
      { h: "Set", n: true, cls: "score", v: function (r) { return r.played ? r.setsCasa + " - " + r.setsOsp : "da giocare"; } },
      { h: "Ospiti", cls: "name", v: function (r) { return r.ospiti; } },
      { h: "Punti", n: true, cls: "score", t: "Punti in classifica", v: function (r) { return r.played ? r.ptCasa + " - " + r.ptOsp : "-"; } },
      { h: "Locale", v: function (r) { return r.locale; } }
    ];
  }

  function filt(rows, fields) {
    var t = P.norm(q.value.trim()); if (!t) return rows;
    return rows.filter(function (r) { return fields.some(function (f) { return P.norm(r[f]).indexOf(t) >= 0; }); });
  }
  function status(n, total, noun) {
    count.textContent = n === total ? P.plural(n, noun[0], noun[1]) : n + " di " + total + " " + noun[1] + " (filtro attivo)";
  }

  /* ---------- render pannello campionato ---------- */
  function render() {
    var c = camp.campionati[S.c];
    P.clear(panel);
    var tab = $("tab-" + S.tab);
    panel.setAttribute("aria-labelledby", tab.id);
    $("cats").hidden = S.tab !== "sq";
    var name = c.nome;
    if (S.tab === "sq") {
      var all = (c.classificaSquadre && c.classificaSquadre[S.cat]) || [];
      var rows = filt(all, ["squadra"]);
      if (!all.length) { count.textContent = ""; panel.appendChild(P.empty("Classifica non disponibile", "Nessun dato per la categoria " + S.cat + " in " + name + ".")); return; }
      status(rows.length, all.length, ["squadra", "squadre"]);
      if (!rows.length) { panel.appendChild(P.empty("Nessun risultato", "Nessuna squadra corrisponde alla ricerca.")); return; }
      panel.appendChild(table("Classifica squadre, categoria " + S.cat + " - " + name, colsSq, rows.map(function (r) { return Object.assign({ p: r.pos }, r); }), !q.value.trim()));
    } else if (S.tab === "gi") {
      var gi = c.classificaGiocatori || [];
      var rg = filt(gi, ["nome"]);
      if (!gi.length) { count.textContent = ""; panel.appendChild(P.empty("Classifica giocatori non disponibile", "Nessun dato per " + name + ".")); return; }
      status(rg.length, gi.length, ["giocatore", "giocatori"]);
      if (!rg.length) { panel.appendChild(P.empty("Nessun risultato", "Nessun giocatore corrisponde alla ricerca.")); return; }
      panel.appendChild(table("Classifica giocatori - " + name, colsGi, rg.map(function (r) { return Object.assign({ p: r.pos }, r); }), !q.value.trim()));
      panel.appendChild(el("p", { "class": "note" }, ["La classifica giocatori non e divisa per categoria. ", P.tbc()]));
    } else {
      var ca = c.calendario || [];
      if (!ca.length) { count.textContent = ""; panel.appendChild(P.empty("Calendario non disponibile", "Nessuna partita per " + name + ".")); return; }
      var rc = filt(ca, ["casa", "ospiti", "locale", "data"]);
      status(rc.length, ca.length, ["partita", "partite"]);
      if (!rc.length) { panel.appendChild(P.empty("Nessun risultato", "Nessuna partita corrisponde alla ricerca.")); return; }
      var out = [], last = null;
      rc.slice().sort(function (a, b) { return (+a.g - +b.g) || ((P.parseDate(a.data) || {}).ts - (P.parseDate(b.data) || {}).ts); })
        .forEach(function (r) {
          if (r.g !== last) { out.push({ group: "Giornata " + (+r.g + 1) }); last = r.g; }
          var d = P.parseDate(r.data);
          out.push(Object.assign({ played: r.setsCasa !== "" && r.setsOsp !== "" }, r, { data: d ? ("0" + d.d).slice(-2) + "/" + ("0" + d.m).slice(-2) + "/" + d.y + (d.time ? " " + d.time : "") : r.data }));
        });
      panel.appendChild(table("Calendario e risultati - " + name, colsCal(), out, false));
      panel.appendChild(el("p", { "class": "note" }, ["Il calendario non indica la categoria delle partite. ", P.tbc()]));
    }
  }

  /* ---------- selettori ---------- */
  function drawChamps() {
    var box = P.clear($("champs"));
    IDS.forEach(function (id) {
      var c = camp.campionati[id]; if (!c) return;
      var on = c.stato === "In corso";
      box.appendChild(el("button", { type: "button", "class": "chip", "aria-pressed": String(id === S.c), "data-id": id }, [
        c.nome, el("span", { "class": "tag" + (on ? " on" : ""), text: c.stato })
      ]));
    });
  }
  function drawCats() {
    var box = P.clear($("cats"));
    CATS.forEach(function (k) {
      box.appendChild(el("button", { type: "button", "class": "chip", "aria-pressed": String(k === S.cat), "data-cat": k, text: k === "Mix" ? "Mix" : "Cat. " + k }));
    });
  }
  function drawState() {
    var c = camp.campionati[S.c], t = $("champ-state");
    t.textContent = c.stato; t.className = "tag" + (c.stato === "In corso" ? " on" : "");
    $("h-team").textContent = c.nome;
    document.title = c.nome + " | Campionato | PSD Promotion Soft Darts";
  }
  function sync() {
    try { history.replaceState(null, "", "?c=" + S.c); } catch (e) {}
  }

  /* ---------- singolo ---------- */
  var sq = $("sq"), sp = $("spanel"), sc = $("scount"), sCat = null;
  function renderSing() {
    P.clear(sp);
    var all = sing.categorie[sCat] || [];
    var t = P.norm(sq.value.trim());
    var rows = t ? all.filter(function (r) { return P.norm(r.nome).indexOf(t) >= 0; }) : all;
    if (!all.length) { sc.textContent = ""; sp.appendChild(P.empty("Classifica non disponibile", "Nessun dato per la categoria " + sCat + ".")); return; }
    sc.textContent = rows.length === all.length ? P.plural(all.length, "giocatore", "giocatori") : rows.length + " di " + all.length + " giocatori (filtro attivo)";
    if (!rows.length) { sp.appendChild(P.empty("Nessun risultato", "Nessun giocatore corrisponde alla ricerca.")); return; }
    sp.appendChild(table("Classifica singolo, categoria " + sCat, colsSg, rows.map(function (r) { return Object.assign({ p: r.pos }, r); }), !t));
  }
  function initSing() {
    var list = $("stabs");
    Object.keys(sing.categorie).forEach(function (k, i) {
      list.appendChild(el("button", { "class": "tab", role: "tab", type: "button", id: "stab-" + i, "aria-controls": "spanel", "data-k": k, text: /^Donne/.test(k) ? k : "Categoria " + k }));
    });
    var api = P.tabs(list, function (tab) { sCat = tab.dataset.k; sp.setAttribute("aria-labelledby", tab.id); renderSing(); });
    api.select(api.tabs()[0]);
    sq.addEventListener("input", P.debounce(renderSing));
  }

  /* ---------- eventi UI ---------- */
  $("champs").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-id]"); if (!b) return;
    S.c = b.dataset.id; drawChamps(); drawState(); sync(); render();
    var nb = $("champs").querySelector('[data-id="' + S.c + '"]'); if (nb) nb.focus();
  });
  $("cats").addEventListener("click", function (e) {
    var b = e.target.closest("button[data-cat]"); if (!b) return;
    S.cat = b.dataset.cat; drawCats(); render();
    var nb = $("cats").querySelector('[data-cat="' + S.cat + '"]'); if (nb) nb.focus();
  });
  q.addEventListener("input", P.debounce(render));

  tabsApi = P.tabs($("tabs"), function (tab) { S.tab = tab.dataset.k; if (camp) render(); });
  tabsApi.select($("tab-sq"));

  Promise.all([P.load("campionati"), P.load("singolo")]).then(function (r) {
    camp = r[0]; sing = r[1];
    P.setUpdated(camp.aggiornato);
    var want = new URLSearchParams(location.search).get("c");
    if (want && camp.campionati[want]) S.c = want;
    else if (!camp.campionati[S.c]) S.c = Object.keys(camp.campionati)[0];
    drawChamps(); drawCats(); drawState(); render(); initSing();
  }).catch(function () { P.error(panel, "i campionati"); P.error(sp, "la classifica singolo"); });
})();
