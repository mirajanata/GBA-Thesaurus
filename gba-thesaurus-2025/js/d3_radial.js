
treeChart = function (data) {
    // Specify the chart’s dimensions.
    const width = 1280;
    const height = width;
    const cx = width * 0.5; // adjust as needed to fit
    const cy = height * 0.54; // adjust as needed to fit
    const radius = Math.min(width, height) / 2 - 80;

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
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-cx - 100, -cy, width + 400, height + 400])
        .attr("style", "max-width: 100%; height: auto; font:15px Calibri;overflow:auto;");

    // Append links.
    svg.append("g")
        .attr("fill", "none")
        .attr("stroke", "#555")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5)
        .selectAll()
        .data(root.links())
        .join("path")
        .attr("d", d3.linkRadial()
            .angle(d => d.x)
            .radius(d => d.y));

    // Append nodes.
    svg.append("g")
        .selectAll()
        .data(root.descendants().filter(function (d) {
            return d.data.c.length > 0 ? true : false;
        }))
        .join("circle")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .attr("stroke", "#202040")
        .attr("stroke-width", "2")
        .attr("fill", "#ffffff")
        .attr("r", 6);

    svg.append("g")
        .selectAll()
        .data(root.descendants())
        .join("circle")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0)`)
        .attr("fill", d => d.data.color)
        .attr("r", 4);

    // Append labels.
    svg.append("g")
        .attr("stroke-linejoin", "round")
        .attr("stroke-width", 3)
        .selectAll()
        .data(root.descendants())
        .join("text")
        .attr("transform", d => `rotate(${d.x * 180 / Math.PI - 90}) translate(${d.y},0) rotate(${d.x >= Math.PI ? 180 : 0})`)
        .attr("dy", "0.31em")
        .attr("x", d => d.x < Math.PI === !d.children ? 10 : -10)
        .attr("text-anchor", d => d.x < Math.PI === !d.children ? "start" : "end")
        .attr("paint-order", "stroke")
        .attr("stroke", "white")
        .attr("style", d => d.data.c.length>0 ? "cursor:pointer;" : "cursor: default;")
        .attr("fill", "currentColor")
        .text(d => nodeText(d.data.name))
        .on("click", (e, d) => {
            console.log(d);
            d.data.children = d.data.children ? null : d.data.c;
            update();
        });

    return svg.node();
}

function nodeText(text) {
    if (text.length > 20) {
        return text.substring(0, 20) + "...";
    }
    return text;
}

function update() {
    chart = treeChart(treeData);
    d3.select("#d3tree").html("");
    d3.select("#d3tree").append(() => chart);
}

var treeData;
d3data.init(function (data) {
    treeData = data;
    chart = treeChart(data);
    d3.select("#d3tree").append(() => chart);
});
