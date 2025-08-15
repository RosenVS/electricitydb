package services

import (
	"errors"

	"my-go-project/repositories"

	"golang.org/x/crypto/bcrypt"
)

type AuthService interface {
	Register(name, email, password string) (int, error)
	Login(email, password string) (int, error)
	GetUserEnergy(userID int) (float64, error)
	GetUserMoney(userID int) (float64, error)
}

type authService struct {
	userRepo repositories.UserRepository
}

func NewAuthService(userRepo repositories.UserRepository) AuthService {
	return &authService{userRepo: userRepo}
}

func (s *authService) Register(name, email, password string) (int, error) {
	existingUser, _ := s.userRepo.GetUserByEmail(email)
	if existingUser != nil {
		return 0, errors.New("email already in use")
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
	if err != nil {
		return 0, err
	}

	return s.userRepo.CreateUser(name, email, string(hashedPassword))
}

func (s *authService) Login(email, password string) (int, error) {
	user, err := s.userRepo.GetUserByEmail(email)
	if err != nil || user == nil {
		return 0, errors.New("invalid email or password")
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.PasswordHash), []byte(password))
	if err != nil {
		return 0, errors.New("invalid email or password")
	}

	return user.ID, nil
}

func (s *authService) GetUserEnergy(userID int) (float64, error) {
	return s.userRepo.GetUserEnergy(userID)
}

func (s *authService) GetUserMoney(userID int) (float64, error) {
	return s.userRepo.GetUserMoney(userID)
}
