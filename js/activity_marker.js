
// Author: github.com/xfarmer

'use strict';

const activitiesTypeValidNum = 9;
const targetSampleRate = 25;
const sampleIntervalMin = 35000000;  // Target sample rate 25Hz(Sample period about 38ms)

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

class LinearLabel {
    constructor(s, t, state) {
        this.startPoint = s;
        this.endPoint = t;
        this.state = state;
        this.seg = '_';
    }

    get len() {
        return this.endPoint - this.startPoint + 1;
    }

    get minutes() {
        return Math.round(this.len / 26 / 60);
    }

    toString() {
        return this.state + this.seg + this.startPoint + this.seg + this.endPoint;
    }
}

class FileLabelArray {
    constructor(f) {
        this.filename = f;
        this.labelList = new ArrayList();
    }

    addLabel(label) {
        this.labelList.add(label);
    }

    getLabel(index) {
        return this.labelList.get(index);
    }

    removeLabel(index) {
        this.labelList.remove(index);
    }

    totalTimeMinutes() {
        let timeMinutes = 0;
        for (let i = 0; i < this.labelList.size(); ++i) {
            let label = this.labelList.get(i);
            timeMinutes += label.minutes;
        }

        return timeMinutes;
    }
}

class FilesLabelResultList {
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

    getTotalTimeMinutes() {
        let minutes = 0;
        let fileNum = this.arr.size();
        console.log('Total marked file num: ' + fileNum);
        for (let i = 0; i < fileNum; i++) {
            let labelResult = this.arr.get(i);
            if (labelResult.labelList.size() === 0) {
                continue;
            }

            minutes += labelResult.totalTimeMinutes();
        }

        return minutes;
    }
}

