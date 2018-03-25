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

exports.updatePlans = function(request,response){
  var planQuery = { _id: request.body.delete };
  if(request.body.delete){
    Plan.remove(planQuery, (err, plans) => {
      var message = "";
      if(err){
        message = "Unable to delete the plan. Please try again.";
      }else{
        message = "Plan deleted sucessfully.";
      }
      return response.render('info_page', {
        data: message
      });
    });
  }else if(request.body.update){
    Plan.findById(request.body.update, function(err, plan) {
      if (err) {
        return response.render('info_page', {
          data: "Unable to update the plan. Please try again."
        });
      } else {
        return response.render('home',{plan:plan});
      }
    });
  }
};

exports.saveUpdatedPlan = function(request,response){
  var updateObject = {};
  if(request.body.date){
    updateObject.date = request.body.date;
  }
  if(request.body.time){
    updateObject.time = request.body.time;
  }
  
  if(request.body.source){
    updateObject.source_id = request.body.source;
    updateObject.source_lat = request.body.lat[0];
    updateObject.source_long = request.body.lng[0];
  }

  if(request.body.destination){
    updateObject.destination_id = request.body.destination;
    updateObject.dest_lat = request.body.lat[1];
    updateObject.dest_long = request.body.lng[1];
  }
  
  var updateQuery = { _id: request.body.planId };
  Plan.update(updateQuery,updateObject,(err,plan)=>{
    var message;
    if(err){
      message = "Unable to update the plan. Please try again."
    }else{
      message = "Plan Updated Successfully."
    }
    response.render('info_page', {
      data: message
    });
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
      var emailList = "";
      plan.emails.forEach(function(email) {
        if(emailList.length == 0)
          emailList = email;
        else
          emailList = emailList + "," + email;
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
