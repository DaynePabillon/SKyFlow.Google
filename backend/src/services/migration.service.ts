import { query } from '../config/database';
import logger from '../config/logger';

/**
 * Auto-migration service that ensures database schema is up to date on startup
 */
export async function runAutoMigrations(): Promise<void> {
  logger.info('🔄 Running auto-migrations...');

  try {
    // Create migrations tracking table if it doesn't exist
    await query(`
      CREATE TABLE IF NOT EXISTS _migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL UNIQUE,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Run base schema setup
    await ensureBaseSchema();

    // Run incremental migrations
    await runMigrations();

    logger.info('✅ Auto-migrations completed successfully');
  } catch (error) {
    logger.error('❌ Auto-migration failed:', error);
    throw error;
  }
}

/**
 * Ensures all base tables and extensions exist
 */
async function ensureBaseSchema(): Promise<void> {
  // Enable UUID extension
  await query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

  // Create organizations table
  await query(`
    CREATE TABLE IF NOT EXISTS organizations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      description TEXT,
      domain VARCHAR(255),
      logo_url TEXT,
      settings JSONB DEFAULT '{}',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create users table
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      google_id VARCHAR(255) UNIQUE NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      profile_picture TEXT,
      access_token TEXT,
      refresh_token TEXT,
      token_expiry TIMESTAMP,
      onboarding_completed BOOLEAN DEFAULT FALSE,
      onboarding_data JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      last_login TIMESTAMP
    )
  `);

  // Create organization_members table
  await query(`
    CREATE TABLE IF NOT EXISTS organization_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
      invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
      invited_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      joined_at TIMESTAMP,
      UNIQUE(organization_id, user_id)
    )
  `);

  // Create projects table
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('planning', 'active', 'on_hold', 'completed', 'archived')),
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      start_date DATE,
      end_date DATE,
      budget DECIMAL(15, 2),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      calendar_id VARCHAR(255),
      drive_folder_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create project_members table
  await query(`
    CREATE TABLE IF NOT EXISTS project_members (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE CASCADE,
      role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('lead', 'member', 'viewer')),
      assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
      UNIQUE(project_id, user_id)
    )
  `);

  // Create tasks table
  await query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      status VARCHAR(20) DEFAULT 'todo',
      priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      due_date TIMESTAMP,
      estimated_hours DECIMAL(10, 2),
      actual_hours DECIMAL(10, 2),
      assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      parent_task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP
    )
  `);

  // Create organization_invitations table
  await query(`
    CREATE TABLE IF NOT EXISTS organization_invitations (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      email VARCHAR(255) NOT NULL,
      role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'manager', 'member')),
      token VARCHAR(255) UNIQUE NOT NULL,
      invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
      expires_at TIMESTAMP NOT NULL,
      accepted_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(organization_id, email)
    )
  `);

  // Create other essential tables
  await query(`
    CREATE TABLE IF NOT EXISTS task_comments (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      comment TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS milestones (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      due_date DATE,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'missed')),
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS drive_files (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      google_drive_id VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(500) NOT NULL,
      mime_type VARCHAR(100),
      size BIGINT,
      web_view_link TEXT,
      web_content_link TEXT,
      thumbnail_link TEXT,
      owner_id UUID REFERENCES users(id) ON DELETE SET NULL,
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      task_id UUID REFERENCES tasks(id) ON DELETE SET NULL,
      parent_folder_id VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS calendar_events (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      google_event_id VARCHAR(255) UNIQUE NOT NULL,
      calendar_id VARCHAR(255) NOT NULL,
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
      title VARCHAR(500) NOT NULL,
      description TEXT,
      location VARCHAR(255),
      start_time TIMESTAMP NOT NULL,
      end_time TIMESTAMP NOT NULL,
      all_day BOOLEAN DEFAULT FALSE,
      event_type VARCHAR(50),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS activity_logs (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID REFERENCES users(id) ON DELETE SET NULL,
      action VARCHAR(100) NOT NULL,
      entity_type VARCHAR(50),
      entity_id VARCHAR(255),
      details JSONB,
      ip_address INET,
      user_agent TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  logger.info('📦 Base schema verified');
}

/**
 * Run individual migrations that haven't been applied yet
 */
async function runMigrations(): Promise<void> {
  const migrations: { name: string; sql: string }[] = [
    {
      name: '001_add_archived_status',
      sql: `
        DO $$ 
        BEGIN
          ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_status_check;
          ALTER TABLE tasks ADD CONSTRAINT tasks_status_check 
            CHECK (status IN ('todo', 'in_progress', 'review', 'done', 'completed', 'blocked', 'archived'));
        EXCEPTION
          WHEN others THEN NULL;
        END $$;
      `
    },
    {
      name: '002_add_onboarding_fields',
      sql: `
        ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
        ALTER TABLE users ADD COLUMN IF NOT EXISTS onboarding_data JSONB;
      `
    },
    {
      name: '003_create_indexes',
      sql: `
        DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id); EXCEPTION WHEN others THEN NULL; END $$;
        DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_users_email ON users(email); EXCEPTION WHEN others THEN NULL; END $$;
        DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id); EXCEPTION WHEN others THEN NULL; END $$;
        DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_projects_organization_id ON projects(organization_id); EXCEPTION WHEN others THEN NULL; END $$;
        DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id); EXCEPTION WHEN others THEN NULL; END $$;
        DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to); EXCEPTION WHEN others THEN NULL; END $$;
        DO $$ BEGIN CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status); EXCEPTION WHEN others THEN NULL; END $$;
      `
    },
    {
      name: '004_fix_missing_columns',
      sql: `
        -- Add organization_id to projects if missing
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Add organization_id to organization_members if missing
        ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
        
        -- Add user_id to organization_members if missing
        ALTER TABLE organization_members ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE CASCADE;
      `
    },
    {
      name: '005_fix_projects_columns',
      sql: `
        -- Add all missing columns to projects table
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium';
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS start_date DATE;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS end_date DATE;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS budget DECIMAL(15, 2);
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS calendar_id VARCHAR(255);
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS drive_folder_id VARCHAR(255);
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
        ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
      `
    },
    {
      name: '006_fix_organizations_columns',
      sql: `
        -- Add created_by to organizations if missing
        ALTER TABLE organizations ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES users(id) ON DELETE SET NULL;
      `
    },
    {
      name: '007_add_theme_mode',
      sql: `
        -- Add theme_mode column for UI preference (professional or aviation)
        ALTER TABLE users ADD COLUMN IF NOT EXISTS theme_mode VARCHAR(20) DEFAULT 'professional';
      `
    },
    {
      name: '008_professional_features',
      sql: `
        -- Activity Log for tracking all actions
        CREATE TABLE IF NOT EXISTS activity_log (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          user_name VARCHAR(255),
          action VARCHAR(50) NOT NULL,
          entity_type VARCHAR(50) NOT NULL,
          entity_id UUID,
          entity_name VARCHAR(255),
          details JSONB,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Notifications
        CREATE TABLE IF NOT EXISTS notifications (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          title VARCHAR(255),
          message TEXT,
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          is_read BOOLEAN DEFAULT false,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Task Comments
        CREATE TABLE IF NOT EXISTS task_comments (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          user_name VARCHAR(255),
          content TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Time Entries
        CREATE TABLE IF NOT EXISTS time_entries (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE SET NULL,
          user_name VARCHAR(255),
          hours DECIMAL(5,2) NOT NULL,
          date DATE DEFAULT CURRENT_DATE,
          notes TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Board Widgets (for customizable charts)
        CREATE TABLE IF NOT EXISTS board_widgets (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
          widget_type VARCHAR(50) NOT NULL,
          title VARCHAR(255),
          config JSONB DEFAULT '{}',
          position INTEGER DEFAULT 0,
          created_by UUID REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Add indexes for performance
        CREATE INDEX IF NOT EXISTS idx_activity_log_org ON activity_log(organization_id);
        CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
        CREATE INDEX IF NOT EXISTS idx_comments_task ON task_comments(task_id);
        CREATE INDEX IF NOT EXISTS idx_time_entries_task ON time_entries(task_id);
        CREATE INDEX IF NOT EXISTS idx_widgets_org ON board_widgets(organization_id);
      `
    },
    {
      name: '009_task_followers',
      sql: `
        -- Task followers for comment notifications
        CREATE TABLE IF NOT EXISTS task_followers (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          followed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(task_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_task_followers_task ON task_followers(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_followers_user ON task_followers(user_id);
      `
    },
    {
      name: '010_fix_notifications_task_id',
      sql: `
        -- Add task_id column to notifications if it doesn't exist
        ALTER TABLE notifications ADD COLUMN IF NOT EXISTS task_id UUID REFERENCES tasks(id) ON DELETE CASCADE;
      `
    },
    {
      name: '011_task_assignees',
      sql: `
        -- Task assignees junction table for multi-assignee support
        CREATE TABLE IF NOT EXISTS task_assignees (
          id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
          task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
          user_id UUID REFERENCES users(id) ON DELETE CASCADE,
          assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          assigned_by UUID REFERENCES users(id) ON DELETE SET NULL,
          UNIQUE(task_id, user_id)
        );

        CREATE INDEX IF NOT EXISTS idx_task_assignees_task ON task_assignees(task_id);
        CREATE INDEX IF NOT EXISTS idx_task_assignees_user ON task_assignees(user_id);

        -- Migrate existing assigned_to data to new table
        INSERT INTO task_assignees (task_id, user_id, assigned_at)
        SELECT id, assigned_to, updated_at
        FROM tasks
        WHERE assigned_to IS NOT NULL
        ON CONFLICT (task_id, user_id) DO NOTHING;
      `
    }
  ];

  for (const migration of migrations) {
    const applied = await query(
      'SELECT 1 FROM _migrations WHERE name = $1',
      [migration.name]
    );

    if (applied.rows.length === 0) {
      logger.info(`  📝 Applying migration: ${migration.name}`);
      await query(migration.sql);
      await query(
        'INSERT INTO _migrations (name) VALUES ($1)',
        [migration.name]
      );
    }
  }
}
