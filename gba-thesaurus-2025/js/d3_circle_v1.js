
circleChart = function (data) {

    // Specify the chart’s dimensions.
    const width = 928;
    const height = width;

    // Create the color scale.
    const color = d3.scaleLinear()
        .domain([0, 5])
        .range(["hsl(32,80%,80%)", "hsl(128,30%,40%)"])
        .interpolate(d3.interpolateHcl);

    // Compute the layout.
    const pack = data => d3.pack()
        .size([width, height])
        .padding(3)
        (d3.hierarchy(data)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value));
    const root = pack(data);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .attr("width", width)
        .attr("height", height)
        .attr("style", `max-width: 100%; height: auto; display: block; font: 15px Calibri; margin: 0 -14px; background: #e8e8e8; cursor: pointer;`);

    // Append the nodes.
    const node = svg.append("g")
        .selectAll("circle")
        .data(root.descendants().slice(1))
        .join("circle")
        .attr("id", d => "c" + d.data.id)
        .attr("text", d => d.data.name)
        .attr("fill", d => d.data.color ? d.data.color : "#ffffff")
        .attr("pointer-events", d => true)
        .on("mouseover", function (event, d) {
            let e = d3.select(this);
            id = e.attr("id");
            let t = d3.select("#t" + id.substring(1));
            let disp = t.attr("display");
            if (d.children) {
                e.attr("stroke", "#202070");
            }
            t.text(e.attr("text"));
        })
        .on("mouseout", function (event, d) {
            let e = d3.select(this);
            id = e.attr("id");
            let t = d3.select("#t" + id.substring(1));
            let disp = t.style("display");
            if (d.children) {
                e.attr("stroke", null);
            }
            d3.select("#t" + id.substring(1)).text(nodeText(e.attr("text")));
        })
        .on("click", (event, d) => { if (d.children && d.parent === focus) { focus !== d && (zoom(event, d), event.stopPropagation()); } });

    // Append the text labels.
    const label = svg.append("g")
        .attr("pointer-events", "none")
        .attr("text-anchor", "middle")
        .selectAll("text")
        .data(root.descendants())
        .join("text")
        .attr("id", d => "t" + d.data.id)
        .style("fill-opacity", d => d.parent === root ? 1 : 0)
        .style("display", d => d.parent === root ? "inline" : "none")
        .text(d => nodeText(d.data.name));

    // Create the zoom behavior and zoom immediately in to the initial focus node.
    svg.on("click", (event) => zoom(event, root));
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2]);

    function nodeText(text) {
        if (text.length > 20) {
            return text.substring(0, 20) + "...";
        }
        return text;
    }

    function zoomTo(v) {
        const k = (width / v[2]);

        view = v;

        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
    }

    function zoom(event, d) {
        const focus0 = focus;

        focus = d;

        const transition = svg.transition()
            .duration(event.altKey ? 7500 : 750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t));
            });

        label
            .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });
    }

    return svg.node();
}

d3data.init(function (data) {
    chart = circleChart(data);
    d3.select("#d3tree").append(() => chart);
});
