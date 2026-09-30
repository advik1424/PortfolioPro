# ==========================================
# Stage 1: Build Java Spring Boot Application
# ==========================================
FROM maven:3.9.8-eclipse-temurin-21 AS build
WORKDIR /app

# Copy Maven POM and source files
COPY pom.xml .
COPY src ./src

# Build production jar skipping tests
RUN mvn clean package -DskipTests

# ==========================================
# Stage 2: Lightweight Java 21 Runtime
# ==========================================
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy executable jar from build stage
COPY --from=build /app/target/*.jar app.jar

# Render assigns dynamic port via $PORT, default to 8080
ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["sh", "-c", "java -Dserver.port=${PORT} -jar app.jar"]
