var geolib = require('geolib');
var haversine = require('haversine-distance');
var Plan = require('../models/plan');
var nodemailer=require("nodemailer");
var smtpTransport=nodemailer.createTransport({
	service: "gmail",
	auth:{
		user: process.env.mailUser,
		pass: process.env.mailPass
  }
  

});
var lyft = require("node-lyft");
var apiRequest = require('request');
var checker = 0;

exports.account=function(req,res){
  console.log("Hello")
  var User = require('../models/user');
 // if(req.query.oauth_token && req.query.oauth_verifier)
  //{
  //console.log(userOAuthToken, userOAuthTokenSecret);
 //splitwiseApi = authApi.getSplitwiseApi(userOAuthToken, userOAuthTokenSecret);
  //console.log(splitwiseApi.get_currencies)

  /*const user={oauth_token: req.query.oauth_token,oauth_verifier: req.query.oauth_verifier}
    User.update({email: req.session.userEmail},user,function(er,doc){
      if(er)
      {
      throw er
      }
      console.log("token saved successfully") 

    })*/
    var request=require('request')
    var qs = require('querystring'),
    oauth ={ 
   // callback: 'http://localhost:3000/splitwiseaccount',
   // callback: 'http://localhost:3000',
    consumer_key: 'reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf',
    consumer_secret: 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB'
    },
     url = 'https://secure.splitwise.com/oauth/request_token';

 /* var oauth =
    { consumer_key: 'reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf'
    , consumer_secret: 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB'
    , token: userOAuthToken
    , token_secret: userOAuthTokenSecret
    , verifier: req.query.oauth_verifier
    }
  , url = 'https://secure.splitwise.com/oauth/access_token';
 */
  request.post({url:url, oauth:oauth}, function (e, r, body) {

    var req_data = qs.parse(body)
    console.log(req_data.oauth_token_secret)

    const user={oauth_secret: req_data.oauth_token_secret}
  User.update({email: req.session.userEmail},user,(err,docs)=>{
      if(err)
       throw err;
    })
    var uri = 'https://secure.splitwise.com/oauth/authorize'+ '?' + qs.stringify({oauth_token: req_data.oauth_token})
    res.redirect(uri)
  })  
    //r.redirect(uri)
    /*http.get(uri,(req,res)=>{
      console.log("I am authorized")
    })*/  
   /*   var auth_data=qs.parse(body)
      var oauth =
      { consumer_key: 'reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf'
      , consumer_secret: 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB'
      , token: auth_data.oauth_token
      , token_secret: auth_data.oauth_token_secret
      , verifier: auth_data.oauth_verifier
      }
    , url = 'https://secure.splitwise.com/oauth/access_token'; 
  
request.post({url:url, oauth:oauth}, function (e, r, body) {
  // ready to make signed requests on behalf of the user
  var perm_data = qs.parse(body)
    , oauth =
      { consumer_key: 'reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf'
      , consumer_secret: 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB'
      , token: perm_data.oauth_token
      , token_secret: perm_data.oauth_token_secret
      }
    , url = "https://secure.splitwise.com/api/v3.0/get_current_user?"+"oauth_token="+perm_data.oauth_token+"&oauth_verifier="+perm_data.oauth_verifier;

  request.get({url:url, oauth:oauth, json:true}, function (e, r, user) {
    console.log(user)
    var val=JSON.stringify(user)
    var injson=JSON.parse(val)
    userparameters=injson.user;
    console.log(userparameters) 
  })
})
  })
  /*var url = "http://secure.splitwise.com/api/v3.0/get_current_user?"+"oauth_token="+req.query.oauth_token+"&oauth_verifier="+req.query.oauth_verifier
    request({
        url: url,
        oauth_token: req.query.oauth_token,
        oauth_verifier: req.query.oauth_verifier,

       // html: true,
       json: true
    }, function (error, response, body) {
    
       console.log(body) // Print the json response
        
    })

  })
  }*/
//}
}
exports.savePlan = function(request, response) {
  if (checker != 1) {
    var planModel = require('../models/plan');

    
    
    // Create Participant
    var planData = new planModel({
      source_id: request.body.source,
      destination_id: request.body.destination,
      source_lat: request.body.lat[0],
      source_long: request.body.lng[0],
      dest_lat: request.body.lat[1],
      dest_long: request.body.lng[1],
      date: request.body.date,
      time: request.body.time,
      no_of_people: request.body.no_of_people,
      vacancy: 6 - request.body.no_of_people,
      participants: [{
        email: request.session.userEmail,
        no_of_people: request.body.no_of_people
      }]
    });
    planData.save()
      .then(item => {
        response.render('info_page', {
          data: "Plan created. Back to ",
          name: 'home',
          link: 'home'
        });
      })
      .catch(err => {
        console.log(err)
        response.render('info_page', {
          data: "Unable to create plan."
        });
      });
  } else {
    response.render('info_page', {
      data: "Similar plans already exists. Please join existing plans."
    });
  }
};

