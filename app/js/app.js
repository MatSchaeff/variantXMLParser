var stats;
var filters;
var reader;

function submitListener() {
//    $("#fileSubmitted").click(function () {
//        var url = $("#fileUrl").val();
//        var fileName = url.substr(url.lastIndexOf('\\') + 1);
//        console.log(fileName);
//        loadXML('scn1a.xml');
//    })
//    document.getElementById('files').addEventListener('change', handleFileSelect, false);
    $("#fileSubmitted").click(function(){
        $("#formBlock").removeClass("col-md-offset-3");
        var files = document.getElementById('files').files;
        handleFileSelect(files);
    })
}

function initVar(){
    stats = {
        nbVE: 0,
        nbVA: 0,
        nbVP: 0,
        nbTotal: 0,
        nbSevere: 0,
        nbMod: 0,
        nbMild: 0,
        nbNorm: 0,
        nbVPTotal: 0
    }
    filters = {
        uniqueName: true,
        total: true,
        VE: true,
        VA: true,
        VP: true,
        severe: true,
        moderate: true,
        mild: true,
        normal: true
    }
}


function initParser(xml){
    initVar();
    var x2js = new X2JS();
    var pData = x2js.xml_str2json(xml);
    console.log(pData);
    var variants = createVariantHMap(pData.nxprotein.annotations.annotation);
    buildTable(variants);
    var sTable = $("#variantTable").stupidtable();
    linkTableHeaders(sTable);
    var statistics = getStatistics(stats);
    createPieChart("#pieChart", statistics.annotations, "Annotations");
    createPieChart("#pieChart2", statistics.VP, "Phenotype");

    $(".export").on('click', function (event) {
        // CSV
        exportTableToCSV.apply(this, [$('#variantTable'), 'export.csv']);

        // IF CSV, don't do event.preventDefault() or return false
        // We actually need this to be a typical hyperlink
    });
    $('.toggleInit').css('display', 'block');
    $('.toggleInit')
      .delay(1000)
      .queue(function (next) { 
        $(this).css('opacity', '1'); 
        
        next(); 
    });
//    $(".toggleInit").delay(1500).css({'display':'block'});
}

function createVariantHMap(annotations) {
    var hashMap = {};
    var regex = /Intensity:(.*?)\\/;
    annotations.forEach(function (v) {
        if (v._accession.substring(0, 7) === "CAVA-VA" || v._accession.substring(0, 7) === "CAVA-VP" || v._accession.substring(0, 7) === "CAVA-VE") {
            if (!hashMap.hasOwnProperty(v.subject.molecularEntityRef))
                hashMap[v.subject.molecularEntityRef] = {
                    uniqueName: v.subject.molecularEntityRef,
                    total: 1,
                    VA: 0,
                    VP: 0,
                    VE: 0,
                    severe: 0,
                    moderate: 0,
                    mild: 0,
                    normal: 0
                };

            stats.nbTotal += 1;
            hashMap[v.subject.molecularEntityRef].total += 1;

            if (v._accession.substring(0, 7) === "CAVA-VP") {
                hashMap[v.subject.molecularEntityRef].VP += 1;

                var evidence = v.evidence.length ? v.evidence : [v.evidence];
                evidence.forEach(function (e) {
                    var ev = e.experimentalDetails;
                    var matched = regex.exec(ev);
                    var level = matched ? matched[1].replace(/\W/g, "").toLowerCase() : null;
                    console.log("||||" + level + "|||||");
                    switch (level) {
                    case "severe":
                        hashMap[v.subject.molecularEntityRef].severe += 1;
                        stats.nbSevere += 1;
                        break;
                    case "moderate":
                        hashMap[v.subject.molecularEntityRef].moderate += 1;
                        stats.nbMod += 1;
                        break;
                    case "mild":
                        hashMap[v.subject.molecularEntityRef].mild += 1;
                        stats.nbMild += 1;
                        break;
                    case "":
                        hashMap[v.subject.molecularEntityRef].normal += 1;
                        stats.nbNorm += 1;
                        break;
                    case null:
                        break;
                    default:
                        console.log("error, could find this level");
                        break;
                    }
                    console.log(level);
                });
                stats.nbVP += 1;
            } else if (v._accession.substring(0, 7) === "CAVA-VA") {
                hashMap[v.subject.molecularEntityRef].VA += 1;
                stats.nbVA += 1;
            } else {
                hashMap[v.subject.molecularEntityRef].VE += 1;
                stats.nbVE += 1;
            }

            //            if (hashMap[v.subject.molecularEntityRef].total > 6) console.log(hashMap[v.subject.molecularEntityRef]);
        }
        //        else console.log(v._accession);
    })
    console.log(hashMap);
    stats.nbVPTotal = stats.nbSevere + stats.nbMod + stats.nbMild + stats.nbNorm;
    return hashMap;
}

