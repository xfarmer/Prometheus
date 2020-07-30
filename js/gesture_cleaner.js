'use strict';

let files;
let markedFlags;
let markingIndex = 0;
let labelResultMap;
let currentLabelArr = null;
let startIndex = 0;
let endIndex = 0;
let maxIndex = 0;
let totalNum = 0;
let currentIndex = 0;
let markingChart = null;
let sampleRate = 26;
let rawDataLines;

let markingChartOptions = {
    credits: {
        text: 'xfarmer',
        href: 'https://github.com/xfarmer'
    },
    title: {
        text: 'Gesture Accelerometer'
    },
    xAxis: {
        title: {
            text: 'Time(s)'
        },
        type: 'linear',
        tickInterval: sampleRate,
        tickWidth: 0,
        gridLineWidth: 1,
        labels: {
            align: 'left',
            x: 3,
            y: -3,
            formatter: function () {
                return this.value / sampleRate;
            },
        }
    },

    yAxis: {
        title: {
            text: 'Magnitude(g)'
        }
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

    series: [{
        tooltip: {
            valueDecimals: 2
        },
        name: 'Gesture X',
        showInLegend: true,
        data: []
    }, {
        tooltip: {
            valueDecimals: 2
        },
        name: 'Gesture Y',
        showInLegend: true,
        data: []
    }, {
        tooltip: {
            valueDecimals: 2
        },
        name: 'Gesture Z',
        showInLegend: true,
        data: []
    }],

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
                    color: '#FCFFC5',
                    id: 'marked-band'
                });

                // Show mark modal
                showMarkIntervalModal(min, max, guessedState);

                return false;
            }
        }
    }
};

function handleFileSelection(evt) {
    files = evt.target.files;  // FileList object
    markedFlags = [];
    // updateMarkProgressBar();
    $('#labelResultsTxt').text('');
    let fileList = $('#fileList');
    fileList.empty();

    labelResultMap = new Map();
    // files is a FileList of File objects. List some properties.
    for (let i = 0; i < files.length; i++) {
        let f = files[i];
        let item = '<button type="button" onclick="onFileClicked(' + i + ')" id="fileIdx-' + i + '" class="list-group-item list-group-item-action">' + f.name + '</button>';
        fileList.append(item);
        markedFlags.push(false);
    }

    markingIndex = 0;
    markFile(files[markingIndex]);
    $('#fileIdx-' + markingIndex).toggleClass('list-group-item-info').append('<i class="fa fa-arrow-left pull-right" aria-hidden="true"></i>');
}

// 如果当前文件已经标注了，那么提示是否保存，然后转到下一个文件
// 如果目标文件已经标注，提示是否重新标注，否则显示结果，随后也可以添加/删除标注
function onFileClicked(index) {
    if (markingIndex !== index) {
        let curItem = $('#fileIdx-' + markingIndex);
        if (!markedFlags[markingIndex]) {
            curItem.toggleClass('list-group-item-info');
        }
        curItem.children('i').remove();

        let desItem = $('#fileIdx-' + index);
        if (markedFlags[index]) {
            let r = confirm('本条数据已经完成标注，是否重新标注?');
            if (r === true) {
                markedFlags[index] = false;
                labelResultMap.get(files[index].name).fill(0);
                desItem.toggleClass('list-group-item-success');
                desItem.toggleClass('list-group-item-info');

                markingIndex = index;
                markFile(files[markingIndex]);
            }
        } else {
            desItem.toggleClass('list-group-item-info');

            markingIndex = index;
            markFile(files[markingIndex]);
        }
        desItem.append('<i class="fa fa-arrow-left pull-right" aria-hidden="true"></i>');
    }
}

