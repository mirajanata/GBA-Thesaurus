var chartData;
circleChart = function (data) {
    chartData = data;
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
    let root = pack(chartData);

    // Create the SVG container.
    const svg = d3.create("svg")
        .attr("viewBox", `-${width / 2} -${height / 2} ${width} ${height}`)
        .attr("width", width)
        .attr("height", height)
        .attr("style", `max-width: 100%; height: auto; display: block; font: 15px Calibri; margin: 0; background: ${root.data.color}; cursor: pointer;`);

    const gNode = svg.append("g")
        .attr("fill", "#fff")
        .attr("stroke", "#000")
        .attr("stroke-opacity", 0.4)
        .attr("stroke-width", 1.5);

    const nodes = root.descendants();
    const node = gNode.selectAll("g")
        .data(nodes, d => d.id);

    function createElements(node) {

        // Enter any new nodes at the parent's previous position.
        const nodeEnter = node.enter().append("g")
            .attr("id", d => "g" + d.data.id)
            .style("display", d => d.parent === root ? "inline" : "none")
            .style("fill-opacity", d => d.parent === root ? 1 : 0)
            ;

        nodeEnter.append("title").html(d => `<p class="title">${d.data.name}</p>`);

        nodeEnter.append("circle")
            .attr("fill", d => d.data.color);

        nodeEnter.append("text")
            .attr("text-anchor", "middle")
            .text(d => nodeText(d.data.name))
            .attr("fill", d => d.data.c.length > 0 ? "#2020ff" : "black")
            .attr("style", d => d.data.c.length > 0 ? "text-decoration: underline;cursor:pointer;" : "cursor: default;")
            .attr("paint-order", "stroke")
            .on("click", (event, d) => {
                if (!d.children && d.data.c) {
                    d.data.children = d.data.c;
                    // Compute the layout.
                    let p = data => d3.pack()
                        .size([width, height])
                        .padding(3)
                        (d3.hierarchy(data)
                            .sum(d => d.value)
                            .sort((a, b) => b.value - a.value));
                    root = p(chartData);

                    let nodes = root.descendants();
                    createElements(gNode.selectAll("g")
                        .data(nodes, d => d.id));
                    zoom(event, root.data.id, gNode.selectAll("g"));
                    zoom(event, d.data.id, gNode.selectAll("g"));
                    event.stopPropagation();
                }
                else if (d.children && d.parent === focus) {
                    focus !== d && (zoom(event, d.data.id, gNode.selectAll("g")), event.stopPropagation());
                }
            });
    };

    createElements(node);

    /*
    
    
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
    */
    // Create the zoom behavior and zoom immediately in to the initial focus node.
    svg.on("click", (event) => {
        zoom(event, root.data.id, gNode.selectAll("g"));
    });
    let focus = root;
    let view;
    zoomTo([focus.x, focus.y, focus.r * 2], gNode.selectAll("g"));

    function nodeText(text) {
        if (text.length > 20) {
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
    }

    return svg.node();
}

d3data.init(function (data) {
    chart = circleChart(data);
    d3.select("#d3tree").append(() => chart);
}, 10);
