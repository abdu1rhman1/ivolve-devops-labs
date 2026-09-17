FROM maven:3.9.16-eclipse-temurin-17 AS builder

WORKDIR /app

COPY . .

RUN mvn package

FROM eclipse-temurin:17-jre

WORKDIR /app

COPY --from=builder /app/target/demo-0.0.1-SNAPSHOT.jar .

EXPOSE 8080

CMD ["java","-jar","demo-0.0.1-SNAPSHOT.jar"]

