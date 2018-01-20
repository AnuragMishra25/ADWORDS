// Client ID and API key from the Developer Console
var CLIENT_ID = '227099130215-7qvb0jucjrcmtepvctrn01ur4j6h0qdm.apps.googleusercontent.com';
var API_KEY = 'AIzaSyD1mLRMBKLdWnU5ZPcBwQfqCB-dfOr6_5Q';

// Array of API discovery doc URLs for APIs used by the quickstart
var DISCOVERY_DOCS = ["https://sheets.googleapis.com/$discovery/rest?version=v4"];

// Authorization scopes required by the API; multiple scopes can be
// included, separated by spaces.
var SCOPES = "https://www.googleapis.com/auth/spreadsheets.readonly";

var authorizeButton = document.getElementById('authorize-button');
var signoutButton = document.getElementById('signout-button');

var exactKeywords = [];// array of rows of exact excel rows
var phraseKeywords = [];// array of rows of phrase excel rows
var broadKeywords = [];//// array of rows of broad excel rows
var resultBhash = {};//hash of result to be appended for broad keywords
var resultPhash = {};//hash of result to be appended for phrase keywords
var resultEhash = {};//hash of result to be appended for exact keywords
var inputRows = [];

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
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1Z0yKBhU9DU1mN6Gl9XoAlGmvy35HzBzvR_rDIDeZVgs',
        range: 'Sheet4!A1:N',
    }).then(function (response) {
        console.log('EXCEL SHEET TO DATA RECIEVED');
        var range = response.result;
        if (range.values.length > 0) {
            appendPre('Name, Major:');
            for (i = 0; i < range.values.length; i++) {
                var row = range.values[i];
                appendPre(row[2] + '      ' + row[3]);
                row.push({ 'rowNumber': i + 1 });
                inputRows.push(row);
                createInputRow(i + 1, row[2], row[3]);
                createKeywords(row);
            }
            console.log("COMPLETING CREATING KEYWORDS");
            deepAnalyseBroad();
            console.log("COMPLETING BROAD KEYWORDS EXHAUST");
            deepAnalysePhrase();
            console.log("COMPLETING PHRASE KEYWORDS EXHAUST");
            deepAnalyseExact();
            console.log("COMPLETING EXACT KEYWORDS EXHAUST");
            populateOutputTable();
            console.log("RESULT POPULATED");
        } else {
            appendPre('No data found.');
        }
    }, function (response) {
        appendPre('Error: ' + response.result.error.message);
    });
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

function deepAnalyseBroad() {
    for (let i = 0; i < broadKeywords.length; i++) {//iterating all broad keywords one by one
        let words = broadKeywords[i][2].split(' ');//finding individual words in broad
        var resultArr = [];
        for (let j = 0; j < words.length; j++) {//itetrating for each individual word 
            var arr = [];
            if (exhaustHash[words[j]] == undefined) {//if exhaustHash does not alredy contain the word,only then go inside
                arr = iterateForKeyword(words[j]);//iterate this keyword within all input rows, can be optimized, but first lets start working
                exhaustHash[words[j]] = arr;//assigning value to this hash, for future reference
            } else {
                arr = exhaustHash[words[j]];
            }
            for (let k = 0; k < arr.length; k++) {//Adding this result to final result array for this broad keyword
                if (resultArr.indexOf(arr[k]) == -1) {
                    resultArr.push(arr[k]);
                }
            }
        }
        //Assiging result of broad keyword in Bhash
        resultBhash[broadKeywords[i][2]] = resultArr;
    }
}

function iterateForKeyword(keyword) {
    var result = [];
    for (var i = 0; i < inputRows.length; i++) {
        let words = inputRows[i][2].split(' ');
        if (words.indexOf(keyword) != -1) {
            result.push(inputRows[i][inputRows[i].length - 1].rowNumber);
        }
    }
    return result;
}

