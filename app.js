//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");

const app = express();
app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));

mongoose.connect("mongodb://localhost:27017/newUserDB", {useNewUrlParser: true});

const userSchema = new mongoose.Schema({
    userName: String,
    password: String
})

const User = new mongoose.model('User', userSchema);

app.get("/", function(req, res) {
    res.render("home");
})

app.get("/login", function(req, res) {
    res.render("login");
})

app.get("/register", function(req, res) {
    res.render("register");
})

// app.post("/login", async function(req, res) {
//     const userName = req.body.username;
//     const password = req.body.password;

//     const users = await User.find();
//     users.forEach(function(user) {
//         const storedUserName = user.userName;
//         const storedPassword = user.password;

//         if(storedUserName === userName && storedPassword === password) {
//             res.render("secrets");
//         }
//     });
// });

app.post("/login", async function(req, res) {
    const userName = req.body.username;
    const password = req.body.password;

    const user = await User.findOne({userName: userName});
        if(user) {
            if(user.password === password) {
                res.render("secrets");
            } else {
                res.send("Incorrect Username & Password")
            }
        } else {
            res.send("Incorrect Username & Password")
        }
})

app.post("/register", async function(req, res) {
    const userName = req.body.username;
    const password = req.body.password;

    const newUser = new User ({
        userName: userName,
        password: password
    });

    try {
        await newUser.save();
        res.render("secrets");
    } catch (err) {
        console.log(err);
    }
})

app.listen(3000, function(req, res) {
    console.log("The app is running on port 3000");
})