function linkTableHeaders($table) {
    var initSort = $table.find("thead th").eq(1);
    initSort.stupidsort();
    $("#staticHead th").click(function () {
        var index = $(this).index();
        console.log(index);
        var $th_to_sort = $table.find("thead th").eq(index);
        $th_to_sort.stupidsort();
    });
}

function buildTable(data) {
    var template = "";
    for (var v in data) {
        template += "<tr>";
        if (filters.uniqueName) template += "<td class=\"col-xs-4\">" + data[v].uniqueName + "</td>";
        if (filters.total) template += "<td class=\"col-xs-1\">" + data[v].total + "</td>";
        if (filters.VE) template += "<td class=\"col-xs-1\">" + data[v].VE + "</td>";
        if (filters.VA) template += "<td class=\"col-xs-1\">" + data[v].VA + "</td>";
        if (filters.VP) template += "<td class=\"col-xs-1\">" + data[v].VP + "</td>";
        if (filters.severe) template += "<td class=\"col-xs-1\">" + data[v].severe + "</td>";
        if (filters.moderate) template += "<td class=\"col-xs-1\">" + data[v].moderate + "</td>";
        if (filters.mild) template += "<td class=\"col-xs-1\">" + data[v].mild + "</td>";
        if (filters.normal) template += "<td class=\"col-xs-1\">" + data[v].normal + "</td></tr>";
    }
    $("#tableBody").html(template);
}

function getStatistics(stats) {
    var statistics = {
        annotations: [
            {
                name: "VE",
                y: stats.nbVE,
                perc: (((stats.nbVE / stats.total).toFixed(2)) * 100)
            },
            {
                name: "VP",
                y: stats.nbVP,
                perc: (((stats.nbVP / stats.total).toFixed(2)) * 100)
            },
            {
                name: "VA",
                y: stats.nbVA,
                perc: (((stats.nbVA / stats.total).toFixed(2)) * 100)
            }
        ],
        VP: [
            {
                name: "Severe",
                y: stats.nbSevere,
                perc: (((stats.nbSevere / stats.nbPVtotal).toFixed(2)) * 100)
            },
            {
                name: "Moderate",
                y: stats.nbMod,
                perc: (((stats.nbMod / stats.nbPVtotal).toFixed(2)) * 100)
            },
            {
                name: "Mild",
                y: stats.nbMild,
                perc: (((stats.nbMild / stats.nbPVtotal).toFixed(2)) * 100)
            },
            {
                name: "Normal",
                y: stats.nbNorm,
                perc: (((stats.nbNorm / stats.nbPVtotal).toFixed(2)) * 100)
            }
        ]
    }
    return statistics;
}

function createPieChart(id, data, title) {

    var colorList = ["#35EA7F", "#055124", "#149E4C", "#510500", "#9E1D14"];

    Highcharts.setOptions({
        colors: colorList
    });
    // Radialize the colors
    console.log(Highcharts.getOptions().colors);
    Highcharts.getOptions().colors = Highcharts.map(Highcharts.getOptions().colors, function (color) {
        return {
            radialGradient: {
                cx: 0.5,
                cy: 0.3,
                r: 0.7
            },
            stops: [
                [0, color],
                [1, Highcharts.Color(color).brighten(-0.3).get('rgb')] // darken
            ]
        };
    });

    // Build the chart
    $(id).highcharts({
        chart: {
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            type: 'pie'
        },
        title: {
            text: title
        },
        tooltip: {
            pointFormat: 'count: <b>{point.y}</b><br>Percentage : <b>{point.percentage:.1f}%</b>'
        },
        credits: {
            enabled: false
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: 'pointer'
            }
        },
        series: [{
            name: title,
            data: data
        }]
    });
}

function loadXML(fileName) {
    var file = fileName;
    console.log(file);
    $.ajax({
        url: file,
        dataType: 'text',
        error: function () {
            alert('Error loading XML document');
        },
        success: function (xml) {
            // do something with xml
            var x2js = new X2JS();
            var pData = x2js.xml_str2json(xml);
            console.log(pData);
            var variants = createVariantHMap(pData.nxprotein.annotations.annotation);
            buildTable(variants);
            var sTable = $("#variantTable").stupidtable();
            linkTableHeaders(sTable);
            var statistics = getStatistics(stats);
            createPieChart("#pieChart", statistics.annotations, "Annotations");
            createPieChart("#pieChart2", statistics.VP, "Phenotype");

            $(".export").on('click', function (event) {
                // CSV
                exportTableToCSV.apply(this, [$('#variantTable'), 'export.csv']);

                // IF CSV, don't do event.preventDefault() or return false
                // We actually need this to be a typical hyperlink
            });
        }
    });
}

