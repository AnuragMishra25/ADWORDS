// import { setTimeout } from "timers";

// Client ID and API key from the Developer Console
var CLIENT_ID = '227099130215-7qvb0jucjrcmtepvctrn01ur4j6h0qdm.apps.googleusercontent.com';
var API_KEY = 'AIzaSyD1mLRMBKLdWnU5ZPcBwQfqCB-dfOr6_5Q';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

var exactKeywords = [];// array of rows of exact excel rows
var phraseKeywords = [];// array of rows of phrase excel rows
var broadKeywords = [];//// array of rows of broad excel rows
var broadModifiedKeywords = [];// array of rows of broad modifier excel rows
var resultBhash = {};//hash of result to be appended for broad keywords
var resultPhash = {};//hash of result to be appended for phrase keywords
var resultEhash = {};//hash of result to be appended for exact keywords
var inputRows = [];
var pBroad = 0;
var pPhrase = 0;
var exhaustHash = {};//exhaust hash which has everything

/**
 *  On load, called to load the auth2 library and API client library.
 */
function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

/**
 *  Initializes the API client library and sets up sign-in state
 *  listeners.
 */
function initClient() {
    gapi.client.init({
        apiKey: API_KEY,
        clientId: CLIENT_ID,
        discoveryDocs: DISCOVERY_DOCS,
        scope: SCOPES
    }).then(function () {
        // Listen for sign-in state changes.
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);

        // Handle the initial sign-in state.
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        authorizeButton.onclick = handleAuthClick;
        signoutButton.onclick = handleSignoutClick;
    });
}

/**
 *  Called when the signed in status changes, to update the UI
 *  appropriately. After a sign-in, the API is called.
 */
function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        authorizeButton.style.display = 'none';
        signoutButton.style.display = 'block';
        listMajors();
    } else {
        authorizeButton.style.display = 'block';
        signoutButton.style.display = 'none';
    }
}

/**
 *  Sign in the user upon button click.
 */
function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

/**
 *  Sign out the user upon button click.
 */
function handleSignoutClick(event) {
    gapi.auth2.getAuthInstance().signOut();
}

/**
 * Append a pre element to the body containing the given message
 * as its text node. Used to display the results of the API call.
 *
 * @param {string} message Text to be placed in pre element.
 */
function appendPre(message) {
    var pre = document.getElementById('content');
    var textContent = document.createTextNode(message + '\n');
    pre.appendChild(textContent);
}

function createInputRow(counter, keyword, type) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td><input type="text" class="form-control" name="rowNumber' + counter + '" value="' + counter + '"/></td>';
    cols += '<td><input type="text" class="form-control" name="keyword' + counter + '" value="' + keyword + '"/></td>';
    cols += '<td><input type="text" class="form-control" name="type' + counter + '" value="' + type + '"/></td>';

    newRow.append(cols);
    $("#inputTable").append(newRow);
}

function createNewOutputRow(rowNumber, keyword, type, duplicate, rows) {
    var newRow = $("<tr>");
    var cols = "";
    cols += '<td><input type="text" class="form-control" name="rowNumber' + rowNumber + '" value="' + rowNumber + '"/></td>';
    cols += '<td><input type="text" class="form-control" name="keyword' + rowNumber + '" value="' + keyword + '"/></td>';
    cols += '<td><input type="text" class="form-control" name="type' + rowNumber + '" value="' + type + '"/></td>';
    cols += '<td><input type="text" class="form-control" name="duplicate' + rowNumber + '" value="' + duplicate + '"/></td>';
    cols += '<td><input type="text" class="form-control" name="rows' + rowNumber + '" value="' + rows + '"/></td>';

    newRow.append(cols);
    $("#myTable").append(newRow);
}

//*************************************************************************************
//*********************************              **************************************
//*********************************BUSINESS LOGIC**************************************
//*********************************              **************************************
//*************************************************************************************

/**
 * Print the names and majors of students in a sample spreadsheet:
 * https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit
 */
