const { authenticate } = require("passport");
const { Router, response } = require("express");
var express          = require("express"),
    methodOverride   = require("method-override"),
    flash            = require("connect-flash"),
    bodyParser       = require("body-parser"),
    mongoose         = require("mongoose"),
    passport         = require("passport"),
    LocalStrategy    = require("passport-local"),
    app              = express(),
    Index            = require("./models/index"),
    User             = require("./models/user"),
    Comment          = require('./models/comment'),
    Emergency        = require("./models/emergency");
//    seedDB           = require("./seeds"),
//   {spawn}          = require('child_process');


// mongoose.connect("mongodb://localhost/mindturner");
mongoose.connect('mongodb+srv://ritam:@BitTU2020@cluster0.vohou.mongodb.net/mindturner?retryWrites=true&w=majority' , {
    useNewUrlParser: true,
    useCreateIndex: true
}).then(() => {
    console.log ('ERROR:', err.message);
});
app.use(bodyParser.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static("public"));
app.use(methodOverride("_method"));
app.use(flash());
//seedDB();

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "it's a secret page!!",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
    res.locals.currentUser = req.user;
    res.locals.error       = req.flash("error");
    res.locals.success     = req.flash("success");
    next();
});



app.get("/", function (req, res){
    res.render("landing");
});

app.get("/index", isLoggedIn, function(req, res){
    Index.find({}, function (err, allIndex){
        if (err){
            console.log(err)
        }else {
            res.render("index", {index: allIndex, currentUser: req.user});
        };
    });
});


app.post("/index", function(req, res){
    var name        = req.body.name,
        image       = req.body.image,
        description = req.body.description,
        author      = {
            id       : req.user._id,
            username : req.user.username
        };

    var newIndex  = {name: name, image: image, description: description, author:author}
    Index.create(newIndex, function(err, newlyCreated){
        if(err){
            console.log(err);
        }else {
                 res.redirect("/index");
            }
    });
});


app.get("/index/new", function (req, res) {
    res.render("new.ejs");
});


app.get("/index/:id", function (req, res){
    Index.findById(req.params.id).populate("comments").exec(function(err, foundIndex){
        if(err) {
                     console.log(err);
                } else {
                         res.render("show", {index: foundIndex});
                    };
    });
});


app.get("/index/:id/edit", checkPostOwnership, function(req, res){
    Index.findById(req.params.id, function(err, foundIndex){
        res.render("edit", {index: foundIndex});
    });
});


app.put("/index/:id", checkPostOwnership, function (req, res){
    Index.findByIdAndUpdate(req.params.id, req.body, function(err, updatedIndex){
        if(err){
            res.redirect("/index");
        }else {
                res.redirect("/index/" + req.params.id);
            }
    });
});

app.delete("/index/:id", checkPostOwnership, function (req, res){
    Index.findByIdAndRemove(req.params.id, function (err){
        if (err) {
            res.redirect("/index");
        }else {
                    res.redirect("/index");
             }
    });
});



// REgister
app.get("/register", function(req, res){
    res.render("register");
});

app.post("/register", function(req, res){
    var newUser = new User({username: req.body.username});
    User.register(newUser, req.body.password, function(err, user){
        if(err){
            console.log(err);
            return res.render("register");
        }
        passport.authenticate("local")(req, res, function(){
            res.redirect("/index");
        });
    });
});

//LOGIN
app.get("/login", function(req, res){
    res.render("login");
});


app.post("/login", passport.authenticate("local",
    {
        successRedirect:"/index",
        failureRedirect:"/login"
    }),function(req, res){
});


app.get("/logout", function (req, res){
    req.logout();
    req.flash("success", "Sorry to see you go!!!")
    res.redirect("/");
});

// middleware------------------------------------------------------------------

