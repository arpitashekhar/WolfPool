var schedule = require('node-schedule');
exports.createUser = function(req, res){

  var User = require('../models/user');
  var md5 = require('md5');

  // Check if all parameters are passed
  if (req.body.email && req.body.name && req.body.password) {

      var verfhash = md5(req.body.email+(new Date()).getTime());
      var userData = {
        email: req.body.email,
        name: req.body.name,
        password: req.body.password,
        phone: null,
        gender: null,
        verified: false,
        verification_hash: verfhash,
        university: null,
        address: null
      }

      //use schema.create to insert data into the db
      User.create(userData, function (err, user) {
        if (err) {
          return res.render('info_page',{data:'Your email is already registered. You can login ',name:'here', link:'login_page'});
          console.log(err);
        } else {

          // For local debugging
          // var websitehost = 'http://localhost:3000';
          var websitehost = 'https://wpool-dev.us-east-1.elasticbeanstalk.com';

          // Configure the api
          var mailjet = require('node-mailjet').connect(process.env.MJ_PUBLIC_KEY, process.env.MJ_PRIVATE_KEY)

          var request = mailjet
              .post("send")
              .request({
                  "FromEmail":"sengncsu2018@gmail.com",
                  "FromName":"Wolfpool Support",
                  "Subject":'Wolfpool user verification',
                  "Html-part":'<h3>Please click on the <a href="' + websitehost + '/verify_user/' + req.body.email + '/' + verfhash + '">link</a> to verify your account</h3>The link will expire in 24 hours',
                  "Recipients":[
                    {
                            "Email": req.body.email
                    }
                  ]
              });

          request
          .then((result) => {
              return res.render('info_page',{data:'An email has been sent to you with verification link. Please check your spam too.'});
          })
          .catch((err) => {
              console.log("**********in email error "+user._id);
              User.remove({"_id":user._id},function(err){
                  if(err){
                    console.log("error in deleting user"+err);
                    return res.render('500');
                  }
                  else{
                    return res.render('info_page',{data: 'There was an unexpected error in registraion. Please click here to Register again ', name:'Register', link:'register_page'});
                  }
              });
              console.log(err.statusCode)
          })
        }
      });

  } else {
    return res.redirect('/');
  }
};

exports.getProfile = function(req,res){

  if (req.session && req.session.userId) {
      var User = require('../models/user');
       User.find({"_id":req.session.userId})
        .then(function(doc){
          //console.log(doc);
          res.render('profile_page',{items:doc});
        });
    } else {
      res.render('info_page',{data: 'You must be logged in to view this page. Back to ', name:'login', link:'login_page'});
    }
};

exports.updateProfile = function(req,res){
  var User = require('../models/user');
      User.findById({"_id":req.session.userId})
        .then(function(doc){
        doc.email=req.body.email;
        doc.name=req.body.name;
        doc.password=req.body.password;
        doc.phone=req.body.phone;
        doc.gender=null;
        doc.university=null;
        doc.address=req.body.address;
        doc.save();
        //console.log(doc);
        });
        res.redirect('/home');
};

exports.verifyUser = function(req, res){

  var User = require('../models/user');

  // Check if all parameters are passed
  if (req.params.email && req.params.verfhash){
    User.findOne({email : req.params.email, verification_hash: req.params.verfhash, verified: false})
      .exec(function(err, user){
      if (err) {
        return res.render('500')
      } else if (!user) {
        console.log('User not found!');
        return res.render('404');
      } else {
        User.update(
          { email : req.params.email},
          { "$set": { verified: true } },
          function (err, raw) {
            if (err) {
                console.log('Error log: ' + err)
            } else {
                res.render('info_page',{data:'Account Verified. Search for ',name:'plans', link:'home'});
            }
          }
        )
      }
    })
  } else {
    return res.render('404');
  }
};

exports.loginUser = function(req, res){
  var User = require('../models/user');
  var bcrypt = require('bcrypt');
  // Check if all parameters are passed
  if (req.body.email && req.body.password) {
    User.authenticate(req.body.email, req.body.password, function (error, user) {
      if (error || !user) {
        var err = new Error('Wrong email or password.');
        err.status = 401;
        res.render('info_page',{data:'Invalid credentials. If you\'ve already registered then please check for verification link in your inbox. Else, register ', name:'here', link:'register_page'});
        // return next(err);
      } else {
        req.session.userId = user._id;
        req.session.userName = user.name;
        req.session.userEmail = req.body.email;
        return res.redirect('/home');
      }
    });
  }
};

exports.logoutUser = function(req, res, next){
  if (req.session) {
    // delete session object
    req.session.destroy(function(err) {
      if(err) {
        return next(err);
      } else {
        return res.redirect('/');
      }
    });
  }
}

var rule = new schedule.RecurrenceRule();
rule.hour = 4;

var j = schedule.scheduleJob(rule, function(){
  console.log('Batch Executed');
  var Users = require('../models/user');
  var query={"verified":false};  //add check for date>=24 hrs in past
  Users.find(query).remove().exec();
});
