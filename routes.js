const passport= require('passport');
const bcrypt = require('bcrypt');

module.exports = function (app, myDataBase) {

//defining middleware to ensure user is authenticated before //accessing page
function ensureAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/');
};

 // Be sure to change the title
  app.route('/').get((req, res) => {
    //Change the response to render the Pug template
    res.render('pug/index', {
      title: 'Connected to Database',
      message: 'Please login',
      showLogin: true,
      showRegistration: true,
      showSocialAuth: true
    });
  });


app.route('/login').post(passport.authenticate('local',{ failureRedirect: '/' }),function(req,res){
    res.redirect("/profile");
});


 
app.route("/auth/github").get(passport.authenticate('github') );

app.route("/auth/github/callback").get(passport.authenticate('local', { failureRedirect: '/' }),(req,res)=>{
  req.session.user_id = req.user.id
      res.redirect("/chat");
});

//adding the middleware to the profile route
  app.route('/profile').get(ensureAuthenticated, (req, res) => {
   // console.log(req.user.username)
    res.render('pug/profile', { username: req.user.username });
  });

//unauthenticating a user 
app.route('/logout')
  .get((req, res) => {
    //logout user
    req.logout();
    //redirect to home /
    res.redirect('/');
});


//route to chat
app.route("/chat").get(ensureAuthenticated, (req,res)=>{
  res.render("pug/chat",{user: req.user});
});

//route to register users
app.route('/register')
  .post((req, res, next) => {
    //check if username exists in db 
    myDataBase.findOne({ username: req.body.username }, function(err, user) {
      if (err) {
        next(err);
      } else if (user) { //if user is found redirect to /
        res.redirect('/');
      } else {
        const hash = bcrypt.hashSync(req.body.password, 12);
        myDataBase.insertOne({ //insert data into db 
          username: req.body.username,
          password: hash
        },
          (err, doc) => {
            if (err) {
              //if data isnt stored redirect to /
              res.redirect('/');
            } else {
              // The inserted document is held within
              // the ops property of the doc
              next(null, doc.ops[0]);
            }
          }
        )
      }
    })
  },//middleware to check if user is authenticated
    passport.authenticate('local', { failureRedirect: '/' }),
    (req, res, next) => {
      res.redirect('/profile');
    }
  );


}