FROM python:3.12-slim

WORKDIR /app

COPY pyproject.toml .
RUN pip install --upgrade pip && \
    pip install fastapi uvicorn sqlalchemy alembic pydantic ortools httpx

COPY . .

RUN alembic upgrade head && python -m app.seed

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
