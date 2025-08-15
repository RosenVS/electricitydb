package repositories

import (
	"time"

	"github.com/jmoiron/sqlx"
)

type User struct {
	ID           int       `db:"id"`
	Name         string    `db:"name"`
	Email        string    `db:"email"`
	PasswordHash string    `db:"password_hash"`
	CreatedAt    time.Time `db:"created_at"`
}

type UserRepository interface {
	CreateUser(name, email, passwordHash string) (int, error)
	GetUserByEmail(email string) (*User, error)
	GetUserByID(id int) (*User, error)

	GetUserEnergy(userID int) (float64, error)
	GetUserMoney(userID int) (float64, error)
}

type userRepository struct {
	db *sqlx.DB
}

func NewUserRepository(db *sqlx.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) CreateUser(name, email, passwordHash string) (int, error) {
	var id int
	err := r.db.QueryRow(
		`INSERT INTO users (name, email, password_hash, created_at) 
         VALUES ($1, $2, $3, NOW()) RETURNING id`,
		name, email, passwordHash,
	).Scan(&id)
	if err != nil {
		return 0, err
	}

	// Initialize user_energy with 1000 mwh
	_, err = r.db.Exec(
		`INSERT INTO user_energy (user_id, energy_mwh) VALUES ($1, $2)`,
		id, 1000.0,
	)
	if err != nil {
		return 0, err
	}

	// Initialize user_money with 10000 euros
	_, err = r.db.Exec(
		`INSERT INTO user_money (user_id, money_eur) VALUES ($1, $2)`,
		id, 10000.0,
	)
	if err != nil {
		return 0, err
	}

	return id, nil
}

func (r *userRepository) GetUserByEmail(email string) (*User, error) {
	var user User
	err := r.db.Get(&user, "SELECT * FROM users WHERE email=$1", email)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetUserByID(id int) (*User, error) {
	var user User
	err := r.db.Get(&user, "SELECT * FROM users WHERE id=$1", id)
	if err != nil {
		return nil, err
	}
	return &user, nil
}

func (r *userRepository) GetUserEnergy(userID int) (float64, error) {
	var energy float64
	err := r.db.Get(&energy, "SELECT energy_mwh FROM user_energy WHERE user_id=$1", userID)
	return energy, err
}

func (r *userRepository) GetUserMoney(userID int) (float64, error) {
	var money float64
	err := r.db.Get(&money, "SELECT money_eur FROM user_money WHERE user_id=$1", userID)
	return money, err
}
