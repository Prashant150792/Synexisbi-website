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

  // Contact page: copy the email address to the clipboard
  document.querySelectorAll("[data-copy]").forEach((btn) => {
    const label = btn.textContent;
    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        btn.textContent = "Copied!";
      } catch (error) {
        btn.textContent = btn.dataset.copy;
      }
      setTimeout(() => {
        btn.textContent = label;
      }, 2000);
    });
  });
});
