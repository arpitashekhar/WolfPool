var geolib = require('geolib');
var haversine = require('haversine-distance');
var Plan = require('../models/plan');

var checker = 0;

exports.savePlan = function(request, response) {
  if (checker != 1) {
    var planModel = require('../models/plan')
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
      emails: [request.session.userEmail]
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
    "emails": request.session.userEmail
  }, function(err, planslist) {
    response.send(planslist);
  });
};

exports.joinPlan = function(request, response) {

  var planId = request.body.selectedPlan;
  var numberOfPeople = request.body.numberOfPeople;

  Plan.findById(planId, function(err, plan) {
    if (err) {
      response.status(500).send("The plan you selected got full. Please search again.");
    } else {
      plan.emails.push(request.session.userEmail);
      plan.no_of_people = +plan.no_of_people + +numberOfPeople;
      plan.vacancy = +plan.vacancy - +numberOfPeople;
      plan.save();

      // Send email to users in list that current user joined plan
      var emails = [];
      var emails_for_mail = "";
      plan.emails.forEach(function(email) {
        emails.push({
          'Email': email
        });
        emails_for_mail += " " + email
      });
      console.log(emails);
      // Configure the api
      var mailjet = require('node-mailjet').connect(process.env.MJ_PUBLIC_KEY, process.env.MJ_PRIVATE_KEY)

      var mj_req = mailjet
        .post("send")
        .request({
          "FromEmail": "sengncsu2018@gmail.com",
          "FromName": "Wolfpool Support",
          "Subject": 'Someone just joined your wolfpool plan!',
          "Html-part": 'Hi there! ' + request.session.userName + ' just joined your trip with details listed below. Following are the email addresses of everyone in the plan: ' + emails_for_mail + '.<br/><br/>Trip details:<br/>Source: ' + plan.source_id + '<br/>Destination: ' + plan.destination_id + '<br/>Date: ' + (plan.date.getMonth() + 1) + '/' + plan.date.getDate() + '/' +  plan.date.getFullYear() + '<br/>Time(24 hr format): ' + plan.time,
          "Recipients": emails
        });

      mj_req
        .then((result) => {
          return res.render('info_page', {
            data: 'An email notification has been to your trip buddies.'
          });
        })
        .catch((err) => {
          console.log(err.statusCode)
        })

      response.setHeader('Content-Type', 'application/text');
      response.send("/plans_page");
    }
  });

}

exports.searchPlan = function(request, response) {

  // Show all existing plans that the user can join, along with an option to create
  checker=0;
  userRequest = request.body
  // console.log(userRequest)

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
    "emails": {
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
