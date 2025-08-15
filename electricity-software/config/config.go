package config

import (
	"os"
	"bufio"
	"strings"
	"path/filepath"
	"fmt"
)

type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	DBSSLMode  string
	DBConnStr  string
	JWTSecret  string
	ServerPort string
	ServerHost string
	Env        string
}

func LoadConfig() *Config {
	// Load .env file first
	loadEnvFile()
	
	config := &Config{
		DBHost:     getRequiredEnv("DB_HOST"),
		DBPort:     getRequiredEnv("DB_PORT"),
		DBUser:     getRequiredEnv("DB_USER"),
		DBPassword: getRequiredEnv("DB_PASSWORD"),
		DBName:     getRequiredEnv("DB_NAME"),
		DBSSLMode:  getRequiredEnv("DB_SSLMODE"),
		JWTSecret:  getRequiredEnv("JWT_SECRET"),
		ServerPort: getRequiredEnv("SERVER_PORT"),
		ServerHost: getRequiredEnv("SERVER_HOST"),
		Env:        getRequiredEnv("ENV"),
	}
	
	// Construct database connection string
	config.DBConnStr = "host=" + config.DBHost + 
		" port=" + config.DBPort + 
		" user=" + config.DBUser + 
		" password=" + config.DBPassword + 
		" dbname=" + config.DBName + 
		" sslmode=" + config.DBSSLMode
	
	return config
}

func loadEnvFile() {
	// Look for .env file in current directory and parent directories
	envPath := ".env"
	for i := 0; i < 5; i++ { // Check up to 5 levels up
		if _, err := os.Stat(envPath); err == nil {
			break
		}
		envPath = filepath.Join("..", envPath)
	}
	
	file, err := os.Open(envPath)
	if err != nil {
		return // .env file not found, use system environment variables
	}
	defer file.Close()
	
	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}
		
		parts := strings.SplitN(line, "=", 2)
		if len(parts) == 2 {
			key := strings.TrimSpace(parts[0])
			value := strings.TrimSpace(parts[1])
			
			// Remove quotes if present
			if len(value) > 1 && (value[0] == '"' || value[0] == '\'') {
				value = value[1 : len(value)-1]
			}
			
			// Set environment variable
			os.Setenv(key, value)
		}
	}
}



func getRequiredEnv(key string) string {
	val := os.Getenv(key)
	if val == "" {
		panic(fmt.Sprintf("Required environment variable %s is not set", key))
	}
	return val
}
