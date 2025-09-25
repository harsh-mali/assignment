import bcrypt from 'bcryptjs';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

// This function establishes a connection to the SQLite database.
// It will create the database file if it doesn't exist.
async function getDbConnection() {
    const db = await open({
        filename: './data/database.sqlite',
        driver: sqlite3.Database,
    });
    return db;
}

// This function initializes the database, creates tables if they don't exist,
// and seeds the initial data (tenants and users).
export async function initializeDb() {
    const db = await getDbConnection();

    // Create tenants table
    await db.exec(`
    CREATE TABLE IF NOT EXISTS tenants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slug TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      plan TEXT NOT NULL DEFAULT 'free'
    )
  `);

    // Create users table
    await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      tenantId INTEGER,
      FOREIGN KEY (tenantId) REFERENCES tenants (id)
    )
  `);

    // Create notes table
    await db.exec(`
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT,
      tenantId INTEGER,
      createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
      updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenantId) REFERENCES tenants (id)
    )
  `);

    // Seed data (idempotent)
    const tenants = [
        { id: 1, slug: 'acme', name: 'ACME Corp' },
        { id: 2, slug: 'globex', name: 'Globex Inc.' },
    ];

    for (const tenant of tenants) {
        await db.run('INSERT OR IGNORE INTO tenants (id, slug, name) VALUES (?, ?, ?)',
            tenant.id, tenant.slug, tenant.name
        );
    }

    const passwordHash = await bcrypt.hash('password', 10);
    const users = [
        { email: 'admin@acme.test', role: 'Admin', tenantId: 1 },
        { email: 'user@acme.test', role: 'Member', tenantId: 1 },
        { email: 'admin@globex.test', role: 'Admin', tenantId: 2 },
        { email: 'user@globex.test', role: 'Member', tenantId: 2 },
    ];

    for (const user of users) {
        await db.run('INSERT OR IGNORE INTO users (email, password_hash, role, tenantId) VALUES (?, ?, ?, ?)',
            user.email, passwordHash, user.role, user.tenantId
        );
    }

    await db.close();
}

// A helper function to easily get a DB connection for API routes.
export async function getDb() {
    return open({
        filename: './data/database.sqlite',
        driver: sqlite3.Database,
    });
}