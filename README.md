# Texttools

A small browser-based text utility app, served as a static site.

## Tools

- **Prefix & suffix:** add or remove text at the start or end of every line, with an option to skip empty lines.
- **Line breaks:** join lines with a chosen separator, insert breaks before or after matching text, or wrap lines to a chosen width. Wrapping can preserve words or break at an exact character count.
- **Duplicate lines:** keep the first copy of each line, with options for case matching, removing empty lines, and viewing removed lines.

Each tool has an input and output editor. You can paste text, load or drop a `.txt`, `.csv`, `.md`, `.log`, or `.tsv` file, view line and character counts, copy or download the output, choose LF or CRLF line endings for downloads, and send output back to the input.

## Run with Docker

Build locally:

```sh
docker build -t texttools .
docker run --rm -p 8080:80 texttools
```

Run the published image:

```sh
docker run --rm -p 8080:80 ghcr.io/cicerbro/texttools:latest
```

Open <http://localhost:8080>.

The runtime image is based on [`joseluisq/static-web-server:2.44`](https://hub.docker.com/r/joseluisq/static-web-server), the scratch variant. The Node build stage is discarded from the final image.

## Font

The app bundles Geist Sans from [`@fontsource-variable/geist`](https://github.com/fontsource/font-files). The font is licensed under SIL Open Font License 1.1; see [`public/fonts/OFL.txt`](public/fonts/OFL.txt).
