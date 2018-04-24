var bodyParser = require('body-parser');
var UserController = require('./controllers/UserController');
var PlanController = require('./controllers/PlanController');

// Routes
module.exports = function(app) {
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(function(req, res, next) {
    res.locals.user = req.session.userId;
    res.locals.username = req.session.userName;
    next();
  });

  // General routes
  app.get('/', function(req, res) {
    if (req.session && req.session.userId) {
      //console.log(req.query.oauth_token)
      //console.log(req.query.oauth_verifier)
      
      res.render('home',{oauth_token: req.query.oauth_verifier,oauth_verifier: req.query.oauth_verifier});
    } else {
      res.render('login');
    }
  });
  app.post('/',function(req,res){
    console.log(req.query.oauth_token)
    console.log(res);
    console.log(res.body.oauth_token);
    console.log(req.body.oauth_verifier);
    res.render('home',{response: req});
  })

  app.get('/help', function(req, res) {
    res.render('help');
  });

  app.get('/contact', function(req, res) {
    res.render('contact', {
      csrf: 'CSRF token here'
    });
  });

  app.get('/home', function(req, res) {
    if (req.session && req.session.userId) {
      res.render('home');
    } else {
      res.render('login');
    }
  });

  app.get('/plans_page', function(req, res) {
    if (req.session && req.session.userId) {
      res.render('plans_page');
    } else {
      res.render('info_page', {
        data: 'You must be logged in to view this page. Back to ',
        name: 'login',
        link: 'login_page'
      });
    }
  });

  app.get('/register_page', function(req, res) {
    res.render('register');
  });

  // Routes related to Plan
  app.post('/savePlan', PlanController.savePlan);
  app.post('/saveUpdatedPlan', PlanController.saveUpdatedPlan);
  app.post('/searchPlan', PlanController.searchPlan);
  app.post('/joinPlan', PlanController.joinPlan);
  app.get('/get_plans', PlanController.getPlans);
  app.post('/updatePlan',PlanController.updatePlans);

  // Routes related to User
  app.get('/verify_user/:email/:verfhash', UserController.verifyUser);
  app.get('/login_page', function(req, res) {
    res.render('login');
  });
  app.get('/logout_page', UserController.logoutUser);
  app.get('/info_page', function(req, res) {
    res.render('info_page', {
      data: 'Welcome. Click here to  ',
      name: 'login',
      link: 'login_page'
    });
  });
  app.post('/profile_page', UserController.updateProfile);
  app.post('/createUser', UserController.createUser);
  app.post('/loginUser', UserController.loginUser);
  app.get('/profile_page', UserController.getProfile);
  app.get('/splitwise',UserController.splitwise);
  app.get('/splitwiseaccount',PlanController.account);
  
};
