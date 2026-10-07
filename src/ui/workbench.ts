import { downloadText, readTextFile } from "./files";
import { formatStats } from "../lib/text";
import { toast } from "./toast";

export type Workbench = {
  input: HTMLTextAreaElement;
  output: HTMLTextAreaElement;
  status: HTMLElement;
  setInputStats: (text: string) => void;
  setOutputStats: (text: string) => void;
};

export function mountWorkbench(root: HTMLElement, onChange: () => void): Workbench {
  const wrap = document.createElement("div");
  wrap.className = "bench";
  wrap.innerHTML = `
    <p class="status" data-testid="status" aria-live="polite"></p>
    <div class="editors">
      <section class="editor">
        <div class="editor-bar">
          <span class="editor-label">Input</span>
          <span class="stats" data-role="input-stats"></span>
          <span class="editor-actions">
            <button type="button" class="btn" data-action="load">Load file</button>
            <button type="button" class="btn" data-action="clear">Clear</button>
          </span>
        </div>
        <textarea data-testid="input" spellcheck="false" wrap="off" placeholder="Paste or drop a text file…"></textarea>
        <input class="file-input" type="file" accept="text/plain,.txt,.csv,.md,.log,.tsv" />
      </section>
      <section class="editor">
        <div class="editor-bar">
          <span class="editor-label">Output</span>
          <span class="stats" data-role="output-stats"></span>
          <span class="editor-actions">
            <button type="button" class="btn primary" data-action="copy">Copy</button>
            <button type="button" class="btn" data-action="download">Download</button>
            <label class="ending">
              <span class="sr">Line endings</span>
              <select data-role="ending">
                <option value="lf">LF</option>
                <option value="crlf">CRLF</option>
              </select>
            </label>
            <button type="button" class="btn" data-action="send">Send to input</button>
          </span>
        </div>
        <textarea data-testid="output" spellcheck="false" wrap="off" readonly></textarea>
      </section>
    </div>
  `;
  root.append(wrap);

  const input = wrap.querySelector<HTMLTextAreaElement>("[data-testid=input]")!;
  const output = wrap.querySelector<HTMLTextAreaElement>("[data-testid=output]")!;
  const status = wrap.querySelector<HTMLElement>("[data-testid=status]")!;
  const inputStats = wrap.querySelector<HTMLElement>("[data-role=input-stats]")!;
  const outputStats = wrap.querySelector<HTMLElement>("[data-role=output-stats]")!;
  const ending = wrap.querySelector<HTMLSelectElement>("[data-role=ending]")!;
  const fileInput = wrap.querySelector<HTMLInputElement>(".file-input")!;
  const inputEditor = input.closest(".editor")!;

  const refreshInputStats = () => {
    inputStats.textContent = formatStats(input.value);
  };

  input.addEventListener("input", () => {
    refreshInputStats();
    onChange();
  });

  wrap.querySelector("[data-action=clear]")!.addEventListener("click", () => {
    input.value = "";
    refreshInputStats();
    onChange();
    input.focus();
  });

  wrap.querySelector("[data-action=load]")!.addEventListener("click", () => fileInput.click());

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];
    fileInput.value = "";
    if (!file) return;
    input.value = await readTextFile(file);
    refreshInputStats();
    onChange();
    toast(`Loaded ${file.name}`);
  });

  inputEditor.addEventListener("dragover", (event) => {
    event.preventDefault();
    inputEditor.classList.add("dropping");
  });
  inputEditor.addEventListener("dragleave", () => inputEditor.classList.remove("dropping"));
  inputEditor.addEventListener("drop", async (event) => {
    event.preventDefault();
    inputEditor.classList.remove("dropping");
    const file = (event as DragEvent).dataTransfer?.files?.[0];
    if (!file) return;
    input.value = await readTextFile(file);
    refreshInputStats();
    onChange();
    toast(`Loaded ${file.name}`);
  });

  wrap.querySelector("[data-action=copy]")!.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(output.value);
      toast("Copied output");
    } catch {
      output.focus();
      output.select();
      toast("Select the output and copy it manually");
    }
  });

  wrap.querySelector("[data-action=download]")!.addEventListener("click", () => {
    const mode = ending.value === "crlf" ? "crlf" : "lf";
    downloadText("output.txt", output.value, mode);
    toast("Download started");
  });

  wrap.querySelector("[data-action=send]")!.addEventListener("click", () => {
    input.value = output.value;
    refreshInputStats();
    onChange();
    toast("Output sent to input");
  });

  return {
    input,
    output,
    status,
    setInputStats: refreshInputStats,
    setOutputStats: (text) => {
      outputStats.textContent = text;
    },
  };
}
