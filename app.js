const express = require('express')
const app = express()
const port = 3000

// app.get('/', (req, res) => res.send('Hello World'))

app.get('/', function(req, res){

    	//upload logo
		uploadLogo(function(err, body) {
			if(err == null){
				//call create event body == id
				let logoid = body;
				//create the event after loading the logo
				createEvent("Creating an event!", "description", logoid, "America/Los_Angeles","2018-12-12T02:00:00Z","2018-12-14T02:00:00Z","USD","Music", function(err, body) {
					// console.log("err: "+ err);
					// console.log("body: " + body);
					if(err == null){
						//after the event is created
						let eventid = JSON.parse(body).id;

						//add ticket to the created event
						addTicketToEventOneByOne(eventid,"VIP","description goes here ...", 40, "USD:3500","messagefromchumi",function(err1, body1){
							// console.log("err:" + err1);
							// console.log("body: " + body1);
						});

						//create custom questions
						createQuestionOneByOne(eventid,true,"text", "The specific question goes here ...", function(err, body){

						});
				
						//set up the confirm message, and after the order, direct to chumi website
						setUpEventConfirmMessage (eventid,"https://www.chumi.co/",function(err, body){
							console.log("confirm message err: " + err);
							console.log("confirm message body: " + body);
						});
						
				 	};
				});		
					
			};
			
	    });
    });	

	

app.listen(port, () => console.log(`Example app listening on port ${port}!`))

var fs = require('fs');
var FormData = require('form-data');
var globeImage;
//read the upload logo
var readImage = fs.readFile('/Users/caoqing/Desktop/node/starbucks.png',(err, data)=>{
		if(err) res.status(500).send(err);
    		globeImage = data;
    	});

var request = require('request');

var EVENTBRITE_API_URL = 'https://www.eventbriteapi.com/v3/';
var API_KEY = "your api key";

createEvent = function(title, description, logoid, start_timeZone,starttime,endtime,currency,category_name, callback) {

    var category_id = "199";
    switch (category_name) {
        case "Music":
            category_id = "103";
            break;
        case "Business" || "Conference":
            category_id = "101";
            break;
        case "Food & Drink":
            category_id = "110";
            break;
        case "Sports":
            category_id = "108";
            break;
        case "Charity":
            category_id = "111";
            break;
        case "Fashion":
            category_id = "106";
            break;
    }


    var formdata = {
        "event.name.html": title,
        "event.description.html": description,
        "event.start.timezone": start_timeZone,
        "event.start.utc": starttime,
        "event.end.timezone": start_timeZone,
        "event.end.utc": endtime,
        "event.currency": currency,
        "event.logo_id": logoid,//upload first
        "event.category_id":category_id
    };

    // if(venue_id != ""){
    //     formdata["event.venue_id"] = venue_id;//upload first
    // }

    request.post({
        url: EVENTBRITE_API_URL + "events/",
        form: formdata,
        headers: {'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json'},
        verify: true
    }, function(err, r, body) {

        return callback(err,body);

    });

};

uploadLogo = function(callback){//upload this imgData when upload the ac.
    request.get({
        url: EVENTBRITE_API_URL+"media/upload/?type=image-event-logo&token="+API_KEY
    }, function(err, r, body) {

    let a =JSON.parse(body);
    let postData = a.upload_data;
    //globeImage: the uploading logo
    let parameter = globeImage;

    let data_para = a.upload_data;
    data_para['file_parameter_name'] = parameter;
	
    let data = 
    {
        	// token: API_KEY,
        	'AWSAccessKeyId': a.upload_data.AWSAccessKeyId,
        	'bucket': a.upload_data.bucket,
        	'acl': a.upload_data.acl,
        	'key': a.upload_data.key,
        	'signature': a.upload_data.signature,
        	'policy': a.upload_data.policy,
        	'file': data_para.file_parameter_name // file should be the last element of the form-data 
               
        };
      
        request.post({   
            url: a.upload_url,
            // upload_token: a.upload_token,
            formData: data,
            json: true
            // headers: {'Content-Type': "multipart/form-data"}
            // verify: true
        }, function(err, r, body) {
        	    
        		// console.log(readImage);
	            request.post({
                	// url: EVENTBRITE_API_URL + "media/upload/",
                	url: EVENTBRITE_API_URL+"media/upload/?token="+API_KEY,
                	form: {
                		'upload_token': a.upload_token
                	},
                	headers: {'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json'},
        			verify: true

            	}, function(err, r, body) {
            		let result = JSON.parse(body);

                	return callback(err,result.id);

            	})
        });


    });
};

