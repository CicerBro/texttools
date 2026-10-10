import { base64Tool } from "./tools/base64";
import { breaksTool } from "./tools/breaks";
import { duplicatesTool } from "./tools/duplicates";
import { emptyLinesTool } from "./tools/empty-lines";
import { prefixTool } from "./tools/prefix";
import type { Tool } from "./tools/types";

const tools: Tool[] = [prefixTool, breaksTool, duplicatesTool, emptyLinesTool, base64Tool];

export function mountApp(root: HTMLElement): void {
  root.innerHTML = `
    <div class="shell">
      <aside class="sidebar">
        <div class="brand">
          <span class="mark" aria-hidden="true">Tt</span>
          <div>
            <strong>Texttools</strong>
            <span>Local text utilities</span>
          </div>
        </div>
        <nav class="nav" aria-label="Tools"></nav>
        <p class="sidebar-note">Everything runs in this browser. Your text never leaves this page.</p>
      </aside>
      <div class="workspace">
        <header class="topbar">
          <div>
            <p class="eyebrow">Basic text</p>
            <h1 data-testid="tool-title"></h1>
            <p class="blurb" data-testid="tool-blurb"></p>
          </div>
          <span class="live"><span class="dot" aria-hidden="true"></span> Live</span>
        </header>
        <div id="tool-root"></div>
      </div>
    </div>
    <div class="toast" hidden role="status"></div>
  `;

  const nav = root.querySelector<HTMLElement>(".nav")!;
  const toolRoot = root.querySelector<HTMLElement>("#tool-root")!;
  const title = root.querySelector<HTMLElement>("[data-testid=tool-title]")!;
  const blurb = root.querySelector<HTMLElement>("[data-testid=tool-blurb]")!;
  const panels = new Map<string, HTMLElement>();

  for (const tool of tools) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "nav-item";
    button.dataset.tool = tool.id;
    button.innerHTML = `
      <span class="nav-index">${tool.index}</span>
      <span>
        <span class="nav-label">${tool.name}</span>
        <span class="nav-desc">${tool.blurb}</span>
      </span>
    `;
    button.addEventListener("click", () => {
      location.hash = tool.id;
    });
    nav.append(button);

    const panel = document.createElement("section");
    panel.className = "tool";
    panel.dataset.tool = tool.id;
    panel.hidden = true;
    tool.mount(panel);
    toolRoot.append(panel);
    panels.set(tool.id, panel);
  }

  const show = (id: string) => {
    const tool = tools.find((item) => item.id === id) ?? tools[0];
    for (const [key, panel] of panels) panel.hidden = key !== tool.id;
    for (const button of nav.querySelectorAll<HTMLButtonElement>(".nav-item")) {
      const active = button.dataset.tool === tool.id;
      button.classList.toggle("active", active);
      if (active) button.setAttribute("aria-current", "page");
      else button.removeAttribute("aria-current");
    }
    title.textContent = tool.name;
    blurb.textContent = tool.blurb;
    document.title = `${tool.name} · Texttools`;
  };

  window.addEventListener("hashchange", () => show(location.hash.slice(1)));
  show(location.hash.slice(1));
}
