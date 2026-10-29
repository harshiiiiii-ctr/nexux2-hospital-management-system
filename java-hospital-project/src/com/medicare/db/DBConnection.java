package com.medicare.db;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.SQLException;
import java.sql.Statement;

/**
 * DBConnection - Database Connection Utility for Nexus Care Hospital Management System.
 * Handles JDBC MySQL connection setup, driver initialization, and connection pooling.
 *
 * College Mini Project: Java + JDBC + MySQL
 */
public class DBConnection {
    // MySQL Database Configuration
    private static final String URL = "jdbc:mysql://localhost:3306/hospital_db?useSSL=false&allowPublicKeyRetrieval=true&serverTimezone=UTC";
    private static final String USER = "root";
    private static final String PASSWORD = "root"; // Update with your MySQL password

    static {
        try {
            // Load MySQL JDBC Driver
            Class.forName("com.mysql.cj.jdbc.Driver");
        } catch (ClassNotFoundException e) {
            System.err.println("[WARN] MySQL JDBC Driver not found in classpath. If running standalone, include mysql-connector-j.jar.");
        }
    }

    /**
     * Get a connection to the MySQL database
     * @return Connection object
     * @throws SQLException if connection fails
     */
    public static Connection getConnection() throws SQLException {
        try {
            return DriverManager.getConnection(URL, USER, PASSWORD);
        } catch (SQLException e) {
            System.err.println("[ERROR] Unable to connect to MySQL database: " + e.getMessage());
            System.err.println("[TIP] Ensure MySQL server is running and database 'hospital_db' is created using schema.sql.");
            throw e;
        }
    }

    /**
     * Helper to close resources cleanly
     */
    public static void close(AutoCloseable... resources) {
        for (AutoCloseable res : resources) {
            if (res != null) {
                try {
                    res.close();
                } catch (Exception ignored) {
                }
            }
        }
    }
}
