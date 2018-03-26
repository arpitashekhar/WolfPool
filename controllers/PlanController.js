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
        memberIndex = plan.participants.findIndex((memberObj => memberObj.email == request.session.userEmail));
        var existingCount = plan.participants[memberIndex].no_of_people;
        var vacancy = +plan.vacancy + +existingCount
        return response.render('home',{plan:plan,vacancy:vacancy});
      }
    });
  }
};

exports.saveUpdatedPlan = function(request,response){
  var updateQuery = { _id: request.body.planId };
  Plan.findOne(updateQuery,function(err, plan) {
    if(err){

    }else{
      
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
        var savePlan = true;
        if(newCount == 0){
          plan.participants[memberIndex].remove();
          console.log("Participants: ",plan.participants.length);
          if(plan.participants.length == 0){
            savePlan = false;
            plan.remove()
            .then(item => {
              return response.render('info_page', {
                data: "Plan Updated Successfully. As no other participant is present plan is deleted."
              });
            })
            .catch(err => {
              return response.render('info_page', {
                data: "Unable to update the plan. Please try again."
              });
            });
          }
        }else{
          plan.vacancy = +plan.vacancy - +newCount;
          plan.participants[memberIndex].no_of_people = newCount;
        }
        plan.no_of_people = 6 - +plan.vacancy;
      }
      console.log("Plan: ",plan);
      if(savePlan){
        plan.save()
        .then(item => {
          response.render('info_page', {
            data: "Plan Updated Successfully."
          });
        })
        .catch(err => {
          console.log(err)
          response.render('info_page', {
            data: "Unable to update the plan. Please try again."
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
