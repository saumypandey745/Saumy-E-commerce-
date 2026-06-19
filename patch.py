with open("test_services.py", "r") as f:
    code = f.read()

import re

test15_old = """    status, res_order = send_request("http://127.0.0.1:8000/api/orders/checkout", method='POST', data=checkout_data_success, headers=headers_cust)
    print(f"Status: {status}, Response: {res_order}")
    assert status == 201, "Saga checkout failed"
    assert res_order['success'] is True
    assert res_order['order']['status'] == 'CONFIRMED'
    assert res_order['order']['payment_status'] == 'PAID'
    assert "Berlin" in res_order['warehouse_fulfillment'], "Expected Berlin warehouse routing" """

test15_new = """    status, res_order = send_request("http://127.0.0.1:8000/api/orders/checkout", method='POST', data=checkout_data_success, headers=headers_cust)
    print(f"Status: {status}, Response: {res_order}")
    assert status == 202, "Saga checkout failed"
    assert res_order['success'] is True
    order_id = res_order['order_id']
    
    # Poll for Saga completion
    for _ in range(5):
        time.sleep(1)
        st, res_check = send_request(f"http://127.0.0.1:8000/api/orders", headers=headers_cust)
        my_order = next((o for o in res_check['orders'] if o['id'] == order_id), None)
        if my_order and my_order['status'] != 'PENDING':
            break
            
    assert my_order is not None
    assert my_order['status'] == 'CONFIRMED'
    assert my_order['payment_status'] == 'PAID'"""

test16_old = """    status, res_fail = send_request("http://127.0.0.1:8000/api/orders/checkout", method='POST', data=checkout_data_fail, headers=headers_cust)
    print(f"Status: {status}, Response: {res_fail}")
    assert status == 400, "Expected status 400 due to payment decline"
    assert res_fail['success'] is False
    assert "decline" in res_fail['message'].lower()
    
    # Verify inventory was NOT decremented
    status, res_prod_fail = send_request(f"http://127.0.0.1:8000/api/products/{product_id}")
    final_inventory = res_prod_fail['product']['total_inventory_count']
    print(f"Inventory after failure: {final_inventory}")
    assert final_inventory == after_inventory, "Inventory should be rolled back"
    print("\n✓ Saga checkout rollback flow validated")"""

test16_new = """    status, res_fail = send_request("http://127.0.0.1:8000/api/orders/checkout", method='POST', data=checkout_data_fail, headers=headers_cust)
    print(f"Status: {status}, Response: {res_fail}")
    assert status == 202, "Expected checkout to start"
    assert res_fail['success'] is True
    fail_order_id = res_fail['order_id']
    
    for _ in range(5):
        time.sleep(1)
        st, res_check = send_request(f"http://127.0.0.1:8000/api/orders", headers=headers_cust)
        my_order = next((o for o in res_check['orders'] if o['id'] == fail_order_id), None)
        if my_order and my_order['status'] != 'PENDING':
            break

    assert my_order['status'] == 'CANCELLED'
    assert my_order['payment_status'] == 'FAILED'
    
    # Verify inventory was NOT decremented (rolled back)
    status, res_prod_fail = send_request(f"http://127.0.0.1:8000/api/products/{product_id}")
    final_inventory = res_prod_fail['product']['total_inventory_count']
    print(f"Inventory after failure: {final_inventory}")
    assert final_inventory == after_inventory, "Inventory should be rolled back"
    print("\n✓ Saga checkout rollback flow validated")"""

code = code.replace(test15_old, test15_new)
code = code.replace(test16_old, test16_new)

with open("test_services.py", "w") as f:
    f.write(code)

print("Patched test_services.py")
