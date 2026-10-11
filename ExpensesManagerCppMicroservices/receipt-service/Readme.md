# Receipts (Cheques) Microservice  
___  
## Endpoints:  
### Classificators
- `GET` - `/payment-methods` - Get list of active payment methods
- `GET` - `/categories` - None - Get list of expense categories
- `GET` - `/retail-chains` - None - Get list of retail chains
- `GET` - `/shops` - Query: retail_chain_id (integer, optional) - Get list of concrete shops filtered by retail chain
- `GET` - `/shops/{id}` - Get concrete shop details by ID  
### Cheques
- `GET` - `/cheques` - Get paginated list of receipts
- `GET` - `/cheques/{id}` -  Get receipt with items by ID
- `POST` - `/cheques` - Body: `CreateChequeDto` - Create a new receipt with items
- `DELETE` - `/cheques/{id}` - Delete receipt and related items by ID  

**CreateChequeDto**  
```json
{
  "concrete_store_id": 1,
  "payment_method_id": 1,
  "total_amount": 369.80,
  "items": [
    {
      "category_id": 1,
      "product_name": "Milk 3.2%",
      "quantity": 2.000,
      "unit_price": 89.90,
      "total_price": 179.80
    }
  ]
}
```

___
## How to access

Port is the same in both cases (`4000`), only the host differs.

**Docker (docker compose):** host `localhost`
```bash
curl http://localhost:4000/categories
```

**Minikube:** NodePort `30400` on the minikube node
```bash
curl http://$(minikube ip):30400/categories
```

Create a receipt — Docker:
```bash
curl -X POST http://localhost:4000/cheques \
  -H "Content-Type: application/json" \
  -d '{
    "concrete_store_id": 1,
    "payment_method_id": 1,
    "total_amount": 369.80,
    "items": [
      {
        "category_id": 1,
        "product_name": "Milk 3.2%",
        "quantity": 2.000,
        "unit_price": 89.90,
        "total_price": 179.80
      }
    ]
  }'
```
Create a receipt — Minikube:
```bash
curl -X POST http://$(minikube ip):30400/cheques \
  -H "Content-Type: application/json" \
  -d '{
    "concrete_store_id": 1,
    "payment_method_id": 1,
    "total_amount": 369.80,
    "items": [
      {
        "category_id": 1,
        "product_name": "Milk 3.2%",
        "quantity": 2.000,
        "unit_price": 89.90,
        "total_price": 179.80
      }
    ]
  }'
```