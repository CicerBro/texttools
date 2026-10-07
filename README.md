# Texttools

A small browser-based text utility app, served as a static site.

## Run with Docker

Build locally:

```sh
docker build -t texttools .
docker run --rm -p 8080:80 texttools
```

Run the published image:

```sh
docker login ghcr.io
docker run --rm -p 8080:80 ghcr.io/cicerbro/texttools:latest
```

Open <http://localhost:8080>.

The runtime image is based on [`joseluisq/static-web-server:2.44`](https://hub.docker.com/r/joseluisq/static-web-server), the scratch variant. The Node build stage is discarded from the final image.
