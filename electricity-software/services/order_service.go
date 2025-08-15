package services

import (
	"errors"
	"fmt"
	"my-go-project/models"
	"my-go-project/repositories"
)

type OrderService struct {
	orderRepo *repositories.OrderRepository
}

func NewOrderService(orderRepo *repositories.OrderRepository) *OrderService {
	return &OrderService{orderRepo: orderRepo}
}

func (s *OrderService) CreateOrder(userID int, req models.CreateOrderRequest) (*models.Order, error) {
	// Check user balance
	money, energy, err := s.orderRepo.GetUserBalance(userID)
	if err != nil {
		return nil, fmt.Errorf("failed to get user balance: %w", err)
	}

	// Validate order based on type
	if req.OrderType == models.OrderTypeBuy {
		totalCost := req.AmountMWh * req.PriceEurPerMWh
		if money < totalCost {
			return nil, errors.New("insufficient funds")
		}
	} else if req.OrderType == models.OrderTypeSell {
		if energy < req.AmountMWh {
			return nil, errors.New("insufficient energy")
		}
	}

	// Create the order
	order := &models.Order{
		UserID:         userID,
		OrderType:      req.OrderType,
		AmountMWh:      req.AmountMWh,
		PriceEurPerMWh: req.PriceEurPerMWh,
		Status:         models.OrderStatusOpen,
	}

	err = s.orderRepo.CreateOrder(order)
	if err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	// If it's a buy order, execute it immediately
	if req.OrderType == models.OrderTypeBuy {
		err = s.executeBuyOrder(order)
		if err != nil {
			// If execution fails, we should probably cancel the order
			// For now, just return the error
			return nil, fmt.Errorf("buy order created but execution failed: %w", err)
		}
	}

	return order, nil
}

func (s *OrderService) executeBuyOrder(buyOrder *models.Order) error {
	// Get available sell orders
	sellOrders, err := s.orderRepo.GetSellOrders(models.OrderFilter{})
	if err != nil {
		return fmt.Errorf("failed to get sell orders: %w", err)
	}

	remainingAmount := buyOrder.AmountMWh
	totalCost := 0.0

	// Try to match with existing sell orders
	for _, sellOrder := range sellOrders {
		if remainingAmount <= 0 {
			break
		}

		// Check if sell price is acceptable
		if sellOrder.PriceEurPerMWh > buyOrder.PriceEurPerMWh {
			continue // Skip if sell price is higher than buy price
		}

		// Calculate how much we can buy from this sell order
		amountToBuy := remainingAmount
		if sellOrder.AmountMWh < amountToBuy {
			amountToBuy = sellOrder.AmountMWh
		}

		// Prevent self-trading
		if buyOrder.UserID == sellOrder.UserID {
			continue // Skip if buyer and seller are the same user
		}

		// Execute the transaction
		err = s.executeTransaction(buyOrder.UserID, sellOrder.UserID, amountToBuy, sellOrder.PriceEurPerMWh, &buyOrder.ID, &sellOrder.ID)
		if err != nil {
			return fmt.Errorf("failed to execute transaction: %w", err)
		}

		// Update sell order
		remainingSellAmount := sellOrder.AmountMWh - amountToBuy
		if remainingSellAmount <= 0 {
			// Sell order is completely fulfilled, mark as completed
			updates := map[string]interface{}{
				"status": models.OrderStatusCompleted,
			}
			err = s.orderRepo.UpdateOrder(sellOrder.ID, updates)
			if err != nil {
				return fmt.Errorf("failed to update sell order: %w", err)
			}
		} else {
			// Sell order is partially fulfilled, update remaining amount
			updates := map[string]interface{}{
				"amount_mwh": remainingSellAmount,
			}
			err = s.orderRepo.UpdateOrder(sellOrder.ID, updates)
			if err != nil {
				return fmt.Errorf("failed to update sell order: %w", err)
			}
		}

		remainingAmount -= amountToBuy
		totalCost += amountToBuy * sellOrder.PriceEurPerMWh
	}

	// Update buy order
	if remainingAmount <= 0 {
		// Order is completely fulfilled, mark as completed
		updates := map[string]interface{}{
			"status": models.OrderStatusCompleted,
		}
		err = s.orderRepo.UpdateOrder(buyOrder.ID, updates)
		if err != nil {
			return fmt.Errorf("failed to update buy order: %w", err)
		}
	} else {
		// Order is partially fulfilled, update remaining amount
		updates := map[string]interface{}{
			"amount_mwh": remainingAmount,
		}
		err = s.orderRepo.UpdateOrder(buyOrder.ID, updates)
		if err != nil {
			return fmt.Errorf("failed to update buy order: %w", err)
		}
	}

	return nil
}