function listMajors() {
    console.log('WAITING FOR EXCEL SHEET TO GIVE DATA');
    console.time('FETCH_EXCEL');
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1Z0yKBhU9DU1mN6Gl9XoAlGmvy35HzBzvR_rDIDeZVgs',
        // range: 'Sheet4!A1:N',
        range: 'Sheet7!A1:E',
    }).then(function (response) {
        console.timeEnd('FETCH_EXCEL');
        console.log('EXCEL SHEET TO DATA RECIEVED');
        var range = response.result;
        if (range.values.length > 0) {
            appendPre('Name, Major:');
            for (i = 0; i < range.values.length; i++) {
                var row = range.values[i];
                appendPre(row[2] + '      ' + row[3]);
                row.push({ 'rowNumber': i + 1 });
                inputRows.push(row);
                // createInputRow(i + 1, row[2], row[3]);
                createKeywords(row);
            }
            console.log("COMPLETING CREATING KEYWORDS");
            startProcess();

        } else {
            appendPre('No data found.');
        }
    }, function (response) {
        appendPre('Error: ' + response.result.error.message);
    });
}

function startProcess() {
    matchAllkind();
    console.log("COMPLETING BROAD KEYWORDS EXHAUST");
    console.log("COMPLETING PHRASE KEYWORDS EXHAUST");
    console.log("RESULT POPULATED");
}

function createKeywords(row) {
    if (row[3] == "Broad") {
        broadKeywords.push(row);
    } else if (row[3] == "Phrase") {
        phraseKeywords.push(row);
    } else if (row[3] == 'Exact') {
        exactKeywords.push(row);
    }
}


function dummyUpdate(start, count) {
    var values = outputExcelRows(start, count);
    var body = {
        values: values
    };

    gapi.client.sheets.spreadsheets.values.batchUpdate({
        spreadsheetId: '1Z0yKBhU9DU1mN6Gl9XoAlGmvy35HzBzvR_rDIDeZVgs',
        range: 'Sheet9!A1:G',
        valueInputOption: "RAW",
        resource: body
    }).then((response) => {
        setTimeout(function () {
            dummyUpdate(count, count + 500);
        }, 1000);
        var result = response.result;
        console.log(`${result.updates.updatedCells} cells appended.`)
    });
}

function createFileAtBackend(start, end){
    let dat= outputExcelRows(start, end);
    $.ajax({
        url: "/excel",
        type: 'POST',
        contentType: 'application/json',
        data: JSON.stringify({start: start, end: end, data: dat}),
        success: function(result){
            // $("#div1").html(result);
            console.log('SAVED');
            createFileAtBackend(end,end+100 );
        }
    });
}

