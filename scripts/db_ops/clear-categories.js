/**
 * Script per netejar les categories de totes les normes2Web.
 * Posa el camp `categories` a [] (array buit) per a totes les normes
 * existents d'alumnes i grups.
 *
 * Ús: node scripts/clear-categories.js
 *
 * Requereix un fitxer .env amb DATABASE_URL a la carpeta scripts/
 */

const path = require('path');

// Carregar variables d'entorn des del .env de la carpeta scripts/
require('dotenv').config({ path: path.join(__dirname, '.env') });

const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no està definit al fitxer scripts/.env');
    process.exit(1);
}

async function main() {
    console.log('🔌 Connectant a MongoDB...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connexió establerta.');

    // 1. Netejar categories de normes2Web d'alumnes
    console.log('\n📦 Processant alumnes...');
    const alumneResult = await mongoose.connection.db
        .collection('alumnes')
        .updateMany(
            { 'normes2Web.categories': { $exists: true } },
            { $set: { 'normes2Web.$[].categories': [] } }
        );
    console.log(`   Alumnes modificats: ${alumneResult.modifiedCount}`);

    // 2. Netejar categories de normes2Web de grups
    console.log('📦 Processant grups...');
    const grupResult = await mongoose.connection.db
        .collection('grups')
        .updateMany(
            { 'normes2Web.categories': { $exists: true } },
            { $set: { 'normes2Web.$[].categories': [] } }
        );
    console.log(`   Grups modificats: ${grupResult.modifiedCount}`);

    await mongoose.disconnect();
    console.log('\n🎉 Fet! Totes les categories han estat netejades.');
    console.log('   Les normes noves continuaran tenint "general" per defecte.');
    console.log('   Les normes existents ara tenen categories buides ([]).');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
