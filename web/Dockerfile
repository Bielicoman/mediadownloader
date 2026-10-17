FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends ffmpeg python3 python3-venv ca-certificates && rm -rf /var/lib/apt/lists/* \
    && python3 -m venv /opt/yt && /opt/yt/bin/pip install --no-cache-dir 'yt-dlp[default]'
ENV PATH="/opt/yt/bin:${PATH}" HOST=0.0.0.0 PORT=3080
WORKDIR /srv/media
COPY scripts/build-site.cjs scripts/build-site.cjs
COPY *.html *.css *.js *.json logo.png favicon.svg favicon.ico LICENSE LICENSE.txt THIRD-PARTY-NOTICES.md ./
COPY assets assets
COPY licenses licenses
COPY web web
RUN node scripts/build-site.cjs && chown -R node:node /srv/media
USER node
EXPOSE 3080
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s CMD node -e "fetch('http://localhost:3080/api/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"
CMD ["node","web/server.cjs"]
