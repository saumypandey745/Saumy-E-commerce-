import os
import re
import json

base_path = '/home/saumy/portproject/ecommerce-enterprise'

report = {
    "fake_data": [],
    "todos": [],
    "hardcoded_secrets": [],
    "endpoints": [],
    "schemas": [],
    "vulnerabilities": [],
    "missing_tests": []
}

def analyze_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
            lines = content.split('\n')
            
            # Fake Data / LocalStorage Auth
            if 'localStorage.getItem(' in content and ('token' in content.lower() or 'user' in content.lower()):
                report['fake_data'].append({"file": filepath, "issue": "Uses localStorage for Auth/Tokens (Insecure/Fake)"})
            if 'const data = [' in content or 'useState([' in content:
                if re.search(r'const\s+\w+\s*=\s*\[\s*\{', content):
                    report['fake_data'].append({"file": filepath, "issue": "Hardcoded arrays used instead of API calls"})
            
            # TODOs and FIXMEs
            for i, line in enumerate(lines):
                if 'TODO' in line or 'FIXME' in line:
                    report['todos'].append({"file": filepath, "line": i+1, "comment": line.strip()})
                
                # Hardcoded secrets
                if re.search(r'(secret|password|key)\s*=\s*["\'][^"\']+["\']', line, re.I):
                    if not 'process.env' in line and not 'req.body' in line:
                        report['hardcoded_secrets'].append({"file": filepath, "line": i+1, "match": line.strip()})
                
                # Endpoints (Express)
                if re.search(r'app\.(get|post|put|delete|patch)\([\'"]/', line):
                    report['endpoints'].append({"file": filepath, "route": line.strip()})
                
                # Schemas (Mongoose)
                if 'new mongoose.Schema' in line:
                    report['schemas'].append({"file": filepath, "schema_def": line.strip()})

                # Vulnerabilities
                if 'dangerouslySetInnerHTML' in line:
                    report['vulnerabilities'].append({"file": filepath, "line": i+1, "issue": "XSS Vulnerability: dangerouslySetInnerHTML"})
                if 'eval(' in line:
                    report['vulnerabilities'].append({"file": filepath, "line": i+1, "issue": "Command Injection: eval()"})
    except:
        pass

for root, dirs, files in os.walk(base_path):
    if 'node_modules' in root or '.git' in root or '.next' in root or 'dist' in root:
        continue
    for file in files:
        if file.endswith(('.js', '.ts', '.tsx', '.jsx', '.json', '.yaml', '.yml', '.env')):
            filepath = os.path.join(root, file)
            analyze_file(filepath)

print(json.dumps(report, indent=2))
