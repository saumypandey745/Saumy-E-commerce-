const http = require('http');

async function testRBAC() {
    console.log("Testing RBAC...");
    
    // Test without token
    const res1 = await fetch('http://localhost:8000/api/sellers/products');
    console.log("No Token GET /api/sellers/products:", res1.status); // Expect 401

    const email = `test_seller_${Date.now()}@test.com`;
    // Register a dummy seller
    const registerRes = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            full_name: "Test Seller",
            email,
            password: "password123",
            role: "SELLER"
        })
    });
    
    const loginRes = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email,
            password: "password123"
        })
    });
    const loginData = await loginRes.json();

    if (loginData.accessToken) {
        const token = loginData.accessToken;
        
        // Test via Gateway
        const res2 = await fetch('http://localhost:8000/api/sellers/products', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data2 = await res2.json();
        console.log("Gateway GET /api/sellers/products:", res2.status, data2.success ? "Success" : data2);
        
        // Test Orders via Gateway
        const res3 = await fetch('http://localhost:8000/api/orders/seller', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data3 = await res3.json();
        console.log("Gateway GET /api/orders/seller:", res3.status, data3.success ? "Success" : data3);
    } else {
        console.log("Login Failed:", loginData);
    }
}

testRBAC().catch(console.error);
