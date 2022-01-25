'use strict';
require('dotenv').config();
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const passport= require('passport');
const session = require('express-session');
const ObjectID = require('mongodb').ObjectID;
const LocalStrategy = require('passport-local');


const routes = require("./routes.js");
const auth = require("./auth.js");
const app = express();
const http = require('http').createServer(app);
const io = require('socket.io')(http);
//setting pug as the template engine
app.set('view engine', 'pug');
//using session middleware 
/*
Using this middleware saves the session id as a cookie in the client and allows us to access the session data using that id on the server. This way we keep personal account information out of the cookie used by the client to verify to our server they are authenticated and just keep the key to access the data stored on the server.
 */
app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));

app.use(passport.initialize());
app.use(passport.session());



fccTesting(app); //For FCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



myDB(async (client) => {
  const myDataBase = await client.db('ChatApp').collection('users');

routes(app, myDataBase);
auth(app,myDataBase);

  let currentUsers = 0;
  io.on('connection', (socket) => {
    //increase currentUsers count by 1 when user connects
    ++currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has connected');

    socket.on('disconnect', () => {
  /*anything you want to do on disconnect*/
  //decrease users count by 1 when a user disconnects 
    --currentUsers;
    io.emit('user count', currentUsers);
    console.log('A user has disconnected');
});

  });
 
 



//defining middleware to ensure user is authenticated //before accessing /profile



//middleware to handle pages not found
app.use((req, res, next) => {
  res.status(404)
    .type('text')
    .send('Not Found');
});



  // Be sure to add this...
}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', { title: e, message: 'Unable to login' });
  });
});

const PORT = process.env.PORT || 3000;
http.listen(PORT, () => {
  console.log('Listening on port ' + PORT);
});
