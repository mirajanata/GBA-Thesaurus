eCharts_sunburstChart = function (data, elementId) {
    let chartDom = document.getElementById(elementId);

    let myChart = echarts.init(chartDom, null, {
        renderer: 'svg'
    });
    function outputsize() {
        myChart.resize();
    }
    new ResizeObserver(outputsize).observe(chartDom);

    data = data.children;
    let option = {
        title: {
            text: '',
            subtext: '',
            textStyle: {
                fontSize: 14,
                align: 'center',
                color: 'black'
            },
            subtextStyle: {
                align: 'center'
            }
        },
        series: {
            type: 'sunburst',
            data: data,
            radius: [0, '95%'],
            sort: undefined,
            emphasis: {
                focus: 'ancestor'
            },
            levels: [
                {},
                {
                    r0: '15%',
                    r: '35%',
                    itemStyle: {
                        borderWidth: 2
                    },
                    label: {
                        //rotate: 'tangential'
                        align: 'right',
                        color: 'black',
                        fontSize: 11
                    }
                },
                {
                    r0: '35%',
                    r: '70%',
                    label: {
                        align: 'right',
                        color: 'black',
                        fontSize: 11
                    }
                },
                {
                    r0: '70%',
                    r: '72%',
                    label: {
                        position: 'outside',
                        padding: 3,
                        silent: false,
                        color: 'black',
                        fontSize: 11
                    },
                    itemStyle: {
                        borderWidth: 3
                    }
                }
            ]
        }
    };

    option && myChart.setOption(option);

}