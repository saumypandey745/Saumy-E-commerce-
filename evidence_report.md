# Pre-Deployment Verification Evidence

## 1 & 2. Authentication & API Verification

**GET /health**
```json
{
  "error": "HTTPConnectionPool(host='127.0.0.1', port=8000): Max retries exceeded with url: /health (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242de70>: Failed to establish a new connection: [Errno 111] Connection refused'))"
}
```

**POST /api/auth/register**
```json
{
  "error": "HTTPConnectionPool(host='127.0.0.1', port=8000): Max retries exceeded with url: /api/auth/register (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242ec20>: Failed to establish a new connection: [Errno 111] Connection refused'))"
}
```

**POST /api/auth/login**
```json
{
  "error": "HTTPConnectionPool(host='127.0.0.1', port=8000): Max retries exceeded with url: /api/auth/login (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242f7f0>: Failed to establish a new connection: [Errno 111] Connection refused'))"
}
```

**GET /api/products**
```json
{
  "error": "HTTPConnectionPool(host='127.0.0.1', port=8000): Max retries exceeded with url: /api/products (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242e6b0>: Failed to establish a new connection: [Errno 111] Connection refused'))"
}...
```

**GET /api/cart**
```json
{
  "error": "HTTPConnectionPool(host='127.0.0.1', port=8000): Max retries exceeded with url: /api/cart (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242de40>: Failed to establish a new connection: [Errno 111] Connection refused'))"
}
```

**GET /api/orders**
```json
{
  "error": "HTTPConnectionPool(host='127.0.0.1', port=8000): Max retries exceeded with url: /api/orders (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032228c430>: Failed to establish a new connection: [Errno 111] Connection refused'))"
}
```

## 3. Frontend Verification

- Route `/`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: / (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032228d090>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)
- Route `/login`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: /login (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242fe80>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)
- Route `/register`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: /register (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242caf0>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)
- Route `/products`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: /products (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242d780>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)
- Route `/cart`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: /cart (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242e3b0>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)
- Route `/wishlist`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: /wishlist (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032242f1c0>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)
- Route `/seller`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: /seller (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032228cdc0>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)
- Route `/admin`: Status HTTPConnectionPool(host='127.0.0.1', port=3000): Max retries exceeded with url: /admin (Caused by NewConnectionError('<urllib3.connection.HTTPConnection object at 0x74032228c550>: Failed to establish a new connection: [Errno 111] Connection refused')) (HTML length: 0)

## 7. Infrastructure Verification

**Docker Containers**
```text
ecommerce-enterprise-ai-ml-service-1	Up 2 hours

```

**Redis Ping**: `PONG`
## 8. Production Build Verification

**Frontend Build Output (truncated)**
```text
/bin/sh: 1: cd: can't cd to storefront

```

