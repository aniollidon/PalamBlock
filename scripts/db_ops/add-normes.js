/**
 * Script per afegir normes ràpidament a un grup a partir d'una llista de hosts.
 *
 * Ús:
 *   node add-normes.js --grup <grupId> --hosts "<host1>,<host2>,..." [opcions]
 *
 * Opcions:
 *   --grup <id>          Grup al qual afegir les normes (obligatori)
 *   --hosts <llista>     Llista de hosts separats per comes (obligatori)
 *   --categoria <cat>    Categoria per a totes les normes (per defecte: "general")
 *   --mode <mode>        Mode de la norma: "blacklist" o "whitelist" (defecte: "blacklist")
 *   --severity <sev>     Severitat: "block" o "warn" (defecte: "block")
 *   --skip-existing      No afegeix normes si el host ja existeix al grup
 *   --dry-run            Mostra què es faria sense aplicar canvis
 *   -h, --help           Mostra aquesta ajuda
 *
 * Exemples:
 *   node add-normes.js --grup FPB1 --hosts "example.com,totube.cat,instagram.com" --categoria xarxes-socials
 *   node add-normes.js --grup FPB1 --hosts "youtube.com,reddit.com" --categoria general --mode whitelist
 *   node add-normes.js --grup FPB1 --hosts "tiktok.com" --categoria xarxes-socials --skip-existing --dry-run
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
        hosts: null,
        categoria: 'general',
        mode: 'blacklist',
        severity: 'block',
        skipExisting: false,
        dryRun: false,
    };

    for (let i = 0; i < args.length; i++) {
        switch (args[i]) {
            case '--grup':
                opts.grup = args[++i];
                break;
            case '--hosts':
                opts.hosts = args[++i];
                break;
            case '--categoria':
                opts.categoria = args[++i];
                break;
            case '--mode':
                opts.mode = args[++i];
                break;
            case '--severity':
                opts.severity = args[++i];
                break;
            case '--skip-existing':
                opts.skipExisting = true;
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
Ús: node add-normes.js --grup <grupId> --hosts "<host1>,<host2>,..." [opcions]

Opcions:
  --grup <id>           Grup al qual afegir les normes (obligatori)
  --hosts <llista>      Llista de hosts separats per comes (obligatori)
  --categoria <cat>     Categoria per a totes les normes (defecte: "general")
  --mode <mode>         Mode: "blacklist" o "whitelist" (defecte: "blacklist")
  --severity <sev>      Severitat: "block" o "warn" (defecte: "block")
  --skip-existing       No afegeix normes si el host ja existeix al grup
  --dry-run             Mostra què es faria sense aplicar canvis
  -h, --help            Mostra aquesta ajuda
`);
}

// ---------------------------------------------------------------------------
// Funcions auxiliars
// ---------------------------------------------------------------------------

/**
 * Comprova si un host ja existeix en alguna norma del grup.
 * Busca tant a normes2Web (camp lines[].host) com a normesApp.
 */
function hostExistsInGrup(grup, host) {
    const normes = grup.normes2Web || [];
    return normes.some((norma) =>
        (norma.lines || []).some((line) => (line.host || '').toLowerCase() === host.toLowerCase())
    );
}

// ---------------------------------------------------------------------------
// Funció principal
// ---------------------------------------------------------------------------

async function main() {
    const opts = parseArgs();

    // Validar arguments obligatoris
    if (!opts.grup) {
        console.error('❌ Cal especificar --grup.');
        printHelp();
        process.exit(1);
    }
    if (!opts.hosts) {
        console.error('❌ Cal especificar --hosts.');
        printHelp();
        process.exit(1);
    }

    if (!['blacklist', 'whitelist'].includes(opts.mode)) {
        console.error(`❌ --mode ha de ser "blacklist" o "whitelist". Valor rebut: "${opts.mode}"`);
        process.exit(1);
    }
    if (!['block', 'warn'].includes(opts.severity)) {
        console.error(`❌ --severity ha de ser "block" o "warn". Valor rebut: "${opts.severity}"`);
        process.exit(1);
    }

    // Processar la llista de hosts
    const hosts = opts.hosts
        .split(',')
        .map((h) => h.trim())
        .filter((h) => h.length > 0);

    if (hosts.length === 0) {
        console.error('❌ No s\'han trobat hosts vàlids a la llista.');
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
    console.log(`📦 Mode: ${opts.mode} | Severitat: ${opts.severity} | Categoria: ${opts.categoria}`);
    if (opts.skipExisting) console.log('🔍 Mode: --skip-existing (s\'exclouen hosts ja existents)');
    if (opts.dryRun) console.log('🔍 Mode: --dry-run (sense canvis reals)');
    console.log(`🌐 Hosts rebuts: ${hosts.length}`);
    console.log('');

    // Filtrar i crear normes
    const normesToAdd = [];
    let skipped = 0;

    for (const host of hosts) {
        if (opts.skipExisting && hostExistsInGrup(grup, host)) {
            console.log(`  ⏭️  [SKIP] "${host}" ja existeix al grup`);
            skipped++;
            continue;
        }

        normesToAdd.push({
            severity: opts.severity,
            mode: opts.mode,
            alive: true,
            enabled_on: [],
            lines: [{
                host: host,
                protocol: '',
                search: '',
                pathname: '',
                title: '',
                browser: '',
                incognito: false,
                audible: false,
            }],
            categories: [opts.categoria],
        });
    }

    // Mostrar les normes a afegir
    if (normesToAdd.length === 0) {
        console.log('\n✅ No hi ha normes noves per afegir (totes saltades).');
        await mongoose.disconnect();
        return;
    }

    console.log(`🆕 Normes a crear: ${normesToAdd.length}`);
    for (const norma of normesToAdd) {
        const host = norma.lines[0].host;
        const dryTag = opts.dryRun ? ' [DRY-RUN]' : '';
        console.log(`  ✅${dryTag} ${host} → (${norma.mode}, ${norma.severity}, [${norma.categories.join(', ')}])`);
    }

    // Aplicar canvis
    if (!opts.dryRun) {
        await db.collection('grups').updateOne(
            { grupId: opts.grup },
            { $push: { normes2Web: { $each: normesToAdd } } }
        );
    }

    // Resum
    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('📊 RESUM:');
    console.log(`   Normes afegides: ${normesToAdd.length}`);
    console.log(`   Normes saltades: ${skipped}`);
    if (opts.dryRun) console.log('   ⚠️  DRY-RUN: no s\'ha aplicat cap canvi real.');
    console.log('═══════════════════════════════════════════');

    await mongoose.disconnect();
    console.log('👋 Desconnectat.');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    process.exit(1);
});
