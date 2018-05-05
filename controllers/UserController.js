
var nodemailer=require("nodemailer");
var smtpTransport=nodemailer.createTransport({
	service: "gmail",
	auth:{
  //	user: process.env.mailUser,
  user: "aishwaryassr@gmail.com",
    //pass: process.env.mailPass
    pass: "Admire2772"
	}
});

var request=require('request');
var authurl,splitwiseApi,userOAuthToken, userOAuthTokenSecret,authApi,userparameters;
var schedule = require('node-schedule');
exports.createUser = function(req, res){

  var User = require('../models/user');
  var md5 = require('md5');

  // Check if all parameters are passed
  if (req.body.email && req.body.name && req.body.password) {
      console.log(req.body.email)
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
          var websitehost = 'http://'+req.get('host');
          //var websitehost = 'https://wpool-dev.us-east-1.elasticbeanstalk.com';

          // Send Email
          mailOptions={
            to: req.body.email,
            subject: "Wolfpool user verification",
            html: '<h3>Please click on the <a href="' + websitehost + '/verify_user/' + req.body.email + '/' + verfhash + '">link</a> to verify your account</h3>The link will expire in 24 hours'
          }
          smtpTransport.sendMail(mailOptions,(error,response)=>{
            if(error){
              console.log(error);
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
              console.log(error.statusCode) 
            }else{
              return res.render('info_page',{data:'An email has been sent to you with verification link. Please check your spam too.'});
            }
          });
        }
      });

  } else {
    return res.redirect('/');
  }
};
exports.splitwise=function(req,res){
  var User = require('../models/user');
  var secret;
  console.log(req.query.oauth_token)
  if(req.query.oauth_verifier){
    const user={oauth_verifier: oauth_verifier}
    User.update({email: req.session.userEmail},user,(e,d)=>{
      if(e)
       throw e 
    })
  }
  if(req.query.oauth_token){
    
    User.find({email: req.session.userEmail},(er,docs)=>{
     if(er)
       throw er
      secret=docs[0].oauth_secret 
      console.log(docs[0].oauth_secret)
    

  var qs=require('querystring')
      var oauth =
      { consumer_key: 'reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf'
      , consumer_secret: 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB'
      , token: req.query.oauth_token
      , token_secret: docs[0].oauth_secret
      , verifier: req.query.oauth_verifier
      }
    , url = 'https://secure.splitwise.com/oauth/access_token'; 
  console.log("secret is"+secret)
request.post({url:url, oauth:oauth}, function (e, r, body) {
  // ready to make signed requests on behalf of the user
  var perm_data = qs.parse(body)
    , oauth =
      { consumer_key: 'reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf'
      , consumer_secret: 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB'
      , token: perm_data.oauth_token
      , token_secret: perm_data.oauth_token_secret
      }
    , url="https://secure.splitwise.com/api/v3.0/get_current_user"
 var flag=0
  request.get({url:url, oauth:oauth, json:true}, function (e, r, user) {
   // console.log(user)
    var val=JSON.stringify(user)
    var injson=JSON.parse(val)
    userparameters=injson.user;
    console.log(userparameters) 
    flag=101
   // res.end(userparameters,{userparameters: userparameters}) 
  })
  
})
    })
var url = "http://secure.splitwise.com/api/v3.0/get_current_user?"+"oauth_token="+req.query.oauth_token+"&oauth_verifier="+req.query.oauth_verifier
      console.log(url)

      request({
          url: url,
          oauth_token: req.query.oauth_token,
          oauth_verifier: req.query.oauth_verifier,

         // html: true,
         json: true
      }, function (error, response, body) {
      
         // if (!error && response.statusCode === 200) {
              
              console.log("body"+body) // Print the json response
          //}
      })
  }
  if(req.session && req.session.userId){
    var AuthApi = require('splitwise-node');
var flag;
authApi = new AuthApi('reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf', 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB');

authApi.getOAuthRequestToken().then(function(oAuthToken, oAuthTokenSecret,url){
  
  [userOAuthToken, userOAuthTokenSecret] = [oAuthToken.token, oAuthToken.secret];

  //console.log(userOAuthToken,userOAuthTokenSecret);
  var x=oAuthToken.token
  authurl=authApi.getUserAuthorisationUrl(oAuthToken.token);
  
  flag=true;
 
  res.render('splitwise',{token: x});
 

  });
}
}


exports.getProfile = function(req,res){
  var User = require('../models/user');
  console.log(req.query.oauth_token)
  if (req.session && req.session.userId) {
    if(req.query.oauth_token && req.query.oauth_verifier)
    {
    //console.log(userOAuthToken, userOAuthTokenSecret);
   splitwiseApi = authApi.getSplitwiseApi(userOAuthToken, userOAuthTokenSecret);
    //console.log(splitwiseApi.get_currencies)

    const user={oauth_token: req.query.oauth_token,oauth_verifier: req.query.oauth_verifier}
      User.update({email: req.session.userEmail},user,function(er,doc){
        if(er)
        {
        throw er
        }
        console.log("token saved successfully") 

      })
      var qs = require('querystring')

    var oauth =
      { consumer_key: 'reCgWzYYm9A7MaSVZOwE4woss5quFct6PxqthGpf'
      , consumer_secret: 'j8e2jV1ZhvT3Q4W366nL7rWOmirwzwH31aDSgUXB'
      , token: userOAuthToken
      , token_secret: userOAuthTokenSecret
      , verifier: req.query.oauth_verifier
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
      , url = 'https://secure.splitwise.com/api/v3.0/get_current_user';

    request.get({url:url, oauth:oauth, json:true}, function (e, r, user) {

      var val=JSON.stringify(user)
      var injson=JSON.parse(val)
      userparameters=injson.user;
   
    })
  })
    var url = "http://secure.splitwise.com/api/v3.0/get_current_user?"+"oauth_token="+req.query.oauth_token+"&oauth_verifier="+req.query.oauth_verifier
      request({
          url: url,
          oauth_token: req.query.oauth_token,
          oauth_verifier: req.query.oauth_verifier,

         // html: true,
         json: true
      }, function (error, response, body) {
      
         console.log(body) // Print the json response
          
      })

    }

     // var User = require('../models/user');
       User.find({"_id":req.session.userId})
        .then(function(doc){
 
        res.render('profile_page',{items: doc});
         

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
