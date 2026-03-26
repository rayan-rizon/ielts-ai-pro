#!/usr/bin/env python3
"""
Supabase Hash-Based Delta Sync Script
======================================
Fast migration sync that only uploads changed files using SHA-256 hashes.
Runs in seconds, not minutes.

Usage:
    python scripts/supabase_sync.py [--dry-run] [--force] [--local] [--remote]

Options:
    --dry-run    Show what would be synced without actually syncing
    --force      Force sync all migrations (ignore hash cache)
    --local      Sync to local Supabase instance only
    --remote     Sync to remote Supabase instance only (default: both)
"""

import hashlib
import json
import os
import subprocess
import sys
from pathlib import Path
from datetime import datetime

# Configuration
PROJECT_ROOT = Path(__file__).parent.parent
MIGRATIONS_DIR = PROJECT_ROOT / "supabase" / "migrations"
HASH_CACHE_FILE = PROJECT_ROOT / ".supabase_sync_cache.json"

# Colors for terminal output
class Colors:
    GREEN = '\033[92m'
    YELLOW = '\033[93m'
    RED = '\033[91m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'
    BOLD = '\033[1m'

def log(msg, color=None):
    """Print colored log message"""
    if color:
        print(f"{color}{msg}{Colors.RESET}")
    else:
        print(msg)

