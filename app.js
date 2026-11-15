/* ===== Database state ===== */
var DB = null;

/* ===== Mission ID helper ===== */
var ROMAN = { I: 1, II: 2, III: 3, IV: 4, V: 5 };
function missionId(m, idx, slug) {
    if (slug === "mars" || slug === "clps") return idx + 1;
    var tok = (m[0].match(/\b([IVX]+|\d+)$/) || [])[1];
    if (tok && ROMAN[tok]) return ROMAN[tok];
    return tok ? +tok : idx + 1;
}

/* ===== Mission icons ===== */
function patch(n, t, label) {
    var c = "var(--" + t + ")";
    var glyph = {
        test: '<path d="M32 14l5 12v14h-10V26z" fill="none" stroke="' + c + '" stroke-width="2"/><path d="M27 40l-4 6M37 40l4 6" stroke="' + c + '" stroke-width="2"/>',
        orbit: '<ellipse cx="32" cy="32" rx="22" ry="9" fill="none" stroke="' + c + '" stroke-width="2" transform="rotate(-25 32 32)"/>',
        land: '<path d="M12 46h40" stroke="' + c + '" stroke-width="2"/><path d="M24 46l4-8h8l4 8" fill="none" stroke="' + c + '" stroke-width="2"/>',
        lost: '<path d="M32 12c4 8 10 10 10 20a10 10 0 0 1-20 0c0-6 4-8 4-12 3 2 4 4 6 4z" fill="none" stroke="' + c + '" stroke-width="2"/>'
    }[t];
    var num = n !== "" && n != null ? '<text x="32" y="38" text-anchor="middle" font-family="Newsreader,Georgia,serif" font-weight="700" font-size="20" fill="var(--ink)">' + n + '</text>' : '';
    return '<svg class="patch" viewBox="0 0 64 64" role="img" aria-label="Icon for ' + (label || "Apollo") + (num ? ' ' + n : '') + '"><circle cx="32" cy="32" r="29" fill="var(--card)" stroke="' + c + '" stroke-width="3"/>' + glyph + num + '</svg>';
}

function rpatch(n, t) { return patch(n, t, "Ranger"); }
function spatch(n, t) { return patch(n, t, "Surveyor"); }
function apatch(n, t) { return patch(n, t, "Artemis"); }
function cpatch(n, t) {
    return '<div style="display:flex;flex-direction:column;align-items:center;text-align:center;max-width:74px;gap:6px">' +
        patch("", t, "CLPS") +
        '<span style="font-size:10px;line-height:1.25;color:var(--muted)">Surface landing & surface mission.<br>Comercial lunar delivery</span>' +
    '</div>';
}
function mpatch(n, t) { return patch(n, t, "Mars mission"); }

