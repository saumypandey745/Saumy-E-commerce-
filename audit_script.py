import os
import json
import re

def count_lines_and_todos(directory):
    total_lines = 0
    todos = 0
    js_ts_files = 0
    test_files = 0
    for root, dirs, files in os.walk(directory):
        if 'node_modules' in root or '.git' in root or '.next' in root:
            continue
        for f in files:
            if f.endswith(('.js', '.ts', '.tsx', '.jsx', '.py')):
                js_ts_files += 1
                if 'test' in f or 'spec' in f:
                    test_files += 1
                try:
                    with open(os.path.join(root, f), 'r', encoding='utf-8') as fp:
                        lines = fp.readlines()
                        total_lines += len(lines)
                        for line in lines:
                            if 'TODO' in line or 'FIXME' in line:
                                todos += 1
                except:
                    pass
    return {"lines": total_lines, "files": js_ts_files, "tests": test_files, "todos": todos}

report = {}
base = '.'
report['api-gateway'] = count_lines_and_todos(f'{base}/api-gateway')
for svc in os.listdir(f'{base}/microservices'):
    path = f'{base}/microservices/{svc}'
    if os.path.isdir(path):
        report[svc] = count_lines_and_todos(path)

for app in os.listdir(f'{base}/frontend/apps'):
    path = f'{base}/frontend/apps/{app}'
    if os.path.isdir(path):
        report[app] = count_lines_and_todos(path)

print(json.dumps(report, indent=2))
