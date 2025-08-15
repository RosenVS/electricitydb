package repositories

import (
	"database/sql"
	"fmt"
	"time"

	"github.com/jmoiron/sqlx"
	"my-go-project/models"
)

type OrderRepository struct {
	db *sqlx.DB
}

func NewOrderRepository(db *sqlx.DB) *OrderRepository {
	return &OrderRepository{db: db}
}

func (r *OrderRepository) CreateOrder(order *models.Order) error {
	query := `
		INSERT INTO orders (user_id, order_type, amount_mwh, price_eur_per_mwh, status, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`
	
	now := time.Now()
	return r.db.QueryRow(
		query,
		order.UserID,
		order.OrderType,
		order.AmountMWh,
		order.PriceEurPerMWh,
		order.Status,
		now,
		now,
	).Scan(&order.ID)
}

func (r *OrderRepository) GetOrderByID(id int) (*models.Order, error) {
	query := `
		SELECT o.*, u.name as user_name
		FROM orders o
		JOIN users u ON o.user_id = u.id
		WHERE o.id = $1`
	
	var order models.Order
	err := r.db.Get(&order, query, id)
	if err != nil {
		return nil, err
	}
	return &order, nil
}

func (r *OrderRepository) GetOrdersByUser(userID int, filter models.OrderFilter) ([]models.Order, error) {
	query := `
		SELECT o.*, u.name as user_name
		FROM orders o
		JOIN users u ON o.user_id = u.id
		WHERE o.user_id = $1`
	
	args := []interface{}{userID}
	argIndex := 2

	if filter.Type != "" {
		query += fmt.Sprintf(" AND o.order_type = $%d", argIndex)
		args = append(args, filter.Type)
		argIndex++
	}

	if filter.From != "" {
		query += fmt.Sprintf(" AND o.created_at >= $%d", argIndex)
		args = append(args, filter.From)
		argIndex++
	}

	if filter.To != "" {
		query += fmt.Sprintf(" AND o.created_at <= $%d", argIndex)
		args = append(args, filter.To)
		argIndex++
	}

	query += " ORDER BY o.created_at DESC"

	var orders []models.Order
	err := r.db.Select(&orders, query, args...)
	return orders, err
}

func (r *OrderRepository) GetSellOrders(filter models.OrderFilter) ([]models.Order, error) {
	query := `
		SELECT o.*, u.name as user_name
		FROM orders o
		JOIN users u ON o.user_id = u.id
		WHERE o.order_type = 'sell' AND o.status = $1`
	
	args := []interface{}{models.OrderStatusOpen}
	argIndex := 2

	if filter.From != "" {
		query += fmt.Sprintf(" AND o.created_at >= $%d", argIndex)
		args = append(args, filter.From)
		argIndex++
	}

	if filter.To != "" {
		query += fmt.Sprintf(" AND o.created_at <= $%d", argIndex)
		args = append(args, filter.To)
		argIndex++
	}

	query += " ORDER BY o.price_eur_per_mwh ASC, o.created_at ASC"

	var orders []models.Order
	err := r.db.Select(&orders, query, args...)
	return orders, err
}

func (r *OrderRepository) UpdateOrder(id int, updates map[string]interface{}) error {
	if len(updates) == 0 {
		return nil
	}

	query := "UPDATE orders SET updated_at = $1"
	args := []interface{}{time.Now()}
	argIndex := 2

	for key, value := range updates {
		query += fmt.Sprintf(", %s = $%d", key, argIndex)
		args = append(args, value)
		argIndex++
	}

	query += " WHERE id = $" + fmt.Sprintf("%d", argIndex)
	args = append(args, id)

	_, err := r.db.Exec(query, args...)
	return err
}

func (r *OrderRepository) DeleteOrder(id int) error {
	query := "DELETE FROM orders WHERE id = $1"
	_, err := r.db.Exec(query, id)
	return err
}

func (r *OrderRepository) CreateTransaction(transaction *models.Transaction) error {
	query := `
		INSERT INTO transactions (user_id, order_id, transaction_type, amount_mwh, price_eur_per_mwh, total_eur, created_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING id`
	
	return r.db.QueryRow(
		query,
		transaction.UserID,
		transaction.OrderID,
		transaction.TransactionType,
		transaction.AmountMWh,
		transaction.PriceEurPerMWh,
		transaction.TotalEur,
		time.Now(),
	).Scan(&transaction.ID)
}

func (r *OrderRepository) GetTransactionsByUser(userID int) ([]models.Transaction, error) {
	query := `
		SELECT *
		FROM transactions
		WHERE user_id = $1
		ORDER BY created_at DESC`
	
	var transactions []models.Transaction
	err := r.db.Select(&transactions, query, userID)
	return transactions, err
}

func (r *OrderRepository) GetUserBalance(userID int) (money float64, energy float64, err error) {
	// Get user money
	moneyQuery := "SELECT money_eur FROM user_money WHERE user_id = $1"
	err = r.db.Get(&money, moneyQuery, userID)
	if err == sql.ErrNoRows {
		money = 10000 // Default starting amount
	} else if err != nil {
		return 0, 0, err
	}

	// Get user energy
	energyQuery := "SELECT energy_mwh FROM user_energy WHERE user_id = $1"
	err = r.db.Get(&energy, energyQuery, userID)
	if err == sql.ErrNoRows {
		energy = 10000 // Default starting amount
	} else if err != nil {
		return 0, 0, err
	}

	return money, energy, nil
}

func (r *OrderRepository) UpdateUserBalance(userID int, moneyDelta, energyDelta float64) error {
	tx, err := r.db.Beginx()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Update or insert money
	moneyQuery := `
		INSERT INTO user_money (user_id, money_eur)
		VALUES ($1, $2)
		ON CONFLICT (user_id)
		DO UPDATE SET money_eur = user_money.money_eur + $2`
	
	_, err = tx.Exec(moneyQuery, userID, moneyDelta)
	if err != nil {
		return err
	}

	// Update or insert energy
	energyQuery := `
		INSERT INTO user_energy (user_id, energy_mwh)
		VALUES ($1, $2)
		ON CONFLICT (user_id)
		DO UPDATE SET energy_mwh = user_energy.energy_mwh + $2`
	
	_, err = tx.Exec(energyQuery, userID, energyDelta)
	if err != nil {
		return err
	}

	return tx.Commit()
} 