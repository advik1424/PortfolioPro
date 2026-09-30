package com.advik.PortfolioPro.config;

import com.zaxxer.hikari.HikariDataSource;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;

import javax.sql.DataSource;
import java.net.InetSocketAddress;
import java.net.Socket;

@Configuration
public class DatabaseConfig {

    private static final Logger log = LoggerFactory.getLogger(DatabaseConfig.class);

    @Bean
    @Primary
    public DataSource dataSource() {
        // 1. Check explicit Spring datasource URL
        String springUrl = System.getenv("SPRING_DATASOURCE_URL");
        if (springUrl != null && !springUrl.isBlank()) {
            log.info("Connecting to explicitly configured SPRING_DATASOURCE_URL: {}", sanitize(springUrl));
            HikariDataSource ds = new HikariDataSource();
            ds.setJdbcUrl(springUrl);
            ds.setUsername(getEnvOrDefault("SPRING_DATASOURCE_USERNAME", "root"));
            ds.setPassword(getEnvOrDefault("SPRING_DATASOURCE_PASSWORD", getEnvOrDefault("DB_PASSWORD", "Advik@1424")));
            setDriver(ds, springUrl);
            return ds;
        }

        // 2. Check Render / Cloud DATABASE_URL (postgres://user:pass@host:port/db)
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isBlank()) {
            DataSource cloudDs = parseCloudDatabaseUrl(databaseUrl);
            if (cloudDs != null) {
                return cloudDs;
            }
        }

        // 3. Check if local MySQL is running on localhost:3306
        boolean mysqlRunning = isLocalPortOpen("localhost", 3306, 500);
        if (mysqlRunning) {
            String defaultLocalMysql = "jdbc:mysql://localhost:3306/portfoliopro?createDatabaseIfNotExist=true&useSSL=false&allowPublicKeyRetrieval=true";
            log.info("Local MySQL detected on port 3306. Connecting to: {}", defaultLocalMysql);
            HikariDataSource ds = new HikariDataSource();
            ds.setJdbcUrl(defaultLocalMysql);
            ds.setUsername(getEnvOrDefault("DB_USERNAME", "root"));
            ds.setPassword(getEnvOrDefault("DB_PASSWORD", "Advik@1424"));
            ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
            return ds;
        }

        // 4. Fallback: In-memory H2 database (ensures Cloud deployment like Render never crashes)
        String h2Url = "jdbc:h2:mem:portfoliopro;DB_CLOSE_DELAY=-1;MODE=MySQL;DATABASE_TO_LOWER=TRUE;NON_KEYWORDS=USER";
        log.warn("================================================================================");
        log.warn("  LOCAL MYSQL NOT DETECTED AND NO EXTERNAL DATABASE URL CONFIGURED.");
        log.warn("  Starting with embedded in-memory H2 database: {}", h2Url);
        log.warn("  To use a persistent PostgreSQL database on Render, add a PostgreSQL service");
        log.warn("  and link it or set SPRING_DATASOURCE_URL in Environment Variables.");
        log.warn("================================================================================");

        HikariDataSource h2Ds = new HikariDataSource();
        h2Ds.setJdbcUrl(h2Url);
        h2Ds.setUsername("sa");
        h2Ds.setPassword("");
        h2Ds.setDriverClassName("org.h2.Driver");
        return h2Ds;
    }

    private DataSource parseCloudDatabaseUrl(String rawUrl) {
        try {
            if (rawUrl.startsWith("postgres://") || rawUrl.startsWith("postgresql://")) {
                String clean = rawUrl.replace("postgresql://", "").replace("postgres://", "");
                String[] atParts = clean.split("@");
                String userInfo = atParts[0];
                String hostAndDb = atParts[1];

                String[] userParts = userInfo.split(":", 2);
                String username = userParts[0];
                String password = userParts.length > 1 ? userParts[1] : "";

                String[] hostParts = hostAndDb.split("/", 2);
                String hostPort = hostParts[0];
                String dbName = hostParts.length > 1 ? hostParts[1] : "portfoliopro";

                // Ensure sslmode=require for cloud PostgreSQL (Render, Supabase, Neon)
                String queryParams = "";
                if (dbName.contains("?")) {
                    queryParams = dbName.substring(dbName.indexOf("?"));
                    dbName = dbName.substring(0, dbName.indexOf("?"));
                } else {
                    queryParams = "?sslmode=require";
                }

                String jdbcUrl = "jdbc:postgresql://" + hostPort + "/" + dbName + queryParams;
                log.info("Detected Cloud PostgreSQL from DATABASE_URL. Target: {}", sanitize(jdbcUrl));

                HikariDataSource ds = new HikariDataSource();
                ds.setJdbcUrl(jdbcUrl);
                ds.setUsername(username);
                ds.setPassword(password);
                ds.setDriverClassName("org.postgresql.Driver");
                return ds;
            }
        } catch (Exception e) {
            log.error("Failed to parse DATABASE_URL: {}. Falling back to default detection.", e.getMessage());
        }
        return null;
    }

    private void setDriver(HikariDataSource ds, String url) {
        if (url.startsWith("jdbc:postgresql:")) {
            ds.setDriverClassName("org.postgresql.Driver");
        } else if (url.startsWith("jdbc:mysql:")) {
            ds.setDriverClassName("com.mysql.cj.jdbc.Driver");
        } else if (url.startsWith("jdbc:h2:")) {
            ds.setDriverClassName("org.h2.Driver");
        }
    }

    private boolean isLocalPortOpen(String host, int port, int timeoutMs) {
        try (Socket socket = new Socket()) {
            socket.connect(new InetSocketAddress(host, port), timeoutMs);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    private String getEnvOrDefault(String key, String fallback) {
        String val = System.getenv(key);
        return (val != null && !val.isBlank()) ? val : fallback;
    }

    private String sanitize(String url) {
        return url.replaceAll(":[^/@]+@", ":****@");
    }
}
