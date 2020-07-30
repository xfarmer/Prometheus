'use strict';

class ArrayList {
    constructor() {
        this.arr = [];
    }

    size() {
        return this.arr.length;
    }

    isEmpty() {
        return this.arr.length === 0;
    }

    add(obj) {
        this.arr.push(obj);
    }

    // Replace object of specified index, if out of bounds, it is added to the boundary.
    replace(index, obj) {
        this.arr.splice(index, 1, obj);
    }

    // Insert obj to specified index, move back if it exists
    // If index out of bounds, it is added to the boundary.
    insert(index, obj) {
        this.arr.splice(index, 0, obj);
    }

    remove(index) {
        this.arr.splice(index, 1);
    }

    get(index) {
        return this.arr[index];
    }

    indexOf(obj) {
        for (let i = 0; i < this.arr.length; i++) {
            if (this.arr[i] === obj) {
                return i;
            }
        }
        return -1;
    }

    contains(obj) {
        return this.indexOf(obj) !== -1;
    }

    clear() {
        this.arr = [];
    }
}

class SwimLabelResultList {
    constructor() {
        this.arr = new ArrayList();
    }

    indexOfFile(name) {
        for (let i = 0; i < this.arr.size(); i++) {
            if (name === this.arr.get(i).filename) {
                return i;
            }
        }

        return -1;
    }

    containsFile(name) {
        return this.indexOfFile(name) !== -1;
    }

    containsObj(obj) {
        return this.containsFile(obj.filename);
    }

    addFile(obj, replace) {
        let i = this.indexOfFile(obj.filename);
        if (i !== -1) {
            console.log('Exists marking file: ' + obj.filename);
            if (replace) {
                console.log('Updated marking file: ' + obj.filename);
                this.arr.replace(i, obj);
                return true;
            }
            return false;
        }
        this.arr.add(obj);
        return true;
    }

    getFile(name) {
        let idx = this.indexOfFile(name);
        if (idx !== -1) {
            return this.arr.get(idx);
        } else {
            return null;
        }
    }

    removeFile(name) {
        for (let i = 0; i < this.arr.size(); i++) {
            if (name === this.arr.get(i).filename) {
                this.arr.remove(i);
                console.log('Removed file: ' + name);
                return ;
            }
        }
    }

    clearFiles() {
        this.arr.clear();
    }

    toString() {
        let txt = '';
        let fileNum = this.arr.size();
        console.log('Total marked file num: ' + fileNum);
        for (let i = 0; i < fileNum; i++) {
            let labelResult = this.arr.get(i);
            if (labelResult.labelList.size() === 0) {
                continue;
            }
            txt += labelResult.filename + ',';

            let labelNum = labelResult.labelList.size();
            for (let j = 0; j < labelNum; j++) {
                txt += labelResult.labelList.get(j).toString();
                if (j !== (labelNum - 1)) {
                    txt += ',';
                }
            }

            if (i !== (fileNum - 1)) {
                txt += '\n';
            }
        }

        return txt;
    }
}

class SwimLabelResult {
    constructor(f) {
        this.filename = f;
        this.labelList = new ArrayList();
    }

    addLabel(label) {
        this.labelList.add(label);
    }

    removeLabel(index) {
        this.labelList.remove(index);
    }

    clearLabel() {
        this.labelList.clear()
    }
}

class SwimLabel {
    constructor(pl, style, trips, strokes) {
        this.poolLen = pl;
        this.style = style;
        this.trips = trips;
        this.strokes = strokes
        this.seg = ',';
    }

    get isStyleLegal() {
        return (this.style >= 0 && this.style <= 4) || this.style === 99;
    }

    toString() {
        return this.poolLen + this.seg + this.style + this.seg + this.trips + this.seg + this.strokes;
    }
}

const stateTable = {
    'Undefined': 0,
    'Freestyle': 1,
    'Breaststroke': 2,
    'Backstroke': 3,
    'Butterfly': 4,
    'Turnaround': 99
};
let files;
let markedFlags;
let markingIndex = 0;
let swimLabelResults = new SwimLabelResultList();
let currentSwimLabelResult = null;
let navigatorChart = null;
let markingChart = null;
let guessedStyle = 0;
let guessedPoolLen = 0;
let guessedTrips = 0;
let guessedStrokes = 0;
let endPointMax = 0;
let sampleRate = 26;

