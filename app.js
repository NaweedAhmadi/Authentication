//jshint esversion:6
require('dotenv').config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FacebookStrategy = require('passport-facebook').Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/newUserDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    userName: String,
    password: String,
    googleId: String,
    facebookId: String
})

const secretSchema = new mongoose.Schema({
    googleId: String,
    secret: String
})

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

const User = new mongoose.model('User', userSchema);

const Secret = new mongoose.model('Secret', secretSchema);

passport.use(User.createStrategy());

passport.serializeUser(function(user, done) {
    done(null, user);
});
  
passport.deserializeUser(function(user, done) {
    done(null, user);
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);

    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: "http://localhost:3000/auth/facebook/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);

    User.findOrCreate({ facebookId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req, res) {
    res.render("home");
})

app.get('/auth/google',
  passport.authenticate('google', { scope: ["profile"] })
);

app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect secrets.
    res.redirect('/secrets');
  });

app.get('/auth/facebook',
  passport.authenticate('facebook')
);

app.get('/auth/facebook/secrets',
  passport.authenticate('facebook', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });

app.get("/login", function(req, res) {
    res.render("login");
})

app.get("/register", function(req, res) {
    res.render("register");
})

app.get("/secrets", async function(req, res){
    if(req.isAuthenticated()) {
        const userGoogleId = req.user.googleId;

        try {
            const secrets = await Secret.find({googleId: userGoogleId}).exec();
            res.render("secrets", { secrets: secrets });
        } catch (err) {
            console.error(err);
            res.redirect("/login");
        }
    } else {
        res.redirect("/login");
    }
});

app.get("/submit", function(req, res) {
    if(req.isAuthenticated()) {
        res.render("submit");
    } else {
        res.redirect("/login");
    }
})

app.post("/login", async function(req, res) {

    const user = new User({
        userName: req.body.username,
        password: req.body.password
    });

    req.login(user, function(err) {
        if(err) {
            console.log(err);
        } else {
            passport.authenticate("local") (req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/register", async function(req, res) {
    const userName = req.body.username;
    const password = req.body.password;

    User.register({username: userName}, password, function(err, user) {
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local") (req, res, function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.post("/submit", function(req, res) {

    const secret = new Secret ({
        secret: req.body.secret,
        googleId: req.user.googleId
    })
    secret.save();
    res.redirect("/secrets");

})

app.get("/logout", async function(req, res) {
    req.logout(function(err) {
        if(err) {
            console.log(err);
        } else {
            res.redirect("/")
        }
    });
});

app.listen(3000, function(req, res) {
    console.log("The app is running on port 3000");
})