#!/usr/bin/env node

/**
 * EHS Suite Backend - Database Seed Script
 * Populates database with demo data for development and testing
 * Usage: node seed.js
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const path = require('path');
require('dotenv').config();

// Database connection configuration
const pool = new Pool({
  host: process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost',
  port: process.env.DB_PORT || process.env.POSTGRES_PORT || 5432,
  database: process.env.DB_NAME || process.env.POSTGRES_DB || 'ehsdb',
  user: process.env.DB_USER || process.env.POSTGRES_USER || 'ehsuser',
  password: process.env.DB_PASSWORD || process.env.POSTGRES_PASSWORD || 'ehspassword123',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false
});

// Fallback to DATABASE_URL if provided
const databaseUrl = process.env.DATABASE_URL;
if (databaseUrl && !process.env.DB_HOST) {
  pool._connectionString = databaseUrl;
}

// Seed data functions
async function seedUsers() {
  console.log('\n📝 Seeding users...');
  
  const demoPassword = await bcrypt.hash('demo123456', 10);
  const users = [
    {
      email: 'admin@ehssuite.com',
      password: demoPassword,
      full_name: 'Admin User',
      phone: '+1-555-0001',
      company: 'Acme Corp',
      status: 'active'
    },
    {
      email: 'manager@ehssuite.com',
      password: demoPassword,
      full_name: 'Sarah Manager',
      phone: '+1-555-0002',
      company: 'Acme Corp',
      status: 'active'
    },
    {
      email: 'employee@ehssuite.com',
      password: demoPassword,
      full_name: 'John Employee',
      phone: '+1-555-0003',
      company: 'Acme Corp',
      status: 'active'
    },
    {
      email: 'safety@ehssuite.com',
      password: demoPassword,
      full_name: 'Alice Safety Officer',
      phone: '+1-555-0004',
      company: 'Acme Corp',
      status: 'active'
    },
    {
      email: 'demo@ehssuite.com',
      password: await bcrypt.hash('Demo@123456', 10),
      full_name: 'Demo Admin',
      phone: '+1-555-0100',
      company: 'EHSSuite',
      status: 'active'
    }
  ];

  for (const user of users) {
    try {
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, phone, company, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE
         SET password_hash = EXCLUDED.password_hash,
             full_name = COALESCE(users.full_name, EXCLUDED.full_name),
             phone = COALESCE(users.phone, EXCLUDED.phone),
             company = COALESCE(users.company, EXCLUDED.company),
             status = EXCLUDED.status,
             updated_at = CURRENT_TIMESTAMP
         RETURNING id, email`,
        [user.email, user.password, user.full_name, user.phone, user.company, user.status]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ Upserted user: ${user.email} (ID: ${result.rows[0].id})`);
      }
    } catch (error) {
      console.error(`❌ Error creating user ${user.email}:`, error.message);
    }
  }
}

async function seedUserRoles() {
  console.log('\n📋 Seeding user roles...');
  
  const roleAssignments = [
    { email: 'admin@ehssuite.com', role: 'admin' },
    { email: 'manager@ehssuite.com', role: 'manager' },
    { email: 'employee@ehssuite.com', role: 'employee' },
    { email: 'safety@ehssuite.com', role: 'manager' }
  ];

  for (const assignment of roleAssignments) {
    try {
      await pool.query(
        `INSERT INTO user_roles (user_id, role_id)
         SELECT u.id, r.id FROM users u, roles r
         WHERE u.email = $1 AND r.name = $2
         ON CONFLICT DO NOTHING`,
        [assignment.email, assignment.role]
      );
      console.log(`✅ Assigned ${assignment.role} role to ${assignment.email}`);
    } catch (error) {
      console.error(`❌ Error assigning role:`, error.message);
    }
  }
}

async function seedDepartments() {
  console.log('\n🏢 Seeding departments...');
  
  const departments = [
    {
      name: 'Safety & Compliance',
      description: 'Responsible for workplace safety and regulatory compliance',
      budget: 150000
    },
    {
      name: 'Operations',
      description: 'Core business operations and daily activities',
      budget: 500000
    },
    {
      name: 'HR & Administration',
      description: 'Human resources and administrative functions',
      budget: 200000
    },
    {
      name: 'Training & Development',
      description: 'Employee training and professional development',
      budget: 100000
    },
    {
      name: 'Maintenance & Assets',
      description: 'Asset management and facility maintenance',
      budget: 300000
    }
  ];

  for (const dept of departments) {
    try {
      const result = await pool.query(
        `INSERT INTO departments (name, description, budget)
         VALUES ($1, $2, $3)
         ON CONFLICT DO NOTHING
         RETURNING id, name`,
        [dept.name, dept.description, dept.budget]
      );
      
      if (result.rows.length > 0) {
        console.log(`✅ Created department: ${dept.name} (ID: ${result.rows[0].id})`);
      }
    } catch (error) {
      console.error(`❌ Error creating department ${dept.name}:`, error.message);
    }
  }
}

async function seedEmployees() {
  console.log('\n👥 Seeding employees...');
  
  // Get admin user for employee link
  const adminResult = await pool.query('SELECT id FROM users WHERE email = $1', ['admin@ehssuite.com']);
  const adminUserId = adminResult.rows[0]?.id;

  // Get departments
  const deptResult = await pool.query('SELECT id, name FROM departments LIMIT 5');
  const departments = deptResult.rows;

  const employees = [
    {
      user_id: adminUserId,
      first_name: 'Admin',
      last_name: 'User',
      email: 'admin@ehssuite.com',
      phone: '+1-555-0001',
      department_id: departments[0]?.id,
      job_title: 'Safety Manager',
      hire_date: '2020-01-15',
      status: 'active',
      skills: ['Safety Management', 'Compliance', 'Leadership', 'Risk Assessment'],
      compliance_score: 95
    },
    {
      first_name: 'Jane',
      last_name: 'Smith',
      email: 'jane.smith@ehssuite.com',
      phone: '+1-555-0005',
      department_id: departments[1]?.id,
      job_title: 'Operations Supervisor',
      hire_date: '2019-06-01',
      status: 'active',
      skills: ['Operations', 'Supervision', 'Quality Control'],
      compliance_score: 88
    },
    {
      first_name: 'Michael',
      last_name: 'Johnson',
      email: 'michael.johnson@ehssuite.com',
      phone: '+1-555-0006',
      department_id: departments[2]?.id,
      job_title: 'HR Specialist',
      hire_date: '2021-03-10',
      status: 'active',
      skills: ['HR Management', 'Recruitment', 'Training'],
      compliance_score: 92
    },
    {
      first_name: 'Robert',
      last_name: 'Williams',
      email: 'robert.williams@ehssuite.com',
      phone: '+1-555-0007',
      department_id: departments[4]?.id,
      job_title: 'Maintenance Technician',
      hire_date: '2018-11-20',
      status: 'active',
      skills: ['Equipment Maintenance', 'Troubleshooting', 'Preventive Maintenance'],
      compliance_score: 85
    }
  ];

  for (const emp of employees) {
    try {
      const result = await pool.query(
        `INSERT INTO employees (
          user_id, first_name, last_name, email, phone, department_id, 
          job_title, hire_date, status, skills, compliance_score
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (email) DO NOTHING
         RETURNING id, email`,
        [
          emp.user_id,
          emp.first_name,
          emp.last_name,
          emp.email,
          emp.phone,
          emp.department_id,
          emp.job_title,
          emp.hire_date,
          emp.status,
          JSON.stringify(emp.skills),
          emp.compliance_score
        ]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Created employee: ${emp.first_name} ${emp.last_name} (${emp.email})`);
      }
    } catch (error) {
      console.error(`❌ Error creating employee ${emp.email}:`, error.message);
    }
  }
}

async function seedCourses() {
  console.log('\n📚 Seeding courses...');
  
  const courses = [
    {
      name: 'Safety Fundamentals',
      description: 'Introduction to workplace safety principles and practices',
      category: 'safety',
      duration_hours: 4,
      required_frequency_days: 365,
      pass_score: 70
    },
    {
      name: 'Environmental Compliance',
      description: 'Environmental regulations and compliance requirements',
      category: 'environmental',
      duration_hours: 3,
      required_frequency_days: 730,
      pass_score: 70
    },
    {
      name: 'Health & Hygiene',
      description: 'Health and hygiene standards in the workplace',
      category: 'health',
      duration_hours: 2,
      required_frequency_days: 365,
      pass_score: 70
    },
    {
      name: 'OSHA Certification',
      description: 'Occupational Safety and Health Administration standards',
      category: 'compliance',
      duration_hours: 8,
      required_frequency_days: 1095,
      pass_score: 80
    }
  ];

  for (const course of courses) {
    try {
      const result = await pool.query(
        `INSERT INTO courses (
          name, description, category, duration_hours, 
          required_frequency_days, pass_score
        ) VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT DO NOTHING
         RETURNING id, name`,
        [
          course.name,
          course.description,
          course.category,
          course.duration_hours,
          course.required_frequency_days,
          course.pass_score
        ]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Created course: ${course.name} (ID: ${result.rows[0].id})`);
      }
    } catch (error) {
      console.error(`❌ Error creating course ${course.name}:`, error.message);
    }
  }
}

async function seedComplianceTemplates() {
  console.log('\n✅ Seeding compliance templates...');
  
  const templates = [
    {
      name: 'Monthly Safety Inspection',
      description: 'Monthly workplace safety inspection checklist',
      frequency: 'monthly',
      items: [
        'Fire exits clear and accessible',
        'First aid kit stocked',
        'Emergency lighting operational',
        'Safety signs visible',
        'Floors clean and non-slip'
      ]
    },
    {
      name: 'Annual Environmental Audit',
      description: 'Annual environmental compliance audit',
      frequency: 'annual',
      items: [
        'Waste disposal procedures',
        'Chemical storage compliance',
        'Emissions monitoring',
        'Water usage optimization',
        'Energy efficiency'
      ]
    },
    {
      name: 'Quarterly Training Review',
      description: 'Review of employee training records',
      frequency: 'quarterly',
      items: [
        'Training attendance records',
        'Certification status',
        'Assessment scores',
        'Training completion dates',
        'Renewal requirements'
      ]
    }
  ];

  for (const template of templates) {
    try {
      const result = await pool.query(
        `INSERT INTO compliance_templates (name, description, frequency, items)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT DO NOTHING
         RETURNING id, name`,
        [
          template.name,
          template.description,
          template.frequency,
          JSON.stringify(template.items)
        ]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Created compliance template: ${template.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating template ${template.name}:`, error.message);
    }
  }
}

async function seedAssets() {
  console.log('\n🏗️  Seeding assets...');
  
  const assets = [
    {
      asset_number: 'EQUIP-001',
      name: 'Forklift A1',
      description: 'Toyota 8FDU25 Forklift',
      asset_type: 'equipment',
      category: 'Lifting Equipment',
      location: 'Warehouse A',
      purchase_date: '2020-01-15',
      cost: 25000,
      status: 'active'
    },
    {
      asset_number: 'PPE-001',
      name: 'Safety Helmets - Box of 10',
      description: 'ANSI/OSHA compliant safety helmets',
      asset_type: 'ppe',
      category: 'Head Protection',
      location: 'Safety Storage',
      purchase_date: '2023-01-01',
      cost: 150,
      status: 'active'
    },
    {
      asset_number: 'VEH-001',
      name: 'Company Vehicle - Van 1',
      description: '2022 Ford Transit Van',
      asset_type: 'vehicle',
      category: 'Transport',
      location: 'Parking Lot',
      purchase_date: '2022-03-01',
      cost: 35000,
      status: 'active'
    }
  ];

  for (const asset of assets) {
    try {
      const result = await pool.query(
        `INSERT INTO assets (
          asset_number, name, description, asset_type, category,
          location, purchase_date, cost, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (asset_number) DO NOTHING
         RETURNING id, asset_number`,
        [
          asset.asset_number,
          asset.name,
          asset.description,
          asset.asset_type,
          asset.category,
          asset.location,
          asset.purchase_date,
          asset.cost,
          asset.status
        ]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Created asset: ${asset.name} (${asset.asset_number})`);
      }
    } catch (error) {
      console.error(`❌ Error creating asset ${asset.asset_number}:`, error.message);
    }
  }
}

async function seedKPIs() {
  console.log('\n📊 Seeding KPI definitions...');
  
  const kpis = [
    {
      name: 'Incident Frequency Rate',
      description: 'Number of incidents per 1000 working hours',
      unit: 'incidents/1000hrs',
      target_value: 2.5,
      frequency: 'monthly'
    },
    {
      name: 'Training Completion Rate',
      description: 'Percentage of employees completing required training',
      unit: '%',
      target_value: 95,
      frequency: 'monthly'
    },
    {
      name: 'Compliance Score',
      description: 'Overall organizational compliance score',
      unit: '%',
      target_value: 90,
      frequency: 'monthly'
    },
    {
      name: 'Employee Safety Awareness',
      description: 'Safety training completion percentage',
      unit: '%',
      target_value: 100,
      frequency: 'quarterly'
    }
  ];

  for (const kpi of kpis) {
    try {
      const result = await pool.query(
        `INSERT INTO kpi_definitions (
          name, description, unit, target_value, frequency
        ) VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (name) DO NOTHING
         RETURNING id, name`,
        [kpi.name, kpi.description, kpi.unit, kpi.target_value, kpi.frequency]
      );

      if (result.rows.length > 0) {
        console.log(`✅ Created KPI: ${kpi.name}`);
      }
    } catch (error) {
      console.error(`❌ Error creating KPI ${kpi.name}:`, error.message);
    }
  }
}

// Main execution
async function main() {
  console.log('🚀 Starting EHS Database Seeding...\n');
  console.log('Database Configuration:');
  console.log(`  Host: ${process.env.DB_HOST || process.env.POSTGRES_HOST || 'localhost'}`);
  console.log(`  Port: ${process.env.DB_PORT || process.env.POSTGRES_PORT || 5432}`);
  console.log(`  Database: ${process.env.DB_NAME || process.env.POSTGRES_DB || 'ehsdb'}`);
  console.log(`  User: ${process.env.DB_USER || process.env.POSTGRES_USER || 'ehsuser'}\n`);

  try {
    // Test connection
    await pool.query('SELECT NOW()');
    console.log('✅ Database connection successful\n');

    // Run seed functions in order
    await seedUsers();
    await seedUserRoles();
    await seedDepartments();
    await seedEmployees();
    await seedCourses();
    await seedComplianceTemplates();
    await seedAssets();
    await seedKPIs();

    console.log('\n🎉 Database seeding completed successfully!\n');
    console.log('📋 Demo User Credentials:');
    console.log('  Email: admin@ehssuite.com');
    console.log('  Password: demo123456\n');
    console.log('📋 Other Demo Users:');
    console.log('  manager@ehssuite.com (Password: demo123456)');
    console.log('  employee@ehssuite.com (Password: demo123456)');
    console.log('  safety@ehssuite.com (Password: demo123456)\n');

  } catch (error) {
    console.error('❌ Fatal error during seeding:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run
main().catch(error => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});

// Export for use in server.js
module.exports = {
  runSeed: async function() {
    try {
      // Test connection
      await pool.query('SELECT NOW()');
      console.log('✅ Database connection successful\n');

      // Run seed functions
      await seedUsers();
      await seedUserRoles();
      await seedDepartments();
      await seedEmployees();
      await seedCourses();
      await seedComplianceTemplates();
      await seedAssets();
      await seedKPIs();

      console.log('\n🎉 Database seeding completed successfully!\n');
      
      return {
        success: true,
        message: 'Database seeded successfully',
        users: [
          { email: 'admin@ehssuite.com', password: 'demo123456' },
          { email: 'manager@ehssuite.com', password: 'demo123456' },
          { email: 'employee@ehssuite.com', password: 'demo123456' },
          { email: 'safety@ehssuite.com', password: 'demo123456' }
        ]
      };
    } catch (error) {
      console.error('❌ Error during seeding:', error.message);
      throw error;
    } finally {
      await pool.end();
    }
  }
};

