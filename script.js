document.addEventListener("DOMContentLoaded", () => {
  // Mobile menu
  const hamburger = document.querySelector(".hamburger");
  const nav = document.querySelector(".nav");

  hamburger.addEventListener("click", () => {
    const open = nav.classList.toggle("active");
    hamburger.setAttribute("aria-expanded", String(open));
  });

  // Services tree on Home: draw curved edges from each node to its parent
  const tree = document.querySelector("[data-tree]");

  if (tree) {
    const svg = tree.querySelector(".svc-tree__edges");
    const svgNS = "http://www.w3.org/2000/svg";
    const nodes = {};
    tree.querySelectorAll("[data-node]").forEach((el) => {
      nodes[el.dataset.node] = el;
    });

    function drawTree() {
      svg.replaceChildren();
      if (getComputedStyle(svg).display === "none") return;

      const box = tree.getBoundingClientRect();
      let i = 0;
      tree.querySelectorAll("[data-parent]").forEach((child) => {
        const parent = nodes[child.dataset.parent];
        const a = parent.getBoundingClientRect();
        const b = child.getBoundingClientRect();
        const x1 = a.right - box.left;
        const y1 = a.top + a.height / 2 - box.top;
        const x2 = b.left - box.left;
        const y2 = b.top + b.height / 2 - box.top;
        const mid = (x1 + x2) / 2;
        const d = `M${x1},${y1} C${mid},${y1} ${mid},${y2} ${x2},${y2}`;

        const edge = document.createElementNS(svgNS, "path");
        edge.setAttribute("d", d);
        edge.setAttribute("class", "edge");
        edge.dataset.to = child.dataset.node;

        const pulse = document.createElementNS(svgNS, "path");
        pulse.setAttribute("d", d);
        pulse.setAttribute("class", "pulse");
        pulse.style.setProperty("--pd", `${(i++ * 0.37) % 3.2}s`);

        const port = document.createElementNS(svgNS, "circle");
        port.setAttribute("cx", x2);
        port.setAttribute("cy", y2);
        port.setAttribute("r", 3.5);
        port.setAttribute("class", "port");

        svg.append(edge, pulse, port);
      });
    }

    // Light up the path from the root to a hovered service
    function highlight(leaf, on) {
      let node = leaf;
      while (node && node.dataset.parent) {
        const edge = svg.querySelector(`.edge[data-to="${node.dataset.node}"]`);
        if (edge) edge.classList.toggle("is-hot", on);
        node = nodes[node.dataset.parent];
      }
    }

    tree.querySelectorAll(".svc-tree__leaf").forEach((leaf) => {
      leaf.addEventListener("mouseenter", () => highlight(leaf, true));
      leaf.addEventListener("mouseleave", () => highlight(leaf, false));
      leaf.addEventListener("focus", () => highlight(leaf, true));
      leaf.addEventListener("blur", () => highlight(leaf, false));
    });

    drawTree();
    new ResizeObserver(drawTree).observe(tree);
    if (document.fonts) document.fonts.ready.then(drawTree);
  }

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