exports.getPlans = function(request, response) {

  Plan.find({
    'participants.email': request.session.userEmail 
  }, function(err, planslist) {
    if(err){

    }else{
      response.send(planslist);
    }
  });
};

exports.updatePlans = function(request,response){
  var planQuery = { _id: request.body.delete };
  if(request.body.delete){
    Plan.remove(planQuery, (err, plans) => {
      var message = "";
      if(err){
        message = "Unable to delete the plan. Please try again. Go Back to";
      }else{
        message = "Plan deleted sucessfully. Go Back to";
      }
      return response.render('info_page', {
        data: message,
        name: 'Your Rides',
        link: 'plans_page'
      });
    });
  }else if(request.body.update){
    Plan.findById(request.body.update, function(err, plan) {
      if (err) {
        return response.render('info_page', {
          data: "Unable to update the plan. Please try again. Go Back to",
          name: 'Your Rides',
          link: 'plans_page'
        });
      } else {
        memberIndex = plan.participants.findIndex((memberObj => memberObj.email == request.session.userEmail));
        var existingCount = plan.participants[memberIndex].no_of_people;
        var vacancy = +plan.vacancy + +existingCount
        return response.render('home',{plan:plan,vacancy:vacancy});
      }
    });
  }else if(request.body.estimate){
    Plan.findById(request.body.estimate, function(err, plan) {
      var message = "";
      if(err){
        console.log(err);
        response.render('info_page', {
          data: "Unable to get fare estimates. Please try again. Go Back to",
          name: 'Your Rides',
          link: 'plans_page'
        });
      }else{
        
        var fareEstimates = {estimates:[]};

        // Get Uber Fare Estimates
        getUberEstimates = new Promise((resolve,reject) => {
          var uberApiUrl = "https://api.uber.com/v1.2/";
          var uberServerToken = process.env.uberToken;
          apiRequest.get({
            url : uberApiUrl + 'estimates/price',
            strictSSL: false,
            qs : {
              server_token : uberServerToken,
              start_latitude : plan.source_lat,
              start_longitude : plan.source_long,
              end_latitude : plan.dest_lat,
              end_longitude : plan.dest_long
            }
          }, function(err, response, body){
            if(err){
              reject(err);
            }else{
              var uberResponse = JSON.parse(body);
              var estimate = {name:"Uber",types:[]};
              for(var i = 0; i < uberResponse.prices.length; i++){
                var currentPrice = uberResponse.prices[i];
                var type = {typeName:currentPrice.localized_display_name,typeCost:currentPrice.estimate};
                estimate.types.push(type);
              }
              fareEstimates.estimates.push(estimate);
              resolve(fareEstimates);
            }
          });
        });

        //Get Lyft Fare Estimates
        getLyftEstimates = new Promise((resolve,reject) => {
          let defaultClient = lyft.ApiClient.instance;
          // Configure OAuth2 access token for authorization: Client Authentication
          let clientAuth = defaultClient.authentications['Client Authentication'];
          clientAuth.accessToken = process.env.lyftToken;
          let apiInstance = new lyft.PublicApi();

          let opts = { 
            'endLat': plan.dest_lat, // Latitude of the ending location
            'endLng': plan.dest_long // Longitude of the ending location
          };

          apiInstance.getCost(plan.source_lat, plan.source_long, opts).then((data) => {
            var estimate = {name:"Lyft",types:[]};
            for(var i = 0; i < data.cost_estimates.length; i++){
              var currentCostEstimate = data.cost_estimates[i];
              var rideCost = "$"+currentCostEstimate.estimated_cost_cents_max / 100+"-"+currentCostEstimate.estimated_cost_cents_min / 100;
              var type = {typeName:currentCostEstimate.ride_type,typeCost:rideCost};
              estimate.types.push(type);
            }
            fareEstimates.estimates.push(estimate);
            resolve(fareEstimates);
          }, (error) => {
            reject(error);
          });
        });
        
        Promise.all([getUberEstimates, getLyftEstimates])
        .then(function(result){
          response.render('plans_page', {source:plan.source_id,destination:plan.destination_id,fareEstimates:fareEstimates});
        });
      }
    });
  }
};