let markingChartOptions = {
    credits: {
        text: 'xfarmer',
        href: 'https://github.com/xfarmer'
    },
    title: {
        text: 'Accelerometer Magnitude'
    },
    xAxis: {
        title: {
            text: 'Time(s)'
        },
        type: 'linear',
        tickInterval: targetSampleRate, // 单位是ms, 坐标轴刻度间隔为采样周期 1/targetSampleRate ms
        tickWidth: 0,
        gridLineWidth: 1,
        labels: {
            align: 'left',
            x: 3,
            y: -3,
            formatter: function () {
                return this.value / targetSampleRate;
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

                // Show mark modal
                showMarkModal(min, max, guessedType);

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
        tickInterval: targetSampleRate, // 单位是ms, 坐标轴刻度间隔为采样周期 1/targetSampleRate ms
        tickWidth: 0,
        gridLineWidth: 1,
        labels: {
            align: 'left',
            x: 3,
            y: -3,
            formatter: function () {
                return this.value / targetSampleRate;
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

const activitiesTypesMap = {
    'Other': 0,
    'Sitting': 1,
    'Standing': 2,
    'Walking': 3,
    'Fast-walking': 4,
    'Upstairs': 5,
    'Downstairs': 6,
    'Running': 7,
    'Biking': 8,
    'Swimming': 9,
    'Elliptical-trainer': 10,
    'Rowing-machine': 11,

    // Non-standard. Only for compatibility.
    'DownStairs': 6
};

let files;
let markedFlags;
let markingIndex = 0;
let filesLabelResults = new FilesLabelResultList();
let currentFileLabelArray = null;
let navigatorChart = null;
let markingChart = null;
let guessedType = 0;
let endPointMax = 0;
let acceptedTimeMinutes = 0;

function handleFileSelection(evt) {
    files = evt.target.files;
    markedFlags = [];
    updateMarkProgressBar();
    filesLabelResults.clearFiles();
    $('#labelResultsTxt').text('');
    let fileList = $('#fileList');
    fileList.empty();
    updateAcceptedTimeUI(0);

    // files is a FileList of File objects. List some properties.
    for (let i = 0, f; f = files[i]; i++) {
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

        saveCurrentLabelResult();

        let desItem = $('#fileIdx-' + index);
        if (markedFlags[index]) {
            let r = confirm('本条数据已经完成标注，是否重新标注?');
            if (r === true) {
                // Update accepted time
                let currentLabelArr = filesLabelResults.getFile(files[index].name);
                updateAcceptedTime(false, currentLabelArr.totalTimeMinutes());

                markedFlags[index] = false;
                updateMarkProgressBar();
                filesLabelResults.removeFile(files[index].name);
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
        renderLabelToTable(labelResult.labelList.get(i));
    }
}

function renderLabelToTable(label) {
    // $('#labelResultPanel').show();

    // Add to label result list
    // let trIndex = '<td>' + currentFileLabelArray.labelList.size() + '</td>';
    let trIndex = "";
    let trStart = '<td>' + label.startPoint + '</td>';
    let trStop = '<td>' + label.endPoint + '</td>';
    let trState = '<td>' + label.state + '</td>';
    let tr = '<tr class="CaseRow">' + trIndex + trStart + trStop + trState;
    tr += '<td><button type="button" class="btn btn-xs btn-danger" onclick="onLabelDelete(this)">删除</button></td></tr>';
    $('#markTable tbody').append(tr);
}

function markFile(f) {
    console.log('Current marking: ' + f.name);
    $('#markTable tbody').empty();
    currentFileLabelArray = filesLabelResults.getFile(f.name);
    if (currentFileLabelArray === null) {
        console.log('Create new result.');
        currentFileLabelArray = new FileLabelArray(f.name);
    } else {
        restoreMarkedFile(currentFileLabelArray);
    }

    let rawDataLines = [];
    let rawData = [];

    let reader = new FileReader();
    // Closure to capture the file information.
    reader.onload = (function () {
        return function (e) {
            // File name looks like: SensorData_2018-08-31-11-39-53_TicWatch-E2-0042_Sport_Fast-walking_320_-1.0_3.txt
            let metas = f.name.split('_');
            if (metas[0] === 'SensorData') {
                let subType = metas[4];
                if (activitiesTypesMap.hasOwnProperty(subType)) {
                    guessedType = activitiesTypesMap[subType];
                } else {
                    console.log('其他类别: ' + subType);
                    guessedType = activitiesTypesMap['Other'];
                }
            } else {
                console.log('Not a standard SensorData file?');
                alert('文件不以"SensorData"开头，可能不是标准的数据文件？')
            }
            console.log('guessedType: ' + guessedType);
            let content = e.target.result;
            // document.getElementById('content').innerHTML = '<p>' + replaceAll(content, '\n','<br>') + '</p>';
            rawDataLines = content.split('\n');
            rawData.length = 0;
            let lastTimestamp = 0;
            for (let j = 0, line; line = rawDataLines[j]; j++) {
                let vArr = line.split(',');
                let type = parseInt(vArr[0]);
                let timestamp = parseInt(vArr[1]);
                if (type === 1) {
                    let delta = timestamp - lastTimestamp;
                    if (delta > sampleIntervalMin) {
                        lastTimestamp = timestamp;
                        let x = parseFloat(vArr[2]);
                        let y = parseFloat(vArr[3]);
                        let z = parseFloat(vArr[4]);
                        rawData.push(Math.sqrt(x * x + y * y + z * z) / 9.8);
                    } else {
                        // console.log("Interval is to small: " + delta);
                    }
                }
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

            // Clear label variables
            endPointMax = rawData.length - 1;
        };
    })(f);

    // Read in the image file as a data URL.
    reader.readAsText(f);
}

function showMarkModal(start, end, state) {
    $('#startPoint').val(start);
    $('#endPoint').val(end);
    $('#activityState').val(state);
    $('#markModal').modal('show');
}

function updateAcceptedTime(add, timeMinutes) {
    if (add) {
        console.log('Accepted time add ' + timeMinutes + ' minutes');
        acceptedTimeMinutes += timeMinutes;
    } else {
        console.log('Accepted time minus ' + timeMinutes + ' minutes');
        acceptedTimeMinutes -= timeMinutes;
        if (acceptedTimeMinutes < 0) {
            acceptedTimeMinutes = 0;
        }
    }

    updateAcceptedTimeUI(acceptedTimeMinutes);
}

function updateAcceptedTimeUI(timeMinutes) {
    let hours = Math.round(timeMinutes / 60);
    let minutes = Math.round(timeMinutes % 60);
    console.log('Accepted time: ' + hours + ' hours, ' + minutes + ' minutes, total ' + timeMinutes + ' minutes');

    $('#acceptedTime').text('' + hours + ' 小时 ' + minutes + ' 分钟')
}

function onLabelSubmit() {
    console.log('Submitted');
    let start = parseInt($('#startPoint').val());
    let stop = parseInt($('#endPoint').val());
    let state = parseInt($('#activityState').val());
    console.log('state: ' + state);
    let label = new LinearLabel(start, stop, state);
    currentFileLabelArray.addLabel(label);
    console.log(currentFileLabelArray);

    // Update accepted time
    updateAcceptedTime(true, label.minutes);

    // Add to label result list
    renderLabelToTable(label);
}

function onLabelDelete(btn) {
    let currentCol = $(btn).parent().parent()[0];
    let deleteIdx = $(btn).parent().parent().parent().find('tr').index(currentCol);
    console.log('Delete Index: ' + deleteIdx);
    let r = confirm('确认删除本条标记?');
    if (r === true) {
        // Update accepted time
        let label = currentFileLabelArray.getLabel(deleteIdx);
        console.log(label);
        updateAcceptedTime(false, label.minutes);

        currentFileLabelArray.removeLabel(deleteIdx);
        if (currentFileLabelArray.labelList.size() === 0) {
            markedFlags[markingIndex] = false;
            updateMarkProgressBar();
            filesLabelResults.removeFile(currentFileLabelArray.filename);
            let curItem = $('#fileIdx-' + markingIndex);
            curItem.removeClass('list-group-item-success');
            curItem.toggleClass('list-group-item-info');
        }
        console.log(currentFileLabelArray);
        currentCol.remove();
    }
}

function onLabelCancel() {
    markingChart.xAxis[0].removePlotBand('marked-band');
}

function saveCurrentLabelResult() {
    if (currentFileLabelArray !== null && !filesLabelResults.containsObj(currentFileLabelArray) && currentFileLabelArray.labelList.size() > 0) {
        let r = confirm('本条数据标注非空，是否保存/更新?');
        if (r === true) {
            console.log("Saving");
            markedFlags[markingIndex] = true;
            updateMarkProgressBar();
            let curItem = $('#fileIdx-' + markingIndex);
            curItem.removeClass('list-group-item-info');
            curItem.toggleClass('list-group-item-success');
            filesLabelResults.addFile(currentFileLabelArray, true);
            console.log(filesLabelResults);
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
    if (currentFileLabelArray === null) {
        alert('请先选择文件进行标记再执行此操作！');
        return;
    }
    saveCurrentLabelResult();

    let txt = filesLabelResults.toString();
    console.log(txt);
    $('#labelResultsTxt').text(txt);

    let totalTimeMinutes = filesLabelResults.getTotalTimeMinutes();
    updateAcceptedTimeUI(totalTimeMinutes);
}

function exportData() {
    let content = filesLabelResults.toString();
    if (content.length > 0) {
        let eleLink = document.createElement('a');
        eleLink.download = 'activity-label-result.csv';
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

function onInit() {
    // let i = 0;
    // let options = $('#activityState');
    // for (let key in activitiesTypesMap) {
    //     let option = '<option value="' + i + '">' + key + '</option>';
    //     console.log(option);
    //     options.append(option);
    //     i += 1;
    //     if (i > activitiesTypeValidNum) break;
    // }
}
