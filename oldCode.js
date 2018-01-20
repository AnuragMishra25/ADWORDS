// const express = require('express')
// const app = express()
// var path = require('path');

// app.use(express.static('public'))

// const AdwordsUser = require('node-adwords').AdwordsUser;
// const AdwordsConstants = require('node-adwords').AdwordsConstants;
 
// let user = new AdwordsUser({
//     developerToken: 'ph7CS3x_8q8P_lVNUzZgtA', //your adwords developerToken
//     userAgent: 'DASHDASH', //any company name
//     // clientCustomerId: '754-222-9756', //the Adwords Account id (e.g. 123-123-123)
//     clientCustomerId:'916-032-4264',
//     // client_id: '192513588480-lltlrnrosdnv6ovu2qiev1210ampulot.apps.googleusercontent.com', //this is the api console client_id
//     // client_secret: 'gX275mFc9zcdcn8gNh1zL68n',
//     // refresh_token: '1/G3m5ShXBJV8kd1tpEubVzlPQQuZT7BrfHKThhOXbTEbfLa1ZtP25SzqzIE1sS9vh'
//     client_id: '798205505977-tlkpmqonc2m9pf0i6msqu437g8lif6f5.apps.googleusercontent.com', //this is the api console client_id
//     client_secret: 'rkP2Ng7DY8-5Dr8UlVcyIXk9',
//     refresh_token:'1/C263dGy0s7TlfQcGUggl7K19DywXno73hYfU9h2ryRE'
// });

// //ID:           798205505977-tlkpmqonc2m9pf0i6msqu437g8lif6f5.apps.googleusercontent.com
// //scrt:         rkP2Ng7DY8-5Dr8UlVcyIXk9

// let campaignService = user.getService('CampaignService', 'v201710')
 
// //create selector
// let selector = {
//     fields: ['Id', 'Name'],
//     ordering: [{field: 'Name', sortOrder: 'ASCENDING'}],
//     paging: {startIndex: 0, numberResults: AdwordsConstants.RECOMMENDED_PAGE_SIZE}
// }
 
// campaignService.get({serviceSelector: selector}, (error, result) => {
//     console.log(result);
// })

// app.get('/', (req, res) => {
//     res.sendFile(path.join(__dirname + '/public/index.html'))
// });

// app.listen(3000, () => console.log('Example app listening on port 3000!'));