def compute_file_hash(filepath):
    """Compute SHA-256 hash of a file"""
    sha256 = hashlib.sha256()
    with open(filepath, 'rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            sha256.update(chunk)
    return sha256.hexdigest()

def load_hash_cache():
    """Load cached file hashes"""
    if HASH_CACHE_FILE.exists():
        try:
            with open(HASH_CACHE_FILE, 'r') as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {"local": {}, "remote": {}}
    return {"local": {}, "remote": {}}

def save_hash_cache(cache):
    """Save file hashes to cache"""
    cache["last_sync"] = datetime.now().isoformat()
    with open(HASH_CACHE_FILE, 'w') as f:
        json.dump(cache, f, indent=2)

def get_migration_files():
    """Get all valid migration SQL files"""
    if not MIGRATIONS_DIR.exists():
        log(f"Error: Migrations directory not found: {MIGRATIONS_DIR}", Colors.RED)
        return []
    
    files = []
    for f in sorted(MIGRATIONS_DIR.glob("*.sql")):
        # Skip invalid filenames (must match timestamp_name.sql pattern)
        name = f.name
        if name.startswith('.') or not name[0].isdigit():
            continue
        files.append(f)
    
    return files

def get_changed_files(files, cache, target):
    """Determine which files have changed since last sync"""
    target_cache = cache.get(target, {})
    changed = []
    unchanged = []
    
    for filepath in files:
        current_hash = compute_file_hash(filepath)
        cached_hash = target_cache.get(filepath.name)
        
        if cached_hash != current_hash:
            changed.append((filepath, current_hash))
        else:
            unchanged.append(filepath)
    
    return changed, unchanged

def run_supabase_command(args, capture=False):
    """Run a supabase CLI command"""
    cmd = ["npx", "supabase"] + args
    
    if capture:
        result = subprocess.run(
            cmd,
            cwd=PROJECT_ROOT,
            capture_output=True,
            text=True
        )
        return result.returncode == 0, result.stdout, result.stderr
    else:
        result = subprocess.run(
            cmd,
            cwd=PROJECT_ROOT,
            stdin=subprocess.PIPE,
            text=True
        )
        return result.returncode == 0

def sync_to_local(changed_files, cache, dry_run=False):
    """Sync migrations to local Supabase instance"""
    log("\n📦 Syncing to LOCAL database...", Colors.CYAN)
    
    if not changed_files:
        log("  ✓ No changes detected", Colors.GREEN)
        return True
    
    log(f"  Found {len(changed_files)} changed migration(s):", Colors.YELLOW)
    for filepath, file_hash in changed_files:
        log(f"    • {filepath.name}", Colors.YELLOW)
    
    if dry_run:
        log("  [DRY RUN] Would run: supabase migration up --local", Colors.BLUE)
        return True
    
    # Run migration up for local
    success = run_supabase_command(["migration", "up", "--local"])
    
    if success:
        log("  ✓ Local sync complete", Colors.GREEN)
        # Update cache
        for filepath, file_hash in changed_files:
            cache.setdefault("local", {})[filepath.name] = file_hash
        return True
    else:
        log("  ✗ Local sync failed", Colors.RED)
        return False

def sync_to_remote(changed_files, cache, dry_run=False):
    """Sync migrations to remote Supabase instance"""
    log("\n🌐 Syncing to REMOTE database...", Colors.CYAN)
    
    if not changed_files:
        log("  ✓ No changes detected", Colors.GREEN)
        return True
    
    log(f"  Found {len(changed_files)} changed migration(s):", Colors.YELLOW)
    for filepath, file_hash in changed_files:
        log(f"    • {filepath.name}", Colors.YELLOW)
    
    if dry_run:
        log("  [DRY RUN] Would run: supabase db push", Colors.BLUE)
        return True
    
    # Run db push for remote (auto-confirm with echo Y)
    cmd = f"cd {PROJECT_ROOT} && echo Y | npx supabase db push"
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    success = result.returncode == 0
    
    if success:
        log("  ✓ Remote sync complete", Colors.GREEN)
        # Update cache
        for filepath, file_hash in changed_files:
            cache.setdefault("remote", {})[filepath.name] = file_hash
        return True
    else:
        log("  ✗ Remote sync failed", Colors.RED)
        if result.stderr:
            log(f"  Error: {result.stderr[:500]}", Colors.RED)
        return False

def print_summary(local_changed, remote_changed, cache):
    """Print sync summary"""
    log("\n" + "="*50, Colors.BOLD)
    log("📊 SYNC SUMMARY", Colors.BOLD)
    log("="*50)
    
    total_files = len(get_migration_files())
    last_sync = cache.get("last_sync", "Never")
    
    log(f"  Total migrations: {total_files}")
    log(f"  Changed (local):  {len(local_changed)}")
    log(f"  Changed (remote): {len(remote_changed)}")
    log(f"  Last sync:        {last_sync}")
    log("="*50 + "\n")

def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(description="Hash-based delta sync for Supabase migrations")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be synced")
    parser.add_argument("--force", action="store_true", help="Force sync all (ignore cache)")
    parser.add_argument("--local", action="store_true", help="Sync to local only")
    parser.add_argument("--remote", action="store_true", help="Sync to remote only")
    args = parser.parse_args()
    
    # Default to both if neither specified
    sync_local = args.local or (not args.local and not args.remote)
    sync_remote = args.remote or (not args.local and not args.remote)
    
    log("\n🚀 Supabase Hash-Based Delta Sync", Colors.BOLD + Colors.CYAN)
    log("="*40)
    
    # Load cache
    cache = {} if args.force else load_hash_cache()
    if args.force:
        log("  ⚠ Force mode: ignoring cache", Colors.YELLOW)
    
    # Get migration files
    files = get_migration_files()
    if not files:
        log("No migration files found!", Colors.RED)
        return 1
    
    log(f"  Found {len(files)} migration file(s)", Colors.GREEN)
    
    # Compute changes
    local_changed, local_unchanged = get_changed_files(files, cache, "local")
    remote_changed, remote_unchanged = get_changed_files(files, cache, "remote")
    
    success = True
    
    # Sync to local
    if sync_local:
        if not sync_to_local(local_changed, cache, args.dry_run):
            success = False
    
    # Sync to remote
    if sync_remote:
        if not sync_to_remote(remote_changed, cache, args.dry_run):
            success = False
    
    # Save cache (unless dry run)
    if not args.dry_run:
        save_hash_cache(cache)
    
    # Print summary
    print_summary(local_changed, remote_changed, cache)
    
    if success:
        log("✅ Sync complete!", Colors.GREEN + Colors.BOLD)
        return 0
    else:
        log("❌ Sync completed with errors", Colors.RED + Colors.BOLD)
        return 1

if __name__ == "__main__":
    sys.exit(main())
