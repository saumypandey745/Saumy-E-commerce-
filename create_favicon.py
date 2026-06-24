import base64
import os

# Minimal 1x1 transparent ICO file base64
icon_b64 = "AAABAAEAAQEAAAEAIAAwAAAAFgAAACgAAAABAAAAAgAAAAEAIAAAAAAACAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAwADAAQAAAAAAAAAAAAAAAQAAAAAAAAAAAAAAAAAAAA=="

output_path = "/home/saumy/portproject/ecommerce-enterprise/frontend/apps/storefront/src/app/favicon.ico"

with open(output_path, "wb") as f:
    f.write(base64.b64decode(icon_b64))

print("Created favicon.ico")
