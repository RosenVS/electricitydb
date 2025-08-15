package services

import (
	"fmt"
	"my-go-project/repositories"

	"github.com/jmoiron/sqlx"
)

type UserService interface {
	InitUserBalance(userID int) error
}

type userService struct {
	userRepo repositories.UserRepository
	db       *sqlx.DB
}

func NewUserService(userRepo repositories.UserRepository, db *sqlx.DB) UserService {
	return &userService{
		userRepo: userRepo,
		db:       db,
	}
}

func (s *userService) InitUserBalance(userID int) error {
	tx, err := s.db.Beginx()
	if err != nil {
		return err
	}
	defer func() {
		if err != nil {
			tx.Rollback()
		} else {
			tx.Commit()
		}
	}()

	// Insert initial energy 1 MWh (1000 kWh)
	_, err = tx.Exec("INSERT INTO user_energy (user_id, energy_mwh) VALUES ($1, $2)", userID, 1.0)
	if err != nil {
		return fmt.Errorf("failed to insert user_energy: %w", err)
	}

	// Insert initial money 10,000 EUR
	_, err = tx.Exec("INSERT INTO user_money (user_id, money_eur) VALUES ($1, $2)", userID, 10000.0)
	if err != nil {
		return fmt.Errorf("failed to insert user_money: %w", err)
	}

	return nil
}
