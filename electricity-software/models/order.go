package models

import (
	"time"
)

type OrderType string

const (
	OrderTypeBuy  OrderType = "buy"
	OrderTypeSell OrderType = "sell"
)

type OrderStatus string

const (
	OrderStatusOpen      OrderStatus = "open"
	OrderStatusCompleted OrderStatus = "completed"
	OrderStatusCanceled  OrderStatus = "canceled"
)

type Order struct {
	ID              int         `db:"id" json:"id"`
	UserID          int         `db:"user_id" json:"user_id"`
	OrderType       OrderType   `db:"order_type" json:"order_type"`
	AmountMWh       float64     `db:"amount_mwh" json:"amount_mwh"`
	PriceEurPerMWh  float64     `db:"price_eur_per_mwh" json:"price_eur_per_mwh"`
	Status          OrderStatus `db:"status" json:"status"`
	CreatedAt       time.Time   `db:"created_at" json:"created_at"`
	UpdatedAt       time.Time   `db:"updated_at" json:"updated_at"`
	UserName        string      `db:"user_name" json:"user_name,omitempty"`
}

type Transaction struct {
	ID              int       `db:"id" json:"id"`
	UserID          int       `db:"user_id" json:"user_id"`
	OrderID         *int      `db:"order_id" json:"order_id,omitempty"`
	TransactionType OrderType `db:"transaction_type" json:"transaction_type"`
	AmountMWh       float64   `db:"amount_mwh" json:"amount_mwh"`
	PriceEurPerMWh  float64   `db:"price_eur_per_mwh" json:"price_eur_per_mwh"`
	TotalEur        float64   `db:"total_eur" json:"total_eur"`
	CreatedAt       time.Time `db:"created_at" json:"created_at"`
}

type CreateOrderRequest struct {
	OrderType      OrderType `json:"order_type" binding:"required,oneof=buy sell"`
	AmountMWh      float64   `json:"amount_mwh" binding:"required,gt=0"`
	PriceEurPerMWh float64   `json:"price_eur_per_mwh" binding:"required,gt=0"`
}

type UpdateOrderRequest struct {
	AmountMWh      *float64 `json:"amount_mwh,omitempty"`
	PriceEurPerMWh *float64 `json:"price_eur_per_mwh,omitempty"`
}

type OrderFilter struct {
	Type OrderType `form:"type" json:"type"`
	From string    `form:"from" json:"from"`
	To   string    `form:"to" json:"to"`
} 