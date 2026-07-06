/**
 * Script per categoritzar automàticament totes les normes existents
 * basant-se en patrons de host i títol.
 *
 * Ús: node auto-tag.js
 */

const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const mongoose = require('mongoose');

const DATABASE_URL = process.env.DATABASE_URL;

// Regles de categorització: [patró, categoria]
// El patró es compara amb host+títol+pathname en minúscules
const RULES = [
    // === JOCS ===
    ['jocs', 'ubisoft'],
    ['jocs', 'venge.io'],
    ['jocs', 'xbox.com'],
    ['jocs', 'playstation'],
    ['jocs', 'crazygames'],
    ['jocs', 'amazongames'],
    ['jocs', 'y8.com'],
    ['jocs', 'poki.com'],
    ['jocs', 'newcp.net'],
    ['jocs', 'totaljerkface'],  // happy wheels
    ['jocs', 'happy_wheels'],
    ['jocs', '1001jogos'],
    ['jocs', 'playhop.com'],
    ['jocs', 'dinorunner'],
    ['jocs', 'yiv.com'],
    ['jocs', 'bubbleshooter'],
    ['jocs', 'twoplayergames'],
    ['jocs', 'leveldevil'],
    ['jocs', 'stickman'],
    ['jocs', 'wordly'],
    ['jocs', 'masomo'],
    ['jocs', 'laxarus'],
    ['jocs', 'egamezone'],
    ['jocs', 'angrybirds'],
    ['jocs', 'temple-ofboom'],
    ['jocs', 'roblox'],
    ['jocs', 'callofduty'],
    ['jocs', 'chess.com'],
    ['jocs', 'rolimons'],
    ['jocs', 'turbowarp'],
    ['jocs', 'fortnite'],
    ['jocs', 'tlauncher'],
    ['jocs', 'pixelmon'],
    ['jocs', 'hoyfortnite'],
    ['jocs', 'valorantstorechecker'],
    ['jocs', 'epicgames'],
    ['jocs', 'brawlhalla'],
    ['jocs', 'microsoftcasualgames'],
    ['jocs', 'trex-runner'],
    ['jocs', 'play-games'],
    ['jocs', 'retrogames'],
    ['jocs', 'futwatch'],
    ['jocs', 'easports'],
    ['jocs', 'gameis.net'],
    ['jocs', 'geoguessr'],
    ['jocs', 'bonk.io'],
    ['jocs', 'brawl*ninja'],
    ['jocs', 'brawl ninja'],
    ['jocs', 'wow'],
    ['jocs', 'god of war'],
    ['jocs', 'champions'],
    ['jocs', 'dark souls'],
    ['jocs', 'videojuegos'],
    ['jocs', 'buscaminas'],
    ['jocs', 'minesweeper'],
    ['jocs', 'ps4'],
    ['jocs', 'pokemon'],
    ['jocs', 'limbuscompany'],
    ['jocs', 'mcdle.net'],
    ['jocs', 'contexto.me'],
    ['jocs', 'quiz.com'],
    ['jocs', 'juegos-mentales'],
    ['jocs', 'wayground'],
    ['jocs', 'blipzi'],
    ['jocs', 'scratch.mit.edu'],
    ['jocs', 'futbol'],
    ['jocs', 'football'],
    ['jocs', 'laliga.com'],
    ['jocs', 'thespike.gg'],
    ['jocs', 'forogore.net'],       // gaming forum
    ['jocs', 'earlygame'],
    ['jocs', 'liquipedia'],
    ['jocs', 'theradiant.gg'],
    ['jocs', 'realmadrid'],
    ['jocs', 'mancity'],
    ['jocs', 'mundodeportivo'],
    ['jocs', 'tennis-point'],
    ['jocs', 'fcf.cat'],
    ['jocs', 'as.com'],
    ['jocs', 'kawasaki'],           // moto game?
    ['jocs', 'spotify'],
    ['jocs', 'steamakersblocks'],   // whitelist, joc educatiu
    ['jocs', 'crunchyroll'],
    ['jocs', 'animeflv'],
    ['jocs', 'primevideo'],
    ['jocs', 'wobo.tools'],
    ['jocs', 'myinstants'],
    ['jocs', 'depor8'],
    ['jocs', 'classroom6x'],        // unblocked games
    ['jocs', '1000chistes'],
    ['jocs', '1001juegos'],
    ['jocs', 'friv.com'],
    ['jocs', 'minijuegos'],
    ['jocs', 'isladejuegos'],
    ['jocs', 'coolmathgames'],
    ['jocs', 'cokitos'],
    ['jocs', 'cooljuegos'],
    ['jocs', 'cokogames'],
    ['jocs', 'fnaf'],
    ['jocs', 'basketballlegends'],
    ['jocs', 'headball2'],
    ['jocs', 'fancade'],
    ['jocs', 'solitarioclasico'],
    ['jocs', 'geforcenow'],
    ['jocs', 'kirka.io'],
    ['jocs', 'snake.io'],
    ['jocs', 'deadshot.io'],
    ['jocs', 'slope2'],
    ['jocs', 'gameverse'],
    ['jocs', 'purogamer'],
    ['jocs', 'wordlegame'],
    ['jocs', 'wordle'],
    ['jocs', 'runescape'],
    ['jocs', 'foddy.net'],
    ['jocs', 'linerider'],
    ['jocs', 'start.gg'],
    ['jocs', 'tiermaker'],
    ['jocs', 'nba.com'],
    ['jocs', 'psg.fr'],
    ['jocs', 'psg'],
    ['jocs', 'espn'],
    ['jocs', 'supercpps'],
    ['jocs', 'superclubpenguin'],
    ['jocs', 'cpjourney'],
    ['jocs', 'nytimes.com/games'],
    ['jocs', 'nintendo'],
    ['jocs', 'steam'],
    ['jocs', 'valorant'],
    ['jocs', 'clash of clans'],
    ['jocs', 'brawl stars'],
    ['jocs', 'brawl*stars'],
    ['jocs', 'diablo'],
    ['jocs', 'blizzard'],
    ['jocs', 'mortal kombat'],
    ['jocs', 'transfermarkt'],
    ['jocs', 'sport.es'],
    ['jocs', 'wefut'],
    ['jocs', 'futwiz'],
    ['jocs', 'infinite-craft'],
    ['jocs', 'neal.fun'],
    ['jocs', 'msn.com*games'],
    ['jocs', 'googlesnake'],
    ['jocs', 'armagetronad'],
    ['jocs', 'armagetron'],
    ['jocs', 'citycardriving'],
    ['jocs', 'spacewavesgame'],
    ['jocs', 'bigshotboxing'],
    ['jocs', 'trinculo54.github'],
    ['jocs', 'codeartemis.github'],
    ['jocs', 'github.io'],
    ['jocs', 'game'],
    ['jocs', 'soundbuttonsworld'],
    ['jocs', 'playgama'],
    ['jocs', 'binarypiano'],
    ['jocs', 'luna.amazon.es'],
    ['jocs', 'uptodown'],
    ['jocs', 'softonic'],
    ['jocs', '*games'],
    ['jocs', 'unblocked games'],
    ['jocs', 'epic games'],
    ['jocs', 'apple.com/app'],

    // === IA ===
    ['ia', 'chatgpt'],
    ['ia', 'deepseek'],
    ['ia', 'monica.im'],
    ['ia', 'venice.ai'],
    ['ia', 'iask.ai'],
    ['ia', 'hix.ai'],
    ['ia', 'deepai'],
    ['ia', 'aichatting'],
    ['ia', 'openrouter.ai'],
    ['ia', 'blackbox.ai'],
    ['ia', 'copyter'],
    ['ia', 'grok.com'],
    ['ia', 'qwen.ai'],
    ['ia', 'gemini.google'],
    ['ia', 'claude.ai'],
    ['ia', '*.ai'],
    ['ia', 'copilot.microsoft'],
    ['ia', 'quillbot'],
    ['ia', 'chat.luzia'],
    ['ia', 'poe.com'],
    ['ia', 'kagi.com'],
    ['ia', 'perplexity.ai'],
    ['ia', 'undetectable.ai'],
    ['ia', 'agpt.co'],
    ['ia', 'sourcegraph'],
    ['ia', 'kimi.com'],
    ['ia', 'notebooklm.google'],
    ['ia', 'you.com'],
    ['ia', 'overchat.ai'],
    ['ia', 'easemate.ai'],
    ['ia', 'victorai.app'],
    ['ia', 'zerogpt'],
    ['ia', 'mydetector.ai'],
    ['ia', 'talkai'],
    ['ia', 'aihumanize'],
    ['ia', 'luzia.com'],
    ['ia', 'resoomer'],
    ['ia', 'huggingface'],
    ['ia', 'hf.space'],
    ['ia', 'aimukreegee'],
    ['ia', 'bing.com/copilot'],
    ['ia', 'copilotsearch'],

    // === XARXES SOCIALS ===
    ['xarxes-socials', 'tiktok'],
    ['xarxes-socials', 'snapchat'],
    ['xarxes-socials', 'facebook'],
    ['xarxes-socials', 'twitter'],
    ['xarxes-socials', 'wechat'],
    ['xarxes-socials', 'chateek'],
    ['xarxes-socials', 'dzen.ru'],
    ['xarxes-socials', 'kick.com'],
    ['xarxes-socials', 'telegram'],
    ['xarxes-socials', 'twitch.tv'],
    ['xarxes-socials', 'discord'],
    ['xarxes-socials', 'whatsapp'],
    ['xarxes-socials', 'instagram'],
    ['xarxes-socials', 'omegle'],
    ['xarxes-socials', 'forocoches'],

    // === COMPRES ===
    ['compres', 'cnfans'],
    ['compres', 'arcteryx'],
    ['compres', 'es.diesel'],
    ['compres', 'wallapop'],
    ['compres', 'kukirin'],
    ['compres', 'stockx'],
    ['compres', 'venum'],
    ['compres', 'decathlon'],
    ['compres', 'underarmour'],
    ['compres', 'zapasmedia'],
    ['compres', 'vrunkstore'],
    ['compres', 'nike'],
    ['compres', 'adidas'],
    ['compres', 'syna.store'],
    ['compres', 'cpcompany'],
    ['compres', 'oopbuy'],
    ['compres', 'alibaba'],
    ['compres', 'keysforgames'],
    ['compres', 'syna'],
    ['compres', 'cuanto cobra'],
    ['compres', 'cuanto cuesta'],
    ['compres', 'pccomponentes'],
    ['compres', 'jdsports'],
    ['compres', 'tagoya'],
    ['compres', 'buddhafightwear'],
    ['compres', 'cuimo'],
    ['compres', 'ant.toys'],
    ['compres', 'canada goose'],
    ['compres', 'motorvinilo'],
    ['compres', '3dtuning'],
    ['compres', 'ebay.es'],
    ['compres', 'booking.com'],
    ['compres', 'portaventuraworld'],

    // === INAPROPIAT ===
    ['inapropiat', 'thehiddenwiki'],
    ['inapropiat', 'tokyvideo'],
    ['inapropiat', 'webcamtoy'],
    ['inapropiat', 'puta'],
    ['inapropiat', 'racksmafia'],
    ['inapropiat', 'mansory'],
    ['inapropiat', 'pollofre'],
    ['inapropiat', 'torproject'],
    ['inapropiat', 'tor'],
    ['inapropiat', 'xnxx'],
    ['inapropiat', 'porno'],
    ['inapropiat', 'webcamtests'],
    ['inapropiat', 'red-track'],

    // === GENERAL (altres) ===
    ['general', 'photos.google'],
    ['general', 'yandex'],
    ['general', 'duolingo'],
    ['general', 'lapalabradeldia'],
    ['general', 'wikihow'],
    ['general', 'mozilla'],
    ['general', 'brave'],
    ['general', 'firefox'],
    ['general', 'opera'],
    ['general', 'cf'],
    ['general', 'piliapp'],
    ['general', 'webcatalog'],
    ['general', 'holi'],
    ['general', 'meme'],
    ['general', 'jordi wild'],
    ['general', 'ps4'],
    ['general', 'youtube'],
    ['general', 'google.com'],
    ['general', 'payments.google'],
    ['general', 'myaccount.google'],
    ['general', 'cloud.aeolservice'],
    ['general', '5.250.190.223'],
    ['general', 'greentecher'],
    ['general', 'amv.es'],
    ['general', 'koenigsegg'],
    ['general', 'yamaha-motor'],
    ['general', 'beacons.ai'],
    ['general', 'lamine'],
    ['general', 'yamal'],
    ['general', 'champions'],
    ['general', 'achievements'],
    ['general', 'fandom'],
    ['general', 'netflix'],
    ['general', 'rottentomatoes'],
    ['general', 'elespanol'],
    ['general', 'voxespana'],
    ['general', 'medium.com'],
    ['general', 'msn.com'],
    ['general', 'britishcouncil'],
    ['general', 'profesionalreview'],
    ['general', 'watchdocumentaries'],
    ['general', 'yupmanga'],
    ['general', 'vivaldi'],
    ['general', 'browzar'],
    ['general', 'chromium'],
    ['general', 'greenbrowser'],
    ['general', 'avast'],
    ['general', 'microsoft.com/app'],
    ['general', 'startpage'],
    ['general', 'vlex'],
    ['general', 'reloj-alarma'],
    ['general', 'xelu.net'],
    ['general', 'wheelofnames'],
    ['general', 'pickerwheel'],
    ['general', 'randomlife'],
    ['general', 'seonalent'],
    ['general', '185.61.126.170'],
    ['general', 'komiko'],
    ['general', 'conselhoeconomico'],
    ['general', 'veo.co'],
    ['general', 'softonic'],
    ['general', 'bing.com/videos'],
    ['general', 'bing.com'],
    ['general', 'video.search.yahoo'],
    ['general', 'navegador'],
    ['general', 'apps.apple'],
    ['general', 'microsoft.com'],
];