/* ===== Rotating planets ===== */
function rnd(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }
function texture(kind) {
    var W = 200, H = 100, R = rnd(kind === "moon" ? 7 : 13), o = "";
    function wrap(f) { [-W, 0, W].forEach(function (dx) { o += f(dx); }); }
    if (kind === "moon") {
        o += '<rect width="200" height="100" fill="#b9b8b1"/>';
        for (var i = 0; i < 9; i++)(function (x, y, rx, ry) { wrap(function (dx) { return '<ellipse cx="' + (x + dx) + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="#8d8c86" opacity=".75"/>'; }); })(R() * W, 25 + R() * 45, 8 + R() * 16, 5 + R() * 10);
        for (var j = 0; j < 70; j++)(function (x, y, r) { wrap(function (dx) { return '<circle cx="' + (x + dx) + '" cy="' + y + '" r="' + r + '" fill="#a3a29b" stroke="#d2d1ca" stroke-width="' + (r / 5) + '"/>'; }); })(R() * W, 5 + R() * 90, .6 + R() * R() * 4.5);
    } else {
        o += '<rect width="200" height="100" fill="#c2552a"/>';
        for (var k = 0; k < 14; k++)(function (x, y, rx, ry, c) { wrap(function (dx) { return '<ellipse cx="' + (x + dx) + '" cy="' + y + '" rx="' + rx + '" ry="' + ry + '" fill="' + c + '" opacity=".7"/>'; }); })(R() * W, 22 + R() * 56, 6 + R() * 20, 3 + R() * 9, R() > .5 ? "#8e3518" : "#d9784a");
        o += '<path d="M60 52 q12 -3 26 1 t30 -2" stroke="#7a2c12" stroke-width="2" fill="none" opacity=".8"/>';
        for (var q = 0; q < 30; q++)(function (x, y, r) { wrap(function (dx) { return '<circle cx="' + (x + dx) + '" cy="' + y + '" r="' + r + '" fill="#a9481f" opacity=".8"/>'; }); })(R() * W, 10 + R() * 80, .5 + R() * 2);
        o += '<rect width="200" height="7" fill="#f1ebe4"/><rect y="94" width="200" height="6" fill="#efe7df"/>';
    }
    var svg = '<svg viewBox="0 0 200 100" preserveAspectRatio="none" aria-hidden="true">' + o + '</svg>';
    return svg + svg;
}

var MARS_BASE = "https://svs.gsfc.nasa.gov/vis/a030000/a030300/a030338/";
function globe(kind, cls) {
    var inner = kind === "moon"
        ? '<video class="moon-video" autoplay loop muted playsinline preload="metadata"><source src="https://svs.gsfc.nasa.gov/vis/a000000/a005300/a005319/moon_turntable_720p30.mp4" type="video/mp4"></video>'
        : '<div class="tex">' + texture(kind) + '</div>' +
            '<video class="mars-video" autoplay loop muted playsinline preload="metadata" poster="' + MARS_BASE + 'rotating_mars_720p_print.jpg">' +
            '<source src="' + MARS_BASE + 'rotating_mars_720p.webmhd.webm" type="video/webm">' +
            '<source src="' + MARS_BASE + 'rotating_mars_720p.mp4" type="video/mp4"></video>';
    return '<div class="globe ' + kind + (cls ? ' ' + cls : '') + '" role="img" aria-label="' + (kind === "moon" ? "The Moon" : "Mars") + ', slowly rotating">' + inner + '</div>';
}

/* ===== Source links ===== */
function sources(list) {
    return '<footer>Sources: ' + list.map(function (s) { return '<a href="' + s[0] + '" target="_blank" rel="noopener">' + s[1] + '</a>'; }).join(" · ") + '</footer>';
}
var SRC_APOLLO = [["https://www.nasa.gov/the-apollo-program/", "NASA, The Apollo Program"], ["https://www.nasa.gov/wp-content/uploads/2023/04/sp-4503-apollo.pdf", "Apollo: A Retrospective Analysis (SP-4503)"], ["https://www.nasa.gov/images/", "NASA Images"]];
var SRC_MARS = [["https://science.nasa.gov/photojournal/galleries/pj-mars/", "Mars Photojournal"], ["https://science.nasa.gov/solar-system/resources/resource-packages/mars-resources/", "Mars Resources and Rover Galleries"], ["https://svs.gsfc.nasa.gov/30338", "Rotating Mars video (NASA/JPL-Caltech)"], ["https://www.nasa.gov/images/", "NASA Images"]];

/* ===== Photos from the NASA Image and Video Library API + Local Images ===== */
var PH = {};
function esc(t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
function nasaSearch(q) {
    return fetch("https://images-api.nasa.gov/search?media_type=image&q=" + encodeURIComponent(q))
        .then(function (r) { if (!r.ok) throw 0; return r.json(); })
        .then(function (j) {
            return (j.collection && j.collection.items || []).map(function (it) {
                var d = it.data && it.data[0] || {}, l = it.links && it.links[0];
                return l && { thumb: l.href, title: d.title || "", text: (d.title || "") + " " + (d.description || "") + " " + (d.keywords || []).join(" "), id: d.nasa_id };
            }).filter(Boolean);
        });
}
function getLocalPhotos(n, p) {
    if (!DB) return [];
    var prog = p === "mars" ? DB.mars : (DB.moon && DB.moon[p]);
    var list = (prog && prog.images && prog.images[n - 1]) || [];
    return list.map(function (item) {
        return { thumb: item[0], full: item[0], title: item[1] || "", local: true };
    });
}
function loadPhotos(n, p) {
    p = p || "apollo"; var key = p + n;
    if (PH[key]) return PH[key];
    var local = getLocalPhotos(n, p);
    var q = p === "mars" ? ({ 1: "Mars Pathfinder", 2: "Mars Exploration Rover", 3: "Viking 1 Mars", 4: "InSight Mars", 5: "Dawn Vesta Ceres", 6: "NEAR Shoemaker Eros" }[n] || "mars rover")
        : p === "clps" ? "Commercial Lunar Payload Services"
        : p === "artemis" ? ("Artemis " + (["", "I", "II", "III", "IV", "V"][n] || n) + " Moon")
        : p + " " + n;
    var re = p === "mars" ? /mars|viking|pathfinder|sojourner|spirit|opportunity|insight|dawn|vesta|ceres|near|shoemaker|eros/i
        : p === "clps" ? /clps|peregrine|odysseus|blue ghost|athena|lunar lander/i
        : p === "artemis" ? /artemis|orion|sls/i
        : new RegExp(p + "\\s*" + n + "(?!\\d)", "i");

    PH[key] = nasaSearch(q).then(function (all) {
        var hit = all.filter(function (x) { return re.test(x.text); });
        if (p === "mars" || p === "apollo" || p === "clps" || p === "artemis") {
            var res = hit.length ? hit : all;
            return local.concat(res);
        }
        if (hit.length >= 4) return local.concat(hit);
        var progQuery = p === "surveyor" ? "surveyor lunar lander" : "ranger lunar probe";
        var progRe = p === "surveyor" ? /surveyor/i : /ranger/i;
        return nasaSearch(progQuery).then(function (g) {
            var seen = {}; hit.forEach(function (x) { seen[x.id] = 1; });
            return local.concat(hit.concat(g.filter(function (x) { return progRe.test(x.text) && !seen[x.id]; })));
        });
    }).catch(function () {
        if (local.length) return local;
        delete PH[key];
        throw 0;
    });
    return PH[key];
}
function fillGalleries() {
    document.querySelectorAll(".gallery[data-n]").forEach(function (g) {
        var n = +g.dataset.n, max = +g.dataset.max, p = g.dataset.p || "apollo",
            name = { ranger: "Ranger", surveyor: "Surveyor", artemis: "Artemis", clps: "CLPS", mars: "Mars" }[p] || "Apollo";
        loadPhotos(n, p).then(function (ps) {
            if (!g.isConnected) return;
            ps = ps.slice(0, max);
            if (!ps.length) { g.outerHTML = '<p class="gnote">No photos found for ' + name + (p === "mars" || p === "clps" ? "" : " " + n) + '.</p>'; return; }
            g.innerHTML = ps.map(function (x, k) { return '<li><button type="button" data-p="' + p + '" data-n="' + n + '" data-k="' + k + '" aria-label="Enlarge photo: ' + esc(x.title) + '"><img src="' + esc(x.thumb) + '" alt="' + esc(x.title) + '" loading="lazy"></button></li>'; }).join("");
        }, function () { if (g.isConnected) g.outerHTML = '<p class="gnote">Photos could not be loaded right now.</p>'; });
    });
}
function gallery(n, max, cls, p) {
    p = p || "apollo";
    var name = { ranger: "Ranger ", surveyor: "Surveyor ", artemis: "Artemis ", clps: "CLPS", mars: "Mars ", apollo: "Apollo " }[p] + (p === "mars" || p === "clps" ? "" : n);
    return '<ul class="gallery' + (cls ? ' ' + cls : '') + '" data-p="' + p + '" data-n="' + n + '" data-max="' + max + '" aria-label="NASA photos of ' + name + '"></ul>';
}

/* Lightbox */
document.addEventListener("click", function (ev) {
    if (ev.target.id === "lb") { ev.target.close(); return; }
    var b = ev.target.closest(".gallery button"); if (!b) return;
    loadPhotos(+b.dataset.n, b.dataset.p).then(function (ps) {
        var p = ps[+b.dataset.k], d = document.getElementById("lb");
        if (!p) return;
        var big = p.full || p.thumb.replace("~thumb.", "~medium.");
        d.innerHTML = '<figure style="margin:0"><img src="' + esc(big) + '" alt="' + esc(p.title) + '" onerror="this.onerror=null;this.src=\'' + esc(p.thumb) + '\'"><figcaption><span>' + esc(p.title) + ' <span class="gnote">· NASA</span></span><button type="button" onclick="this.closest(\'dialog\').close()">Close</button></figcaption></figure>';
        d.showModal();
    });
});

/* ===== Views ===== */
function legend(items) {
    return '<ul class="legend">' + items.map(function (i) { return '<li><i style="border-color:var(--' + i[0] + ')"></i>' + i[1] + '</li>'; }).join("") + '</ul>';
}
function sec(title, ps) {
    return '<h3>' + title + '</h3>' + [].concat(ps).map(function (t) { return '<p>' + t + '</p>'; }).join("");
}

function homeView() {
    return '<div class="home"><h1>NASA’s forgotten space missions</h1>' +
        '<p class="lead">Everyone remembers the first steps on the Moon. This project brings to light the missions that history overlooked: the tests, the rehearsals, the tragedies and the flights in between, so the unknown chapters of space exploration can be seen and understood.</p>' +
        '<div class="worlds">' +
            '<section class="world"><a class="globe-link" href="#moon" aria-label="Explore the Moon missions">' + globe("moon") + '</a>' +
            '<h2>The Moon</h2><p>Every Apollo mission, the robotic Ranger and Surveyor probes, and the modern Artemis and CLPS lunar programmes.</p><a class="go" href="#moon">Explore the Moon missions →</a></section>' +
            '<section class="world"><a class="globe-link" href="#mars" aria-label="Explore the Mars missions">' + globe("mars") + '</a>' +
            '<h2>Mars & Deep Space</h2><p>The orbiters, landers, rovers and deep-space probes sent to Mars and asteroids.</p><a class="go" href="#mars">Explore the Mars missions →</a></section>' +
        '</div></div>';
}

function moonHubView() {
    var clps = DB.moon.clps.index[0];
    return '<a class="back" href="#">← Home</a><h1>The Moon</h1>' +
        '<p class="lead">Five NASA programs span the exploration of the Moon: the early Ranger impactors, the Surveyor soft-landers, the Apollo crewed landings, and today’s CLPS commercial deliveries and Artemis missions.</p>' +

        '<section class="program" aria-labelledby="p-apollo"><h2 id="p-apollo">Apollo Program: Mission-by-Mission Guide</h2>' +
        '<p>One fact sheet per crewed or Saturn-test Apollo mission: one-line summary, context, course of the mission, technical information, conclusion and additional data.</p>' +
        '<ul class="points"><li>Apollo 1: the launch pad fire</li><li>Apollo 4–6: uncrewed Saturn V and Lunar Module tests</li><li>Apollo 7–10: crewed orbit flights and rehearsals</li><li>Apollo 11–17: six Moon landings, plus the Apollo 13 rescue</li></ul>' +
        '<p class="note">Apollo 2 and 3 were never flown as separate missions and Apollo 18 to 20 were cancelled, so the guide covers Apollo 1 and 4 to 17.</p>' +
        '<p class="fact"><strong>Did you know?</strong> On its way home, Apollo 10 reached about 39,900 km/h, the fastest any humans have ever travelled.</p>' +
        gallery(11, 4, 'strip', 'apollo') + '<p class="gnote">Photos: Apollo 11, NASA Image and Video Library.</p>' +
        '<a class="go" href="#apollo">Open the Apollo guide →</a></section>' +

        '<section class="program" aria-labelledby="p-ranger"><h2 id="p-ranger">NASA Ranger Program: Ranger 1–9</h2>' +
        '<p>Ranger was one of the first U.S. efforts to explore another body in space. The spacecraft were meant to send back pictures and data on approach and then crash into the Moon (the Surveyors that followed were the soft landers). JPL designed them from 1959 in three blocks:</p>' +
        '<ul class="points"><li>Block 1 (Ranger 1–2, 1961): Earth-orbit tests of the Atlas/Agena launch vehicle and spacecraft systems</li><li>Block 2 (Ranger 3–5, 1962): a TV camera, a radiation detector and a seismometer in a balsa-protected capsule</li><li>Block 3 (Ranger 6–9, 1964–65): a six-camera TV system to photograph the surface on approach</li></ul>' +
        '<p class="fact"><strong>Did you know?</strong> Ranger 7 was the first success after 13 failures in a row for these early U.S. lunar missions, and opening peanuts in control rooms is credited to it.</p>' +
        gallery(7, 4, 'strip', 'ranger') + '<p class="gnote">Photos: Ranger 7, NASA Image and Video Library.</p>' +
        '<a class="go" href="#ranger">Open the Ranger guide →</a></section>' +

        '<section class="program" aria-labelledby="p-surveyor"><h2 id="p-surveyor">NASA Surveyor Program: Surveyor 1–7</h2>' +
        '<p>Built by Hughes Aircraft under JPL direction, the seven Surveyors were the first U.S. spacecraft to soft-land on the Moon. Five succeeded, returning over 87,000 photos and proving the surface could support Apollo:</p>' +
        '<ul class="points"><li>Surveyor 1 & 3 (1966–67): first U.S. soft landing and first surface soil-sampling scoop</li><li>Surveyor 5 & 6 (1967): first chemical soil analysis on another world and first liftoff from the Moon</li><li>Surveyor 7 (1968): pure science mission in the lunar highlands near Tycho crater</li></ul>' +
        '<p class="fact"><strong>Did you know?</strong> In November 1969, Apollo 12 landed just 180 meters from Surveyor 3 and brought its camera and soil scoop back to Earth.</p>' +
        gallery(1, 4, 'strip', 'surveyor') + '<p class="gnote">Photos: Surveyor 1, NASA Image and Video Library.</p>' +
        '<a class="go" href="#surveyor">Open the Surveyor guide →</a></section>' +

        '<section class="program" aria-labelledby="p-artemis"><h2 id="p-artemis">NASA Artemis Program: Artemis I–V</h2>' +
        '<p>NASA’s modern programme to return astronauts to the Moon, test commercial lunar landers, and begin building a permanent lunar base:</p>' +
        '<ul class="points"><li>Artemis I (2022): uncrewed 25-day test flight of SLS and Orion to distant retrograde orbit</li><li>Artemis II (2026): first crewed flight beyond low Earth orbit since 1972</li><li>Artemis III–V (planned): low Earth orbit lander docking tests followed by south pole landings</li></ul>' +
        '<p class="fact"><strong>Did you know?</strong> On 26 November 2022, the uncrewed Artemis I Orion capsule reached 432,210 km from Earth, surpassing Apollo 13’s distance record.</p>' +
        gallery(2, 4, 'strip', 'artemis') + '<p class="gnote">Photos: Artemis II, NASA Image and Video Library.</p>' +
        '<a class="go" href="#artemis">Open the Artemis guide →</a></section>' +

        '<ol class="missions">' +
            '<li class="mission">' + cpatch(1, clps[2]) + '<div><h2>' + clps[0] + '</h2><p class="meta">' + clps[1] + '</p><p class="line">' + clps[3] + '</p>' +
            gallery(1, 4, 'strip', 'clps') + '<div class="links"><a href="#clps-1">Full explanation</a></div></div></li>' +
        '</ol>' +
        sources(SRC_APOLLO);
}

/* ===== Generic List & Detail Builders driven by JSON ===== */
function renderProgramList(programData, opts) {
    var h = '<a class="back" href="' + opts.backHref + '">' + opts.backText + '</a><h1>' + opts.title + '</h1>' +
        '<p class="lead">' + opts.lead + '</p>' +
        legend(opts.legend) +
        '<ol class="missions">';
    programData.index.forEach(function (m, k) {
        var id = missionId(m, k, opts.slug);
        h += '<li class="mission">' + opts.patchFn(id, m[2]) + '<div><h2>' + m[0] + '</h2><p class="meta">' + m[1] + '</p><p class="line">' + m[3] + '</p>' +
            gallery(id, 4, 'strip', opts.galleryKey) + '<div class="links"><a href="#' + opts.slug + '-' + id + '">Full explanation</a></div></div></li>';
    });
    return h + '</ol>' + opts.footer;
}

function renderProgramDetail(programData, i, opts) {
    var m = programData.index[i],
        id = missionId(m, i, opts.slug),
        e = programData.explanations[i] || [],
        add = (programData.additional && programData.additional[i]) || [],
        headings = (programData.subindex && programData.subindex[0]) || ["Context", "Course of the mission", "Technical information", "Conclusion", "Additional data"],
        prev = programData.index[i - 1],
        next = programData.index[i + 1],
        prevId = prev ? missionId(prev, i - 1, opts.slug) : "",
        nextId = next ? missionId(next, i + 1, opts.slug) : "";

    var sectionsHtml = "";
    for (var s = 0; s < 4; s++) {
        sectionsHtml += sec(headings[s], e[s] || []);
    }
    sectionsHtml += sec(headings[4] || "Additional data", add);

    return '<div class="detail"><a class="back" href="' + (opts.backAllHref || ('#' + opts.slug)) + '">' + opts.backAllText + '</a>' +
        '<div class="dhead">' + opts.patchFn(id, m[2]) + '<div><h1>' + m[0] + '</h1><p class="meta">' + m[1] + '</p></div></div>' +
        '<p class="line"><strong>' + m[3] + '</strong></p>' +
        sectionsHtml +
        '<h3>Photos and data</h3>' + gallery(id, 24, '', opts.galleryKey) + '<p class="gnote">' + opts.photoNote(m[0]) + '</p>' +
        '<div class="pager"><span>' + (prev ? '<a href="#' + opts.slug + '-' + prevId + '">← ' + prev[0] + '</a>' : '') + '</span><span>' + (next ? '<a href="#' + opts.slug + '-' + nextId + '">' + next[0] + ' →</a>' : '') + '</span></div></div>';
}

/* ===== Program Configurations ===== */
var PROGRAMS = {
    apollo: {
        getData: function () { return DB.moon.apollo; },
        slug: "apollo",
        galleryKey: "apollo",
        patchFn: patch,
        backHref: "#moon",
        backText: "← The Moon",
        backAllText: "← All Apollo missions",
        title: "Apollo Program: Mission-by-Mission Guide",
        pageTitle: "Apollo Program",
        lead: "Every Apollo mission that flew or was lost on the way: from the launch pad fire of Apollo 1 to the last footsteps of Apollo 17.",
        legend: [["test", "Uncrewed test"], ["orbit", "Crewed, orbit or Moon flyby"], ["land", "Moon landing"], ["lost", "Tragedy or emergency"]],
        footer: sources(SRC_APOLLO) + '<footer>Facts are summaries; check figures against NASA mission reports. Mission icons are illustrations; photographs come from the NASA Image and Video Library.</footer>',
        photoNote: function () { return "Images: NASA Image and Video Library. Select a photo to enlarge it."; }
    },
    ranger: {
        getData: function () { return DB.moon.ranger; },
        slug: "ranger",
        galleryKey: "ranger",
        patchFn: rpatch,
        backHref: "#moon",
        backText: "← The Moon",
        backAllText: "← All Ranger missions",
        title: "NASA Ranger Program: Ranger 1–9",
        pageTitle: "Ranger Program",
        lead: "Nine robotic probes built to photograph the Moon on approach and then crash into it. Six failed in different ways; the last three sent back thousands of pictures that helped choose the Apollo landing sites.",
        legend: [["test", "Earth-orbit test (Block 1)"], ["lost", "Failed lunar attempt"], ["land", "Success"]],
        footer: '<footer>Main source: NASA Science, “Lunar Ranger and Surveyor Programs”, and each mission’s NASA Science page; background from Wikipedia (Ranger program, Ranger 7, Ranger 9). Figures differ between sources in places; check the mission reports. Photographs come from the NASA Image and Video Library.</footer>',
        photoNote: function (name) { return "Images: NASA Image and Video Library (missions with few photos also show general Ranger program images). Source: NASA Science, " + name + " mission page. Select a photo to enlarge it."; }
    },
    surveyor: {
        getData: function () { return DB.moon.surveyor; },
        slug: "surveyor",
        galleryKey: "surveyor",
        patchFn: spatch,
        backHref: "#moon",
        backText: "← The Moon",
        backAllText: "← All Surveyor missions",
        title: "NASA Surveyor Program: Surveyor 1–7",
        pageTitle: "Surveyor Program",
        lead: "Seven robotic landers built to achieve the first U.S. soft landings on the Moon, test the bearing strength and chemistry of the lunar soil, and scout landing sites for Apollo.",
        legend: [["lost", "Failed lunar attempt"], ["land", "Soft landing"]],
        footer: '<footer>Main source: NASA Science, “Lunar Ranger and Surveyor Programs”, and each mission’s NASA Science page. Figures differ between sources in places; check the mission reports. Photographs come from the NASA Image and Video Library.</footer>',
        photoNote: function (name) { return "Images: NASA Image and Video Library (missions with few photos also show general Surveyor program images). Source: NASA Science, " + name + " mission page. Select a photo to enlarge it."; }
    },
    artemis: {
        getData: function () { return DB.moon.artemis; },
        slug: "artemis",
        galleryKey: "artemis",
        patchFn: apatch,
        backHref: "#moon",
        backText: "← The Moon",
        backAllText: "← All Artemis missions",
        title: "NASA Artemis Program: Artemis I–V",
        pageTitle: "Artemis Program",
        lead: "NASA’s return to the Moon: from the uncrewed Artemis I test flight and the Artemis II lunar flyby to upcoming lander tests and crewed south pole landings.",
        legend: [["test", "Test flight"], ["orbit", "Crewed lunar flyby"], ["land", "Planned Moon landing"]],
        footer: '<footer>Main sources: NASA Artemis mission pages and press kits, ESA, and Wikipedia. Planned mission dates and architectures reflect NASA’s 2026 updates. Photographs come from the NASA Image and Video Library.</footer>',
        photoNote: function () { return "Images: NASA Image and Video Library. Select a photo to enlarge it."; }
    },
    clps: {
        getData: function () { return DB.moon.clps; },
        slug: "clps",
        galleryKey: "clps",
        patchFn: cpatch,
        backHref: "#moon",
        backText: "← The Moon",
        backAllHref: "#moon",
        backAllText: "← The Moon",
        title: "Commercial Lunar Payload Services (CLPS)",
        pageTitle: "Commercial Lunar Payload Services",
        lead: "NASA’s commercial lunar delivery programme: contracting American companies to land science instruments, rovers, and technology demonstrations on the Moon ahead of Artemis.",
        legend: [["land", "Commercial lunar delivery programme"]],
        footer: '<footer>Main sources: NASA CLPS overview and providers pages, SpaceNews, The Space Review, and Wikipedia. Select a photo or the timeline graphic to enlarge it.</footer>',
        photoNote: function () { return "Timeline graphic and images: NASA. Select any image to enlarge it."; }
    },
    mars: {
        getData: function () { return DB.mars; },
        slug: "mars",
        galleryKey: "mars",
        patchFn: mpatch,
        backHref: "#",
        backText: "← Home",
        backAllText: "← All Mars missions",
        title: "Mars & Deep Space Missions",
        pageTitle: "Mars & Deep Space Missions",
        lead: "Pioneering NASA missions to the Red Planet and deep space: from Viking 1, Pathfinder, Spirit, Opportunity, InSight and Dawn to NEAR Shoemaker.",
        legend: [["land", "Surface landing & surface mission"], ["orbit", "Orbiter mission"]],
        footer: sources(SRC_MARS) + '<footer>Facts are summaries; check figures against NASA mission reports. Mission icons are illustrations; photographs come from the NASA Image and Video Library.</footer>',
        photoNote: function () { return "Images: NASA Image and Video Library. Select a photo to enlarge it."; }
    }
};

/* ===== Router ===== */
function route() {
    if (!DB) return;
    var h = location.hash.replace("#", ""),
        app = document.getElementById("app"),
        T = "NASA\u2019s forgotten space missions";

    for (var key in PROGRAMS) {
        var cfg = PROGRAMS[key];
        var pData = cfg.getData();
        if (!pData) continue;
        if (h === cfg.slug) {
            if (cfg.slug === "clps") {
                app.innerHTML = renderProgramDetail(pData, 0, cfg);
                document.title = pData.index[0][0] + " · " + T;
            } else {
                app.innerHTML = renderProgramList(pData, cfg);
                document.title = cfg.pageTitle + " · " + T;
            }
            window.scrollTo(0, 0);
            fillGalleries();
            return;
        }
        for (var k = 0; k < pData.index.length; k++) {
            var id = missionId(pData.index[k], k, cfg.slug);
            if (h === cfg.slug + "-" + id) {
                app.innerHTML = renderProgramDetail(pData, k, cfg);
                document.title = pData.index[k][0] + " · " + T;
                window.scrollTo(0, 0);
                fillGalleries();
                return;
            }
        }
    }

    if (h === "moon") {
        app.innerHTML = moonHubView();
        document.title = "The Moon · " + T;
    } else {
        app.innerHTML = homeView();
        document.title = T;
    }
    window.scrollTo(0, 0);
    fillGalleries();
}

/* ===== Load database.json and boot ===== */
fetch("database.json")
    .then(function (r) {
        if (!r.ok) throw new Error("Failed to load database.json");
        return r.json();
    })
    .then(function (data) {
        DB = data;
        window.addEventListener("hashchange", route);
        route();
    })
    .catch(function (err) {
        document.getElementById("app").innerHTML = '<p class="gnote">Error loading mission database: ' + esc(err.message) + '</p>';
    });