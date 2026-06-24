import os

pages = [
    "rewards",
    "security",
    "about",
    "careers",
    "stores",
    "blog",
    "reviews",
    "privacy",
    "terms",
    "cookies"
]

base_path = "/home/saumy/portproject/ecommerce-enterprise/frontend/apps/storefront/src/app"

content = """export default function Page() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-20 text-center">
      <h1 className="text-4xl font-bold mb-4 capitalize">Page</h1>
      <p className="text-slate-500">This page is under construction.</p>
    </div>
  );
}
"""

for page in pages:
    dir_path = os.path.join(base_path, page)
    os.makedirs(dir_path, exist_ok=True)
    file_path = os.path.join(dir_path, "page.tsx")
    with open(file_path, "w") as f:
        f.write(content.replace("Page", page.capitalize()))

print("Missing pages created successfully.")
