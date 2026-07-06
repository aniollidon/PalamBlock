/**
 * Script d'inspecció de la base de dades.
 * Llista totes les col·leccions i mostra un resum de cadascuna.
 * Només lectura, no modifica res.
 *
 * Ús: node inspect-db.js
 */

const path = require('path');
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
    const db = mongoose.connection.db;
    console.log('✅ Connexió establerta.\n');

    // 1. Llistar TOTES les col·leccions
    const collections = await db.listCollections().toArray();
    const colNames = collections.map(c => c.name).sort();

    console.log('═══════════════════════════════════════════');
    console.log(`📊 ${colNames.length} col·leccions trobades:`);
    console.log('═══════════════════════════════════════════\n');

    for (const name of colNames) {
        const count = await db.collection(name).countDocuments();
        const sample = await db.collection(name).findOne({});

        console.log(`📦 ${name} (${count} documents)`);

        if (sample) {
            // Mostrar els camps del primer document (claus)
            const keys = Object.keys(sample).filter(k => !k.startsWith('_'));
            console.log(`   Camps: ${keys.join(', ')}`);

            // Per a col·leccions petites, mostrar tots els documents resumits
            if (count <= 15 && count > 0) {
                const docs = await db.collection(name).find({}).toArray();
                for (const doc of docs) {
                    const id = doc.alumneId || doc.grupId || doc.user || doc._id;
                    const extra = [];
                    if (doc.normes2Web) extra.push(`normes2Web: ${doc.normes2Web.length}`);
                    if (doc.normesWeb) extra.push(`normesWeb(legacy): ${doc.normesWeb.length}`);
                    if (doc.normesApp) extra.push(`normesApp: ${doc.normesApp.length}`);
                    if (doc.nom) extra.push(`nom: ${doc.nom}`);
                    const extraStr = extra.length > 0 ? ` (${extra.join(', ')})` : '';
                    console.log(`   - ${id}${extraStr}`);
                }
            }
        } else {
            console.log('   (buida)');
        }
        console.log('');
    }

    // 2. Diagnòstic específic: comprovar si normesWeb (legacy) té dades
    console.log('═══════════════════════════════════════════');
    console.log('🔍 DIAGNÒSTIC ESPECÍFIC');
    console.log('═══════════════════════════════════════════\n');

    // Alumnes amb normesWeb (legacy) no buit
    const alWithLegacy = await db.collection('alumnes').countDocuments({
        normesWeb: { $exists: true, $not: { $size: 0 } }
    });
    console.log(`Alumnes amb normesWeb (legacy) NO buit: ${alWithLegacy}`);

    // Grups amb normesWeb (legacy) no buit
    const grWithLegacy = await db.collection('grups').countDocuments({
        normesWeb: { $exists: true, $not: { $size: 0 } }
    });
    console.log(`Grups amb normesWeb (legacy) NO buit: ${grWithLegacy}`);

    // Total normes2Web
    let total2Web = 0;
    const alumnes = await db.collection('alumnes').find({}).toArray();
    for (const a of alumnes) total2Web += (a.normes2Web || []).length;
    const grups = await db.collection('grups').find({}).toArray();
    for (const g of grups) total2Web += (g.normes2Web || []).length;
    console.log(`Total normes2Web (alumnes + grups): ${total2Web}`);

    // Total normesApp
    let totalApp = 0;
    for (const a of alumnes) totalApp += (a.normesApp || []).length;
    for (const g of grups) totalApp += (g.normesApp || []).length;
    console.log(`Total normesApp (alumnes + grups): ${totalApp}`);

    // Total normesWeb legacy
    let totalLegacy = 0;
    for (const a of alumnes) totalLegacy += (a.normesWeb || []).length;
    for (const g of grups) totalLegacy += (g.normesWeb || []).length;
    console.log(`Total normesWeb LEGACY (alumnes + grups): ${totalLegacy}`);

    console.log('');

    // 3. Col·leccions sospitoses (possibles orfes/no usades)
    const suspicious = ['weblines', 'normaapps', 'norma2webs', 'normas', 'web_lines'];
    console.log('🕵️ Col·leccions potencialment no usades:');
    let foundAny = false;
    for (const name of suspicious) {
        if (colNames.includes(name)) {
            const count = await db.collection(name).countDocuments();
            console.log(`   ⚠️  ${name}: ${count} documents`);
            foundAny = true;
        }
    }
    if (!foundAny) {
        console.log('   ✅ Cap col·lecció sospitosa trobada.');
    }

    console.log('\n👋 Fet!');

    await mongoose.disconnect();
}

main().catch((err) => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
    process.exit(1);
});
