import fs from 'fs';
import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function importProducts() {
  if (!DATABASE_URL) {
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  // Parse connection string
  const url = new URL(DATABASE_URL);
  const connection = await mysql.createConnection({
    host: url.hostname,
    user: url.username,
    password: url.password,
    database: url.pathname.slice(1),
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    // Read products from JSON
    const products = JSON.parse(fs.readFileSync('./products.json', 'utf-8'));
    console.log(`Importing ${products.length} products...`);

    // Insert products in batches
    const batchSize = 100;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);
      const values = batch.map(p => [p.productName, 0, 0]);
      
      const query = 'INSERT INTO inventory (productName, quantitySystem, quantityPhysical) VALUES ?';
      await connection.query(query, [values]);
      
      console.log(`Imported ${Math.min(i + batchSize, products.length)}/${products.length}`);
    }

    console.log('✓ Import completed successfully!');
  } catch (error) {
    console.error('Import failed:', error);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

importProducts();
