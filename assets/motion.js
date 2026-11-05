// Motion layer: loader, cinematic hero, driving car on scroll, reveals, counters, magnetic buttons.
// Without GSAP (offline) or with reduced motion the page stays fully usable and static.
(() => {
  const body = document.body;
  const loader = document.getElementById("loader");
  // Reduced motion keeps scroll-linked animation (it follows the user's own scrolling)
  // but drops the loader, rain and idle loops. ?motion=full forces everything for demos.
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches && !location.search.includes("motion=full");
  const finish = () => { body.classList.remove("is-loading"); loader?.remove(); };
  if (!window.gsap) { finish(); return; }
  if (reduce) { finish(); body.classList.add("calm"); }
  // Safety net: a paused tab or slow device never leaves the visitor behind the curtain
  setTimeout(() => { if (document.getElementById("loader")) gsap.to("#loader", { opacity: 0, duration: 0.4, onComplete: finish }); }, 5000);

  gsap.registerPlugin(ScrollTrigger);
  const desktop = matchMedia("(min-width: 921px)").matches;
  const fine = matchMedia("(pointer: fine)").matches;

  // Copy the logo car into the loader and the road (a <use> would inherit the hero outline animation)
  const carShape = document.getElementById("car-shape")?.innerHTML || "";
  document.querySelectorAll(".loader-car, .road-car svg").forEach(s => { s.innerHTML = carShape; });

  // Smooth scroll
  let lenis = null;
  if (window.Lenis && fine && !reduce) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    document.addEventListener("click", e => {
      const a = e.target.closest('a[href^="#"]');
      const id = a?.getAttribute("href");
      if (!id || id === "#") return;
      const el = document.querySelector(id);
      if (el) { e.preventDefault(); lenis.scrollTo(el, { offset: -80, duration: 1.4 }); }
    });
  }

  // Hero headline: split into words, last two words in brand yellow
  const h1 = document.querySelector("[data-split]");
  if (h1) {
    const words = h1.textContent.trim().split(/\s+/);
    h1.innerHTML = words.map((w, i) => `<span class="w${i >= words.length - 2 ? " hl" : ""}"><span>${w}</span></span>`).join(" ");
  }

  // Hero outline is driven by GSAP instead of the CSS keyframes
  const heroPaths = document.querySelectorAll(".hero-car path");
  heroPaths.forEach(p => { p.style.animation = "none"; });
  gsap.set(heroPaths, { strokeDashoffset: 1, fill: "rgba(254,200,0,0)" });

  // Loader wordmark: every letter gets its own span so letters can rise in and leave one by one
  document.querySelectorAll(".loader-word > span, .loader-sub").forEach(el => {
    el.innerHTML = [...el.textContent].map(c => `<span class="ch">${c === " " ? "&nbsp;" : c}</span>`).join("");
  });
  const letters = ".loader-word .ch", subLetters = ".loader-sub .ch";

  // Intro: loader draws the car and spells ЮРЭКСПЕРТ, then everything leaves and the curtain lifts
  const intro = gsap.timeline({ defaults: { ease: "power3.out" } });
  if (reduce) intro.timeScale(3);
  if (!reduce) intro
    .to(".loader-car path", { strokeDashoffset: 0, duration: 1.1, stagger: 0.07, ease: "power2.inOut" })
    .from(letters, { yPercent: 120, opacity: 0, rotateX: -80, duration: 0.6, stagger: 0.06, ease: "back.out(2)" }, 0.25)
    .from(subLetters, { yPercent: 110, opacity: 0, duration: 0.4, stagger: 0.015 }, 0.8)
    .to(".loader-bar i", { width: "100%", duration: 1.5, ease: "power1.inOut" }, 0)
    .to(".loader-car path", { fill: "#FEC800", duration: 0.35 }, 1.25)
    .to(".lw-sig .ch", { textShadow: "0 0 18px rgba(254,200,0,.8)", duration: 0.3, stagger: 0.03, yoyo: true, repeat: 1 }, 1.3)
    .to(letters, { yPercent: -120, opacity: 0, duration: 0.45, stagger: 0.04, ease: "power3.in" }, 2.0)
    .to(subLetters, { yPercent: -110, opacity: 0, duration: 0.3, stagger: 0.01, ease: "power3.in" }, 2.0)
    .to(".loader-bar", { scaleX: 0, opacity: 0, duration: 0.4, ease: "power3.in" }, 2.1)
    .to(".loader-car", { x: "60vw", duration: 0.7, ease: "power3.in" }, 2.15)
    .to(".loader", { yPercent: -100, duration: 0.8, ease: "power4.inOut" }, "<+0.3")
    .add(() => finish());
  intro
    .from(".hero-bg", { scale: 1.25, duration: 2.2, ease: "power2.out" }, "<+0.2")
    .from(".hero-dark h1 .w > span", { yPercent: 110, duration: 0.9, stagger: 0.045 }, "<+0.1")
    .from(".hero-dark .lead, .hero-actions > *, .trust > div", { y: 26, opacity: 0, duration: 0.7, stagger: 0.07 }, "<+0.45")
    .to(heroPaths, { strokeDashoffset: 0, duration: 1.8, stagger: 0.1, ease: "power2.inOut" }, "<+0.2")
    .to(heroPaths, { fill: "rgba(254,200,0,.5)", duration: 0.8 }, ">-0.4");

  // Generated Flow video replaces the still once it can play; a missing file keeps the still
  const vid = document.getElementById("hero-video");
  if (vid) {
    if (reduce) vid.remove();
    else {
      vid.addEventListener("canplay", () => { vid.classList.add("on"); vid.play().catch(() => {}); }, { once: true });
      vid.addEventListener("error", () => vid.remove(), { once: true });
    }
  }

  // Case card flies in and replays the numbers when it reaches the screen
  gsap.from(".meter", {
    y: 80, rotateX: 14, opacity: 0, duration: 1.1, ease: "power3.out", transformPerspective: 1200,
    scrollTrigger: { trigger: ".cases-sec", start: "top 65%", once: true, onEnter: () => setTimeout(() => document.querySelector(".cases button")?.click(), 300) }
  });

  // Counters
  document.querySelectorAll("[data-count]").forEach(el => {
    const to = Number(el.dataset.count), from = Number(el.dataset.from || 0), dec = Number(el.dataset.dec || 0);
    const o = { v: from };
    gsap.to(o, {
      v: to, duration: 1.8, ease: "power2.out", delay: 2.4,
      onUpdate: () => { el.textContent = o.v.toLocaleString("ru-RU", { minimumFractionDigits: dec, maximumFractionDigits: dec }).replace(/\s/g, "") ; }
    });
  });

  // Hero: cursor glow, parallax, 3D tilt of the case card
  const hero = document.querySelector(".hero-dark");
  if (hero && fine) {
    const glowX = gsap.quickTo(".hero-glow", "x", { duration: 0.6 }), glowY = gsap.quickTo(".hero-glow", "y", { duration: 0.6 });
    const bgX = gsap.quickTo(".hero-bg", "x", { duration: 1.2 }), bgY = gsap.quickTo(".hero-bg", "y", { duration: 1.2 });
    hero.addEventListener("mousemove", e => {
      const r = hero.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      glowX(e.clientX - r.left); glowY(e.clientY - r.top);
      bgX(nx * -30); bgY(ny * -20);
    });
    // The case card tilts toward the cursor
    const meter = document.querySelector(".meter");
    meter?.addEventListener("mousemove", e => {
      const r = meter.getBoundingClientRect(), nx = (e.clientX - r.left) / r.width - 0.5, ny = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(meter, { rotateY: nx * 8, rotateX: ny * -6, transformPerspective: 1000, duration: 0.5 });
    });
    meter?.addEventListener("mouseleave", () => gsap.to(meter, { rotateY: 0, rotateX: 0, duration: 0.8 }));
  } else gsap.set(".hero-glow", { display: "none" });

  // Hero scroll-out: background sinks, content lifts and fades
  gsap.to(".hero-bg img", { yPercent: 12, ease: "none", scrollTrigger: { trigger: ".hero-dark", start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-dark .wrap", { y: -80, opacity: 0.2, ease: "none", scrollTrigger: { trigger: ".hero-dark", start: "center top", end: "bottom top", scrub: true } });

  // Header switches to dark while over the hero
  const top = document.querySelector(".top");
  ScrollTrigger.create({ trigger: ".hero-dark", start: "top 90px", end: "bottom 90px", toggleClass: { targets: top, className: "on-dark" } });

  // Rain and floating sparks on canvas
  const cv = document.getElementById("hero-fx");
  if (cv && !reduce) {
    const ctx = cv.getContext("2d");
    let w, h, drops, sparks;
    const size = () => {
      const dpr = Math.min(devicePixelRatio, 2);
      w = cv.clientWidth; h = cv.clientHeight; cv.width = w * dpr; cv.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drops = Array.from({ length: Math.round(w / 9) }, () => ({ x: Math.random() * w, y: Math.random() * h, l: 10 + Math.random() * 22, v: 7 + Math.random() * 9 }));
      sparks = Array.from({ length: 36 }, () => ({ x: Math.random() * w, y: Math.random() * h, r: 0.6 + Math.random() * 1.8, v: 0.2 + Math.random() * 0.5, p: Math.random() * 6 }));
    };
    size(); addEventListener("resize", size);
    let visible = true;
    ScrollTrigger.create({ trigger: ".hero-dark", start: "top bottom", end: "bottom top", onToggle: s => { visible = s.isActive; } });
    gsap.ticker.add(() => {
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = "rgba(200,210,225,.18)"; ctx.lineWidth = 1;
      ctx.beginPath();
      for (const d of drops) {
        ctx.moveTo(d.x, d.y); ctx.lineTo(d.x - d.l * 0.18, d.y + d.l);
        d.y += d.v; d.x -= d.v * 0.18;
        if (d.y > h) { d.y = -d.l; d.x = Math.random() * w * 1.2; }
      }
      ctx.stroke();
      for (const s of sparks) {
        s.y -= s.v; s.p += 0.03;
        if (s.y < -5) { s.y = h + 5; s.x = Math.random() * w; }
        ctx.fillStyle = `rgba(254,200,0,${0.25 + Math.sin(s.p) * 0.2})`;
        ctx.beginPath(); ctx.arc(s.x + Math.sin(s.p) * 6, s.y, s.r, 0, 7); ctx.fill();
      }
    });
  }

  // Marquee reacts to scroll speed
  const track = document.querySelector(".marquee-track");
  if (track) {
    ScrollTrigger.create({
      onUpdate: s => gsap.to(track, { skewX: gsap.utils.clamp(-8, 8, s.getVelocity() / -300), duration: 0.3, overwrite: true, onComplete: () => gsap.to(track, { skewX: 0, duration: 0.6 }) })
    });
  }

  // The road: the car drives through the six steps while the section is pinned
  const road = document.querySelector(".road");
  if (road) {
    const car = document.getElementById("road-car"), done = document.getElementById("road-done");
    const steps = [...document.querySelectorAll(".road-steps .step")];
    const dist = () => road.clientWidth - car.clientWidth;
    gsap.to(car, { y: -3, duration: 0.18, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.timeline({
      scrollTrigger: {
        trigger: ".road-sec", start: desktop ? "top top" : "top 70%", end: desktop ? "+=1600" : "bottom 60%",
        pin: desktop, scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: s => steps.forEach((st, i) => st.classList.toggle("lit", s.progress >= i / steps.length + 0.02))
      }
    })
      .fromTo(car, { x: -40 }, { x: () => dist(), ease: "none" }, 0)
      .fromTo(done, { width: 0 }, { width: () => dist() + 120, ease: "none" }, 0);
  }

  // Reveals for everything below the fold
  const reveal = (sel, vars = {}) => ScrollTrigger.batch(sel, {
    start: "top 88%", once: true,
    onEnter: els => gsap.from(els, { y: 50, opacity: 0, duration: 0.9, stagger: 0.08, ease: "power3.out", ...vars })
  });
  reveal("section h2, .section-head .lead");
  reveal(".chip", { x: -30, y: 0 });
  reveal(".answer", { scale: 0.96 });
  reveal(".price-col div, .price-col h3", { y: 24, duration: 0.6, stagger: 0.04 });
  reveal(".score, .quote", { y: 60, rotate: 1.5 });
  reveal(".app-feats li, .app .btn");
  reveal(".contact-list > div, .map, .form");
  reveal(".band p, .band .btn", { y: 30 });
  reveal("footer .wrap > div", { y: 30 });

  // Phone in the app section floats and the notification drops in
  gsap.to(".mini-phone", { y: -14, duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
  gsap.from(".mini-phone", { rotate: -14, y: 120, opacity: 0, duration: 1.2, ease: "power3.out", scrollTrigger: { trigger: ".app", start: "top 70%" } });
  gsap.from(".push", { y: -40, x: 40, opacity: 0, scale: 0.9, duration: 0.8, ease: "back.out(1.8)", delay: 0.7, scrollTrigger: { trigger: ".app", start: "top 70%" } });
  gsap.to(".band", { backgroundPosition: "200% 0", ease: "none", scrollTrigger: { trigger: ".band", scrub: true } });

  // Magnetic buttons
  if (fine) document.querySelectorAll(".btn").forEach(b => {
    const mx = gsap.quickTo(b, "x", { duration: 0.4, ease: "power3" }), my = gsap.quickTo(b, "y", { duration: 0.4, ease: "power3" });
    b.addEventListener("mousemove", e => { const r = b.getBoundingClientRect(); mx((e.clientX - r.left - r.width / 2) * 0.25); my((e.clientY - r.top - r.height / 2) * 0.35); });
    b.addEventListener("mouseleave", () => { mx(0); my(0); });
  });

  addEventListener("load", () => ScrollTrigger.refresh());
})();
