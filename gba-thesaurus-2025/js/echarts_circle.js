eCharts_circleChart = function (rawData, elementId) {
    let chartDom = document.getElementById(elementId);

    let myChart = echarts.init(chartDom, null, {
        renderer: 'svg'
    });
    function outputsize() {
        setTimeout(function () {
            myChart.resize();
        }, 10);
    }
    new ResizeObserver(outputsize).observe(chartDom);

    var option;
    function prepareData(rawData) {
        const seriesData = [];
        let maxDepth = 0;
        let ix = 0;
        function convert(source, parent, depth) {
            if (source == null) {
                return;
            }
            if (maxDepth > 5) {
                return;
            }
            maxDepth = Math.max(depth, maxDepth);
            source.id = ix;

            ix++;
            let nd = {
                id: source.id,
                name: source.name,
                parentId: parent != null ? parent.id : null,
                value: source.value,
                depth: depth,
                index: seriesData.length,
                itemStyle: source.itemStyle
            };
            seriesData.push(nd);
            if (source.children && source.children.length > 0) {
                for (let c of source.children) {
                    convert(c, source, depth + 1);
                }
            } else if (!nd.value) {
                nd.value = 1;
            }
        }
        convert(rawData, null, 0);
        return {
            seriesData: seriesData,
            maxDepth: maxDepth
        };
    }
    var all;
    function initChart(seriesData, maxDepth) {
        var displayRoot = stratify();
        all = displayRoot.descendants();
        function stratify() {
            return d3
                .stratify()
                .parentId(function (d) {
                    return d.parentId;
                })(seriesData)
                .sum(function (d) {
                    return d.value || 1;
                })
                .sort(function (a, b) {
                    return b.value - a.value;
                });
        }
        function overallLayout(params, api) {
            var context = params.context;
            d3
                .pack()
                .size([api.getWidth() - 2, api.getHeight() - 2])
                .padding(3)(displayRoot);
            context.nodes = {};
            displayRoot.descendants().forEach(function (node, index) {
                context.nodes[node.id] = node;
            });
        }
        function renderItem(params, api) {
            var context = params.context;
            // Only do that layout once in each time `setOption` called.
            if (!context.layout) {
                context.layout = true;
                overallLayout(params, api);
            }
            var nodePath = api.value('id');
            var node = context.nodes[nodePath];
            if (!node) {
                // Reder nothing.
                return;
            }
            var isLeaf = !node.children || !node.children.length;
            var focus = new Uint32Array(
                node.descendants().map(function (node) {
                    return node.data.index;
                })
            );
            var nodeName = node.data.name;
            var z2 = api.value('depth') * 2;

            let itemColor = api.visual('color');

            drawStack(displayRoot);

            return {
                type: 'circle',
                focus: focus,
                shape: {
                    cx: node.x,
                    cy: node.y,
                    r: node.r
                },
                transition: ['shape'],
                z2: z2,
                textContent: {
                    type: 'text',
                    style: {
                        // transition: isLeaf ? 'fontSize' : null,
                        text: nodeName,
                        width: node.r * 1.3,
                        overflow: 'truncate',
                        fontSize: 12,
                        color: 'grey'
                    },
                    emphasis: {
                        style: {
                            overflow: null,
                            fontSize: 28,
                            color: 'grey'
                        }
                    }
                },
                textConfig: {
                    position: 'inside'
                },
                style: {
                    fill: (node.data.itemStyle.color || api.visual('color'))
                },
                emphasis: {
                    style: {
                        fontSize: 12,
                        shadowBlur: 20,
                        shadowOffsetX: 3,
                        shadowOffsetY: 5,
                        shadowColor: 'rgba(0,0,0,0.3)'
                    }
                }
            };
        }
        function nodeText(text) {
            if (text.startsWith("https://") && text.length > 20) {
                return text.substring(0, 20) + "...";
            }
            return text;
        }
        function drawStack(node) {
            let text = null;
            while (node) {
                text = text != null ? " | " + text : "";
                text = nodeText(node.data.name) + text;
                let parentId = node.data.parentId;
                node = all.find(function (n) {
                    return n.data.id === parentId;
                });
            }
            document.getElementById("stackContent").innerHTML = text;
        }
        option = {
            dataset: {
                source: seriesData
            },
            tooltip: {},
            visualMap: [
                {
                    show: false,
                    min: 0,
                    max: maxDepth,
                    dimension: 'depth',
                    inRange: {
                        color: ['#006edd', '#e0ffff']
                    }
                }
            ],
            hoverLayerThreshold: Infinity,
            series: {
                type: 'custom',
                renderItem: renderItem,
                progressive: 0,
                coordinateSystem: 'none',
                encode: {
                    tooltip: 'name'
                }
            }
        };
        myChart.setOption(option);
        myChart.on('click', { seriesIndex: 0 }, function (params) {
            drillDown(params.data.id);
        });
        function drillDown(targetNodeId) {
            let isTargetNodeId = targetNodeId != null;
            let dr = displayRoot;
            displayRoot = stratify();
            if (targetNodeId == null) {
                if (dr.data.parentId != null)
                    targetNodeId = dr.data.parentId;
            }
            if (targetNodeId != null) {
                displayRoot = displayRoot.descendants().find(function (node) {
                    return node.data.id === targetNodeId;
                });
            }
            // A trick to prevent d3-hierarchy from visiting parents in this algorithm.
            drawStack(displayRoot);
            displayRoot.parent = null;
            myChart.setOption({
                dataset: {
                    source: seriesData
                }
            });
        }
        // Reset: click on the blank area.
        myChart.getZr().on('click', function (event) {
            if (!event.target) {
                drillDown();
            }
        });
    }

    const dataWrap = prepareData(rawData);
    initChart(dataWrap.seriesData, dataWrap.maxDepth);

}