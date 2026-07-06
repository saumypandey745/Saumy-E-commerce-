import requests
import json
import subprocess
import time

def run_cmd(cmd):
    try:
        res = subprocess.run(cmd, shell=True, capture_output=True, text=True, timeout=60)
        return res.stdout + res.stderr
    except subprocess.TimeoutExpired:
        return "Command timed out"

def test_api(name, method, url, data=None, headers=None):
    try:
        if method == "GET":
            res = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            res = requests.post(url, json=data, headers=headers, timeout=5)
        else:
            raise ValueError(f"Unsupported method: {method}")
        return {"status": res.status_code, "body": res.json()}
    except Exception as e:
        return {"error": str(e)}

def test_ui(route):
    try:
        res = requests.get(f"http://127.0.0.1:3000{route}", timeout=5)
        return {"status": res.status_code, "length": len(res.text)}
    except Exception as e:
        return {"error": str(e)}

def main():
    print("Gathering evidence...")

    report = "# Pre-Deployment Verification Evidence\n\n"

    # 1 & 2. Authentication & API Verification
    print("Testing Auth...")
    report += "## 1 & 2. Authentication & API Verification\n\n"

    health = test_api("Health", "GET", "http://127.0.0.1:8000/health")
    report += f"**GET /health**\n```json\n{json.dumps(health, indent=2)}\n```\n\n"

    reg_data = {
        "first_name": "Test",
        "last_name": "User",
        "email": f"test{int(time.time())}@example.com",
        "password": "Password123!"
    }
    register = test_api("Register", "POST", "http://127.0.0.1:8000/api/auth/register", data=reg_data)
    report += f"**POST /api/auth/register**\n```json\n{json.dumps(register, indent=2)}\n```\n\n"

    login_data = {
        "email": reg_data["email"],
        "password": "Password123!"
    }
    login_response = test_api("Login", "POST", "http://127.0.0.1:8000/api/auth/login", data=login_data)
    report += f"**POST /api/auth/login**\n```json\n{json.dumps(login_response, indent=2)}\n```\n\n"

    token = None
    login_body = login_response.get("body")
    if isinstance(login_body, dict):
        token = login_body.get("token") or login_body.get("accessToken")
    headers = {"Authorization": f"Bearer {token}"}

    products = test_api("Products", "GET", "http://127.0.0.1:8000/api/products")
    report += f"**GET /api/products**\n```json\n{json.dumps(products, indent=2)[:500]}...\n```\n\n"

    cart = test_api("Cart", "GET", "http://127.0.0.1:8000/api/cart", headers=headers)
    report += f"**GET /api/cart**\n```json\n{json.dumps(cart, indent=2)}\n```\n\n"

    orders = test_api("Orders", "GET", "http://127.0.0.1:8000/api/orders", headers=headers)
    report += f"**GET /api/orders**\n```json\n{json.dumps(orders, indent=2)}\n```\n\n"

    # 3. Frontend Verification
    print("Testing Frontend UI routes...")
    report += "## 3. Frontend Verification\n\n"
    routes = ['/', '/login', '/register', '/products', '/cart', '/wishlist', '/seller', '/admin']
    for r in routes:
        ui = test_ui(r)
        report += f"- Route `{r}`: Status {ui.get('status', ui.get('error'))} (HTML length: {ui.get('length', 0)})\n"
    report += "\n"

    # 7. Infrastructure Verification
    print("Testing Infra...")
    report += "## 7. Infrastructure Verification\n\n"
    infra = run_cmd("docker ps --format '{{.Names}}\t{{.Status}}'")
    report += f"**Docker Containers**\n```text\n{infra}\n```\n\n"
    redis_ping = run_cmd("redis-cli ping")
    report += f"**Redis Ping**: `{redis_ping.strip()}`\n"

    # 8. Production Build Verification
    print("Testing Builds...")
    report += "## 8. Production Build Verification\n\n"
    build_out = run_cmd("cd frontend/apps/storefront && pnpm build")
    report += f"**Frontend Build Output (truncated)**\n```text\n{build_out[-1000:]}\n```\n\n"

    with open("evidence_report.md", "w") as f:
        f.write(report)
    print("Done. Saved to evidence_report.md")


if __name__ == "__main__":
    main()
