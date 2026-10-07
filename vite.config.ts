import { readFileSync, rmSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { defineConfig, type Plugin } from "vite";

function singleHtmlFile(): Plugin {
  return {
    name: "single-html-file",
    apply: "build",
    closeBundle() {
      const dist = resolve("dist");
      let html = readFileSync(resolve(dist, "index.html"), "utf8");
      const readAsset = (url: string) => {
        const relative = url.replace(/^\.?\//, "");
        return readFileSync(resolve(dist, relative), "utf8");
      };

      html = html.replace(/<script type="module"[^>]*src="([^"]+)"><\/script>/g, (_match, src: string) => {
        const code = readAsset(src).replace(/<\/script/gi, "<\\/script");
        return `<script type="module">${code}</script>`;
      });
      html = html.replace(/<link rel="stylesheet"[^>]*href="([^"]+)"\s*\/?>/g, (_match, href: string) => {
        const css = readAsset(href).replace(/<\/style/gi, "<\\/style");
        return `<style>${css}</style>`;
      });

      writeFileSync(resolve(dist, "index.html"), html);
      writeFileSync(resolve("texttools.html"), html);
      rmSync(resolve(dist, "assets"), { recursive: true, force: true });
    },
  };
}

export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
  },
  plugins: [singleHtmlFile()],
  build: {
    cssCodeSplit: false,
    modulePreload: false,
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
});
