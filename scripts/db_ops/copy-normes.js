/**
 * Script per copiar totes les normes d'un grup a un altre.
 *
 * Ús:
 *   node copy-normes.js --from <grupId_origen> --to <grupId_desti> [--skip-existing] [--type web|app|all] [--dry-run]
 *
 * Opcions:
 *   --from <id>          Grup d'origen (obligatori)
 *   --to <id>            Grup de destí (obligatori)
 *   --skip-existing      No copia normes que ja existeixen al grup destí
 *   --type <tipus>       Tipus de normes: "web", "app", o "all" (per defecte: "all")
 *   --dry-run            Mostra què es faria sense aplicar canvis
 *
 * Exemples:
 *   node copy-normes.js --from grupA --to grupB
 *   node copy-normes.js --from grupA --to grupB --skip-existing
 *   node copy-normes.js --from grupA --to grupB --type web --dry-run
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL no està definit al fitxer .env');
    process.exit(1);
}

// ---------------------------------------------------------------------------
// Parseig d'arguments
// ---------------------------------------------------------------------------

function parseArgs() {
    const args = process.argv.slice(2);
    const opts = {
        from: null,
        to: null,
        skipExisting: false,
        type: 'all',
        dryRun: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--from':
                opts.from = args[++i];
                break;
            case '--to':
                opts.to = args[++i];
                break;
            case '--skip-existing':
                opts.skipExisting = true;
                break;
            case '--type':
                opts.type = args[++i];
                break;
            case '--dry-run':
                opts.dryRun = true;
                break;
            case '--help':
            case '-h':
                printHelp();
                process.exit(0);
            default:
                console.error(`❌ Argument desconegut: ${args[i]}`);
                printHelp();
                process.exit(1);
        }
    }

    return opts;
}

function printHelp() {
    console.log(`
Ús: node copy-normes.js --from <grupId> --to <grupId> [opcions]

Opcions:
  --from <id>          Grup d'origen (obligatori)
  --to <id>            Grup de destí (obligatori)
  --skip-existing      No copia normes que ja existeixen al grup destí
  --type <tipus>       Tipus de normes: "web", "app", o "all" (defecte: "all")
  --dry-run            Mostra què es faria sense aplicar canvis
  -h, --help           Mostra aquesta ajuda
`);
}

// ---------------------------------------------------------------------------
// Funcions de comparació de normes
// ---------------------------------------------------------------------------

/**
 * Comprova si dues normes2Web són equivalents.
 * Es comparen: severity, mode, lines (host+pathname) i categories.
 */
function areWebNormesEqual(a, b) {
    // severity i mode
    if (a.severity !== b.severity) return false;
    if (a.mode !== b.mode) return false;

    // Comparar categories (en ordre, normalitzades)
    const catA = [...(a.categories || [])].sort();
    const catB = [...(b.categories || [])].sort();
    if (catA.length !== catB.length) return false;
    if (!catA.every((c, i) => c === catB[i])) return false;

    // Comparar lines
    const linesA = a.lines || [];
    const linesB = b.lines || [];
    if (linesA.length !== linesB.length) return false;

    for (let i = 0; i < linesA.length; i++) {
        if (!areWebLinesEqual(linesA[i], linesB[i])) return false;
    }

    return true;
}

/**
 * Comprova si dues WebLine són equivalents.
 */
function areWebLinesEqual(a, b) {
    return (a.host || '') === (b.host || '')
        && (a.protocol || '') === (b.protocol || '')
        && (a.search || '') === (b.search || '')
        && (a.pathname || '') === (b.pathname || '')
        && (a.title || '') === (b.title || '')
        && (a.browser || '') === (b.browser || '')
        && (a.incognito || false) === (b.incognito || false)
        && (a.audible || false) === (b.audible || false);
}

/**
 * Comprova si dues normesApp són equivalents.
 */
function areAppNormesEqual(a, b) {
    return (a.processName || '') === (b.processName || '')
        && (a.processPath || '') === (b.processPath || '')
        && (a.processPathisRegex || false) === (b.processPathisRegex || false)
        && (a.severity || '') === (b.severity || '');
}

// ---------------------------------------------------------------------------
// Funció principal
// ---------------------------------------------------------------------------

