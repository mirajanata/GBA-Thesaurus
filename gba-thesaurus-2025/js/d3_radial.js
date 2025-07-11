
radialChart = function (data) {
    // Specify the chart’s dimensions.
    const width = 1480;
    const height = width;
    const cx = width * 0.5; // adjust as needed to fit
    const cy = height * 0.54; // adjust as needed to fit
    const radius = Math.min(width, height) / 2 - 80;
    let maxWidth = 0;
    let maxHeight = 0;
    // Create a radial cluster layout. The layout’s first dimension (x)
    // is the angle, while the second (y) is the radius.
    const tree = d3.cluster()
        .size([2 * Math.PI, radius])
        .separation((a, b) => (a.parent == b.parent ? 1 : 2) / a.depth);

    // Sort the tree and apply the layout.
    const root = tree(d3.hierarchy(data)
        .sort((a, b) => d3.ascending(a.data.name, b.data.name)));

    // Creates the SVG container.
    const svg = d3.create("svg")
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("viewBox", [-cx - 100, -cy, width + 200, height + 200])
        .attr("preserveAspectRatio", "xMidYMid meet")
        .attr("style", "font-size:32px;overflow:auto;");

    // Append links.
    const gNode = svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

    gNode.selectAll()
        .data(root.links())
        .join("path")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    const nodes = root.descendants().reverse();
    const node = gNode.selectAll("g")
        .data(nodes, d => d.id);

    // Enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
        .attr("style", d => d.data.c.length > 0 ? "cursor:pointer;" : "cursor: default;")
        .on("click", (event, d) => {
            d.data.children = d.data.children ? null : d.data.c;
            update();
        });

    nodeEnter.append("title").html(d => `<p class="title">${d.data.name}</p>`);

    nodeEnter.append("circle")
        .attr("fill", d => d.data.color)
        .attr("r", 4);

    nodeEnter.append("text")
        .attr("dy", "0.31em")
        .attr("x", d => d.x >= Math.PI != (d.children != null) ? -8 : 8)
        .attr("text-anchor", d => d.x >= Math.PI != (d.children!=null) ? "end" : "start")
        .attr("text-rendering", "optimizeLegibility")
        .text(d => nodeText(d.data.name))
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 0.25)
        .attr("fill", d => d.data.c.length > 0 ? "#2020ff" : "grey")
        .attr("style", d => d.data.c.length > 0 ? "text-decoration: underline;" : "")
        .attr("paint-order", "stroke");

    function nodeText(text) {
        if (text.startsWith("https://") && text.length > 20) {
            return text.substring(0, 20) + "...";
        }
        return text;
    }

    function update() {
        chart = radialChart(treeData);
        d3.select("#d3radial").html("");
        d3.select("#d3radial").append(() => chart);
    }


    return svg.node();
}

/*
var treeData;
d3data.init(function (data) {
    treeData = data;
    chart = radialChart(data);
    d3.select("#d3tree").append(() => chart);
}, 10);
*/