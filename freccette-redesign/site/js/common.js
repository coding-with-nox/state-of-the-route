/* PSD prototipo - utilita condivise. Vanilla, nessuna dipendenza. */
(function () {
  "use strict";
  var P = (window.PSD = {});
  var MESI = ["Gennaio","Febbraio","Marzo","Aprile","Maggio","Giugno","Luglio","Agosto","Settembre","Ottobre","Novembre","Dicembre"];
  var MESI_BREVI = ["gen","feb","mar","apr","mag","giu","lug","ago","set","ott","nov","dic"];
  P.MESI = MESI;

  /* el("div", {class:"x", "aria-label":"y"}, [figli o testo]) - usa sempre textContent */
  P.el = function (tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
      if (k === "text") n.textContent = attrs[k]; else n.setAttribute(k, attrs[k] === true ? "" : attrs[k]);
    });
    (kids == null ? [] : [].concat(kids)).forEach(function (c) {
      if (c == null || c === false) return;
      n.appendChild(typeof c === "object" ? c : document.createTextNode(String(c)));
    });
    return n;
  };
  P.tbc = function (t) { return P.el("span", { "class": "tbc", text: t || "[DA CONFERMARE]" }); };
  P.clear = function (n) { while (n.firstChild) n.removeChild(n.firstChild); return n; };

  P.load = function (name) {
    return fetch("data/" + name + ".json").then(function (r) {
      if (!r.ok) throw new Error(name + " " + r.status);
      return r.json();
    });
  };
  P.error = function (target, what) {
    P.clear(target).appendChild(P.el("div", { "class": "empty", role: "alert" }, [
      P.el("h3", { text: "Dati non disponibili" }),
      P.el("p", null, ["Impossibile caricare " + what + ". Riprova piu tardi. ", P.tbc()])
    ]));
  };
  P.empty = function (title, msg) {
    return P.el("div", { "class": "empty" }, [P.el("h3", { text: title }), P.el("p", null, [msg ? msg + " " : "", P.tbc()])]);
  };

  /* "30/10/2026, 20:00" -> {d,m,y,hh,mm,ts} */
  P.parseDate = function (s) {
    var m = /(\d{1,2})\/(\d{1,2})\/(\d{4})(?:,?\s*(\d{1,2}):(\d{2}))?/.exec(s || "");
    if (!m) return null;
    var o = { d: +m[1], m: +m[2], y: +m[3], hh: m[4] || "", mm: m[5] || "" };
    o.ts = new Date(o.y, o.m - 1, o.d, +(o.hh || 0), +(o.mm || 0)).getTime();
    o.time = o.hh ? ("0" + o.hh).slice(-2) + ":" + o.mm : "";
    o.mon = MESI_BREVI[o.m - 1];
    o.key = o.y * 100 + o.m;
    return o;
  };
  P.fmtISO = function (iso) {
    var m = /(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
    return m ? m[3] + "/" + m[2] + "/" + m[1] : "[DA CONFERMARE]";
  };
  P.setUpdated = function (iso) {
    [].forEach.call(document.querySelectorAll("[data-updated]"), function (t) {
      t.textContent = P.fmtISO(iso);
      if (iso) t.setAttribute("datetime", iso);
    });
  };
  P.norm = function (s) {
    return String(s == null ? "" : s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  };
  P.debounce = function (fn, ms) {
    var t; return function () { var a = arguments, c = this; clearTimeout(t); t = setTimeout(function () { fn.apply(c, a); }, ms || 120); };
  };
  P.plural = function (n, one, many) { return n + " " + (n === 1 ? one : many); };

  /* Tabs accessibili (ARIA tablist) con frecce, Home, End. Le tab sono <button role=tab>. */
  P.tabs = function (list, onSelect) {
    var tabs = function () { return [].slice.call(list.querySelectorAll("[role=tab]")); };
    function select(tab, focus) {
      tabs().forEach(function (t) {
        var on = t === tab;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      onSelect(tab);
    }
    list.addEventListener("click", function (e) {
      var t = e.target.closest("[role=tab]"); if (t && list.contains(t)) select(t);
    });
    list.addEventListener("keydown", function (e) {
      var all = tabs(), i = all.indexOf(document.activeElement), n = -1;
      if (i < 0) return;
      if (e.key === "ArrowRight") n = (i + 1) % all.length;
      else if (e.key === "ArrowLeft") n = (i - 1 + all.length) % all.length;
      else if (e.key === "Home") n = 0;
      else if (e.key === "End") n = all.length - 1;
      if (n < 0) return;
      e.preventDefault(); select(all[n], true);
    });
    return { select: select, tabs: tabs };
  };

  /* Menu mobile + altezza header per elementi sticky */
  function initMenu() {
    var btn = document.querySelector(".menu-btn"), nav = document.getElementById("menu");
    var header = document.querySelector(".site-header");
    if (header) {
      var setH = function () { document.documentElement.style.setProperty("--hh", header.offsetHeight + "px"); };
      setH(); window.addEventListener("resize", setH);
    }
    if (!btn || !nav) return;
    var mq = window.matchMedia("(min-width:860px)");
    function set(open) {
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      nav.hidden = !open && !mq.matches;
      if (header) document.documentElement.style.setProperty("--hh", header.offsetHeight + "px");
    }
    btn.hidden = false;
    set(false);
    btn.addEventListener("click", function () { set(btn.getAttribute("aria-expanded") !== "true"); });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && btn.getAttribute("aria-expanded") === "true") { set(false); btn.focus(); }
    });
    (mq.addEventListener ? mq.addEventListener.bind(mq, "change") : mq.addListener.bind(mq))(function () { set(false); });
    /* chiude "Varie" con Esc o click fuori */
    var det = nav.querySelector("details");
    if (det) {
      document.addEventListener("click", function (e) { if (!det.contains(e.target)) det.open = false; });
      det.addEventListener("keydown", function (e) { if (e.key === "Escape") { det.open = false; det.querySelector("summary").focus(); e.stopPropagation(); } });
    }
  }
  /* aggiorna anche i link regolamenti se il JSON ne ha di piu recenti */
  P.applyRegs = function (regs) {
    if (!regs) return;
    [].forEach.call(document.querySelectorAll("a[data-reg]"), function (a) { if (regs[a.dataset.reg]) a.href = regs[a.dataset.reg]; });
  };
  initMenu();
})();