function exportTableToCSV($table, filename) {

    var $rows = $table.find('tr:has(td),tr:has(th)'),

        // Temporary delimiter characters unlikely to be typed by keyboard
        // This is to avoid accidentally splitting the actual contents
        tmpColDelim = String.fromCharCode(11), // vertical tab character
        tmpRowDelim = String.fromCharCode(0), // null character

        // actual delimiter characters for CSV format
        colDelim = '","',
        rowDelim = '"\r\n"',

        // Grab text from table into CSV formatted string
        csv = '"' + $rows.map(function (i, row) {
            var $row = $(row),
                $cols = $row.find('td,th');

            return $cols.map(function (j, col) {
                var $col = $(col),
                    text = $col.text();

                return text.replace(/"/g, '""'); // escape double quotes

            }).get().join(tmpColDelim);

        }).get().join(tmpRowDelim)
        .split(tmpRowDelim).join(rowDelim)
        .split(tmpColDelim).join(colDelim) + '"',

        // Data URI
        csvData = 'data:application/csv;charset=utf-8,' + encodeURIComponent(csv);



    $(this)
        .attr({
            'download': filename,
            'href': csvData,
            'target': '_blank'
        });
}

//var progress = document.querySelector('.percent');

//function abortRead() {
//    reader.abort();
//}

function errorHandler(evt) {
    switch (evt.target.error.code) {
    case evt.target.error.NOT_FOUND_ERR:
        alert('File Not Found!');
        break;
    case evt.target.error.NOT_READABLE_ERR:
        alert('File is not readable');
        break;
    case evt.target.error.ABORT_ERR:
        break; // noop
    default:
        alert('An error occurred reading this file.');
    };
}

//function updateProgress(evt) {
//    // evt is an ProgressEvent.
//    if (evt.lengthComputable) {
//        var percentLoaded = Math.round((evt.loaded / evt.total) * 100);
//        // Increase the progress bar length.
//        if (percentLoaded < 100) {
//            progress.style.width = percentLoaded + '%';
//            progress.textContent = percentLoaded + '%';
//        }
//    }
//}

function handleFileSelect(files) {
    // Reset progress indicator on new file selection.
    //    progress.style.width = '0%';
    //    progress.textContent = '0%';
//        console.log(evt);
//        var files = evt.target.files; // FileList object
//        console.log(files);
    console.log(files);

        // files is a FileList of File objects. List some properties.
        var output = [];
        output.push('<img src="img/success2.png" alt="success"><p><strong>', escape(files[0].name), '</strong> (', files[0].type || 'n/a', ') - ',
            files[0].size, ' bytes, last modified: ',
            files[0].lastModifiedDate ? files[0].lastModifiedDate.toLocaleDateString() : 'n/a',
            '</p>');
        document.getElementById('list').innerHTML = output.join('');
        $("#list").delay(1000).show('fast');


    reader = new FileReader();
//    reader.onerror = errorHandler;
    //    reader.onprogress = updateProgress;
    reader.onabort = function (e) {
        alert('File read cancelled');
    };
//    reader.onloadstart = function (e) {
//        document.getElementById('progress_bar').className = 'loading';
//    };
    reader.onload = function (e) {
        // Ensure that the progress bar displays 100% at the end.
//        progress.style.width = '100%';
//        progress.textContent = '100%';
        
//        setTimeout("document.getElementById('progress_bar').className='';", 4000);
        
        setTimeout("document.getElementById('loadSuccessful').className = 'successLoad';", 2000);
    }
    reader.onloadend = function (evt) {
        if (evt.target.readyState == FileReader.DONE) { // DONE == 2
            var xmlPlainText = evt.target.result;
            initParser(xmlPlainText);
        }
            
        // Ensure that the progress bar displays 100% at the end.
//        progress.style.width = '100%';
//        progress.textContent = '100%';
        
//        setTimeout("document.getElementById('progress_bar').className='';", 4000);
        
        setTimeout("document.getElementById('loadSuccessful').className = 'successLoad';", 2000);
    }

    // Read in the image file as a binary string.
    reader.readAsText(files[0]);
}

//document.getElementById('files').addEventListener('change', handleFileSelect, false);


submitListener();