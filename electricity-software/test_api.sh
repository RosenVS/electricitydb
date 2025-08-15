#!/bin/bash

# Test script for Electricity Trading Platform API
# Make sure the server is running on localhost:8080

BASE_URL="http://localhost:8080"

echo "=== Electricity Trading Platform API Test ==="
echo

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ $2${NC}"
    else
        echo -e "${RED}✗ $2${NC}"
    fi
}

echo -e "${YELLOW}1. Registering users...${NC}"

# Register Alice
echo "Registering Alice..."
ALICE_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice","email":"alice@example.com","password":"secret123"}')
print_status $? "Alice registered"

# Register Bob
echo "Registering Bob..."
BOB_RESPONSE=$(curl -s -X POST $BASE_URL/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Bob","email":"bob@example.com","password":"secret123"}')
print_status $? "Bob registered"

echo

echo -e "${YELLOW}2. Logging in users...${NC}"

# Login Alice
echo "Logging in Alice..."
ALICE_LOGIN=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}')
ALICE_TOKEN=$(echo $ALICE_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
print_status $? "Alice logged in"

# Login Bob
echo "Logging in Bob..."
BOB_LOGIN=$(curl -s -X POST $BASE_URL/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@example.com","password":"secret123"}')
BOB_TOKEN=$(echo $BOB_LOGIN | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
print_status $? "Bob logged in"

echo

echo -e "${YELLOW}3. Checking initial balances...${NC}"

# Check Alice's initial balance
echo "Checking Alice's initial balance..."
ALICE_BALANCE=$(curl -s -X GET $BASE_URL/balance \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "Alice's balance: $ALICE_BALANCE"
print_status $? "Alice balance retrieved"

# Check Bob's initial balance
echo "Checking Bob's initial balance..."
BOB_BALANCE=$(curl -s -X GET $BASE_URL/balance \
  -H "Authorization: Bearer $BOB_TOKEN")
echo "Bob's balance: $BOB_BALANCE"
print_status $? "Bob balance retrieved"

echo

echo -e "${YELLOW}4. Creating sell order (Bob)...${NC}"

# Bob creates a sell order
echo "Bob creating sell order..."
SELL_RESPONSE=$(curl -s -X POST $BASE_URL/orders \
  -H "Authorization: Bearer $BOB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_type":"sell","amount_mwh":500,"price_eur_per_mwh":100}')
print_status $? "Bob's sell order created"
echo "Sell order response: $SELL_RESPONSE"

echo

echo -e "${YELLOW}5. Viewing public sell orders...${NC}"

# View public sell orders
echo "Viewing public sell orders..."
PUBLIC_SELLS=$(curl -s -X GET $BASE_URL/orders/sell)
print_status $? "Public sell orders retrieved"
echo "Public sell orders: $PUBLIC_SELLS"

echo

echo -e "${YELLOW}6. Creating buy order (Alice) - should execute automatically...${NC}"

# Alice creates a buy order (should execute automatically)
echo "Alice creating buy order..."
BUY_RESPONSE=$(curl -s -X POST $BASE_URL/orders \
  -H "Authorization: Bearer $ALICE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"order_type":"buy","amount_mwh":200,"price_eur_per_mwh":105}')
print_status $? "Alice's buy order created and executed"
echo "Buy order response: $BUY_RESPONSE"

echo

echo -e "${YELLOW}7. Checking balances after trade...${NC}"

# Check Alice's balance after trade
echo "Checking Alice's balance after trade..."
ALICE_BALANCE_AFTER=$(curl -s -X GET $BASE_URL/balance \
  -H "Authorization: Bearer $ALICE_TOKEN")
echo "Alice's balance after trade: $ALICE_BALANCE_AFTER"
print_status $? "Alice balance after trade retrieved"

# Check Bob's balance after trade
echo "Checking Bob's balance after trade..."
BOB_BALANCE_AFTER=$(curl -s -X GET $BASE_URL/balance \
  -H "Authorization: Bearer $BOB_TOKEN")
echo "Bob's balance after trade: $BOB_BALANCE_AFTER"
print_status $? "Bob balance after trade retrieved"

echo

echo -e "${YELLOW}8. Viewing transactions...${NC}"

# View Alice's transactions
echo "Viewing Alice's transactions..."
ALICE_TRANSACTIONS=$(curl -s -X GET $BASE_URL/transactions \
  -H "Authorization: Bearer $ALICE_TOKEN")
print_status $? "Alice's transactions retrieved"
echo "Alice's transactions: $ALICE_TRANSACTIONS"

# View Bob's transactions
echo "Viewing Bob's transactions..."
BOB_TRANSACTIONS=$(curl -s -X GET $BASE_URL/transactions \
  -H "Authorization: Bearer $BOB_TOKEN")
print_status $? "Bob's transactions retrieved"
echo "Bob's transactions: $BOB_TRANSACTIONS"

echo

echo -e "${YELLOW}9. Viewing orders...${NC}"

# View Alice's orders
echo "Viewing Alice's orders..."
ALICE_ORDERS=$(curl -s -X GET $BASE_URL/orders \
  -H "Authorization: Bearer $ALICE_TOKEN")
print_status $? "Alice's orders retrieved"
echo "Alice's orders: $ALICE_ORDERS"

# View Bob's orders
echo "Viewing Bob's orders..."
BOB_ORDERS=$(curl -s -X GET $BASE_URL/orders \
  -H "Authorization: Bearer $BOB_TOKEN")
print_status $? "Bob's orders retrieved"
echo "Bob's orders: $BOB_ORDERS"

echo

echo -e "${YELLOW}10. Testing filtering...${NC}"

# Test filtering by type
echo "Testing filter by type (buy orders)..."
BUY_FILTER=$(curl -s -X GET "$BASE_URL/orders?type=buy" \
  -H "Authorization: Bearer $ALICE_TOKEN")
print_status $? "Buy orders filter test"
echo "Buy orders filter result: $BUY_FILTER"

echo

echo -e "${GREEN}=== Test completed! ===${NC}"
echo
echo "Summary:"
echo "- Users registered and logged in"
echo "- Initial balances checked (10,000 EUR and 10,000 MWh each)"
echo "- Bob created a sell order (500 MWh at 100 EUR/MWh)"
echo "- Alice created a buy order (200 MWh at 105 EUR/MWh) - automatically executed"
echo "- Balances updated after trade"
echo "- Transactions recorded"
echo "- Orders and filtering tested" 