exports.saveUpdatedPlan = function(request,response){
  var updateQuery = { _id: request.body.planId };
  Plan.findOne(updateQuery,function(err, plan) {
    if(err){
      console.log(err);
    }else{
      var savePlan = true;
      if(request.body.date){
        plan.date = request.body.date;
      }
      
      if(request.body.time){
        plan.time = request.body.time;
      }
        
      if(request.body.source){
        plan.source_id = request.body.source;
        plan.source_lat = request.body.lat[0];
        plan.source_long = request.body.lng[0];
      }
      
      if(request.body.destination){
        plan.destination_id = request.body.destination;
        plan.dest_lat = request.body.lat[1];
        plan.dest_long = request.body.lng[1];
      }
      
      if(request.body.no_of_people){
        memberIndex = plan.participants.findIndex((memberObj => memberObj.email == request.session.userEmail));
        var newCount = request.body.no_of_people;
        var existingCount = plan.participants[memberIndex].no_of_people;
        plan.vacancy = +plan.vacancy + +existingCount;
        if(newCount == 0){
          plan.participants[memberIndex].remove();
          if(plan.participants.length == 0){
            savePlan = false;
            plan.remove()
            .then(item => {
              return response.render('info_page', {
                data: "Plan Updated Successfully. As no other participant is present plan is deleted. Go Back to",
                name: 'Your Rides',
                link: 'plans_page'
              });
            })
            .catch(err => {
              return response.render('info_page', {
                data: "Unable to update the plan. Please try again. Go Back to",
                name: 'Your Rides',
                link: 'plans_page'
              });
            });
          }
        }else{
          plan.vacancy = +plan.vacancy - +newCount;
          plan.participants[memberIndex].no_of_people = newCount;
        }
        plan.no_of_people = 6 - +plan.vacancy;
      }
      if(savePlan){
        plan.save()
        .then(item => {
          response.render('info_page', {
            data: "Plan Updated Successfully. Go Back to",
            name: 'Your Rides',
            link: 'plans_page'
          });
        })
        .catch(err => {
          console.log(err)
          response.render('info_page', {
            data: "Unable to update the plan. Please try again. Go Back to",
            name: 'Your Rides',
            link: 'plans_page'
          });
        });
      }
    }
  });
};

exports.joinPlan = function(request, response) {

  var planId = request.body.selectedPlan;
  var numberOfPeople = request.body.numberOfPeople;

  Plan.findById(planId, function(err, plan) {
    if (err) {
      response.status(500).send("The plan you selected got full. Please search again.");
    } else {
      plan.participants.push({
        email: request.session.userEmail,
        no_of_people: numberOfPeople});
      plan.no_of_people = +plan.no_of_people + +numberOfPeople;
      plan.vacancy = +plan.vacancy - +numberOfPeople;
      plan.save();
      
      // Send email to users in list that current user joined plan
      var emailList = "";
      plan.participants.forEach(function(participant) {
        if(emailList.length == 0)
          emailList = participant.email;
        else
          emailList = emailList + "," + participant.email;
      });
      
      // Send Email
      mailOptions={
        to: emailList,
        subject: "Someone just joined your wolfpool plan!",
        html: 'Hi there! ' + request.session.userName + ' just joined your trip with details listed below. Following are the email addresses of everyone in the plan: ' + emailList + '.<br/><br/>Trip details:<br/>Source: ' + plan.source_id + '<br/>Destination: ' + plan.destination_id + '<br/>Date: ' + (plan.date.getMonth() + 1) + '/' + plan.date.getDate() + '/' +  plan.date.getFullYear() + '<br/>Time(24 hr format): ' + plan.time
      }
      smtpTransport.sendMail(mailOptions,(error,response)=>{
        if(error){
          console.log(error);
        }else{
          return response.render('info_page', {
            data: 'An email notification has been sent to your trip buddies.'
          });
        }
      });

      response.setHeader('Content-Type', 'application/text');
      response.send("/plans_page");
    }
  });

}

exports.searchPlan = function(request, response) {

  // Show all existing plans that the user can join, along with an option to create
  checker=0;
  userRequest = request.body

  var currSrc = {
    lat: userRequest.lat[0],
    lng: userRequest.lng[0]
  };
  var currDest = {
    lat: userRequest.lat[1],
    lng: userRequest.lng[1]
  };
  var query = {
    "date": {
      $gte: userRequest.date
    },
    "time": {
      $gte: userRequest.time
    },
    "participants.email": {
      $ne: request.session.userEmail
    },
    "vacancy": {
      $gte: userRequest.no_of_people
    }
  }; //Change to vacancy - no_of_people
  Plan.find(query, (err, plans) => {
    if (err) {
      response.status(500).send(err);
    } else {
      console.log("found " + plans.length);
      var results = [];
      for (var i = 0; i < plans.length; i++) {
        var optionSrc = {
          lat: plans[i].source_lat,
          lng: plans[i].source_long
        };
        var optionDest = {
          lat: plans[i].dest_lat,
          lng: plans[i].dest_long
        };

        if (haversine(currSrc, optionSrc) < 2000 && haversine(currDest, optionDest) < 2000) {
          plans[i].src_distance = Math.round(haversine(currSrc, optionSrc) * 0.000621371 * 100) / 100; //to calculate the distance in miles
          plans[i].dest_distance = Math.round(haversine(currDest, optionDest) * 0.000621371 * 100) / 100; //to calculate the distance in miles
          results.push(plans[i]);
          checker = 1;
        }
      }
      // console.log("*********result "+results);
      response.setHeader('Content-Type', 'application/json');
      response.send(JSON.stringify(results));

    }
  });
};
