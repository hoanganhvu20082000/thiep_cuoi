(function () {
  "use strict";
  const W = window.WEDDING;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");

  // --- Text bindings (ẩn phần tử nếu trống) ---
  document.querySelectorAll("[data-bind]").forEach((el) => {
    const v = W[el.dataset.bind];
    if (v) el.textContent = v; else if (el.tagName === "P") el.hidden = true;
  });
  $("#hero-photo").src = W.heroPhoto;

  // --- Nhạc nền: tự phát, không nút ---
  // Trình duyệt chặn phát có tiếng khi khách chưa tương tác, nên: thử phát ngay,
  // nếu bị chặn thì phát ở lần chạm / cuộn / bấm phím đầu tiên.
  (() => {
    if (!W.musicFile && !W.musicYoutubeId) return;
    let started = false, ready = false, play = () => {};
    const kick = () => { if (!started) play(); };
    const unlock = () => {
      kick();
      if (started) ["pointerdown", "touchstart", "keydown", "scroll", "wheel"].forEach((ev) => removeEventListener(ev, unlock));
    };
    ["pointerdown", "touchstart", "keydown", "scroll", "wheel"].forEach((ev) => addEventListener(ev, unlock, { passive: true }));

    if (W.musicFile) {
      const audio = Object.assign(new Audio(W.musicFile), { loop: true, volume: 0.6, preload: "auto" });
      play = () => audio.play().then(() => (started = true)).catch(() => {});
      play();
      return;
    }

    // YouTube IFrame API (embed chính chủ, cho phép nhúng)
    let yt;
    play = () => {
      if (!ready) return;
      yt.unMute(); yt.setVolume(70); yt.playVideo();
    };
    window.onYouTubeIframeAPIReady = () => {
      yt = new YT.Player("music-player", {
        videoId: W.musicYoutubeId, width: 200, height: 120,
        playerVars: { autoplay: 1, start: W.musicStart || 0, playsinline: 1, controls: 0, rel: 0, loop: 1, playlist: W.musicYoutubeId },
        events: {
          onReady: () => { ready = true; play(); },
          onStateChange: (e) => {
            if (e.data === YT.PlayerState.PLAYING && !yt.isMuted()) started = true;
            if (e.data === YT.PlayerState.ENDED) { yt.seekTo(W.musicStart || 0); yt.playVideo(); }
          }
        }
      });
    };
    const s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  })();

  // --- Story player: tự chạy từng cảnh như 1 clip ngắn ---
  (() => {
    const slides = [...document.querySelectorAll(".slide")];
    if (!slides.length) return;
    const bars = [...document.querySelectorAll(".player__bars span")];
    const toggle = $("#player-toggle");
    const DURATION = 5500;
    let idx = 0, playing = true, started = 0, elapsed = 0, raf = 0;

    const go = (i) => {
      slides[idx].classList.remove("is-active");
      slides[idx].setAttribute("aria-hidden", "true");
      idx = (i + slides.length) % slides.length;
      const s = slides[idx];
      // Reset animation trong cảnh để chạy lại từ đầu
      s.classList.remove("is-active"); void s.offsetWidth; s.classList.add("is-active");
      s.setAttribute("aria-hidden", "false");
      bars.forEach((b, j) => { b.classList.toggle("done", j < idx); b.firstChild.style.width = j < idx ? "100%" : "0"; });
      $("#player-no").textContent = `${idx + 1}/${slides.length}`;
      $("#player-title").textContent = s.dataset.title;
      $("#player-text").textContent = s.dataset.caption;
      const cap = $(".player__caption"); cap.classList.remove("swap"); void cap.offsetWidth; cap.classList.add("swap");
      elapsed = 0; started = performance.now();
    };
    const frame = (t) => {
      if (playing) {
        const p = Math.min(1, (elapsed + t - started) / DURATION);
        bars[idx].firstChild.style.width = `${p * 100}%`;
        if (p >= 1) go(idx + 1);
      }
      raf = requestAnimationFrame(frame);
    };
    const setPlaying = (v) => {
      if (v === playing) return;
      if (v) started = performance.now(); else elapsed += performance.now() - started;
      playing = v;
      toggle.textContent = v ? "❚❚" : "▶";
      toggle.setAttribute("aria-label", v ? "Tạm dừng" : "Phát");
    };

    $("#player").addEventListener("click", (e) => {
      const act = e.target.closest("[data-act]")?.dataset.act;
      if (act === "prev") go(idx - 1);
      else if (act === "next") go(idx + 1);
      else if (act === "toggle") setPlaying(!playing);
    });
    let sx = 0;
    const stage = $(".player__stage");
    stage.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
    stage.addEventListener("touchend", (e) => {
      const dx = e.changedTouches[0].clientX - sx;
      if (Math.abs(dx) > 40) go(idx + (dx < 0 ? 1 : -1));
    });

    // Chỉ chạy khi người xem cuộn tới; tôn trọng reduced-motion
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    playing = false;
    go(0);
    if (reduce) { toggle.textContent = "▶"; toggle.setAttribute("aria-label", "Phát"); }
    new IntersectionObserver(([en]) => { if (!reduce) setPlaying(en.isIntersecting); }, { threshold: 0.5 }).observe($("#player"));
    raf = requestAnimationFrame(frame);
  })();

  // --- Families ---
  const fam = (f, name) => `
    <h3>${esc(f.title)}</h3>
    ${f.father ? `<p>Ông ${esc(f.father)}</p>` : ""}
    ${f.mother ? `<p>Bà ${esc(f.mother)}</p>` : ""}
    ${f.place ? `<p class="place">${esc(f.place)}</p>` : ""}
    <p class="role">${esc(f.role)}</p>
    <p class="name">${esc(name)}</p>`;
  $("#family-groom").innerHTML = fam(W.groomFamily, W.groom);
  $("#family-bride").innerHTML = fam(W.brideFamily, W.bride);

  // --- Venue + map ---
  const v = W.venue;
  $("#venue-name").textContent = v.name;
  $("#venue-hall").textContent = v.hall; $("#venue-hall").hidden = !v.hall;
  $("#venue-address").textContent = v.address;
  const q = encodeURIComponent(`${v.mapQuery}, ${v.address}`);
  $("#venue-map").href = `https://www.google.com/maps/search/?api=1&query=${q}`;
  $("#map").src = `https://maps.google.com/maps?q=${q}&z=15&output=embed`;

  // --- Countdown ---
  const target = new Date(W.date).getTime();
  const tick = () => {
    const s = Math.max(0, Math.floor((target - Date.now()) / 1000));
    $("#cd-d").textContent = pad(Math.floor(s / 86400));
    $("#cd-h").textContent = pad(Math.floor((s % 86400) / 3600));
    $("#cd-m").textContent = pad(Math.floor((s % 3600) / 60));
    $("#cd-s").textContent = pad(s % 60);
  };
  tick(); setInterval(tick, 1000);

  // --- Calendar (Thứ 2 đầu tuần) ---
  (() => {
    const d = new Date(W.date), y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
    const first = (new Date(y, m, 1).getDay() + 6) % 7, total = new Date(y, m + 1, 0).getDate();
    let h = `<h3>Tháng ${m + 1} · ${y}</h3><div class="grid">`;
    ["T2", "T3", "T4", "T5", "T6", "T7", "CN"].forEach((x) => (h += `<div class="dow">${x}</div>`));
    for (let i = 0; i < first; i++) h += "<div></div>";
    for (let i = 1; i <= total; i++) h += `<div class="day${i === day ? " is-wedding" : ""}">${i}</div>`;
    $("#calendar").innerHTML = h + "</div>";
  })();

  // --- Album + lightbox ---
  const photos = W.album.map((n) => `assets/photos/${n}.jpg`);
  $("#album").innerHTML = photos.map((src, i) =>
    `<button type="button" class="reveal" data-i="${i}" aria-label="Mở ảnh ${i + 1}"><img src="${src}" alt="Ảnh cưới ${i + 1}" loading="lazy"></button>`).join("");
  const lb = $("#lightbox"), lbImg = $("#lightbox-img");
  let cur = 0;
  const show = (i) => { cur = (i + photos.length) % photos.length; lbImg.src = photos[cur]; lbImg.alt = `Ảnh cưới ${cur + 1}`; };
  $("#album").addEventListener("click", (e) => {
    const b = e.target.closest("button[data-i]");
    if (b) { show(+b.dataset.i); lb.showModal(); }
  });
  lb.addEventListener("click", (e) => {
    const a = e.target.dataset.lb;
    if (a === "close" || e.target === lb) lb.close();
    else if (a === "prev") show(cur - 1);
    else if (a === "next") show(cur + 1);
  });
  document.addEventListener("keydown", (e) => {
    if (!lb.open) return;
    if (e.key === "ArrowLeft") show(cur - 1);
    if (e.key === "ArrowRight") show(cur + 1);
  });
  let sx = 0;
  lb.addEventListener("touchstart", (e) => (sx = e.touches[0].clientX), { passive: true });
  lb.addEventListener("touchend", (e) => {
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) show(cur + (dx < 0 ? 1 : -1));
  });

  // --- RSVP + lời chúc ---
  // Có rsvpEndpoint (Google Apps Script) → lưu/đọc từ Google Sheet, mọi khách đều thấy.
  // Không có → chỉ lưu localStorage trên máy khách (dùng khi xem thử local).
  const KEY = "wedding-wishes-vu-thao";
  const loadLocal = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
  let current = [];
  const render = () => {
    $("#wishes").innerHTML = current.filter((w) => w.message)
      .map((w) => `<li><b>${esc(w.name)}</b>: ${esc(w.message)}</li>`).join("");
  };
  (async () => {
    if (W.rsvpEndpoint) {
      try { current = (await (await fetch(W.rsvpEndpoint)).json()).wishes || []; }
      catch { current = []; }
    } else current = loadLocal().slice().reverse();
    render();
  })();

  $("#rsvp").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target, btn = form.querySelector("button[type=submit]");
    const fd = new FormData(form);
    const entry = {
      name: fd.get("name").trim(), message: fd.get("message").trim(),
      attend: fd.get("attend"), website: fd.get("website") || ""
    };
    if (!entry.name) return;
    const st = $("#rsvp-status");
    st.textContent = "Đang gửi…"; btn.disabled = true;
    try {
      if (W.rsvpEndpoint) {
        // no-cors: Apps Script vẫn nhận được dữ liệu, chỉ là không đọc được response
        await fetch(W.rsvpEndpoint, { method: "POST", mode: "no-cors", body: new URLSearchParams(entry) });
      } else {
        localStorage.setItem(KEY, JSON.stringify([...loadLocal(), entry]));
      }
    } catch {
      st.textContent = "Gửi chưa được, bạn thử lại nha."; btn.disabled = false; return;
    }
    btn.disabled = false;
    current = [{ name: entry.name, message: entry.message }, ...current];
    render(); form.reset();
    st.textContent = entry.attend === "yes" ? "Yay! Hẹn gặp bạn ngày vui nha 💕" : "Cảm ơn lời chúc của bạn nhiều lắm 💕";
  });

  // --- Hiện dần khi cuộn (kích hoạt animation trong từng chương) ---
  const io = new IntersectionObserver((ents) => ents.forEach((en) => {
    if (en.isIntersecting) { en.target.classList.add("is-visible"); io.unobserve(en.target); }
  }), { threshold: 0.25 });
  document.querySelectorAll(".reveal").forEach((el) => io.observe(el));
})();
