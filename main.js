(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Footer year
  document.getElementById("year").textContent = new Date().getFullYear();

  // Project filters
  const filters = document.querySelectorAll(".filter");
  const cards = document.querySelectorAll(".card");
  filters.forEach((btn) => {
    btn.addEventListener("click", () => {
      filters.forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      cards.forEach((card) => {
        const show = f === "all" || card.dataset.tags.split(" ").includes(f);
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  // Videos: play on hover (desktop) or while visible (touch)
  const isTouch = window.matchMedia("(hover: none)").matches;
  const videos = document.querySelectorAll(".card video");
  if (!isTouch) {
    videos.forEach((video) => {
      const card = video.closest(".card");
      card.addEventListener("mouseenter", () => video.play().catch(() => {}));
      card.addEventListener("mouseleave", () => video.pause());
    });
  } else if (!reduceMotion && "IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.isIntersecting ? entry.target.play().catch(() => {}) : entry.target.pause();
      });
    }, { threshold: 0.5 });
    videos.forEach((video) => io.observe(video));
  }

  // Email button: copy the address instead of opening the mail app
  let toastTimer;
  function showToast(text) {
    let toast = document.querySelector(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      toast.setAttribute("role", "status");
      document.body.appendChild(toast);
    }
    toast.textContent = text;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 2200);
  }

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text);
    // Fallback for non-HTTPS pages
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const ok = document.execCommand("copy");
    area.remove();
    return ok ? Promise.resolve() : Promise.reject();
  }

  document.querySelectorAll("[data-copy]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      copyText(el.dataset.copy)
        .then(() => showToast("Email copied to clipboard"))
        .catch(() => { window.location.href = el.href; });
    });
  });
})();
