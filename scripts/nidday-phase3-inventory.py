import json
import re
from pathlib import Path

root = Path(__file__).resolve().parents[1]
schema_path = root / "packages/db/src/schema.ts"
snapshot_path = root / "packages/db/migrations/meta/0000_snapshot.json"
migrations_dir = root / "packages/db/migrations"

schema = schema_path.read_text()
snapshot = json.loads(snapshot_path.read_text())

schema_tables = sorted(set(re.findall(r'pgTable\s*\(\s*"([^"]+)"', schema)))
schema_enums = sorted(set(re.findall(r'pgEnum\s*\(\s*"([^"]+)"', schema)))
snapshot_tables = sorted(name.split(".")[-1] for name in snapshot.get("tables", {}).keys())
snapshot_enums = sorted(name.split(".")[-1] for name in snapshot.get("enums", {}).keys())

migration_files = sorted(migrations_dir.glob("*.sql"))
migration_names = [p.name for p in migration_files]
migration_text = "\n".join(p.read_text() for p in migration_files)

fk_targets = sorted(set(re.findall(r'REFERENCES\s+([A-Za-z0-9_."]+)', migration_text, re.I)))
created_tables = sorted(set(re.findall(r'CREATE TABLE\s+(?:IF NOT EXISTS\s+)?([A-Za-z0-9_."]+)', migration_text, re.I)))
created_enums = sorted(set(re.findall(r'CREATE TYPE\s+(?:IF NOT EXISTS\s+)?([A-Za-z0-9_."]+)', migration_text, re.I)))
created_functions = sorted(set(re.findall(r'CREATE(?: OR REPLACE)? FUNCTION\s+([A-Za-z0-9_."]+)', migration_text, re.I)))
created_triggers = sorted(set(re.findall(r'CREATE TRIGGER\s+([A-Za-z0-9_."]+)', migration_text, re.I)))
policy_names = sorted(set(re.findall(r'CREATE POLICY\s+"([^"]+)"', migration_text, re.I)))

result = {
    "repository": str(root),
    "schema_ts": {
        "tables": schema_tables,
        "table_count": len(schema_tables),
        "enums": schema_enums,
        "enum_count": len(schema_enums),
        "auth_references": sorted(set(re.findall(r'auth\.[A-Za-z0-9_]+', schema))),
        "private_references": sorted(set(re.findall(r'private\.[A-Za-z0-9_]+', schema))),
        "extensions_or_sql_symbols": sorted(set(re.findall(r'(?i)\b(?:vector|tsvector|to_tsvector|gen_random_uuid|auth\.uid|auth\.jwt)\b', schema))),
    },
    "snapshot": {
        "tables": snapshot_tables,
        "table_count": len(snapshot_tables),
        "enums": snapshot_enums,
        "enum_count": len(snapshot_enums),
        "schemas": sorted(snapshot.get("schemas", {}).keys()),
        "foreign_key_count": sum(len(t.get("foreignKeys", {})) for t in snapshot.get("tables", {}).values()),
        "policy_count": sum(len(t.get("policies", {})) for t in snapshot.get("tables", {}).values()),
        "rls_enabled_tables": sorted(k.split(".")[-1] for k, t in snapshot.get("tables", {}).items() if t.get("isRLSEnabled")),
    },
    "migrations": {
        "files": migration_names,
        "file_count": len(migration_names),
        "created_tables": created_tables,
        "created_enums": created_enums,
        "created_functions": created_functions,
        "created_triggers": created_triggers,
        "policy_names": policy_names,
        "foreign_key_targets": fk_targets,
    },
    "divergences": {
        "schema_only_tables": sorted(set(schema_tables) - set(snapshot_tables)),
        "snapshot_only_tables": sorted(set(snapshot_tables) - set(schema_tables)),
        "schema_only_enums": sorted(set(schema_enums) - set(snapshot_enums)),
        "snapshot_only_enums": sorted(set(snapshot_enums) - set(schema_enums)),
    },
}

out = root / "docs/nidday-phase3-inventory.json"
out.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
print(out)
print(json.dumps({
    "schema_tables": len(schema_tables),
    "snapshot_tables": len(snapshot_tables),
    "schema_enums": len(schema_enums),
    "snapshot_enums": len(snapshot_enums),
    "migration_files": len(migration_names),
    "created_tables_in_migrations": len(created_tables),
    "created_enums_in_migrations": len(created_enums),
    "created_functions_in_migrations": len(created_functions),
    "created_triggers_in_migrations": len(created_triggers),
}, ensure_ascii=False))