async function main() {
    const opts = parseArgs();

    // Validar arguments obligatoris
    if (!opts.from || !opts.to) {
        console.error('❌ Cal especificar --from i --to.');
        printHelp();
        process.exit(1);
    }

    if (!['web', 'app', 'all'].includes(opts.type)) {
        console.error(`❌ --type ha de ser "web", "app" o "all". Valor rebut: "${opts.type}"`);
        process.exit(1);
    }

    console.log('🔌 Connectant a MongoDB...');
    await mongoose.connect(DATABASE_URL);
    const db = mongoose.connection.db;
    console.log('✅ Connexió establerta.\n');

    // Cercar els grups
    const grupFrom = await db.collection('grups').findOne({ grupId: opts.from });
    const grupTo = await db.collection('grups').findOne({ grupId: opts.to });

    if (!grupFrom) {
        console.error(`❌ Grup origen "${opts.from}" no trobat.`);
        process.exit(1);
    }
    if (!grupTo) {
        console.error(`❌ Grup destí "${opts.to}" no trobat.`);
        process.exit(1);
    }

    console.log(`📋 Grup ORIGEN: ${grupFrom.nom || grupFrom.grupId} (${grupFrom.grupId})`);
    console.log(`📋 Grup DESTÍ:  ${grupTo.nom || grupTo.grupId} (${grupTo.grupId})`);
    if (opts.skipExisting) console.log('🔍 Mode: --skip-existing (s\'exclouen normes ja existents)');
    if (opts.dryRun) console.log('🔍 Mode: --dry-run (sense canvis reals)');
    console.log(`📦 Tipus de normes: ${opts.type}`);
    console.log('');

    let totalCopied = 0;
    let totalSkipped = 0;

    // ---- normes2Web ----
    if (opts.type === 'web' || opts.type === 'all') {
        const webFrom = grupFrom.normes2Web || [];
        const webTo = grupTo.normes2Web || [];

        console.log(`🌐 normes2Web a origen: ${webFrom.length}`);
        console.log(`🌐 normes2Web a destí:  ${webTo.length}`);
        console.log('');

        const toAdd = [];

        for (const norma of webFrom) {
            if (!norma.alive) {
                console.log(`  ⏭️  [SKIP] Norma desactivada (alive=false) → no es copia`);
                totalSkipped++;
                continue;
            }

            if (opts.skipExisting) {
                const alreadyExists = webTo.some((existing) => areWebNormesEqual(existing, norma));
                if (alreadyExists) {
                    const firstLine = (norma.lines && norma.lines.length > 0)
                        ? `${norma.lines[0].host || '?'}${norma.lines[0].pathname || ''}`
                        : 'sense lines';
                    console.log(`  ⏭️  [SKIP] Ja existeix: ${norma.mode} / ${norma.severity} / ${firstLine}`);
                    totalSkipped++;
                    continue;
                }
            }

            toAdd.push(norma);
        }

        if (toAdd.length > 0) {
            if (!opts.dryRun) {
                await db.collection('grups').updateOne(
                    { grupId: opts.to },
                    { $push: { normes2Web: { $each: toAdd } } }
                );
            }
            for (const norma of toAdd) {
                const firstLine = (norma.lines && norma.lines.length > 0)
                    ? `${norma.lines[0].host || '?'}${norma.lines[0].pathname || ''}`
                    : 'sense lines';
                const dryTag = opts.dryRun ? ' [DRY-RUN]' : '';
                console.log(`  ✅${dryTag} Copiada: ${norma.mode} / ${norma.severity} / ${firstLine} [${(norma.categories || ['general']).join(', ')}]`);
            }
            totalCopied += toAdd.length;
        }
    }

    // ---- normesApp ----
    if (opts.type === 'app' || opts.type === 'all') {
        const appFrom = grupFrom.normesApp || [];
        const appTo = grupTo.normesApp || [];

        console.log('');
        console.log(`💻 normesApp a origen: ${appFrom.length}`);
        console.log(`💻 normesApp a destí:  ${appTo.length}`);
        console.log('');

        const toAdd = [];

        for (const norma of appFrom) {
            if (opts.skipExisting) {
                const alreadyExists = appTo.some((existing) => areAppNormesEqual(existing, norma));
                if (alreadyExists) {
                    console.log(`  ⏭️  [SKIP] Ja existeix: ${norma.processName || '?'} (${norma.severity})`);
                    totalSkipped++;
                    continue;
                }
            }

            toAdd.push(norma);
        }

        if (toAdd.length > 0) {
            if (!opts.dryRun) {
                await db.collection('grups').updateOne(
                    { grupId: opts.to },
                    { $push: { normesApp: { $each: toAdd } } }
                );
            }
            for (const norma of toAdd) {
                const dryTag = opts.dryRun ? ' [DRY-RUN]' : '';
                console.log(`  ✅${dryTag} Copiada: ${norma.processName || '?'} (${norma.severity})`);
            }
            totalCopied += toAdd.length;
        }
    }

    // ---- Resum final ----
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log(`📊 RESUM:`);
    console.log(`   Normes copiades: ${totalCopied}`);
    console.log(`   Normes saltades: ${totalSkipped}`);
    if (opts.dryRun) console.log('   ⚠️  DRY-RUN: no s\'ha aplicat cap canvi real.');
    console.log('═══════════════════════════════════════════');

    await mongoose.disconnect();
    console.log('👋 Desconnectat.');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
