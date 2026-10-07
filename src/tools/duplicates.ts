import { formatRemovedLine, formatStats, removeDuplicateLines } from "../lib/text";
import type { Tool } from "./types";
import { mountWorkbench } from "../ui/workbench";

const SAMPLE = "apple\nBanana\napple\nbanana\norange\n\norange\nApple";

export const duplicatesTool: Tool = {
  id: "duplicates",
  index: "03",
  name: "Duplicate lines",
  blurb: "Keep the first copy of each line, in the original order.",
  mount(root) {
    const options = document.createElement("div");
    options.className = "options";
    options.innerHTML = `
      <div class="checks">
        <label class="check"><input data-role="case" type="checkbox" /> <span>Match case</span></label>
        <label class="check"><input data-role="empty" type="checkbox" checked /> <span>Remove empty lines</span></label>
        <label class="check"><input data-role="show" type="checkbox" /> <span>Show removed lines</span></label>
      </div>
    `;
    root.append(options);

    const bench = mountWorkbench(root, run);
    bench.input.value = SAMPLE;

    const removedWrap = document.createElement("section");
    removedWrap.className = "editor removed";
    removedWrap.hidden = true;
    removedWrap.innerHTML = `
      <div class="editor-bar">
        <span class="editor-label">Removed</span>
        <span class="stats" data-role="removed-stats"></span>
      </div>
      <textarea data-testid="removed" spellcheck="false" wrap="off" readonly></textarea>
    `;
    root.append(removedWrap);
    const removed = removedWrap.querySelector<HTMLTextAreaElement>("textarea")!;
    const removedStats = removedWrap.querySelector<HTMLElement>("[data-role=removed-stats]")!;
    const show = options.querySelector<HTMLInputElement>("[data-role=show]")!;

    function run(): void {
      const caseSensitive = options.querySelector<HTMLInputElement>("[data-role=case]")!.checked;
      const removeEmpty = options.querySelector<HTMLInputElement>("[data-role=empty]")!.checked;
      const result = removeDuplicateLines(bench.input.value, caseSensitive, removeEmpty);
      bench.output.value = result.text;
      removed.value = result.removed.map(formatRemovedLine).join("\n");
      removedWrap.hidden = !show.checked;
      bench.setInputStats(bench.input.value);
      bench.setOutputStats(formatStats(result.text));
      removedStats.textContent = formatStats(removed.value);

      if (bench.input.value === "") {
        bench.status.textContent = "Paste a list to drop later copies of each line.";
        return;
      }
      const duplicates = result.removed.filter((item) => item.reason === "duplicate").length;
      const empties = result.removed.length - duplicates;
      if (result.removed.length === 0) {
        bench.status.textContent = "No duplicate lines.";
        return;
      }
      const parts = [`Removed ${duplicates.toLocaleString()} ${duplicates === 1 ? "duplicate" : "duplicates"}`];
      if (empties > 0) parts.push(`${empties.toLocaleString()} empty`);
      bench.status.textContent = parts.join(" · ");
    }

    options.addEventListener("input", run);
    options.addEventListener("change", run);
    run();
  },
};
