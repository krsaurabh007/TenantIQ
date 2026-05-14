const { sequelize } = require('../config/database');

// Creates the public schema tables that are shared across all tenants
async function createPublicSchema() {
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS public.tenants (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      slug VARCHAR(100) UNIQUE NOT NULL,
      plan VARCHAR(50) DEFAULT 'free',
      status VARCHAR(50) DEFAULT 'active',
      schema_name VARCHAR(100) UNIQUE NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS public.users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      tenant_id UUID REFERENCES public.tenants(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log('public.tenants and public.users tables ready');
}

// Creates a brand new PostgreSQL schema for a tenant — this is the core multi-tenancy logic
async function createTenantSchema(schemaName) {
  // 1. Create the schema namespace
  await sequelize.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);

  // 2. Users table inside tenant schema
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 3. Invites table
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".invites (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) NOT NULL,
      token VARCHAR(255) UNIQUE NOT NULL,
      role VARCHAR(50) NOT NULL DEFAULT 'viewer',
      expires_at TIMESTAMPTZ NOT NULL,
      accepted BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 4. Projects table
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(50) DEFAULT 'active',
      deadline DATE,
      created_by UUID NOT NULL,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  // 5. Project members junction table
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".project_members (
      project_id UUID REFERENCES "${schemaName}".projects(id) ON DELETE CASCADE,
      user_id UUID NOT NULL,
      PRIMARY KEY (project_id, user_id)
    );
  `);

  // 6. Tasks table
  await sequelize.query(`
    CREATE TABLE IF NOT EXISTS "${schemaName}".tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      project_id UUID REFERENCES "${schemaName}".projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      priority VARCHAR(50) DEFAULT 'medium',
      status VARCHAR(50) DEFAULT 'todo',
      assignee_id UUID,
      due_date DATE,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);

  console.log(`Tenant schema "${schemaName}" created with all tables`);
}

async function dropTenantSchema(schemaName) {
  await sequelize.query(`DROP SCHEMA IF EXISTS "${schemaName}" CASCADE`);
  console.log(`Tenant schema "${schemaName}" dropped`);
}

module.exports = { createPublicSchema, createTenantSchema, dropTenantSchema };