let markingChartOptions = {
    credits: {
        text: 'xfarmer',
        href: 'https://github.com/xfarmer'
    },
    title: {
        text: 'Swimming Accelerometer Magnitude'
    },
    xAxis: {
        title: {
            text: 'Time(s)'
        },
        type: 'linear',
        tickInterval: sampleRate, // 坐标轴刻度间隔为采样周期
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
        name: 'Magnitude',
        showInLegend: false,
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

                return false;
            }
        }
    }
};

let navigatorChartOptions = {
    credits: {
        text: 'xfarmer',
        href: 'https://github.com/xfarmer'
    },
    title: {
        text: 'Navigator'
    },
    xAxis: {
        title: {
            text: 'Time(s)'
        },
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

    series: [{
        tooltip: {
            valueDecimals: 2
        },
        name: 'Magnitude',
        showInLegend: false,
        data: []
    }],

    chart: {
        selectionMarkerFill: 'rgba(0,191,255,0.2)',
        zoomType: 'x',
        panning: true,
        panKey: 'shift',
        events: {
            selection: function (event) {
                let min = Math.round(event.xAxis[0].min);
                let max = Math.round(event.xAxis[0].max);
                markingChart.xAxis[0].setExtremes(min, max);
                return false;
            }
        }
    }
};

function handleFileSelection(evt) {
    files = evt.target.files;  // FileList object
    markedFlags = [];
    updateMarkProgressBar();
    swimLabelResults.clearFiles();
    $('#labelResultsTxt').text('');
    let fileList = $('#fileList');
    fileList.empty();

    // files is a FileList of File objects. List some properties.
    for (let i = 0, f; f = files[i]; i++) {
        let item = '<button type="button" onclick="onFileClicked(' + i + ')" id="fileIdx-' + i + '" class="list-group-item list-group-item-action">' + f.name + '</button>';
        fileList.append(item);
        markedFlags.push(false);
    }

    $('#labelResultRow').show();
    $('#markSubmit').show();
    $('#markInvalid').show();

    markingIndex = 0;
    markFile(files[markingIndex]);
    $('#fileIdx-' + markingIndex).toggleClass('list-group-item-info').append('<i class="fa fa-arrow-left pull-right" aria-hidden="true"></i>');
}

// 如果当前文件已经标注了，那么提示是否保存，然后转到下一个文件
// 如果目标文件已经标注，提示是否重新标注，否则显示结果，随后也可以添加/删除标注
function onFileClicked(index) {
    if (index >= files.length) {
        console.log('Index is greater than files list length')
        return;
    }
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
                updateMarkProgressBar();
                swimLabelResults.removeFile(files[index].name);
                desItem.toggleClass('list-group-item-success');
                desItem.toggleClass('list-group-item-info');
            }
        } else {
            desItem.toggleClass('list-group-item-info');
        }

        desItem.append('<i class="fa fa-arrow-left pull-right" aria-hidden="true"></i>');
        markingIndex = index;
        markFile(files[markingIndex]);
    }
}

function restoreMarkedFile(labelResult) {
    console.log('Restore marked file.');
    let labelNum = labelResult.labelList.size();
    for (let i = 0; i < labelNum; i++) {
        renderSwimLabelToTable(labelResult.labelList.get(i));
    }
}

function renderSwimLabelToTable(label) {
    $('#inputPoolLen').val(label.poolLen);
    $('#swimmingStyle').val(label.style);
    $('#inputTrips').val(label.trips);
    $('#inputStrokes').val(label.strokes);
}

