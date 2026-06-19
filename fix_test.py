import re

with open("test_services.py", "r") as f:
    content = f.read()

replacement = """    # 8. Create Order (Customer) via Cart
    print("\\n[Test 10] Adding to Cart as Customer...")
    cart_item = {
        "product_id": product_id,
        "seller_id": seller_id,
        "quantity": 2,
        "price": 299.99,
        "sku": "SW-101"
    }
    status, res = send_request("http://127.0.0.1:8000/api/cart/items", method='POST', data=cart_item, headers=headers_cust)
    print(f"Status: {status}, Response: {res}")
    assert status == 200 or status == 201, "Add to cart failed"
    
    print("\\n[Test 10.1] Checking out Cart...")
    checkout_data = {
        "shipping_address": "123 Innovation Boulevard, Cyber City",
        "card_number": "1111-2222-3333-4444"
    }
    status, res = send_request("http://127.0.0.1:8000/api/orders/checkout", method='POST', data=checkout_data, headers=headers_cust)
    print(f"Status: {status}, Response: {res}")
    assert status == 202, "Order checkout failed"
    order_id = res['order_id']
    print("✓ Order Checkout Successfully. RabbitMQ mock event dispatched.")"""

# Replace the block from [Test 10] to right before [Test 11]
new_content = re.sub(
    r'    # 8\. Create Order \(Customer\).*?    # 9\. Get User Orders',
    replacement + '\n\n    # 9. Get User Orders',
    content,
    flags=re.DOTALL
)

with open("test_services.py", "w") as f:
    f.write(new_content)

print("Test file patched successfully!")