function markFile(f) {
    console.log('Current marking: ' + f.name);

    let reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function () {
        return function (e) {
            let content = e.target.result;
            rawDataLines = content.split('\n'); // Split by '\n', the last element will be empty.
            totalNum = rawDataLines.length - 1;          // So minus 1 here.
            maxIndex = totalNum - 1;                     // Index start with 0.
            console.log('Gesture instance num: ' + (maxIndex + 1));

            if (!labelResultMap.has(f.name)) {
                console.log('Not contain ' + f.name + ' yet. Adding to map.');
                labelResultMap.set(f.name, new Array(totalNum).fill(0));
            }
            currentLabelArr = labelResultMap.get(f.name);

            showMarkIntervalModal(totalNum, 0, 100);
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsText(f);
}

function markGestureData(index) {
    console.log('Marking index ' + index);
    let rawDataX = [];
    let rawDataY = [];
    let rawDataZ = [];
    let vArr = rawDataLines[index].split(',');
    let featureLen = vArr.length / 3;
    for (let i = 0; i < featureLen; i++) {
        rawDataX.push(parseFloat(vArr[i]));
        rawDataY.push(parseFloat(vArr[i + featureLen]));
        rawDataZ.push(parseFloat(vArr[i + featureLen * 2]))
    }

    if (markingChart === null) {
        console.log('Init marking chart.');
        markingChartOptions.series[0].data = rawDataX;
        markingChartOptions.series[1].data = rawDataY;
        markingChartOptions.series[2].data = rawDataZ;
        markingChart = Highcharts.chart('markingChart', markingChartOptions);
        $('#markingChart').show();
        $('#markPanel').show();
    } else {
        // console.log('Update marking chart.');
        markingChart.xAxis[0].removePlotBand('marked-band');
        markingChart.series[0].setData(rawDataX, true);
        markingChart.series[1].setData(rawDataY, true);
        markingChart.series[2].setData(rawDataZ, true);
    }
}

function gestureAccepted() {
    if (currentIndex <= endIndex) {
        console.log('Index ' + currentIndex + ' accepted.');
        currentLabelArr[currentIndex] = 1;

        markNextGesture();
    }
}

function gestureRejected() {
    if (currentIndex <= endIndex) {
        console.log('Index ' + currentIndex + ' rejected.');
        currentLabelArr[currentIndex] = 0;

        markNextGesture();
    }
}

function markNextGesture() {
    ++currentIndex;
    updateMarkProgressBar();
    if (currentIndex <= endIndex) {
        markGestureData(currentIndex);
    } else {
        alert('当前文件标记完成!');
        markedFlags[markingIndex] = true;
    }
}

function onMarkIntervalSubmit() {
    startIndex = parseInt($('#startPoint').val());
    if (startIndex > maxIndex) startIndex = maxIndex;
    endIndex = parseInt($('#endPoint').val());
    if (endIndex > maxIndex) endIndex = maxIndex;
    if (startIndex > endIndex) {
        alert('标记起点大于终点!');
        endIndex = startIndex;
    }
    currentIndex = startIndex;
    let intervalHint = 'from ' + startIndex + ' to ' + endIndex;
    console.log('Ready to mark ' + intervalHint);

    $('#markProgressTitle').text('标记进度(' + intervalHint + ')：');
    updateMarkProgressBar();

    markGestureData(currentIndex);
}

function onMarkIntervalCancel() {
    // markingChart.xAxis[0].removePlotBand('marked-band');
}

function updateMarkProgressBar() {
    if (markedFlags.length <= 0) return;

    let completed = currentIndex - startIndex;
    let total = endIndex - startIndex + 1;
    let progress = completed / total * 100;
    // console.log('completed: ' + completed + ', total: ' + total);
    progress = progress.toFixed(1);
    let barItem = $('#markProgress').children('div');
    barItem.css('width', progress + '%');
    barItem.empty();
    barItem.text(progress + '%')
}

function showMarkIntervalModal(total, start, end) {
    $('#instanceNumHint').text('当前文件手势实例总数: ' + total);
    let startPoint = $('#startPoint');
    startPoint.val(start);
    startPoint.attr('min', '' + 0);
    startPoint.attr('max', '' + total);
    let endPoint = $('#endPoint');
    endPoint.val(end);
    endPoint.attr('min', '' + 0);
    endPoint.attr('max', '' + total);

    $('#markModal').modal('show');
}

function labelResultToString() {
    let out = '';
    for (let i = 0; i < currentLabelArr.length; i++) {
        out += currentLabelArr[i] + '\n'
    }

    return out;
}

function generateResult() {
    if (currentLabelArr === null) {
        alert('请先选择文件进行标记再执行此操作！');
        return;
    }

    $('#labelResultsTxt').text(labelResultToString());
}

function exportData() {
    let content = labelResultToString();
    let suffix = '_labels-' + startIndex + '-' + endIndex + '.npt';
    let originName = files[markingIndex].name;
    let fileName = originName.substring(0, originName.lastIndexOf('.')) + suffix;
    if (content.length > 0) {
        let eleLink = document.createElement('a');
        eleLink.download = fileName;
        eleLink.style.display = 'none';
        // 字符内容转变成blob地址
        let blob = new Blob([content]);
        eleLink.href = URL.createObjectURL(blob);
        // 触发点击
        document.body.appendChild(eleLink);
        eleLink.click();
        // 然后移除
        document.body.removeChild(eleLink);
    } else {
        alert('没有目标数据可导出！');
    }
}

function copyData() {
    let Url2 = $('#labelResultsTxt');
    Url2.select();
    document.execCommand('Copy');
    alert('数据已复制！');
}
