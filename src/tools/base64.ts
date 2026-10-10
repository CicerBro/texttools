import { decodeBase64, encodeBase64, formatStats } from "../lib/text";
import type { Tool } from "./types";
import { mountWorkbench } from "../ui/workbench";

const SAMPLE = "Hello, Texttools";

export const base64Tool: Tool = {
  id: "base64",
  index: "05",
  name: "Base64",
  blurb: "Encode text as Base64, or decode Base64 back to text.",
  mount(root) {
    const options = document.createElement("div");
    options.className = "options";
    options.innerHTML = `
      <div class="row">
        <div class="segment" role="radiogroup" aria-label="Encode or decode">
          <label><input type="radio" name="base64-mode" value="encode" checked /> Encode</label>
          <label><input type="radio" name="base64-mode" value="decode" /> Decode</label>
        </div>
        <label class="check" data-role="url-option">
          <input data-role="url" type="checkbox" />
          <span>URL-safe</span>
        </label>
      </div>
    `;
    root.append(options);

    const bench = mountWorkbench(root, run);
    bench.input.value = SAMPLE;

    const urlOption = options.querySelector<HTMLElement>("[data-role=url-option]")!;
    const url = options.querySelector<HTMLInputElement>("[data-role=url]")!;

    const decoding = () => options.querySelector<HTMLInputElement>('input[name="base64-mode"]:checked')!.value === "decode";

    function run(): void {
      const source = bench.input.value;
      const isDecode = decoding();
      urlOption.hidden = isDecode;

      if (isDecode) {
        const result = decodeBase64(source);
        bench.output.value = result.text;
        if (source.trim() === "") bench.status.textContent = "Paste Base64 to decode.";
        else if (result.error) bench.status.textContent = result.error;
        else bench.status.textContent = "Decoded Base64.";
      } else {
        bench.output.value = encodeBase64(source, url.checked);
        if (source === "") bench.status.textContent = "Paste text to encode as Base64.";
        else bench.status.textContent = url.checked ? "Encoded as URL-safe Base64." : "Encoded as Base64.";
      }

      bench.setInputStats(source);
      bench.setOutputStats(formatStats(bench.output.value));
    }

    options.addEventListener("input", run);
    options.addEventListener("change", run);
    bench.setInputStats(SAMPLE);
    run();
  },
};
