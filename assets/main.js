/* 内测招募页 · main.js v1.2 — vanilla JS，无依赖、无任何网络请求 */
(function () {
  "use strict";
  var CFG = window.SITE_CONFIG || { brandName: "栖灵", pageVersion: "v1.3" };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 品牌名：唯一来源 assets/config.js */
  $$("[data-brand]").forEach(function (el) { el.textContent = CFG.brandName; });
  document.title = CFG.brandName + " · 一个角色，持续生长的内容";
  $("#ver").textContent = CFG.pageVersion || "v1.3";
  // 仅在真实配置后渲染联系方式/隐私链接，绝不伪造
  var fc = $("#footContact"), parts = [];
  if (CFG.contactEmail) parts.push('<a href="mailto:' + CFG.contactEmail + '">' + CFG.contactEmail + "</a>");
  if (CFG.privacyUrl) parts.push('<a href="' + CFG.privacyUrl + '">隐私说明</a>');
  if (parts.length) fc.innerHTML = parts.join(" · ") + " · ";

  /* 导航 */
  var nav = $(".nav"), links = $("#navLinks"), menuBtn = $("#menuBtn");
  addEventListener("scroll", function () { nav.classList.toggle("scrolled", scrollY > 8); }, { passive: true });
  menuBtn.addEventListener("click", function () {
    var open = links.classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.setAttribute("aria-label", open ? "关闭菜单" : "打开菜单");
  });
  $$("a", links).forEach(function (a) { a.addEventListener("click", function () { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "打开菜单"); }); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("open")) { links.classList.remove("open"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "打开菜单"); } });
  var spyLinks = $$("#navLinks a[href^='#']");
  if ("IntersectionObserver" in window) {
    var spyObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = "#" + entry.target.id;
        spyLinks.forEach(function (a) { a.classList.toggle("is-active", a.getAttribute("href") === id); });
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    spyLinks.forEach(function (a) { var sec = document.querySelector(a.getAttribute("href")); if (sec) spyObs.observe(sec); });
  }

  /* 申请内测：打开演示表单对话框（无 JS 时锚点跳到 #early-access） */
  var dlg = $("#applyDlg");
  $$("[data-apply]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      if (!dlg.showModal) return;
      e.preventDefault(); dlg.showModal(); $("#email").focus();
    });
  });
  $("#dlgClose").addEventListener("click", function () { dlg.close(); });
  dlg.addEventListener("click", function (e) { if (e.target === dlg) dlg.close(); });

  /* 演示表单：MOCK ONLY — 不发送、不存储。保留输入，不显示虚假成功。 */
  $("#waitlist").addEventListener("submit", function (e) {
    e.preventDefault();
    var email = $("#email"), consent = $("#consent");
    var okMail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value.trim());
    $("#emailErr").textContent = okMail ? "" : "请填写有效邮箱";
    email.setAttribute("aria-invalid", String(!okMail));
    $("#consentErr").textContent = consent.checked ? "" : "请阅读并确认隐私说明后再提交";
    var st = $("#formStatus"); st.classList.remove("show");
    if (!okMail) return email.focus();
    if (!consent.checked) return consent.focus();
    var btn = $("#submitBtn"); btn.disabled = true; btn.textContent = "正在校验…";
    setTimeout(function () {
      btn.disabled = false; btn.textContent = "提交内测申请（演示）";
      st.textContent = "演示模式：格式校验已通过，但申请尚未开放——没有任何信息被发送或保存。";
      st.classList.add("show");
    }, 400);
  });

  /* 衍生视频：静音循环 0:02–0:06；播放键 = 开声从头完整播放 / 暂停 */
  var v = $("#ocVideo"), playBtn = $("#playBtn"), sndBtn = $("#soundBtn");
  var A = 2, B = 6, full = false;
  function sync() {
    playBtn.innerHTML = '<svg aria-hidden="true"><use href="#i-' + (v.paused ? "play" : "pause") + '"/></svg>';
    playBtn.setAttribute("aria-label", v.paused ? "播放视频" : "暂停视频");
    sndBtn.textContent = v.muted ? "声音：关" : "声音：开";
    sndBtn.setAttribute("aria-pressed", String(!v.muted));
  }
  v.addEventListener("loadedmetadata", function () { if (!full && v.duration > B) v.currentTime = A; });
  v.addEventListener("timeupdate", function () { if (!full && v.currentTime >= B) v.currentTime = A; });
  v.addEventListener("play", sync); v.addEventListener("pause", sync); v.addEventListener("volumechange", sync);
  if (reduce) { v.removeAttribute("autoplay"); v.pause(); }
  playBtn.addEventListener("click", function () {
    if (!full) { full = true; v.muted = false; v.currentTime = 0; v.play().catch(function () {}); }
    else if (v.paused) v.play().catch(function () {}); else v.pause();
  });
  sndBtn.addEventListener("click", function () {
    v.muted = !v.muted;
    if (!v.muted && !full) { full = true; v.currentTime = 0; v.play().catch(function () {}); }
  });
  if ("IntersectionObserver" in window) new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (!e.isIntersecting && !v.paused) v.pause(); else if (e.isIntersecting && v.paused && !full && !reduce) v.play().catch(function () {}); });
  }, { threshold: .25 }).observe(v);
  sync();

  /* 轻量淡入 */
  var rev = $$(".reveal");
  if (reduce || !("IntersectionObserver" in window) || /[?&]static\b/.test(location.search)) rev.forEach(function (el) { el.classList.add("in"); });
  else { var io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }); }, { rootMargin: "0px 0px -8% 0px" }); rev.forEach(function (el) { io.observe(el); }); }
})();
