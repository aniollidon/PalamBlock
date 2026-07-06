/**
 * Script per borrar totes les normes (web i/o app) d'un grup.
 *
 * Ús:
 *   node clear-normes.js --grup <grupId> [--type web|app|all] [--dry-run] [--force]
 *
 * Opcions:
 *   --grup <id>        Grup del qual borrar les normes (obligatori)
 *   --type <tipus>     Tipus de normes: "web", "app", o "all" (per defecte: "all")
 *   --dry-run          Mostra què es borraria sense aplicar canvis
 *   --force            No demana confirmació abans de borrar
 *   -h, --help         Mostra aquesta ajuda
 *
 * Exemples:
 *   node clear-normes.js --grup FPB1
 *   node clear-normes.js --grup FPB1 --type web --dry-run
 *   node clear-normes.js --grup FPB1 --type app --force
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
        grup: null,
        type: 'all',
        dryRun: false,
        force: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--grup':
                opts.grup = args[++i];
                break;
            case '--type':
                opts.type = args[++i];
                break;
            case '--dry-run':
                opts.dryRun = true;
                break;
            case '--force':
                opts.force = true;
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
Ús: node clear-normes.js --grup <grupId> [opcions]

Opcions:
  --grup <id>      Grup del qual borrar les normes (obligatori)
  --type <tipus>   Tipus de normes: "web", "app" o "all" (defecte: "all")
  --dry-run        Mostra què es borraria sense aplicar canvis
  --force          No demana confirmació abans de borrar
  -h, --help       Mostra aquesta ajuda
`);
}

// ---------------------------------------------------------------------------
// Funció per demanar confirmació
// ---------------------------------------------------------------------------

function askConfirm(question) {
    return new Promise((resolve) => {
        const rl = require('readline').createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        rl.question(question, (answer) => {
            rl.close();
            resolve(answer.trim().toLowerCase() === 's');
        });
    });
}

// ---------------------------------------------------------------------------
// Funció principal
// ---------------------------------------------------------------------------

async function main() {
    const opts = parseArgs();

    if (!opts.grup) {
        console.error('❌ Cal especificar --grup.');
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

    // Cercar el grup
    const grup = await db.collection('grups').findOne({ grupId: opts.grup });

    if (!grup) {
        console.error(`❌ Grup "${opts.grup}" no trobat.`);
        process.exit(1);
    }

    console.log(`📋 Grup: ${grup.nom || grup.grupId} (${grup.grupId})`);
    if (opts.dryRun) console.log('🔍 Mode: --dry-run (sense canvis reals)');
    console.log('');

    const normesWeb = grup.normes2Web || [];
    const normesApp = grup.normesApp || [];

    let clearWeb = false;
    let clearApp = false;
    let totalToClear = 0;

    if (opts.type === 'web' || opts.type === 'all') {
        clearWeb = true;
        totalToClear += normesWeb.length;
    }
    if (opts.type === 'app' || opts.type === 'all') {
        clearApp = true;
        totalToClear += normesApp.length;
    }

    console.log('═══════════════════════════════════════════');
    console.log('📊 NORMES A BORRAR:');
    console.log('═══════════════════════════════════════════');
    console.log('');

    if (clearWeb) {
        console.log(`🌐 normes2Web: ${normesWeb.length}`);
        if (normesWeb.length > 0) {
            for (const norma of normesWeb) {
                const firstLine = (norma.lines && norma.lines.length > 0)
                    ? `${norma.lines[0].host || '?'}${norma.lines[0].pathname || ''}`
                    : 'sense lines';
                console.log(`   · ${norma.mode} / ${norma.severity} / ${firstLine} [${(norma.categories || ['general']).join(', ')}]`);
            }
        } else {
            console.log('   (cap norma per borrar)');
        }
        console.log('');
    }

    if (clearApp) {
        console.log(`💻 normesApp: ${normesApp.length}`);
        if (normesApp.length > 0) {
            for (const norma of normesApp) {
                console.log(`   · ${norma.processName || '?'} / ${norma.processPath || '?'} (${norma.severity})`);
            }
        } else {
            console.log('   (cap norma per borrar)');
        }
        console.log('');
    }

    if (totalToClear === 0) {
        console.log('✅ No hi ha normes per borrar.');
        await mongoose.disconnect();
        return;
    }

    console.log(`📊 Total: ${totalToClear} normes`);

    if (opts.dryRun) {
        console.log('⚠️  DRY-RUN: no s\'ha aplicat cap canvi.');
        await mongoose.disconnect();
        return;
    }

    // Demanar confirmació si no s'ha passat --force
    if (!opts.force) {
        const confirmed = await askConfirm(`\n⚠️  Estàs segur de borrar ${totalToClear} normes del grup "${grup.grupId}"? (s/N) `);
        if (!confirmed) {
            console.log('❌ Operació cancel·lada.');
            await mongoose.disconnect();
            return;
        }
    }

    // Aplicar els canvis
    const updateFields = {};
    if (clearWeb) {
        updateFields.normes2Web = [];
    }
    if (clearApp) {
        updateFields.normesApp = [];
    }

    await db.collection('grups').updateOne(
        { grupId: opts.grup },
        { $set: updateFields }
    );

    console.log(`\n✅ Borrades ${totalToClear} normes del grup "${grup.grupId}".`);

    await mongoose.disconnect();
    console.log('👋 Desconnectat.');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