function createExcelInBrower() {
    var data = outputExcelRows(0, 5000);
    var blob = new Blob(
        [[s2ab(atob(data.toString()))]],
        { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64," }
    );

    // Programatically create a link and click it:
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = fileName;
    a.click();
}

function outputExcelRows(start, count) {
    var finalResult = [];
    for (var i = start; (i < inputRows.length) && (i < count); i++) {
        let arr = [];
        arr.push(inputRows[i][inputRows[i].length - 1].rowNumber);//Row Number
        arr.push(inputRows[i][0]);//Campaign
        arr.push(inputRows[i][1]);//Adgroup
        arr.push(inputRows[i][2]);//Keyword
        arr.push(inputRows[i][3]);//Type
        // arr.push(inputRows[i][0]);//Duplicate

        var duplicate = 'NO';
        var type = inputRows[i][3];
        var result = [];
        if (type == 'Phrase') {
            result = removeDuplicatesIndexes(resultPhash[inputRows[i][2]]);
        } else if (type == 'Exact') {
            result = removeDuplicatesIndexes(resultEhash[inputRows[i][2]]);
        } else {
            result = removeDuplicatesIndexes(resultBhash[inputRows[i][2]]);
        }
        if (result != undefined) {
            if (result.length > 1) {
                duplicate = 'YES';
                arr.push('YES');
            }
            var index = result.indexOf(i + 1);
            if (index > -1) {
                result.splice(index, 1);
            }
            result.sort(function (a, b) { return a - b });
            arr.push(result.toString());
        } else {
            arr.push('DONT KNOW');
            arr.push('');
        }
        finalResult.push(arr);
    }
    return finalResult;
}

function populateOutputTable() {
    //Adding default row for headers
    createNewOutputRow('1', 'Keyword', 'Type', 'Duplicate', '');

    for (var i = 1; i < inputRows.length; i++) {
        var duplicate = 'NO';
        var type = inputRows[i][3];
        var result = [];
        if (type == 'Phrase') {
            result = removeDuplicatesIndexes(resultPhash[inputRows[i][2]]);
        } else if (type == 'Exact') {
            result = removeDuplicatesIndexes(resultEhash[inputRows[i][2]]);
        } else {
            result = removeDuplicatesIndexes(resultBhash[inputRows[i][2]]);
        }
        if (result != undefined) {
            if (result.length > 1) {
                duplicate = 'YES';
            }
            var index = result.indexOf(i + 1);
            if (index > -1) {
                result.splice(index, 1);
            }
            result.sort(function (a, b) { return a - b });
            createNewOutputRow(i + 1, inputRows[i][2], type, duplicate, result);
        } else {
            createNewOutputRow(i + 1, inputRows[i][2], type, "DONT KNOW", '');
        }
    }
}

function removeDuplicatesIndexes(names) {
    var uniqueNames = [];
    $.each(names, function (i, el) {
        if ($.inArray(el, uniqueNames) === -1) uniqueNames.push(el);
    });
    return uniqueNames;
}

function populateExactBroadCombo(i, j) {
    if (resultEhash[inputRows[i][2]] == undefined) {
        resultEhash[inputRows[i][2]] = [];
    }
    resultEhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultBhash[inputRows[j][2]] == undefined) {
        resultBhash[inputRows[j][2]] = [];
    }
    resultBhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populateExactPhraseCombo(i, j) {
    if (resultEhash[inputRows[i][2]] == undefined) {
        resultEhash[inputRows[i][2]] = [];
    }
    resultEhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultPhash[inputRows[j][2]] == undefined) {
        resultPhash[inputRows[j][2]] = [];
    }
    resultPhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populateExactExactCombo(i, j) {
    if (resultEhash[inputRows[i][2]] == undefined) {
        resultEhash[inputRows[i][2]] = [];
    }
    resultEhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultEhash[inputRows[j][2]] == undefined) {
        resultEhash[inputRows[j][2]] = [];
    }
    resultEhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populatePhraseBroadCombo(i, j) {
    if (resultPhash[inputRows[i][2]] == undefined) {
        resultPhash[inputRows[i][2]] = [];
    }
    resultPhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultBhash[inputRows[j][2]] == undefined) {
        resultBhash[inputRows[j][2]] = [];
    }
    resultBhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populatePhrasePhraseCombo(i, j) {
    if (resultPhash[inputRows[i][2]] == undefined) {
        resultPhash[inputRows[i][2]] = [];
    }
    resultPhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultPhash[inputRows[j][2]] == undefined) {
        resultPhash[inputRows[j][2]] = [];
    }
    resultPhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populatePhraseExactCombo(i, j) {
    if (resultPhash[inputRows[i][2]] == undefined) {
        resultPhash[inputRows[i][2]] = [];
    }
    resultPhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultEhash[inputRows[j][2]] == undefined) {
        resultEhash[inputRows[j][2]] = [];
    }
    resultEhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populateBroadBroadCombo(i, j) {
    if (resultBhash[inputRows[i][2]] == undefined) {
        resultBhash[inputRows[i][2]] = [];
    }
    resultBhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultBhash[inputRows[j][2]] == undefined) {
        resultBhash[inputRows[j][2]] = [];
    }
    resultBhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populateBroadPhraseCombo(i, j) {
    if (resultBhash[inputRows[i][2]] == undefined) {
        resultBhash[inputRows[i][2]] = [];
    }

    resultBhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultPhash[inputRows[j][2]] == undefined) {
        resultPhash[inputRows[j][2]] = [];
    }
    resultPhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function populateBroadExactCombo(i, j) {
    if (resultBhash[inputRows[i][2]] == undefined) {
        resultBhash[inputRows[i][2]] = [];
    }
    resultBhash[inputRows[i][2]].push(inputRows[j][inputRows[j].length - 1].rowNumber);

    if (resultEhash[inputRows[j][2]] == undefined) {
        resultEhash[inputRows[j][2]] = [];
    }
    resultEhash[inputRows[j][2]].push(inputRows[i][inputRows[i].length - 1].rowNumber);
}

function matchAllkind() {
    for (var i = 1; i < inputRows.length; i++) {
        // console.log("hi");
        if (inputRows[i][3] == 'Exact') {
            for (var j = i + 1; j < inputRows.length; j++) {
                if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') == -1) {//CASE 1: EXACT -> BROAD

                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) != -1) {
                            populateExactBroadCombo(i, j);
                            break;
                        }
                    }
                } else if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') != -1) {//CASE 2: EXACT -> BROAD MODIFIER
                    iWords = inputRows[i][2].split(' ');
                    jWords = inputRows[j][2].split(' ');
                    let jPlus = [];
                    let flag = true;
                    for (var k = 0; k < jWords.length; k++) {
                        if (jWords[k].indexOf('+') != -1) {//all plus words
                            if (iWords.indexOf(jWords[k]) == -1) {
                                flag = false;
                                break;
                            }
                        }
                    }
                    if (flag) {
                        populateExactBroadCombo(i, j);
                    }
                } else if (inputRows[j][3] == 'Phrase') {//CASE 3: EXACT -> PHRASE
                    if (inputRows[i][2].indexOf(inputRows[j][2]) != -1) {
                        populateExactPhraseCombo(i, j);
                    }
                } else if (inputRows[j][3] == 'Exact') {//CASE 4: EXACT -> EXACT
                    if (inputRows[i][2] == inputRows[j][2] && i != j) {
                        populateExactExactCombo(i, j);
                    }
                }
            }
        } else if (inputRows[i][3] == 'Phrase') {
            for (var j = i + 1; j < inputRows.length; j++) {
                if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') == -1) {//CASE 5: PHRASE -> BROAD COMDO
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) != -1) {
                            populatePhraseBroadCombo(i, j);
                            break;
                        }
                    }
                } else if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') != -1) {// CASE 6: PHRASE -> BROAD MODIFIER
                    // TO BE COMPLETED
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    var flagJ = true;
                    var flagI = true;
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) == -1) {
                            flagJ = false;
                            break;
                        }
                    }
                    for (var k = 0; k < jWords.length; k++) {
                        if (iWords.indexOf(jWords[k]) == -1) {
                            flagI = false;
                            break;
                        }
                    }
                    if (flagI || flagJ) {
                        populatePhraseBroadCombo(i, j);
                    }
                } else if (inputRows[j][3] == 'Phrase') {//CASE 7: PHRASE -> PHRASE COMBO
                    if (inputRows[i][2].indexOf(inputRows[j][2]) != -1 || inputRows[j][2].indexOf(inputRows[i][2]) != -1) {
                        populatePhrasePhraseCombo(i, j);
                    }
                } else if (inputRows[j][3] == 'Exact') {//CASE 8: PHRASE -> EXACT COMBO
                    if (inputRows[j][2].indexOf(inputRows[j][2]) != -1) {
                        populatePhraseExactCombo(i, j);
                    }
                }
            }
        } else if (inputRows[i][3] == 'Broad' && inputRows[i][2].indexOf('+') == -1) {
            for (var j = i + 1; j < inputRows.length; j++) {
                if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') == -1) {// CASE 9: BROAD -> BROAD
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) != -1) {
                            populateBroadBroadCombo(i, j);
                            break;
                        }
                    }
                } else if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') != -1) {//CASE 10: BROAD->BROAD MODIFIER
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) != -1) {
                            populateBroadBroadCombo(i, j);
                            break;
                        }
                    }
                } else if (inputRows[j][3] == 'Phrase') {//CASE 11: BROAD -> PHRASE
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) != -1) {
                            populateBroadPhraseCombo(i, j);
                            break;
                        }
                    }
                } else if (inputRows[j][3] == 'Exact') {//CASE 12: BROAD-> EXACT
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) != -1) {
                            populateBroadExactCombo(i, j);
                            break;
                        }
                    }
                }
            }
        } else if (inputRows[i][3] == 'Broad' && inputRows[i][2].indexOf('+') != -1) {
            for (var j = i + 1; j < inputRows.length; j++) {
                if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') == -1) {// CASE 13: BROAD MODIFIER -> BROAD
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) != -1) {
                            populateBroadBroadCombo(i, j);
                            break;
                        }
                    }
                } else if (inputRows[j][3] == 'Broad' && inputRows[j][2].indexOf('+') != -1) {//CASE 14: BROAD MODIFIER -> BROAD MODIFIER
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    var flagI = true;
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) == -1) {
                            flagI = false;
                            break;
                        }
                    }
                    var flagJ = true;
                    for (var k = 0; k < jWords.length; k++) {
                        if (iWords.indexOf(jWords[k]) == -1) {
                            flagJ = false;
                            break;
                        }
                    }
                    if (flagI || flagJ) {
                        populateBroadBroadCombo(i, j);
                    }

                } else if (inputRows[j][3] == 'Phrase') {//CASE 15: BROAD MODIFIER -> PHRASE
                    var iWords = inputRows[i][2].split(' ');
                    var jWords = inputRows[j][2].split(' ');
                    var flagJ = true;
                    var flagI = true;
                    for (var k = 0; k < iWords.length; k++) {
                        if (jWords.indexOf(iWords[k]) == -1) {
                            flagJ = false;
                            break;
                        }
                    }
                    for (var k = 0; k < jWords.length; k++) {
                        if (iWords.indexOf(jWords[k]) == -1) {
                            flagI = false;
                            break;
                        }
                    }
                    if (flagI || flagJ) {
                        populateBroadPhraseCombo(i, j);
                    }
                } else if (inputRows[j][3] == 'Exact') {
                    iWords = inputRows[i][2].split(' ');
                    jWords = inputRows[j][2].split(' ');
                    let iPlus = [];
                    let flag = true;
                    for (var k = 0; k < iWords.length; k++) {
                        if (iWords[k].indexOf('+') != -1) {//all plus words
                            if (jWords.indexOf(iWords[k]) == -1) {
                                flag = false;
                                break;
                            }
                        }
                    }
                    if (flag) {
                        populateBroadExactCombo(i, j);
                    }
                }
            }
        }
    }
}





