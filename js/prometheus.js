'use strict';

function replaceAll(str, s1, s2) {
    return str.replace(new RegExp(s1, 'gm'), s2);
}


let markingChartBaseConfig = {
    credits: {
        text: 'xFarmer',
        href: 'https://github.com/xfarmer/Prometheus'
    },
    xAxis: {
        title: {
            text: null
        },
        tickInterval: 1,
        tickWidth: 0,
        gridLineWidth: 1,
        labels: {
            align: 'left',
            x: 3,
            y: -3,
            formatter: function () {
                return this.value;
            },
        }
    },
    yAxis: {
        title: {
            text: 'Value'
        }
    },

    series: [{
        tooltip: {
            valueDecimals: 2
        },
        name: 'Value',
        showInLegend: false,
        data: [1,1,1,1]
    }],
}

let markChartDefaultOptions = {
    title: {
        text: 'Sensor Data'
    },
    tooltip: {
        enabled: false
    },
    plotOptions: {
        series: {
            allowPointSelect: true
        },
        line: {
            dataLabels: {
                enabled: false
            },
            enableMouseTracking: true
        },
    },
    xAxis: {
        title: {
            text: null
        },
    },
    chart: {
        selectionMarkerFill: 'rgba(0,191,255,0.2)',
        zoomType: 'x',
        panning: true,
        panKey: 'shift',
        events: {
            click: function (event) {
                this.xAxis[0].removePlotBand('marked-band');
            },
            selection: function (event) {
                let min = Math.round(event.xAxis[0].min);
                if (min < 0) min = 0;
                let max = Math.round(event.xAxis[0].max);
                if (max > endPointMax) max = endPointMax;
                // alert('You selected points from: ' + min + ' to ' + max);
                this.xAxis[0].removePlotBand('marked-band');
                this.xAxis[0].addPlotBand({
                    from: min,
                    to: max,
                    color: '#87CEFA',
                    id: 'marked-band'
                });

                return false;
            }
        }
    }
};

let navChartDefaultOptions = {
    title: {
        text: null
    },
    xAxis: {
        title: {
            text: 'Sample point'
        },
    },
    chart: {
        selectionMarkerFill: 'rgba(0,191,255,0.2)',
        zoomType: 'x',
        panning: true,
        panKey: 'shift',
        events: {
            selection: function (event) {
                let min = Math.round(event.xAxis[0].min);
                let max = Math.round(event.xAxis[0].max);
                console.log('-----   min: ' + min + ', max: ' + max)
                return false;
            }
        }
    }
};

class MarkingChart {
    constructor(markChartDivId, navChartDivId, markChartOptions=null, navChartOptions=null) {
        this.markChartDivId = markChartDivId;
        this.navChartDivId = navChartDivId;
        this.markChart = null;
        this.navigatorChart = null;

        if (markChartOptions === null) {
            this.markChartOptions = {};
            $.extend(this.markChartOptions, markingChartBaseConfig, markChartDefaultOptions);
        }

        if (navChartOptions === null) {
            this.navChartOptions = {};
            $.extend(this.navChartOptions, markingChartBaseConfig, navChartDefaultOptions);
        }

        console.log('Construct marking chart');
        this.markChart = Highcharts.chart(this.markChartDivId, this.markChartOptions);
        this.navChartOptions.chart.events.selection = (function (event) {
            let min = Math.round(event.xAxis[0].min);
            let max = Math.round(event.xAxis[0].max);
            console.log('min: ' + min + ', max: ' + max);
            this.markChart.xAxis[0].setExtremes(min, max);
            return false;
        }).bind(this);

        console.log('Construct navigate chart');
        this.navigatorChart = Highcharts.chart(this.navChartDivId, this.navChartOptions);
    }

    setData(data, seriesIndex=0) {
        // TODO: Some bugs? Just work around for now
        let dataCopy1 = data.slice();
        let dataCopy2 = data.slice();

        console.log('Update mark chart');
        this.markChart.series[seriesIndex].setData(dataCopy1, true);
        console.log('Update navigator chart');
        this.navigatorChart.series[seriesIndex].setData(dataCopy2, true);
    }
}

class SensorDataLoader {
    constructor(parseByType=false, maxAxis=3, onDataLoadedCallBack=function (data) {}) {
        this.parseByType = parseByType;
        this.data = null;
        this.dataAxisNum = maxAxis;
        this.dataLength = 0;

        this.onDataLoadedCb = onDataLoadedCallBack;
        this.reader = new FileReader();
        this.reader.onload = this.readDataFromFile.bind(this);
    }

    readFile(filePath) {
        this.reader.readAsText(filePath);
    }


    readDataFromFile(event) {
        let rawDataLines = event.target.result.split('\n');
        console.log('Data line num: ' + rawDataLines.length)

        // clear data
        this.data = null

        for (let i = 0; i < rawDataLines.length; ++i) {
            let vArr = rawDataLines[i].split(',');
            if (this.parseByType) {
                // Use dict
                if (this.data === null) {
                    this.data = {}
                }
            } else {
                // Use 2D array
                if (this.data === null) {
                    this.data = []
                    if (this.dataAxisNum > vArr.length) {
                        this.dataAxisNum = vArr.length;
                    }
                    console.log('Init 2d array, shape 0: ' + this.dataAxisNum)
                    for (let j = 0; j < this.dataAxisNum; ++j) {
                        this.data.push([]);
                    }
                }

                for (let j = 0; j < this.dataAxisNum; ++j) {
                    this.data[j].push(parseFloat(vArr[j]));
                }
                this.dataLength++;
            }
        }
        if (this.parseByType) {

        } else {
            for (let i = 0; i < this.dataAxisNum; ++i) {
                console.log('Data length for axis ' + i + ': ' + this.data[i].length)
                console.log('Data sample: ' + this.data[i].slice(0, 3))
            }
        }

        if (this.onDataLoadedCb !== null) {
            this.onDataLoadedCb(this.data);
        }
    }
}
