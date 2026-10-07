import { breakOnText, formatStats, removeLineBreaks, wrapLines } from "../lib/text";
import type { Tool } from "./types";
import { mountWorkbench } from "../ui/workbench";

const SAMPLE = "Ada Lovelace\nGrace Hopper\nKatherine Johnson\n\nThe quick brown fox jumps over the lazy dog and then keeps going.";

export const breaksTool: Tool = {
  id: "breaks",
  index: "02",
  name: "Line breaks",
  blurb: "Join lines, split on a marker, or wrap at a fixed width.",
  mount(root) {
    const options = document.createElement("div");
    options.className = "options";
    options.innerHTML = `
      <div class="modes" role="radiogroup" aria-label="Line break action">
        <label class="mode">
          <input type="radio" name="break-mode" value="remove" checked />
          <span class="mode-title">Remove breaks</span>
          <span class="mode-desc">Join every line, with an optional separator.</span>
        </label>
        <label class="mode">
          <input type="radio" name="break-mode" value="split" />
          <span class="mode-title">Break on text</span>
          <span class="mode-desc">Insert a break before or after each match.</span>
        </label>
        <label class="mode">
          <input type="radio" name="break-mode" value="wrap" />
          <span class="mode-title">Wrap lines</span>
          <span class="mode-desc">Break each line after a set number of characters.</span>
        </label>
      </div>
      <div class="mode-panel" data-mode="remove">
        <label class="field">
          <span>Replace each break with</span>
          <input data-role="replacement" type="text" spellcheck="false" value=", " placeholder="Leave blank to join with nothing" />
        </label>
      </div>
      <div class="mode-panel" data-mode="split" hidden>
        <div class="row">
          <div class="segment" role="radiogroup" aria-label="Break position">
            <label><input type="radio" name="break-pos" value="before" /> Before</label>
            <label><input type="radio" name="break-pos" value="after" checked /> After</label>
          </div>
          <label class="field grow">
            <span>Each occurrence of</span>
            <input data-role="needle" type="text" spellcheck="false" value="," placeholder="Text to split on" />
          </label>
        </div>
        <div class="checks">
          <label class="check"><input data-role="case" type="checkbox" /> <span>Match case</span></label>
          <label class="check"><input data-role="relb" type="checkbox" /> <span>Remove existing breaks first</span></label>
        </div>
      </div>
      <div class="mode-panel" data-mode="wrap" hidden>
        <div class="row">
          <label class="field narrow">
            <span>Characters</span>
            <input data-role="width" type="number" min="1" step="1" value="42" />
          </label>
          <div class="checks align-end">
            <label class="check"><input data-role="words" type="checkbox" checked /> <span>Word wrap</span></label>
            <label class="check"><input data-role="escape" type="checkbox" /> <span>Turn existing breaks into \\n</span></label>
          </div>
        </div>
      </div>
    `;
    root.append(options);

    const bench = mountWorkbench(root, run);
    bench.input.value = SAMPLE;

    const panels = [...options.querySelectorAll<HTMLElement>(".mode-panel")];

    function mode(): "remove" | "split" | "wrap" {
      const selected = options.querySelector<HTMLInputElement>('input[name="break-mode"]:checked');
      const value = selected?.value;
      if (value === "split" || value === "wrap") return value;
      return "remove";
    }

    function run(): void {
      const current = mode();
      for (const panel of panels) panel.hidden = panel.dataset.mode !== current;

      const source = bench.input.value;
      if (current === "remove") {
        const replacement = options.querySelector<HTMLInputElement>("[data-role=replacement]")!.value;
        const result = removeLineBreaks(source, replacement);
        bench.output.value = result.text;
        bench.status.textContent =
          source === "" ? "Paste text to join its lines." : `Replaced ${result.replaced.toLocaleString()} line ${result.replaced === 1 ? "break" : "breaks"}`;
      } else if (current === "split") {
        const needle = options.querySelector<HTMLInputElement>("[data-role=needle]")!.value;
        const position = options.querySelector<HTMLInputElement>('input[name="break-pos"]:checked')!.value === "before" ? "before" : "after";
        const caseSensitive = options.querySelector<HTMLInputElement>("[data-role=case]")!.checked;
        const removeExisting = options.querySelector<HTMLInputElement>("[data-role=relb]")!.checked;
        const result = breakOnText(source, needle, position, caseSensitive, removeExisting);
        bench.output.value = result.text;
        if (needle === "") bench.status.textContent = "Enter the text to split on.";
        else bench.status.textContent = `Inserted ${result.inserted.toLocaleString()} line ${result.inserted === 1 ? "break" : "breaks"}`;
      } else {
        const width = Number(options.querySelector<HTMLInputElement>("[data-role=width]")!.value);
        const wordWrap = options.querySelector<HTMLInputElement>("[data-role=words]")!.checked;
        const escapeExisting = options.querySelector<HTMLInputElement>("[data-role=escape]")!.checked;
        const result = wrapLines(source, width, wordWrap, escapeExisting);
        bench.output.value = result.text;
        if (!Number.isInteger(width) || width < 1) bench.status.textContent = "Enter a width of at least 1.";
        else bench.status.textContent = `Wrapped to ${result.lines.toLocaleString()} ${result.lines === 1 ? "line" : "lines"}`;
      }

      bench.setInputStats(source);
      bench.setOutputStats(formatStats(bench.output.value));
    }

    options.addEventListener("input", run);
    options.addEventListener("change", run);
    run();
  },
};