// addTicketToEventOneByOne = function(eventid,name,description,quantity_total,currency,value,messagefromchumi,callback){//after create events
addTicketToEventOneByOne = function(eventid, name, description, quantity_total, cost, messagefromchumi, callback){
    var formdata = {
        "ticket_class.name": name,
        "ticket_class.description": description,
        "ticket_class.quantity_total": quantity_total,
        "ticket_class.cost": cost, //cost should be inputed as cents, e.g., Input: USD: 4500 ==> USD 45.00
        "ticket_class.include_fee": false,
        "ticket_class.order_confirmation_message": messagefromchumi
    };

    request.post({
        url: EVENTBRITE_API_URL + "events/"+ eventid +"/ticket_classes/",
        form: formdata,
        headers: {'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json'},
        verify: true
    }, function(err, r, body) {
        return callback(err,body);

    });
};

setUpEventConfirmMessage = function (eventid,redirect_url,callback){//redirect_url our page
    var formdata = {
        "ticket_buyer_settings.refund_request_enabled": false,
        "ticket_buyer_settings.instructions.html": "We use chumi.co to manage eventbrite and other platform's tickets, you will receive two emails, please use the ticket from Chumi to check in.",
        "ticket_buyer_settings.redirect_url": redirect_url
    };

    request.post({
        url: EVENTBRITE_API_URL + "events/"+ eventid +"/ticket_buyer_settings/",
        form: formdata,
        headers: {'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json'},
        verify: true
    }, function(err, r, body) {

        return callback(err,body);

    });
};


//use wekhook
// returnOrderFromUrl = function(url,callback){
//     request.get({/
//         url: url+"?token="+API_KEY
//     }, function(err, r, body) {

//         //body.name
//         //body.email
//         //body.questions  list
//         //body.answers   list

//         return callback(err,body);
//     });
// };

createQuestionOneByOne = function(eventid,required,type,question,callback){
    //uplaod text only. 
    var formdata = {
        "question.required": required,
        "question.type": type,//checkbox, dropdown, text, paragraph, radio, or waiver (only text, paragraph, waiver work)
        "question.display_answer_on_order": true,
//         "question.choices.answer.html": [{"answer":{"text":"answer1","html":"answer1"},"id":"58556124","subquestion_ids":[]},{"answer":{"text":"answer2","html":"answer2"},"id":"58556125","subquestion_ids":[]},{"answer":{"text":"answer3","html":"answer3"},"id":"58556126","subquestion_ids":[]}]
// body: [{"answer":{"text":"answer1","html":"answer1"},"id":"58556124","subquestion_ids":[]},{"answer":{"text":"answer2","html":"answer2"},"id":"58556125","subquestion_ids":[]},{"answer":{"text":"answer3","html":"answer3"},"id":"58556126","subquestion_ids":[]}]
// ,
        // "question.choices.choices" : [{"answer":{"text":"answer1","html":"answer1"}}],
        // "question.choices": choices, //cannot find the correct format
        "question.question.html":question
    };
    request.post({
        url: EVENTBRITE_API_URL + "events/"+ eventid +"/questions/",
        form: formdata,
        headers: {'Authorization': 'Bearer '+API_KEY, 'Content-Type': 'application/json'},
        verify: true
    }, function(err, r, body) {
    	console.log("body==" + body);
        return callback(err,body);

    });
};



// exports.createEvent = createEvent;