function deepAnalysePhrase() {
    for (let i = 0; i < phraseKeywords.length; i++) {//iterate through each keyword present in phraseKeywords list
        let words = phraseKeywords[i][2].split(' ');//split each keyword into words
        var resultArr = [];
        var result = [];
        for (let j = 0; j < words.length; j++) {
            if (exhaustHash[words[j]] == undefined) {//if exhaustHash does not contain the word, dont bother going inside
                continue;//continue to find out next word
            } else {
                resultArr = exhaustHash[words[j]];
                for (var k = 0; k < resultArr.length; k++) {
                    if (inputRows[resultArr[k] - 1][2] == words[j]) {
                        var row = inputRows[resultArr[k] - 1];
                        if (result.indexOf(row[row.length - 1].rowNumber) == -1)
                            result.push(row[row.length - 1].rowNumber);
                    }
                }
            }
        }
        if (resultArr.length > 0) {
            for (var k = 0; k < resultArr.length; k++) {
                if (inputRows[resultArr[k] - 1][2].indexOf(phraseKeywords[i][2]) != -1) {
                    var row = inputRows[resultArr[k] - 1];
                    if (result.indexOf(row[row.length - 1].rowNumber) == -1)
                        result.push(row[row.length - 1].rowNumber);
                }
            }
        } else {
            for (var l = 0; l < inputRows.length; i++) {
                if (inputRows[l][3] == "Exact" || inputRows[l][3] == "Phrase") {
                    if (inputRows[l][2].indexOf(phraseKeywords[i][2]) != -1) {
                        var row = inputRows[l];
                        if (result.indexOf(row[row.length - 1].rowNumber) == -1)
                            result.push(row[row.length - 1].rowNumber);
                    }
                }
            }
        }

        resultPhash[phraseKeywords[i][2]] = result;
    }
}

function deepAnalyseExact() {
    for (var i = 0; i < exactKeywords.length; i++) {
        let words = exactKeywords[i][2].split(' ');
        var resultArr = [];
        var result = [];
        for (let j = 0; j < words.length; j++) {
            if (exhaustHash[words[j]] == undefined) {//if exhaustHash does not contain the word, dont bother going inside
                continue;//continue to find out next word
            } else {
                resultArr = exhaustHash[words[j]];
                for (var k = 0; k < resultArr.length; k++) {
                    if (inputRows[resultArr[k] - 1][2] == words[j]) {
                        var row = inputRows[resultArr[k] - 1];
                        if (result.indexOf(row[row.length - 1].rowNumber) == -1)
                            result.push(row[row.length - 1].rowNumber);
                    }
                }
            }
        }
        if (resultArr.length > 0) {
            for (var k = 0; k < resultArr.length; k++) {
                if (inputRows[resultArr[k] - 1][3] == 'Broad') {
                    var row = inputRows[resultArr[k] - 1];
                    if (result.indexOf(row[row.length - 1].rowNumber) == -1)
                        result.push(row[row.length - 1].rowNumber);
                } else if (inputRows[resultArr[k] - 1][3] == 'Phrase') {
                    if (exactKeywords[i][2].indexOf(inputRows[resultArr[k] - 1][2]) != -1) {
                        var row = inputRows[resultArr[k] - 1];
                        if (result.indexOf(row[row.length - 1].rowNumber) == -1)
                            result.push(row[row.length - 1].rowNumber);
                    }
                }
            }
        } else {
            for (var l = 0; l < inputRows.length; i++) {
                if (inputRows[l][3] == "Exact") {
                    if (inputRows[l][2] == exactKeywords[i][2]) {
                        var row = inputRows[l];
                        if (result.indexOf(row[row.length - 1].rowNumber) == -1)
                            result.push(row[row.length - 1].rowNumber);
                    }
                }
            }
        }
        resultEhash[exactKeywords[i][2]] = result;
    }
}

function populateOutputTable() {
    createNewOutputRow('1', 'Keyword', 'Type', 'Duplicate', '');
    for (var i = 1; i < inputRows.length; i++) {
        var duplicate = 'NO';
        var type = inputRows[i][3];
        var result = [];
        if (type == 'Phrase') {
            result = resultPhash[inputRows[i][2]];
        } else if (type == 'Exact') {
            result = resultEhash[inputRows[i][2]];
        } else {
            result = resultBhash[inputRows[i][2]];
        }
        if (result.length > 1) {
            duplicate = 'YES';
        }
        var index = result.indexOf(i + 1);
        if (index > -1) {
            result.splice(index, 1);
        }
        result.sort(function(a, b){return a-b});
        createNewOutputRow(i + 1, inputRows[i][2], type, duplicate, result);
    }

}