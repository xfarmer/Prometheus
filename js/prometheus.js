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
        data: []
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
        let markCHart = this.markChart;
        this.navChartOptions.chart.events.selection = function (event) {
            let min = Math.round(event.xAxis[0].min);
            let max = Math.round(event.xAxis[0].max);
            console.log('min: ' + min + ', max: ' + max);
            markCHart.xAxis[0].setExtremes(min, max);
            // $('#' + this.markChartDivId).highcharts().xAxis[0].setExtremes(min, max);
            return false;
        };

        console.log('Construct navigate chart');
        this.navigatorChart = Highcharts.chart(this.navChartDivId, this.navChartOptions);
    }

    setData(data) {
        this.markChart.series[0].setData(data, true);
        this.navigatorChart.series[0].setData(data, true);
    }
}
