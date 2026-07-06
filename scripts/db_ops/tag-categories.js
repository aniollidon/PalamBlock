/**
 * Script interactiu per etiquetar normes amb categories.
 * 
 * Mostra cada norma existent i permet assignar-li una o més categories
 * triant entre opcions predefinides o escrivint text lliure.
 *
 * Ús: node tag-categories.js
 */

const path = require('path');
const readline = require('readline');

require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL;

// Categories predefinides
const PRESET_CATEGORIES = [
    { key: '1', name: 'jocs' },
    { key: '2', name: 'ia' },
    { key: '3', name: 'xarxes-socials' },
    { key: '4', name: 'compres' },
    { key: '5', name: 'inapropiat' },
    { key: '6', name: 'navegadors' },
    { key: '7', name: 'general' },
];

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

function ask(question) {
    return new Promise((resolve) => rl.question(question, resolve));
}

function printPresetOptions() {
    console.log('');
    PRESET_CATEGORIES.forEach((c) => {
        console.log(`  [${c.key}] ${c.name}`);
    });
    console.log('  [0] saltar (deixar sense categoria)');
    console.log('  [s] sortir i guardar');
    console.log('  (o escriu text lliure separat per comes)');
}

function parseAnswer(answer) {
    if (!answer || answer.trim() === '') return { action: 'skip' };
    const trimmed = answer.trim().toLowerCase();

    if (trimmed === 's') return { action: 'quit' };
    if (trimmed === '0') return { action: 'skip' };

    // Separar per comes o espais
    const parts = trimmed.split(/[,\s]+/).filter(Boolean);
    const categories = [];

    for (const part of parts) {
        const preset = PRESET_CATEGORIES.find((c) => c.key === part);
        if (preset) {
            categories.push(preset.name);
        } else {
            // Text lliure
            categories.push(part);
        }
    }

    return { action: 'set', categories: [...new Set(categories)] };
}

function formatNormaLine(norma, context) {
    const parts = [];
    parts.push(`${context.type}: ${context.name}`);
    if (norma.lines && norma.lines.length > 0) {
        const l = norma.lines[0];
        if (l.host) parts.push(`host: ${l.host}`);
        if (l.pathname && l.pathname !== '/') parts.push(`path: ${l.pathname}`);
        if (l.title) parts.push(`title: ${l.title.replace(/^\*+|\*+$/g, '')}`);
    }
    parts.push(`severity: ${norma.severity}`);
    parts.push(`mode: ${norma.mode}`);
    parts.push(`alive: ${norma.alive ? '✓' : '✗'}`);
    const currentCats = (norma.categories && norma.categories.length > 0)
        ? norma.categories.join(', ')
        : '(cap)';
    parts.push(`cats: [${currentCats}]`);
    return parts.join(' | ');
}

async function main() {
    console.log('🔌 Connectant a MongoDB...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connexió establerta.\n');

    // Preguntar quin àmbit
    console.log('Què vols etiquetar?');
    console.log('  [1] Només alumnes');
    console.log('  [2] Només grups');
    console.log('  [3] Ambdós (per defecte)');
    const scopeAnswer = await ask('> ');
    const scope = scopeAnswer.trim() || '3';

    // Recollir totes les normes
    const norms = [];

    if (scope === '1' || scope === '3') {
        const alumnes = await mongoose.connection.db
            .collection('alumnes')
            .find({})
            .toArray();

        for (const alumne of alumnes) {
            for (const norma of (alumne.normes2Web || [])) {
                norms.push({
                    _id: norma._id,
                    collection: 'alumnes',
                    docId: alumne._id,
                    context: {
                        type: 'Alumne',
                        name: alumne.alumneId || alumne._id,
                    },
                    lines: norma.lines || [],
                    severity: norma.severity,
                    mode: norma.mode,
                    alive: norma.alive,
                    categories: norma.categories || [],
                });
            }
        }
    }

    if (scope === '2' || scope === '3') {
        const grups = await mongoose.connection.db
            .collection('grups')
            .find({})
            .toArray();

        for (const grup of grups) {
            for (const norma of (grup.normes2Web || [])) {
                norms.push({
                    _id: norma._id,
                    collection: 'grups',
                    docId: grup._id,
                    context: {
                        type: 'Grup',
                        name: grup.grupId || grup._id,
                    },
                    lines: norma.lines || [],
                    severity: norma.severity,
                    mode: norma.mode,
                    alive: norma.alive,
                    categories: norma.categories || [],
                });
            }
        }
    }

    if (norms.length === 0) {
        console.log('⚠️ No s\'ha trobat cap norma per etiquetar.');
        await mongoose.disconnect();
        rl.close();
        return;
    }

    console.log(`\n📋 S'han trobat ${norms.length} normes.\n`);
    printPresetOptions();

    let changed = 0;
    let skipped = 0;
    const updates = []; // { collection, docId, normaId, categories }

    for (let i = 0; i < norms.length; i++) {
        const norma = norms[i];
        console.log(`\n─────────────────────────────────────────────`);
        console.log(`Norma ${i + 1}/${norms.length}:`);
        console.log(`  ${formatNormaLine(norma, norma.context)}`);

        const answer = await ask('  Categories > ');
        const result = parseAnswer(answer);

        if (result.action === 'quit') {
            console.log('\n👋 Sortint...');
            break;
        }

        if (result.action === 'skip') {
            skipped++;
            continue;
        }

        if (result.action === 'set') {
            const newCats = result.categories;
            const oldCats = norma.categories || [];

            // Comprovar si hi ha canvi real
            const sortedNew = [...newCats].sort();
            const sortedOld = [...oldCats].sort();
            if (JSON.stringify(sortedNew) === JSON.stringify(sortedOld)) {
                skipped++;
                continue;
            }

            updates.push({
                collection: norma.collection,
                docId: norma.docId,
                normaId: norma._id,
                categories: newCats,
            });
            changed++;
            console.log(`  ✅ Categoria: ${newCats.join(', ') || '(cap)'}`);
        }
    }

    // Resum i confirmació
    console.log(`\n═══════════════════════════════════════════════`);
    console.log(`📊 Resum: ${skipped} sense canvis, ${changed} modificades`);
    console.log(`═══════════════════════════════════════════════\n`);

    if (changed === 0) {
        console.log('✅ No hi ha canvis per guardar.');
    } else {
        // Mostrar què es canviarà
        console.log('Canvis a aplicar:');
        for (const upd of updates) {
            const ctx = upd.collection === 'alumnes' ? 'Alumne' : 'Grup';
            console.log(`  ${ctx} → norma ${upd.normaId}: [${upd.categories.join(', ') || '(cap)'}]`);
        }

        console.log('');
        const confirm = await ask('Vols aplicar aquests canvis? [s/N] ');
        if (confirm.trim().toLowerCase() === 's') {
            console.log('\n💾 Guardant canvis...');

            for (const upd of updates) {
                await mongoose.connection.db
                    .collection(upd.collection)
                    .updateOne(
                        { _id: upd.docId, 'normes2Web._id': upd.normaId },
                        { $set: { 'normes2Web.$.categories': upd.categories } }
                    );
            }

            console.log('✅ Canvis aplicats correctament!');
        } else {
            console.log('❌ Canvis descartats.');
        }
    }

    await mongoose.disconnect();
    rl.close();
    console.log('\n👋 Fet!');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
    rl.close();
    process.exit(1);
});
