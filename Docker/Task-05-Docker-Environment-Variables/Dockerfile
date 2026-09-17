FROM python:3.13-slim

WORKDIR /app

COPY . .

RUN pip install flask 

EXPOSE 8080 

ENV APP_MODE=production
ENV APP_REGION=canada-west

CMD ["python","app.py"]