function categorizeNorma(host, title, pathname) {
    // Wildcard catch-all rule
    if (host === '*' && !title && !pathname) return 'general';

    const haystack = [host, title, pathname]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

    for (const [cat, pattern] of RULES) {
        if (haystack.includes(pattern.toLowerCase())) {
            return cat;
        }
    }
    return null; // no match
}

async function main() {
    console.log('🔌 Connectant a MongoDB...');
    await mongoose.connect(DATABASE_URL);
    console.log('✅ Connexió establerta.\n');

    const db = mongoose.connection.db;
    const updates = [];

    // Processar alumnes
    const alumnes = await db.collection('alumnes').find({}).toArray();
    for (const a of alumnes) {
        for (const n of (a.normes2Web || [])) {
            const l = n.lines?.[0] || {};
            const host = l.host || '';
            const title = (l.title || '').replace(/^\*+|\*+$/g, '');
            const pathname = l.pathname || '';
            const cat = categorizeNorma(host, title, pathname);
            if (cat) {
                updates.push({
                    collection: 'alumnes',
                    docId: a._id,
                    normaId: n._id,
                    category: cat,
                    host, title, pathname,
                    context: `Alumne ${a.alumneId}`,
                });
            }
        }
    }

    // Processar grups
    const grups = await db.collection('grups').find({}).toArray();
    for (const g of grups) {
        for (const n of (g.normes2Web || [])) {
            const l = n.lines?.[0] || {};
            const host = l.host || '';
            const title = (l.title || '').replace(/^\*+|\*+$/g, '');
            const pathname = l.pathname || '';
            const cat = categorizeNorma(host, title, pathname);
            if (cat) {
                updates.push({
                    collection: 'grups',
                    docId: g._id,
                    normaId: n._id,
                    category: cat,
                    host, title, pathname,
                    context: `Grup ${g.grupId}`,
                });
            }
        }
    }

    // Mostrar resum
    const byCat = {};
    for (const u of updates) {
        if (!byCat[u.category]) byCat[u.category] = 0;
        byCat[u.category]++;
    }

    console.log('📊 Categories a assignar:');
    for (const [cat, count] of Object.entries(byCat).sort()) {
        console.log(`  ${cat}: ${count} normes`);
    }

    // Mostrar les no categoritzades
    const allNorms = [];
    for (const a of alumnes) {
        for (const n of (a.normes2Web || [])) {
            const l = n.lines?.[0] || {};
            allNorms.push({
                host: l.host || '',
                title: (l.title || '').replace(/^\*+|\*+$/g, ''),
                pathname: l.pathname || '',
            });
        }
    }
    for (const g of grups) {
        for (const n of (g.normes2Web || [])) {
            const l = n.lines?.[0] || {};
            allNorms.push({
                host: l.host || '',
                title: (l.title || '').replace(/^\*+|\*+$/g, ''),
                pathname: l.pathname || '',
            });
        }
    }

    const matchedIds = new Set(updates.map(u => u.normaId.toString()));
    const unmatched = [];
    for (const a of alumnes) {
        for (const n of (a.normes2Web || [])) {
            if (!matchedIds.has(n._id.toString())) {
                const l = n.lines?.[0] || {};
                unmatched.push(`Alumne ${a.alumneId} | host: ${l.host||'(sense)'} | title: ${(l.title||'').replace(/^\*+|\*+$/g,'')} | path: ${l.pathname||''} | sev: ${n.severity}`);
            }
        }
    }
    for (const g of grups) {
        for (const n of (g.normes2Web || [])) {
            if (!matchedIds.has(n._id.toString())) {
                const l = n.lines?.[0] || {};
                unmatched.push(`Grup ${g.grupId} | host: ${l.host||'(sense)'} | title: ${(l.title||'').replace(/^\*+|\*+$/g,'')} | path: ${l.pathname||''} | sev: ${n.severity}`);
            }
        }
    }

    if (unmatched.length > 0) {
        console.log(`\n⚠️ ${unmatched.length} normes sense categoria (es quedaran sense):`);
        unmatched.forEach(u => console.log(`  ${u}`));
    }

    console.log(`\n💾 Aplicant ${updates.length} canvis...`);

    let applied = 0;
    for (const u of updates) {
        await db.collection(u.collection).updateOne(
            { _id: u.docId, 'normes2Web._id': u.normaId },
            { $set: { 'normes2Web.$.categories': [u.category] } }
        );
        applied++;
    }

    console.log(`✅ ${applied} normes actualitzades.`);
    await mongoose.disconnect();
    console.log('👋 Fet!');
}

main().catch((err) => {
    console.error('❌ Error:', err);
    mongoose.disconnect();
    process.exit(1);
});
