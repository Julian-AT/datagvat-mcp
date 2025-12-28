FROM python:3.11-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --no-cache-dir .

COPY app/ app/

ENV AUSTRIA_MCP_LOG_LEVEL=INFO

ENTRYPOINT ["python", "-m", "app.server"]