func (s *OrderService) executeTransaction(buyerID, sellerID int, amountMWh, priceEurPerMWh float64, buyOrderID *int, sellOrderID *int) error {
	totalEur := amountMWh * priceEurPerMWh

	// Create transaction for buyer
	buyerTransaction := &models.Transaction{
		UserID:          buyerID,
		OrderID:         buyOrderID,
		TransactionType: models.OrderTypeBuy,
		AmountMWh:       amountMWh,
		PriceEurPerMWh:  priceEurPerMWh,
		TotalEur:        totalEur,
	}

	err := s.orderRepo.CreateTransaction(buyerTransaction)
	if err != nil {
		return fmt.Errorf("failed to create buyer transaction: %w", err)
	}

	// Create transaction for seller
	sellerTransaction := &models.Transaction{
		UserID:          sellerID,
		OrderID:         sellOrderID,
		TransactionType: models.OrderTypeSell,
		AmountMWh:       amountMWh,
		PriceEurPerMWh:  priceEurPerMWh,
		TotalEur:        totalEur,
	}

	err = s.orderRepo.CreateTransaction(sellerTransaction)
	if err != nil {
		return fmt.Errorf("failed to create seller transaction: %w", err)
	}

	// Update balances
	// Buyer: loses money, gains energy
	err = s.orderRepo.UpdateUserBalance(buyerID, -totalEur, amountMWh)
	if err != nil {
		return fmt.Errorf("failed to update buyer balance: %w", err)
	}

	// Seller: gains money, loses energy
	err = s.orderRepo.UpdateUserBalance(sellerID, totalEur, -amountMWh)
	if err != nil {
		return fmt.Errorf("failed to update seller balance: %w", err)
	}

	return nil
}

func (s *OrderService) GetOrdersByUser(userID int, filter models.OrderFilter) ([]models.Order, error) {
	return s.orderRepo.GetOrdersByUser(userID, filter)
}

func (s *OrderService) GetSellOrders(filter models.OrderFilter) ([]models.Order, error) {
	return s.orderRepo.GetSellOrders(filter)
}

func (s *OrderService) GetOrderByID(id int) (*models.Order, error) {
	return s.orderRepo.GetOrderByID(id)
}

func (s *OrderService) UpdateOrder(id int, userID int, req models.UpdateOrderRequest) error {
	// Check if order exists and belongs to user
	order, err := s.orderRepo.GetOrderByID(id)
	if err != nil {
		return fmt.Errorf("order not found: %w", err)
	}

	if order.UserID != userID {
		return errors.New("unauthorized: order does not belong to user")
	}

	if order.Status != models.OrderStatusOpen {
		return errors.New("cannot update order: order is not open")
	}

	// Build updates map
	updates := make(map[string]interface{})
	if req.AmountMWh != nil {
		updates["amount_mwh"] = *req.AmountMWh
	}
	if req.PriceEurPerMWh != nil {
		updates["price_eur_per_mwh"] = *req.PriceEurPerMWh
	}

	return s.orderRepo.UpdateOrder(id, updates)
}

func (s *OrderService) DeleteOrder(id int, userID int) error {
	// Check if order exists and belongs to user
	order, err := s.orderRepo.GetOrderByID(id)
	if err != nil {
		return fmt.Errorf("order not found: %w", err)
	}

	if order.UserID != userID {
		return errors.New("unauthorized: order does not belong to user")
	}

	if order.Status != models.OrderStatusOpen {
		return errors.New("cannot delete order: order is not open")
	}

	return s.orderRepo.DeleteOrder(id)
}

func (s *OrderService) GetTransactionsByUser(userID int) ([]models.Transaction, error) {
	return s.orderRepo.GetTransactionsByUser(userID)
}

func (s *OrderService) GetUserBalance(userID int) (money float64, energy float64, err error) {
	return s.orderRepo.GetUserBalance(userID)
} 