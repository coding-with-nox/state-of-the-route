(function () {
  "use strict";
  var P = window.PSD, el = P.el;
  var cards = document.getElementById("camp-cards");
  var next = document.getElementById("next-list");
  Promise.all([P.load("home"), P.load("campionati")]).then(function (r) {
    var home = r[0], camp = r[1];
    P.setUpdated(home.aggiornato);
    P.applyRegs(home.regolamenti);
    P.clear(next);
    (home.prossimiTornei || []).forEach(function (t) {
      var d = P.parseDate(t.data);
      next.appendChild(el("li", { "class": "ev" }, [
        el("div", { "class": "date" }, [el("small", { text: d ? d.mon : "" }), el("b", { text: d ? d.d : "?" })]),
        el("div", { "class": "what" }, [el("h3", { text: t.nome }), el("p", { text: (d && d.time ? "ore " + d.time + " - " : "") + (t.locale || "") })])
      ]));
    });
    if (!next.firstChild) next.appendChild(el("li", null, [P.empty("Nessun torneo in programma")]));
    if (home.sponsor) {
      var s = document.getElementById("sponsor");
      s.appendChild(document.createTextNode("Sponsor: "));
      s.appendChild(el("a", { href: home.sponsor.url, rel: "noopener" }, home.sponsor.nome));
    }
    P.clear(cards);
    ["25", "11", "3"].forEach(function (id) {
      var c = camp.campionati[id]; if (!c) return;
      var A = (c.classificaSquadre && c.classificaSquadre.A) || [];
      var lead = A[0];
      var on = c.stato === "In corso";
      cards.appendChild(el("article", { "class": "card" + (on ? " hl" : "") }, [
        el("span", { "class": "tag" + (on ? " on" : ""), text: c.stato }),
        el("h3", { text: c.nome }),
        lead ? el("p", { "class": "muted" }, ["Prima in categoria A: ", el("b", { text: lead.squadra })]) : P.empty("Classifica non disponibile"),
        lead ? el("p", { "class": "big" }, [lead.punti, el("small", { text: " punti" })]) : null,
        lead ? el("p", { "class": "muted", text: lead.partite + " partite giocate" }) : null,
        el("a", { "class": "btn " + (on ? "btn-line" : "btn-ghost"), href: "campionato.html?c=" + id, "aria-label": "Apri " + c.nome }, "Apri classifiche")
      ]));
    });
  }).catch(function () { P.error(cards, "i campionati"); P.error(next, "i tornei"); });
})();
