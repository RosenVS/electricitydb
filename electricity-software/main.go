package main

import (
	"log"
	"net/http"
	"os"
	"strings"

	"github.com/gin-contrib/cors"

	"github.com/dgrijalva/jwt-go"
	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	_ "github.com/lib/pq"

	"my-go-project/config"
	"my-go-project/handlers"
	"my-go-project/repositories"
	"my-go-project/services"
)

func AuthMiddleware(jwtSecret []byte) gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing authorization header"})
			return
		}

		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header format"})
			return
		}

		tokenString := parts[1]

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			return jwtSecret, nil
		})

		if err != nil || !token.Valid {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok || claims["user_id"] == nil {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token claims"})
			return
		}

		userIDFloat, ok := claims["user_id"].(float64)
		if !ok {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid user id in token"})
			return
		}

		userID := int(userIDFloat)
		c.Set("userID", userID)
		c.Next()
	}
}

func main() {
	// Load configuration from environment variables
	cfg := config.LoadConfig()

	db, err := sqlx.Connect("postgres", cfg.DBConnStr)
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
		os.Exit(1)
	}

	userRepo := repositories.NewUserRepository(db)
	orderRepo := repositories.NewOrderRepository(db)
	authService := services.NewAuthService(userRepo)
	orderService := services.NewOrderService(orderRepo)
	jwtSecret := []byte(cfg.JWTSecret)
	authHandler := handlers.NewAuthHandler(authService, jwtSecret)
	orderHandler := handlers.NewOrderHandler(orderService)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:3000"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Origin", "Authorization", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))
	r.POST("/register", authHandler.Register)
	r.POST("/login", authHandler.Login)

	// Public endpoints
	r.GET("/orders/sell", orderHandler.GetSellOrders)

	auth := r.Group("/auth")
	auth.Use(AuthMiddleware(jwtSecret))
	{
		auth.GET("/profile", authHandler.Profile)
	}

	// Protected order endpoints
	orders := r.Group("/orders")
	orders.Use(AuthMiddleware(jwtSecret))
	{
		orders.GET("", orderHandler.GetOrders)
		orders.POST("", orderHandler.CreateOrder)
		orders.GET("/:id", orderHandler.GetOrder)
		orders.PUT("/:id", orderHandler.UpdateOrder)
		orders.DELETE("/:id", orderHandler.DeleteOrder)
	}

	// Protected transaction and balance endpoints
	protected := r.Group("")
	protected.Use(AuthMiddleware(jwtSecret))
	{
		protected.GET("/transactions", orderHandler.GetTransactions)
		protected.GET("/balance", orderHandler.GetBalance)
	}

	serverAddr := cfg.ServerHost + ":" + cfg.ServerPort
	log.Printf("Starting server on %s", serverAddr)
	if err := r.Run(serverAddr); err != nil {
		log.Fatalf("Server failed to start: %v", err)
	}
}
