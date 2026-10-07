let timer = 0;

export function toast(message: string): void {
  const node = document.querySelector<HTMLElement>(".toast");
  if (!node) return;
  node.textContent = message;
  node.hidden = false;
  window.clearTimeout(timer);
  timer = window.setTimeout(() => {
    node.hidden = true;
  }, 1800);
}
