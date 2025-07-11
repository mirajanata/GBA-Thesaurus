circleChart = function (data) {
    // Specify the chart’s dimensions.
    let stack = [];
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
    let root = pack(data);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .attr("width", "100%")
        .attr("height", "100%")
        .attr("style", `font-size: 16px; margin: 0; background: ${root.data.color}; cursor: pointer;`);

    const gNode = svg.append("g")
        .attr("fill", "#fff")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

    const nodes = root.descendants();
    const node = gNode.selectAll("g")
        .data(nodes, d => d.id);

    function drawStack(d) {
        let text = null;
        for (let i = 0; i < stack.length; i++) {
            text = text != null ? text += " | " : "";
            text += nodeText(stack[i].data.name);
        }
        if (d) {
            text = text != null ? text += " | " : "";
            text += nodeText(d.data.name);
        }
        document.getElementById("stackContent").innerHTML = text;
    }


    function createElements(node) {
        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("g")
            .attr("id", d => "g" + d.data.id)
            .style("display", d => d.parent === root ? "inline" : "none")
            ;

        nodeEnter.append("title").html(d => `<p class="title">${d.data.name}</p>`);

        nodeEnter.append("circle")
            .attr("class", "shadow")
            .attr("stroke", "#000")
            .attr("fill", d => d.data.color);

        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .attr("text-rendering", "optimizeLegibility")
            .text(d => nodeText(d.data.name))
            .attr("fill", d => d.data.c.length > 0 ? "#2020ff" : "grey")
            .attr("style", d => d.data.c.length > 0 ? "text-decoration: underline;cursor:pointer;" : "cursor: default;")
            .attr("paint-order", "stroke")
            .on("click", (event, d) => {
                if (d.children && d.parent === focus) {
                    stack.push(focus);
                    focus !== d && (zoom(event, d.data.id, gNode.selectAll("g")), event.stopPropagation());
                }
            });
    };

    createElements(node);

    // Create the zoom behavior and zoom immediately in to the initial focus node.
    svg.on("click", (event) => {
        let e = stack.pop() || root;
        zoom(event, e.data.id, gNode.selectAll("g"));
    });
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2], gNode.selectAll("g"));
    drawStack(root);

    function nodeText(text) {
        if (text.startsWith("https://") && text.length > 20) {
            return text.substring(0, 20) + "...";
        }
        return text;
    }
    function getById(e, id) {
        if (e.data.id === id) {
            return e;
        }
        if (!e.children) {
            return null;
        };
        for (let i = 0; i < e.children.length; i++) {
            let d = getById(e.children[i], id);
            if (d) {
                return d;
            }
        }
        return null;
    }
    function zoomTo(v, gNode) {
        const k = (width / v[2]);

        view = v;

        /*
        label.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        node.attr("r", d => d.r * k);
        */
        gNode.attr("transform", d => `translate(${(d.x - v[0]) * k},${(d.y - v[1]) * k})`);
        gNode.selectAll("circle").attr("r", d => d.r * k);
    }

    function zoom(event, id, gNode) {
        let d = getById(root, id);
        const focus0 = focus;

        focus = d;

        const transition = svg.transition()
            .duration(event.altKey ? 7500 : 750)
            .tween("zoom", d => {
                const i = d3.interpolateZoom(view, [focus.x, focus.y, focus.r * 2]);
                return t => zoomTo(i(t), gNode);
            });

        gNode
            .filter(function (d) { return d.parent === focus || this.style.display === "inline"; })
            .transition(transition)
            .style("fill-opacity", d => d.parent === focus ? 1 : 0)
            .on("start", function (d) { if (d.parent === focus) this.style.display = "inline"; })
            .on("end", function (d) { if (d.parent !== focus) this.style.display = "none"; });

        svg.style("background", focus.data.color);
        drawStack(d);
    }

    return svg.node();
}

/*
d3data.init(function (data) {
    chart = circleChart(data);
    d3.select("#d3tree").append(() => chart);
}, 10);
*/