document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".nav");

  hamburger.addEventListener("click", () => {
    const open = nav.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", String(open));
  });

  // Services dropdown: opens on hover (desktop, via CSS) and on click/tap
  const dropdown = document.querySelector(".dropdown");
  const servicesToggle = document.getElementById("services-toggle");

  function setDropdown(open) {
    dropdown.classList.toggle("open", open);
    servicesToggle.setAttribute("aria-expanded", String(open));
  }

  servicesToggle.addEventListener("click", () => {
    setDropdown(!dropdown.classList.contains("open"));
  });

  document.addEventListener("click", (event) => {
    if (!dropdown.contains(event.target)) setDropdown(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && dropdown.classList.contains("open")) {
      setDropdown(false);
      servicesToggle.focus();
    }
  });

  // Footer year
  document.querySelectorAll("[data-year]").forEach((el) => {
    el.textContent = new Date().getFullYear();
  });

  // Scroll reveal
  const revealItems = document.querySelectorAll(".reveal");
  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  if (revealItems.length && "IntersectionObserver" in window && !reduceMotion) {
    document.documentElement.classList.add("js-reveal");
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 }
    );
    revealItems.forEach((el) => revealObserver.observe(el));
  }

  // Contact form: posts to the form service set in data-endpoint
  // (e.g. https://formspree.io/f/xxxxxxx). GitHub Pages can't run PHP.
  const contactForm = document.getElementById("contactForm");

  if (contactForm) {
    const status = document.getElementById("formStatus");
    const submitBtn = contactForm.querySelector("button[type=submit]");

    function showStatus(kind, message) {
      status.className = "form-status is-" + kind;
      status.textContent = message;
    }

    contactForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      if (!contactForm.reportValidity()) return;

      const endpoint = contactForm.dataset.endpoint;
      if (!endpoint) {
        showStatus(
          "error",
          "Online messages aren't available just yet. Please email us using the address on this page."
        );
        return;
      }

      submitBtn.disabled = true;
      submitBtn.textContent = "Sending…";

      try {
        const response = await fetch(endpoint, {
          method: "POST",
          body: new FormData(contactForm),
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(response.statusText);

        const name = contactForm.elements.name.value.trim();
        contactForm.reset();
        showStatus(
          "success",
          "Thank you" + (name ? ", " + name : "") + ". Your message has been sent and we'll be in touch soon."
        );
      } catch (error) {
        showStatus(
          "error",
          "Sorry, your message couldn't be sent. Please try again or email us directly."
        );
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Send message";
      }
    });
  }
});
