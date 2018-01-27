const express = require('express');
var bodyParser = require('body-parser');

var excelbuilder = require('msexcel-builder');
const app = express()
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies
var path = require('path');

app.use(express.static('public'))


// const adsSdk = require('facebook-nodejs-ads-sdk');
// const accessToken = '353083125113970|lsBQMqxy-tjPCfUw9yZr6TIcZtA';
// const api = adsSdk.FacebookAdsApi.init(accessToken);
// const AdAccount = adsSdk.AdAccount;
// const Campaign = adsSdk.Campaign;
// const account = new AdAccount('act_117698568611235');

// const errorFunction = (scenarioName) => {
//   let returnFunction = (error) => {
//     console.log('An error occurred while processing, ' + scenarioName);
//     console.log('Error Message:' + error);
//     console.log('Error Stack:' + error.stack);
//   };
//   return returnFunction;
// };

// const logPassedTest = (testName, data) => {
//   console.log(testName);
//   if (showDebugingInfo) {
//     console.log('Data:' + JSON.stringify(data));
//   }
// };

// let test1 = 'Node.js read';
// account
//   .read([AdAccount.Fields.name, AdAccount.Fields.age])
//   .then((account) => {
//     logPassedTest(test1 + ':Pass', account);
//   })
//   .catch(errorFunction(test1));



app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname + '/public/index.html'))
});

app.post('/excel', (req, res, next) => {
  let data = req.body.data;
  let start = req.body.start;
  let end = req.body.end;
  console.log('IDHAR AYA');
  // Create a new workbook file in current working-path 
  var workbook = excelbuilder.createWorkbook('/Users/anuragmishra/Desktop/WORK', 'sample.xlsx')

  // Create a new worksheet with 10 columns and 12 rows 
  var sheet1 = workbook.createSheet('sheet1', 7, data.length);

  try {
    for (let i = start; i < end; i++) {
      console.log(data[i]);
      sheet1.set(1, 1, data[i][0]);
      sheet1.set(2, 1, data[i][1]);
      sheet1.set(3, 1, data[i][2]);
      sheet1.set(4, 1, data[i][3]);
      sheet1.set(5, 1, data[i][4]);
      sheet1.set(6, 1, data[i][5]);
      sheet1.set(7, 1, data[i][6]);
    }
  }
  catch (ex) {
    console.log("EXCETIPION: " + ex.toString());
  }

  // Fill some data 
  // sheet1.set(1, 1, 'I am title');
  // for (var i = 2; i < 5; i++)
  //   sheet1.set(i, 1, 'test'+i);

  // Save it 
  workbook.save(function (ok) {
    if (!ok) {
      console.log("SOMETHING WENT WRONG");
      res.send({ code: 400, message: 'went wrong' })
      workbook.cancel();
    }
    else {
      
      console.log('congratulations, your workbook created');
      res.send({ code: 200, message: 'success' })
    }

  });
});

app.listen(3000, () => console.log('Example app listening on port 3000!'));