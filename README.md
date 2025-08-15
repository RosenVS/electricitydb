# Платформа за Търговия с Електроенергия

REST API базиран на Go за търговия с електроенергия между потребители. Всеки потребител започва с 10,000 EUR и 10,000 MWh енергия.

## Функционалности

- **Потребителска Автентикация**: Регистрация и влизане с JWT токени
- **Управление на Поръчки**: Създаване, четене, обновяване и изтриване на поръчки за купуване/продажба
- **Автоматично Изпълнение на Поръчки за Купуване**: Поръчките за купуване се изпълняват автоматично срещу наличните поръчки за продажба
- **Управление на Баланси**: Проследяване на паричните и енергийните баланси на потребителите
- **История на Транзакциите**: Преглед на всички завършени транзакции
- **Публични Поръчки за Продажба**: Всеки може да вижда наличните поръчки за продажба
- **Филтриране**: Филтриране на поръчки по тип и период

## Конфигурация

## Software Start
`go mod tidy`
`go run main.go`

## Frontend Start
`npm start`


### 1. Създаване на .env файл

Създайте `.env` файл в основната директория на проекта:

```bash
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=1204
DB_NAME=electricitydb
DB_SSLMODE=disable

# JWT Configuration
JWT_SECRET=supersecretkey

# Server Configuration
SERVER_PORT=8080
SERVER_HOST=localhost

# Environment
ENV=development
```

### 2. Настройка на Базата Данни

1. Създайте PostgreSQL база данни с име `electricitydb` (или каквото име сте задали в `.env` файла)
2. Изпълнете SQL миграцията:

#### **Вариант 1: От командния ред**
```bash
# За нови инсталации
psql -h localhost -U postgres -d electricitydb -f migrations/001_initial_schema.sql

# Ако psql не е в PATH, използвайте пълния път, този PATH е мой, трябва да се промени на ваш: За автоматично създаване на базата данни (откоментирайте CREATE DATABASE в SQL файла)
 /opt/homebrew/Cellar/postgresql@15/15.13/bin/psql -h localhost -U postgres -f migrations/001_initial_schema.sql
```

#### **Вариант 2: Механично**
Създавате база данни с име и копирате кодът от файл migrations/001_initial_schema.sql и рънвате в Query самият код след създаването на база данни


**Забележка**: Заменете `electricitydb` с името на вашата база данни от `.env` файла.

### 3. Тестване на Настройката

След като изпълните SQL миграцията, можете да тествате дали всичко работи правилно:

```bash
# Направете скрипта изпълним
chmod +x test_api.sh

# Стартирайте тестовете
./test_api.sh
```

Този скрипт ще:
- Регистрира тестови потребители
- Създаде поръчки
- Тества всички API крайни точки
- Покаже резултатите от тестовете

**Важно**: Уверете се, че backend сървърът работи (`go run main.go`) преди да стартирате тестовете.

## API Крайни Точки

### Автентикация

#### POST /register
Регистрация на нов потребител.

```bash
curl -X POST http://localhost:8080/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Алиса",
    "email": "alice@example.com",
    "password": "secret123"
  }'
```

#### POST /login
Влизане и получаване на JWT токен.

```bash
curl -X POST http://localhost:8080/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "alice@example.com",
    "password": "secret123"
  }'
```

Отговор:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Поръчки

#### GET /orders
Получаване на поръчките на потребителя с опционално филтриране.

```bash
curl -X GET "http://localhost:8080/orders?type=buy&from=2025-01-01&to=2025-01-31" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Параметри за заявка:
- `type`: Филтриране по тип на поръчката (`buy` или `sell`)
- `from`: Начална дата (YYYY-MM-DD)
- `to`: Крайна дата (YYYY-MM-DD)

#### POST /orders
Създаване на нова поръчка.

```bash
curl -X POST http://localhost:8080/orders \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "order_type": "buy",
    "amount_mwh": 100,
    "price_eur_per_mwh": 95
  }'
```

**Поръчки за Купуване**: Автоматично се изпълняват срещу наличните поръчки за продажба. Парите се приспадат незабавно.
**Поръчки за Продажба**: Поставят се на пазара за други потребители да купят.

#### GET /orders/:id
Получаване на конкретна поръчка.

```bash
curl -X GET http://localhost:8080/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### PUT /orders/:id
Обновяване на поръчка (само отворените поръчки могат да се обновяват).

```bash
curl -X PUT http://localhost:8080/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount_mwh": 150,
    "price_eur_per_mwh": 90
  }'
```

#### DELETE /orders/:id
Изтриване на поръчка (само отворените поръчки могат да се изтриват).

```bash
curl -X DELETE http://localhost:8080/orders/1 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Публични Крайни Точки

#### GET /orders/sell
Получаване на всички налични поръчки за продажба (публична крайна точка, не изисква автентикация).

```bash
curl -X GET "http://localhost:8080/orders/sell?from=2025-01-01&to=2025-01-31"
```

### Потребителски Данни

#### GET /balance
Получаване на текущия баланс на потребителя.

```bash
curl -X GET http://localhost:8080/balance \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Отговор:
```json
{
  "money_eur": 8500.00,
  "energy_mwh": 10500.00
}
```

