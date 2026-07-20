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
    const categoryColors = new Map([
        ["Central database", "#fe0100"],
        ["Human actors", "#355070"],
        ["Source data", "#2a9d8f"],
        ["Computational methods", "#457b9d"],
        ["Analysis", "#b7791f"],
        ["Outputs", "#9c6644"],
        ["Audiences", "#6d597a"]
    ]);
    const relationshipColors = new Map([
        ["input", "#b24a3b"],
        ["analysis", "#457b9d"],
        ["production", "#b7791f"],
        ["communication", "#6d597a"]
    ]);

    function parseNode(row) {
        const node = {
            id: row.id,
            title: JSON.parse(row.title),
            subtitle: JSON.parse(row.subtitle),
            width: Number(row.width),
            height: Number(row.height),
            targetX: Number(row.targetX),
            targetY: Number(row.targetY),
            x: Number(row.x),
            y: Number(row.y),
            category: row.category,
            description: row.description
        };

        if (row.abbreviation) node.abbreviation = row.abbreviation;
        if (row.central) node.central = row.central === "true";
        if (row.fx) node.fx = Number(row.fx);
        if (row.fy) node.fy = Number(row.fy);

        return node;
    }

    function parseLink(row) {
        const link = {
            source: row.source,
            target: row.target
        };

        if (row.secondary) link.secondary = row.secondary === "true";
        if (row.relationship) link.relationship = row.relationship;
        if (row.relationship_type) link.relationshipType = row.relationship_type;

        return link;
    }

    function renderNetwork(nodes, links) {

    const tooltip = d3.select(container)
        .append("div")
        .attr("class", "network-tooltip")
        .attr("role", "tooltip")
        .attr("aria-hidden", "true");

    function positionTooltip(event) {
        const bounds = container.getBoundingClientRect();
        const tooltipNode = tooltip.node();
        const proposedX = event.clientX - bounds.left + 12;
        const proposedY = event.clientY - bounds.top + 12;
        const x = Math.max(8, Math.min(proposedX, bounds.width - tooltipNode.offsetWidth - 8));
        const y = Math.max(8, Math.min(proposedY, bounds.height - tooltipNode.offsetHeight - 8));

        tooltip
            .style("left", `${x}px`)
            .style("top", `${y}px`);
    }

    function showNodeTooltip(event, d) {
        tooltip.html("");
        tooltip.append("strong").text(d.title.join(" "));
        tooltip.append("span").attr("class", "network-tooltip-category").text(d.category);
        tooltip.append("span").text(d.description);
        tooltip
            .attr("aria-hidden", "false")
            .classed("is-visible", true);

        positionTooltip(event);
    }

    function hideTooltip() {
        tooltip
            .attr("aria-hidden", "true")
            .classed("is-visible", false);
    }

    const svg = d3.select(container)
        .append("svg")
        .attr("viewBox", `0 0 ${width} ${height}`)
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("role", "img")
        .attr("aria-labelledby", "d3-network-title d3-network-description");

    const definitions = svg.append("defs");

    relationshipColors.forEach((color, relationshipType) => {
        definitions.append("marker")
            .attr("id", `network-arrowhead-${relationshipType}`)
            .attr("viewBox", "0 -4 8 8")
            .attr("refX", 8)
            .attr("refY", 0)
            .attr("markerWidth", 8)
            .attr("markerHeight", 8)
            .attr("markerUnits", "userSpaceOnUse")
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M0,-4L8,0L0,4Z")
            .attr("fill", color);
    });

    svg.append("title")
        .attr("id", "d3-network-title")
        .text("Actor network for A Cartography of Genocide");

    svg.append("desc")
        .attr("id", "d3-network-description")
        .text("A force-directed network connecting ten actors, sources, methods, analyses, outputs, and audiences around the General Cartographic Database.");

    const legendCategories = Array.from(categoryColors)
        .filter(([category]) => nodes.some((nodeData) => nodeData.category === category));

    const legend = svg.append("g")
        .attr("class", "network-legend")
        .attr("transform", "translate(55,650)");

    legend.append("text")
        .attr("class", "network-legend-title")
        .attr("x", 0)
        .attr("y", 0)
        .text("CATEGORIES");

    const legendItem = legend.selectAll("g")
        .data(legendCategories)
        .join("g")
        .attr("transform", (d, index) => `translate(0,${24 + index * 27})`);

    legendItem.append("rect")
        .attr("class", "network-legend-swatch")
        .attr("width", 14)
        .attr("height", 14)
        .style("fill", ([, color]) => color)
        .style("fill-opacity", 0.12)
        .style("stroke", ([, color]) => color);

    legendItem.append("text")
        .attr("class", "network-legend-label")
        .attr("x", 24)
        .attr("y", 11)
        .text(([category]) => category.toUpperCase());

    const relationshipLegend = legend.append("g")
        .attr("transform", "translate(225,0)");

    relationshipLegend.append("text")
        .attr("class", "network-legend-title")
        .attr("x", 0)
        .attr("y", 0)
        .text("RELATIONSHIPS");

    const relationshipLegendItem = relationshipLegend.selectAll("g")
        .data(Array.from(relationshipColors))
        .join("g")
        .attr("transform", (d, index) => `translate(0,${24 + index * 27})`);

    relationshipLegendItem.append("line")
        .attr("class", "network-legend-edge")
        .attr("x1", 0)
        .attr("x2", 18)
        .attr("y1", 7)
        .attr("y2", 7)
        .style("stroke", ([, color]) => color);

    relationshipLegendItem.append("text")
        .attr("class", "network-legend-label")
        .attr("x", 28)
        .attr("y", 11)
        .text(([relationshipType]) => relationshipType.toUpperCase());

    const link = svg.append("g")
        .attr("class", "network-connections")
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("class", (d) => [
            d.secondary ? "network-connection--secondary" : null,
            `network-relationship--${d.relationshipType}`
        ].filter(Boolean).join(" "))
        .attr("marker-end", (d) => `url(#network-arrowhead-${d.relationshipType})`)
        .on("mouseenter", function (event, d) {
            const sourceId = typeof d.source === "object" ? d.source.id : d.source;
            const targetId = typeof d.target === "object" ? d.target.id : d.target;

            link
                .classed("is-highlighted", (edge) => edge === d)
                .classed("is-dimmed", (edge) => edge !== d);

            node.classed("is-highlighted", (connectedNode) => (
                connectedNode.id === sourceId || connectedNode.id === targetId
            ));

            tooltip
                .text(d.relationship)
                .attr("aria-hidden", "false")
                .classed("is-visible", true);

            positionTooltip(event);
        })
        .on("mousemove", positionTooltip)
        .on("mouseleave", function () {
            link
                .classed("is-highlighted", false)
                .classed("is-dimmed", false);

            node.classed("is-highlighted", false);

            hideTooltip();
        });

    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .attr("class", (d) => d.central ? "network-node network-node--gcd" : "network-node")
        .attr("role", "group")
        .attr("aria-label", (d) => [...d.title, ...d.subtitle].join(". "))
        .on("mouseenter", showNodeTooltip)
        .on("mousemove", positionTooltip)
        .on("mouseleave", hideTooltip);

    node.append("rect")
        .attr("x", (d) => -d.width / 2)
        .attr("y", (d) => -d.height / 2)
        .attr("width", (d) => d.width)
        .attr("height", (d) => d.height)
        .style("stroke", (d) => categoryColors.get(d.category))
        .style("fill", (d) => categoryColors.get(d.category))
        .style("fill-opacity", (d) => d.central ? 1 : 0.12);

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
    }

    Promise.all([
        d3.csv("data/actor-network-nodes.csv"),
        d3.csv("data/actor-network-edges.csv")
    ])
        .then(([nodeRows, linkRows]) => {
            const nodes = nodeRows.map(parseNode);
            const links = linkRows.map(parseLink);

            renderNetwork(nodes, links);
        })
        .catch((error) => {
            console.error("Unable to load actor network data:", error);
            container.innerHTML = '<p class="actor-network-fallback">The actor network data could not be loaded.</p>';
        });
}());
