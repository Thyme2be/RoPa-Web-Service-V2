FROM python:3.10-slim

WORKDIR /app

# Ensure standard output is not buffered
ENV PYTHONUNBUFFERED=1

# Install system dependencies if required for some python packages, though basic FastAPI might not need them.
# The user's previous Dockerfile seemed to use apt-get. We'll add a minimal one.
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Let compose override the command for dev
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