// curl -G \
// -d "fields=delivery" \
// -d "access_token=<ACCESS_TOKEN>" \
// "https://graph.facebook.com/<API_VERSION>/<AD_OBJECT_ID>/insights"




// curl -G \
// -d "fields=delivery" \
// -d "access_token=353083125113970|lsBQMqxy-tjPCfUw9yZr6TIcZtA" \
// "https://graph.facebook.com/v2.7/117698568611235/insights"

// curl -G \
// -d "level=ad" \
// -d "fields=impressions,ad_id" \
// -d "access_token=353083125113970|lsBQMqxy-tjPCfUw9yZr6TIcZtA" \
// "https://graph.facebook.com/v2.11/6057628706482/insights"

// curl -G \
// -d "level=ad" \
// -d "filtering=[{'field':'ad.effective_status','operator':'IN','value':['ARCHIVED']}]" \
// -d "access_token=353083125113970|lsBQMqxy-tjPCfUw9yZr6TIcZtA" \
// "https://graph.facebook.com/v2.11/act_117698568611235/insights/"


// curl -G \
// -d "fields=name,campaign_status" \
// -d "access_token=353083125113970|lsBQMqxy-tjPCfUw9yZr6TIcZtA" \
// "https://graph.facebook.com/v2.11/6057628706482/adcampaigns"


// Anurags-MBP:WORK anuragmishra$ curl -G \
// > -d "fields=name,campaign_status" \
// > -d "access_token=353083125113970|lsBQMqxy-tjPCfUw9yZr6TIcZtA" \
// > "https://graph.facebook.com/v2.11/6057628706482/adcampaigns"


// {"error":{"message":"(#200) Cannot access an object not managed by the business owning this app.","type":"OAuthException","code":200,"fbtrace_id":"GYfXrpH0eAf"}}Anurags-MBP:WORK anuragmishra$