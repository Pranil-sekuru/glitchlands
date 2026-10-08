FROM python:3.12-slim
WORKDIR /app
COPY server.py index.html game.html playtest.html game.css landing.css playtest.css landing.js playtest.js bugs.js atlas.js runner.js ./
COPY js ./js
COPY assets ./assets
ENV PORT=8080 PYTHONUNBUFFERED=1
EXPOSE 8080
RUN useradd --no-create-home app
USER app
CMD ["python3", "server.py"]