function isLoggedIn(req, res, next){
    if (req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You need to be logged in first!!! " );
    res.redirect("/login");
};

function checkPostOwnership(req, res, next) {
    if(req.isAuthenticated()){
        Index.findById(req.params.id, function(err, foundIndex){
            if(err){
                res.redirect("back");
            } else {
                if(foundIndex.author.id.equals(req.user._id)){
                    next()
                } else{
                    res.redirect("back");
                };
            };
        });
    } else {
        res.flash("error", "You need to be logged in first!!! ");
        res.redirect("back");
    }
};

function checkCommentOwnership(req, res, next) {
    if(req.isAuthenticated()){
           Comment.findById(req.params.comment_id, function(err, foundComment){
              if(err){
                  res.redirect("back");
              }  else {
                  // does user own the comment?
               if(foundComment.author.id.equals(req.user._id)) {
                   next();
               } else {
                   res.flash("error", "You don't have permission to do that ")
                   res.redirect("back");
               };
              };
           });
       } else {
           res.redirect("back");
       };
   };


app.get("/emergency", function (req, res){
    res.render("emergency");
});





app.post("/emergency", function (req, res) {
    var Yname = req.body.Yname,
        Sname = req.body.Sname,
        add = req.body.add,
        add2 = req.body.add2,
        Ynumber = req.body.Ynumber,
        Snumber = req.body.Snumber,
        problems = req.body.problems;

    var newEmergency = { Yname: Yname, Sname: Sname, add: add, add2:add2, Ynumber: Ynumber,Snumber: Snumber, problems: problems }
    Emergency.create(newEmergency, function (err, newlyCreated){
        if(err){
            console.log(err);
        }else{
            console.log(newEmergency);
            res.redirect("/index");
        }
    });
});

app.get("/game1", function (req, res){
    res.render("circles");
});

app.get("/generalfacts", function(req, res){
    res.render("generalfacts") ;
});

app.get("/question", function(req, res){
    res.render("question");
});

app.get("/category", function(req, res){
    res.render("category");
});

//app.get("/self", function (req, res){
  //  var dataToSend;
    // spawn new child process to call the python script
   // const python = spawn('python', ['self.py']);
    // collect data from script
    //python.stdout.on('data', function (data) {
     //console.log('Pipe data from python script ...');
     //dataToSend = data.toString();
   // });
    // in close event we are sure that stream from child process is closed
//    python.on('close', (code) => {
//    console.log(`child process close all stdio with code ${code}`);
    //    send data to browser
    //res.send(dataToSend);
//});

//})

app.get("/index/:id/comments/new", isLoggedIn, function (req, res){
    Index.findById(req.params.id, function(err,index){
        if(err){console.log(err)}
        else{
            res.render("comments/new", {index: index});
        };
    });
});

app.post("/index/:id/comments", function(req, res){
    Index.findById(req.params.id, function (err, index){
        if (err) {
                    console.log(err);
                    res.redirect("/index");
            }else {
                    Comment.create(req.body.comment, function (err, comment){
                        if (err) { console.log(err)}
                        else {
                            comment.author.id = req.user._id;
                            comment.author.username = req.user.username;
                            //save comment
                            comment.save();
                            index.comments.push(comment);
                            index.save();
                            res.redirect('/index/' + index._id);
                            }
                    });
                };
    });
});


app.get("/index/:id/comments/:comment_id/edit",checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function(err, foundComment){
       if(err){
           res.redirect("back");
       } else {
         res.render("comments/edit", {index_id: req.params.id, comment: foundComment});
       }
    });
 });
 
 // COMMENT UPDATE
 app.put("/index/:id/comments/:comment_id", checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
       if(err){
           res.redirect("back");
       } else {
           res.redirect("/index/" + req.params.id );
       }
    });
 });
 
 // COMMENT DESTROY ROUTE
 app.delete("/index/:id/comments/:comment_id", checkCommentOwnership, function(req, res){
     //findByIdAndRemove
     Comment.findByIdAndRemove(req.params.comment_id, function(err){
        if(err){
            res.redirect("back");
        } else {
            res.redirect("/index/" + req.params.id);
        }
     });
 });


// app.listen(3000, function(){
//    console.log("Server has started!!!");
// });

// app.listen(process.env.PORT, process.env.IP, function(){
//     console.log("Mhrd Server Has Started!");
//  });

app.listen(process.env.PORT || 3000);