require('dotenv').config();
const bcrypt = require('bcryptjs');
const { sequelize } = require('./config/database');
const { createPublicSchema, createTenantSchema } = require('./utils/schemaManager');

async function seed() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    await createPublicSchema();

    const companyName = 'Acme Corp';
    const slug = 'acme_corp';
    const schemaName = `tenant_${slug}`;
    const passwordHash = await bcrypt.hash('password123', 12);

    // Insert tenant
    const tenantResult = await sequelize.query(
      `INSERT INTO public.tenants (name, slug, schema_name)
       VALUES (:name, :slug, :schemaName)
       RETURNING id`,
      { replacements: { name: companyName, slug, schemaName }, type: sequelize.QueryTypes.INSERT }
    );
    const tenantId = tenantResult[0][0].id;
    console.log(`Created tenant: ${companyName} (${tenantId})`);

    // Insert admin user into public.users
    const userResult = await sequelize.query(
      `INSERT INTO public.users (tenant_id, name, email, password_hash, role)
       VALUES (:tenantId, :name, :email, :passwordHash, 'admin')
       RETURNING id`,
      {
        replacements: {
          tenantId,
          name: 'Saurabh Admin',
          email: 'admin@acme.test',
          passwordHash,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    const userId = userResult[0][0].id;
    console.log(`Created admin user: admin@acme.test (${userId})`);

    // Create the tenant's isolated schema (tables: users, invites, projects, tasks)
    await createTenantSchema(schemaName);

    // Mirror the admin user into the tenant schema, same as real registration does
    await sequelize.query(
      `INSERT INTO "${schemaName}".users (id, name, email, password_hash, role)
       VALUES (:id, :name, :email, :passwordHash, 'admin')`,
      {
        replacements: { id: userId, name: 'Saurabh Admin', email: 'admin@acme.test', passwordHash },
      }
    );

    // Seed one fake project
    const projectResult = await sequelize.query(
      `INSERT INTO "${schemaName}".projects (name, description, created_by)
       VALUES (:name, :description, :createdBy)
       RETURNING id`,
      {
        replacements: {
          name: 'Website Redesign',
          description: 'Revamp the marketing website',
          createdBy: userId,
        },
        type: sequelize.QueryTypes.INSERT,
      }
    );
    const projectId = projectResult[0][0].id;
    console.log(`Created project: Website Redesign (${projectId})`);

    // Seed two fake tasks under that project
    await sequelize.query(
      `INSERT INTO "${schemaName}".tasks (project_id, title, description, priority, status, assignee_id)
       VALUES
        (:projectId, 'Design homepage mockup', 'Create Figma design', 'high', 'todo', :userId),
        (:projectId, 'Set up CI/CD pipeline', 'GitHub Actions for auto-deploy', 'medium', 'in_progress', :userId)`,
      { replacements: { projectId, userId } }
    );
    console.log('Created 2 sample tasks');

    console.log('\nSeed complete!');
    console.log('Login with: admin@acme.test / password123');
    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err);
    process.exit(1);
  }
}

seed();