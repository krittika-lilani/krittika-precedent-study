(function () {
    "use strict";

    const container = document.getElementById("actor-network");

    if (!container || typeof d3 === "undefined") {
        if (container) {
            container.innerHTML = '<p class="actor-network-fallback">The interactive diagram requires an internet connection to load D3.</p>';
        }
        return;
    }

    const width = 1600;
    const height = 900;
    const red = "#fe0100";

    // Target positions preserve the restrained constellation while the forces
    // introduce the organic spacing of a force-directed diagram.
    const nodes = [
        {
            id: "gcd",
            title: ["GENERAL CARTOGRAPHIC", "DATABASE"],
            abbreviation: "GCD",
            subtitle: ["Spatial evidence and cartographic interface"],
            width: 300,
            height: 220,
            targetX: 800,
            targetY: 450,
            central: true,
            fx: 800,
            fy: 450
        },
        {
            id: "forensic-architecture",
            title: ["FORENSIC ARCHITECTURE"],
            subtitle: ["Researchers · Architects", "OSINT analysts · Legal researchers"],
            width: 320,
            height: 130,
            targetX: 430,
            targetY: 175
        },
        {
            id: "source-data",
            title: ["SOURCE DATA"],
            subtitle: ["Satellite imagery · Open-source media", "Witness testimony · Humanitarian data"],
            width: 300,
            height: 130,
            targetX: 185,
            targetY: 430
        },
        {
            id: "verification",
            title: ["VERIFICATION"],
            subtitle: ["Geolocation · Chronolocation", "Cross-referencing"],
            width: 250,
            height: 120,
            targetX: 810,
            targetY: 125
        },
        {
            id: "gis",
            title: ["GIS + SPATIAL ANALYSIS"],
            subtitle: ["Mapping · Classification", "Spatial comparison"],
            width: 300,
            height: 120,
            targetX: 1200,
            targetY: 175
        },
        {
            id: "verified-incidents",
            title: ["VERIFIED INCIDENTS"],
            subtitle: [],
            width: 210,
            height: 90,
            targetX: 1090,
            targetY: 405
        },
        {
            id: "pattern-recognition",
            title: ["PATTERN RECOGNITION"],
            subtitle: [],
            width: 280,
            height: 100,
            targetX: 1230,
            targetY: 575
        },
        {
            id: "interactive-database",
            title: ["INTERACTIVE DATABASE"],
            subtitle: [],
            width: 280,
            height: 100,
            targetX: 610,
            targetY: 715
        },
        {
            id: "reports",
            title: ["REPORTS + LEGAL EVIDENCE"],
            subtitle: [],
            width: 330,
            height: 95,
            targetX: 1165,
            targetY: 760
        },
        {
            id: "audiences",
            title: ["AUDIENCES"],
            subtitle: ["Courts · Human-rights organisations", "Researchers · Journalists · Public"],
            width: 260,
            height: 140,
            targetX: 1450,
            targetY: 700
        }
    ].map((node) => ({ ...node, x: node.targetX, y: node.targetY }));

    const links = [
        { source: "source-data", target: "forensic-architecture" },
        { source: "forensic-architecture", target: "gcd" },
        { source: "verification", target: "gcd" },
        { source: "gis", target: "gcd" },
        { source: "gcd", target: "verified-incidents" },
        { source: "verified-incidents", target: "pattern-recognition" },
        { source: "gcd", target: "interactive-database" },
        { source: "pattern-recognition", target: "reports" },
        { source: "interactive-database", target: "audiences" },
        { source: "reports", target: "audiences" },
        { source: "forensic-architecture", target: "verification", secondary: true },
        { source: "gis", target: "pattern-recognition", secondary: true }
    ];

    const svg = d3.select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("role", "img")
        .attr("aria-labelledby", "d3-network-title d3-network-description");

    svg.append("title")
        .attr("id", "d3-network-title")
        .text("Actor network for A Cartography of Genocide");

    svg.append("desc")
        .attr("id", "d3-network-description")
        .text("A force-directed network connecting ten actors, sources, methods, analyses, outputs, and audiences around the General Cartographic Database.");

    const categoryLabels = [
        { label: "HUMAN ACTORS", x: 280, y: 55 },
        { label: "DATA + METHODS", x: 55, y: 300 },
        { label: "ANALYSIS", x: 1025, y: 320 },
        { label: "OUTPUTS + AUDIENCES", x: 455, y: 620 }
    ];

    svg.append("g")
        .selectAll("text")
        .data(categoryLabels)
        .join("text")
        .attr("class", "network-category")
        .attr("x", (d) => d.x)
        .attr("y", (d) => d.y)
        .text((d) => d.label);

    const link = svg.append("g")
        .attr("class", "network-connections")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", (d) => d.secondary ? "network-connection--secondary" : null);

    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", (d) => d.central ? "network-node network-node--gcd" : "network-node")
        .attr("role", "group")
        .attr("aria-label", (d) => [...d.title, ...d.subtitle].join(". "));

    node.append("rect")
        .attr("x", (d) => -d.width / 2)
        .attr("y", (d) => -d.height / 2)
        .attr("width", (d) => d.width)
        .attr("height", (d) => d.height);

    node.each(function (d) {
        const group = d3.select(this);
        const titleLineHeight = d.central ? 27 : 20;
        const subtitleLineHeight = 23;
        const titleStart = d.abbreviation ? -48 : -(d.title.length * titleLineHeight + d.subtitle.length * subtitleLineHeight) / 2 + 15;

        const title = group.append("text")
            .attr("class", d.central ? "network-primary network-primary--gcd" : "network-primary")
            .attr("text-anchor", "middle");

        d.title.forEach((lineText, index) => {
            title.append("tspan")
                .attr("x", 0)
                .attr("y", titleStart + index * titleLineHeight)
                .text(lineText);
        });

        if (d.abbreviation) {
            group.append("text")
                .attr("class", "network-gcd-abbreviation")
                .attr("text-anchor", "middle")
                .attr("y", 45)
                .text(d.abbreviation);
        }

        const subtitleStart = d.abbreviation ? 80 : titleStart + d.title.length * titleLineHeight + 17;
        const subtitle = group.append("text")
            .attr("class", "network-secondary")
            .attr("text-anchor", "middle");

        d.subtitle.forEach((lineText, index) => {
            subtitle.append("tspan")
                .attr("x", 0)
                .attr("y", subtitleStart + index * subtitleLineHeight)
                .text(lineText);
        });
    });

    function edgePoint(from, to) {
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const scale = Math.min(
            (from.width / 2) / Math.max(Math.abs(dx), 0.001),
            (from.height / 2) / Math.max(Math.abs(dy), 0.001)
        );

        return {
            x: from.x + dx * scale,
            y: from.y + dy * scale
        };
    }

    function keepInsideFrame(d) {
        const padding = 18;
        d.x = Math.max(d.width / 2 + padding, Math.min(width - d.width / 2 - padding, d.x));
        d.y = Math.max(d.height / 2 + padding, Math.min(height - d.height / 2 - padding, d.y));
    }

    function ticked() {
        nodes.forEach(keepInsideFrame);

        link.each(function (d) {
            const start = edgePoint(d.source, d.target);
            const end = edgePoint(d.target, d.source);

            d3.select(this)
                .attr("x1", start.x)
                .attr("y1", start.y)
                .attr("x2", end.x)
                .attr("y2", end.y);
        });

        node.attr("transform", (d) => `translate(${d.x},${d.y})`);
    }

    const simulation = d3.forceSimulation(nodes)
        .force("link", d3.forceLink(links)
            .id((d) => d.id)
            .distance((d) => d.secondary ? 245 : 210)
            .strength((d) => d.secondary ? 0.08 : 0.14))
        .force("charge", d3.forceManyBody().strength((d) => d.central ? -1250 : -650))
        .force("collide", d3.forceCollide()
            .radius((d) => Math.hypot(d.width, d.height) / 2 + 24)
            .strength(0.9))
        .force("x", d3.forceX((d) => d.targetX).strength(0.18))
        .force("y", d3.forceY((d) => d.targetY).strength(0.2))
        .alphaDecay(0.035)
        .velocityDecay(0.45)
        .on("tick", ticked);

    node.call(d3.drag()
        .on("start", function (event, d) {
            if (!event.active) simulation.alphaTarget(0.25).restart();
            d.fx = d.x;
            d.fy = d.y;
        })
        .on("drag", function (event, d) {
            d.fx = Math.max(d.width / 2, Math.min(width - d.width / 2, event.x));
            d.fy = Math.max(d.height / 2, Math.min(height - d.height / 2, event.y));
        })
        .on("end", function (event, d) {
            if (!event.active) simulation.alphaTarget(0);
            if (!d.central) {
                d.fx = null;
                d.fy = null;
            }
        }));

    ticked();
}());