#### GET /transactions
Получаване на историята на транзакциите на потребителя.

```bash
curl -X GET http://localhost:8080/transactions \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### GET /auth/profile
Получаване на информация за профила на потребителя.

```bash
curl -X GET http://localhost:8080/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Бизнес Логика

### Поръчки за Купуване
1. Потребителят създава поръчка за купуване с количество и максимална цена
2. Системата автоматично съпоставя с наличните поръчки за продажба
3. Парите се приспадат от сметката на купувача
4. Енергията се прехвърля в сметката на купувача
5. Поръчките за продажба се частично или напълно изпълняват
6. Транзакциите се записват за двете страни

### Поръчки за Продажба
1. Потребителят създава поръчка за продажба с количество и минимална цена
2. Поръчката се поставя на пазара
3. Други потребители могат да видят поръчката за продажба чрез `/orders/sell`
4. Когато поръчка за купуване съвпада, поръчката за продажба се изпълнява
5. Парите се прехвърлят в сметката на продавача
6. Енергията се приспада от сметката на продавача

### Правила за Верификация
- Потребителите могат да редактират/изтриват само собствените си поръчки
- Само отворените поръчки могат да се редактират или изтриват
- Поръчките за купуване изискват достатъчно средства
- Поръчките за продажба изискват достатъчно енергия
- Поръчките се съпоставят по цена (цена за купуване >= цена за продажба)

## Стартиране на Приложението

1. Настройте PostgreSQL база данни
2. Създайте `.env` файл с правилните настройки
3. Стартирайте приложението:

```bash
go run main.go
```

Сървърът ще стартира на `http://localhost:8080`

## Примерен Поток на Използване

1. **Регистриране на двама потребители**:
   ```bash
   # Регистриране на Алиса
   curl -X POST http://localhost:8080/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Алиса","email":"alice@example.com","password":"secret123"}'
   
   # Регистриране на Боб
   curl -X POST http://localhost:8080/register \
     -H "Content-Type: application/json" \
     -d '{"name":"Боб","email":"bob@example.com","password":"secret123"}'
   ```

2. **Влизане и получаване на токени**:
   ```bash
   # Токен на Алиса
   curl -X POST http://localhost:8080/login \
     -H "Content-Type: application/json" \
     -d '{"email":"alice@example.com","password":"secret123"}'
   
   # Токен на Боб
   curl -X POST http://localhost:8080/login \
     -H "Content-Type: application/json" \
     -d '{"email":"bob@example.com","password":"secret123"}'
   ```

3. **Боб създава поръчка за продажба**:
   ```bash
   curl -X POST http://localhost:8080/orders \
     -H "Authorization: Bearer BOB_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"order_type":"sell","amount_mwh":500,"price_eur_per_mwh":100}'
   ```

4. **Алиса създава поръчка за купуване** (автоматично се изпълнява):
   ```bash
   curl -X POST http://localhost:8080/orders \
     -H "Authorization: Bearer ALICE_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"order_type":"buy","amount_mwh":200,"price_eur_per_mwh":105}'
   ```

5. **Проверка на баланси и транзакции**:
   ```bash
   # Проверка на баланса на Алиса
   curl -X GET http://localhost:8080/balance \
     -H "Authorization: Bearer ALICE_TOKEN"
   
   # Проверка на баланса на Боб
   curl -X GET http://localhost:8080/balance \
     -H "Authorization: Bearer BOB_TOKEN"
   
   # Проверка на транзакциите на Алиса
   curl -X GET http://localhost:8080/transactions \
     -H "Authorization: Bearer ALICE_TOKEN"
   ```

## Обработка на Грешки

API-то връща подходящи HTTP статус кодове и съобщения за грешки:

- `400 Bad Request`: Невалидни входни данни
- `401 Unauthorized`: Липсващ или невалиден JWT токен
- `403 Forbidden`: Потребителят не притежава ресурса
- `404 Not Found`: Ресурсът не е намерен
- `500 Internal Server Error`: Грешка в сървъра

Отговорите за грешки включват описателно съобщение:
```json
{
  "error": "недостатъчно средства"
}
```

## Тестване на API

Използвайте предоставения тест скрипт за проверка на функционалността:

```bash
chmod +x test_api.sh
./test_api.sh
```

## Структура на Базата Данни

Схемата включва:
- **users**: Потребителски акаунти
- **user_energy**: Енергийни баланси на потребителите
- **user_money**: Парични баланси на потребителите
- **orders**: Поръчки за купуване/продажба
- **transactions**: История на транзакциите
- **price_per_mwh**: Конфигурация на цените

Всички таблици включват подходящи индекси за оптимална производителност. 