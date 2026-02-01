import re
import os
from app.db.DGaph import ingest_file, ingest_dependencies

JS_PATTERNS = [
    r"from\s+['\"](.*)['\"]", 
    r"require\(['\"](.*)['\"]\)", 
    r"import\(['\"](.*)['\"]\)" 
]

IMPORT_PATTERNS = {
    ".py": [
        r"^import\s+(\S+)",           
        r"^from\s+(\S+)\s+import"     
    ],
    ".js": JS_PATTERNS,
    ".ts": JS_PATTERNS,
    ".jsx": JS_PATTERNS,
    ".tsx": JS_PATTERNS,
    ".go": [
        r"\"(.+)\""              
    ]
}
def extract_imports(file_path, content):
    """
    Scans the file content and returns a list of raw import strings.
    """
    ext = os.path.splitext(file_path)[1]
    if ext not in IMPORT_PATTERNS:
        return []
    
    imports = []
    for pattern in IMPORT_PATTERNS[ext]:
        matches = re.findall(pattern, content, re.MULTILINE)
        imports.extend(matches)
    return imports

def resolve_path(current_file_path, import_str, root_dir):
    """
    Converts relative imports ('./utils') into absolute file paths.
    """
    if not import_str.startswith("."):
        return None 
    base_dir = os.path.dirname(current_file_path)
    target_path = os.path.normpath(os.path.join(base_dir, import_str))

    possible_extensions = [".py", ".js", ".ts", ".tsx", ".jsx", ".go"]
    
    for ext in possible_extensions:
        candidate = target_path + ext
        if os.path.exists(candidate):
            return os.path.relpath(candidate, root_dir)
    
    return None

def process_repository(repo_root,repo_url):
    print(f"Starting graph ingestion for: {repo_root}")
    
    for root, _, files in os.walk(repo_root):
        for file in files:
            if file.startswith("."): continue
            
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, repo_root)
            ingest_file(rel_path, repo_url)

            try:
                with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
                    content = f.read()
                
                raw_imports = extract_imports(full_path, content)
                resolved_deps = []
                for imp in raw_imports:
                    res = resolve_path(full_path, imp, repo_root)
                    if res:
                        resolved_deps.append(res)

                if resolved_deps:
                    ingest_dependencies(rel_path, resolved_deps, repo_url)
                    print(f"{rel_path} imports {len(resolved_deps)} files")

            except Exception as e:
                print(f"Failed to process {rel_path}: {e}")

    print("Graph ingestion complete!")