function markFile(f) {
    console.log('Current marking: ' + f.name);
    currentSwimLabelResult = swimLabelResults.getFile(f.name);
    if (currentSwimLabelResult === null) {
        console.log('Create new result.');
        currentSwimLabelResult = new SwimLabelResult(f.name);
    } else {
        restoreMarkedFile(currentSwimLabelResult);
    }

    let rawDataLines = [];
    let rawData = [];

    let reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function () {
        return function (e) {
            let metas = f.name.split('_');
            if (metas[0] === 'SensorData') {
                guessedPoolLen = parseInt(metas[6]);
                guessedStyle = stateTable[metas[7]];
                guessedTrips = parseInt(metas[8]);
                guessedStrokes = parseInt(metas[9]);

            } else {
                guessedStyle = 0;
                console.log('Not a standard SensorData file?');
                alert('文件不以"SensorData"开头，可能不是标准的数据文件？')
            }

            // console.log('guessedState: ' + guessedState);
            let content = e.target.result;
            // document.getElementById('content').innerHTML = '<p>' + replaceAll(content, '\n','<br>') + '</p>';
            rawDataLines = content.split('\n');
            rawData.length = 0;
            for (let j = 0, line; line = rawDataLines[j]; j++) {
                let vArr = line.split(',');
                let x = parseFloat(vArr[1]);
                let y = parseFloat(vArr[2]);
                let z = parseFloat(vArr[3]);
                let wx = parseFloat(vArr[1]);
                let wy = parseFloat(vArr[2]);
                let wz = parseFloat(vArr[3]);
                rawData.push(wy);
            }

            if (navigatorChart === null) {
                console.log('Init navigator chart.');
                navigatorChartOptions.series[0].data = rawData;
                navigatorChart = Highcharts.chart('navigatorChart', navigatorChartOptions);
                $('#navigatorChart').show();
            } else {
                // console.log('Update navigator chart.');
                navigatorChart.series[0].setData(rawData, true);
            }
            if (markingChart === null) {
                console.log('Init marking chart.');
                markingChartOptions.series[0].data = rawData;
                markingChart = Highcharts.chart('markingChart', markingChartOptions);
                $('#markingChart').show();
            } else {
                // console.log('Update marking chart.');
                markingChart.xAxis[0].removePlotBand('marked-band');
                markingChart.series[0].setData(rawData, true);
            }

            // Set default label
            $('#inputPoolLen').val(guessedPoolLen);
            $('#swimmingStyle').val(guessedStyle);
            $('#inputTrips').val(guessedTrips);
            $('#inputStrokes').val(guessedStrokes);

            // Clear label variables
            endPointMax = rawData.length - 1;
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsText(f);
}

function updateLabel(label) {
    console.log('Submit Label: ' + label);
    // Update label
    currentSwimLabelResult.clearLabel();
    currentSwimLabelResult.addLabel(label);
    console.log(currentSwimLabelResult);

    // Save current label result
    saveCurrentLabelResult(false);

    if ((markingIndex + 1) < files.length) {
        toastr.success('开始标注下一条', '提交成功');
        // Move to next file
        console.log('Move to next file: ' + (markingIndex + 1))
        onFileClicked(markingIndex + 1);
    } else {
        toastr.success('已经是最后一条', '提交成功');
    }
}


function onLabelSubmit() {
    let poolLen = parseInt($('#inputPoolLen').val());
    let style = parseInt($('#swimmingStyle').val());
    let trips = parseInt($('#inputTrips').val());
    let strokes = parseInt($('#inputStrokes').val());
    let label = new SwimLabel(poolLen, style, trips, strokes);

    updateLabel(label)
}

function onLabelInvalid() {
    let poolLen = -1;
    let style = -1;
    let trips = -1;
    let strokes = -1;
    let label = new SwimLabel(poolLen, style, trips, strokes);

    if (confirm('确认标注此条数据为无效数据?')) {
        updateLabel(label);
    }
}

function saveCurrentLabelResult(needConfirm) {
    if (currentSwimLabelResult !== null && !swimLabelResults.containsObj(currentSwimLabelResult) && currentSwimLabelResult.labelList.size() > 0) {
        if (!needConfirm || confirm('本条数据标注非空，是否保存/更新?') === true) {
            console.log("Saving");
            markedFlags[markingIndex] = true;
            updateMarkProgressBar();
            let curItem = $('#fileIdx-' + markingIndex);
            curItem.removeClass('list-group-item-info');
            curItem.toggleClass('list-group-item-success');
            swimLabelResults.addFile(currentSwimLabelResult, true);
            console.log(swimLabelResults);
        }
    }
}

function updateMarkProgressBar() {
    if (markedFlags.length <= 0) return;

    let completed = markedFlags.reduce((a, b) => a + b, 0);
    let progress = completed / markedFlags.length * 100;
    progress = progress.toFixed(1);
    let barItem = $('#markProgress').children('div');
    barItem.css('width', progress + '%');
    barItem.empty();
    barItem.text(progress + '%')
}

function generateResult() {
    if (currentSwimLabelResult === null) {
        alert('请先选择文件进行标记再执行此操作！');
        return;
    }
    saveCurrentLabelResult();

    let txt = swimLabelResults.toString();
    console.log(txt);
    $('#labelResultsTxt').text(txt);
}

function exportData() {
    let content = swimLabelResults.toString();
    if (content.length > 0) {
        let eleLink = document.createElement('a');
        eleLink.download = 'swimming-labeled_ground-truth.csv';
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
