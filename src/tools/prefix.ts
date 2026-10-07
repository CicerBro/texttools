import { addPrefixSuffix, formatStats, removePrefixSuffix } from "../lib/text";
import type { Tool } from "./types";
import { mountWorkbench } from "../ui/workbench";

const SAMPLE = "Ada Lovelace\nGrace Hopper\nKatherine Johnson";

export const prefixTool: Tool = {
  id: "prefix",
  index: "01",
  name: "Prefix & suffix",
  blurb: "Add or remove text at the start and end of every line.",
  mount(root) {
    const options = document.createElement("div");
    options.className = "options";
    options.innerHTML = `
      <div class="fields">
        <label class="field">
          <span>Prefix</span>
          <input data-role="prefix" type="text" spellcheck="false" placeholder="Text at the start of each line" value="- " />
        </label>
        <label class="field">
          <span>Suffix</span>
          <input data-role="suffix" type="text" spellcheck="false" placeholder="Text at the end of each line" />
        </label>
      </div>
      <div class="row">
        <div class="segment" role="radiogroup" aria-label="Add or remove">
          <label><input type="radio" name="affix-mode" value="add" checked /> Add</label>
          <label><input type="radio" name="affix-mode" value="remove" /> Remove</label>
        </div>
        <label class="check">
          <input data-role="skip" type="checkbox" />
          <span>Skip empty lines</span>
        </label>
      </div>
    `;
    root.append(options);

    const prefix = options.querySelector<HTMLInputElement>("[data-role=prefix]")!;
    const suffix = options.querySelector<HTMLInputElement>("[data-role=suffix]")!;
    const skip = options.querySelector<HTMLInputElement>("[data-role=skip]")!;

    const bench = mountWorkbench(root, run);
    bench.input.value = SAMPLE;

    const removing = () => options.querySelector<HTMLInputElement>('input[name="affix-mode"]:checked')!.value === "remove";

    function run(): void {
      const modeIsRemove = removing();
      const result = modeIsRemove
        ? removePrefixSuffix(bench.input.value, prefix.value, suffix.value, skip.checked)
        : { ...addPrefixSuffix(bench.input.value, prefix.value, suffix.value, skip.checked), unchanged: 0 };
      bench.output.value = result.text;
      bench.setInputStats(bench.input.value);
      bench.setOutputStats(formatStats(result.text));
      if (bench.input.value === "") {
        bench.status.textContent = modeIsRemove ? "Paste a list to strip each line." : "Paste a list to wrap each line.";
        return;
      }
      if (prefix.value === "" && suffix.value === "") {
        bench.status.textContent = "Enter a prefix or suffix.";
        return;
      }
      const skipped = result.skipped > 0 ? ` · skipped ${result.skipped} empty` : "";
      if (modeIsRemove) {
        const missed = result.unchanged > 0 ? ` · ${result.unchanged} unchanged` : "";
        bench.status.textContent = `Removed from ${result.updated.toLocaleString()} ${result.updated === 1 ? "line" : "lines"}${missed}${skipped}`;
        return;
      }
      bench.status.textContent = `Updated ${result.updated.toLocaleString()} ${result.updated === 1 ? "line" : "lines"}${skipped}`;
    }

    options.addEventListener("input", run);
    options.addEventListener("change", run);
    bench.setInputStats(SAMPLE);
    run();
  },
};
