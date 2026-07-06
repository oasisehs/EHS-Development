const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://oasis:H5m3zZheus4iDA5RxS6HeCcDC8DwCBgV@dpg-d95i9fpoagis738st8p0-a.oregon-postgres.render.com/ehsdb_o0dm',
  ssl: { rejectUnauthorized: false }
});

pool.query(
  'SELECT u.id, u.email, f.file_name, f.s3_url, f.file_type, f.upload_type, f.created_at FROM users u LEFT JOIN files f ON u.id = f.user_id WHERE u.email = $1 ORDER BY f.created_at DESC',
  ['aleemanoorishah@gmail.com'],
  (err, res) => {
    if (err) {
      console.error('Error:', err.message);
    } else {
      console.log('\n📋 Files for user: aleemanoorishah@gmail.com\n');
      if (res.rows.length === 0) {
        console.log('No files found for this user.');
      } else {
        res.rows.forEach((row, idx) => {
          if (row.file_name) {
            console.log(`${idx + 1}. ${row.file_name}`);
            console.log(`   Type: ${row.file_type} | Category: ${row.upload_type}`);
            console.log(`   S3 URL: ${row.s3_url}`);
            console.log(`   Uploaded: ${row.created_at}`);
            console.log('');
          }
        });
      }
    }
    pool.end();
  }
);
