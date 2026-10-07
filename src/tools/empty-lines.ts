import { formatStats, removeEmptyLines } from "../lib/text";
import type { Tool } from "./types";
import { mountWorkbench } from "../ui/workbench";

const SAMPLE = "First line\n\nSecond line\n\n\nThird line";

export const emptyLinesTool: Tool = {
  id: "empty-lines",
  index: "04",
  name: "Remove empty lines",
  blurb: "Remove empty lines while keeping every non-empty line unchanged.",
  mount(root) {
    const bench = mountWorkbench(root, run);
    bench.input.value = SAMPLE;

    function run(): void {
      const source = bench.input.value;
      const result = removeEmptyLines(source);
      bench.output.value = result.text;
      bench.setInputStats(source);
      bench.setOutputStats(formatStats(result.text));
      bench.status.textContent = source === ""
        ? "Paste text to remove its empty lines."
        : `Removed ${result.removed.toLocaleString()} ${result.removed === 1 ? "empty line" : "empty lines"}`;
    }

    run();
  },
};
