var express = require('express');
var router = express.Router();
const userModal = require("./users")
const postModal = require("./post")
const passport = require('passport')
const localStrategy = require("passport-local");
const upload = require("./multer")


passport.use(new localStrategy(userModal.authenticate()));


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get('/profile', isLoggedIn, async function(req, res, next) {
  const user =  await userModal.findOne({username: req.session.passport.user})
  .populate("posts");
  res.render("profile", {user, message: req.flash('message')})
});

router.get("/login", function(req, res, next){
  res.render("login", {error: req.flash('error')});
})

router.get("/feed", function(req, res, next){
  res.render("feed");
})

router.post("/upload",isLoggedIn, upload.single("file") ,async function(req, res, next){
  if(!req.file){
    return res.status(400).send("File Not Uploaded");
  }
  const user = await userModal.findOne({username: req.session.passport.user});
  const postdata = await postModal.create({
    image: req.file.filename,
    postText: req.body.filecaption,
    user: user._id
  });
  
  user.posts.push(postdata._id);
  await user.save();
  req.flash('message', "File Uploaded Succesfully");
  res.redirect("/profile")

  
})

// router.get("/allusers", async function(req, res, next){
//     let users = await userModal.findOne({_id:"658ab4dec5407b10602bd99f"}).populate("posts");
//     res.send(users);
// });

// router.get('/createuser', async function(req, res, next) {
//  let createduser = await userModal.create({
//     username: "Kartik",
//     password: "nahipata",
//     posts: [],
//     email: "kartik@gmail.com",
//     fullname: "Kartik Satish Bankar",
//   });

//   res.send(createduser);
// });

// router.get('/createpost', async function(req, res, next) {
//   let createdpost = await postModal.create({
//     postText: "Hello My friend",
//     user:"658ab4dec5407b10602bd99f",
//    });

//    let user = await userModal.findOne({_id:"658ab4dec5407b10602bd99f"});
//    user.posts.push(createdpost._id);
//    await user.save();
//    res.send("Done");
//  });

router.post("/register", function(req, res, next){
    const userData = new userModal({
      username : req.body.username,
      email: req.body.email,
      fullname: req.body.fullname,
    });

    userModal.register(userData, req.body.password).then(function(){
      passport.authenticate("local")(req, res, function(){
        res.redirect("/profile")
      })
    })
});


router.post("/login", passport.authenticate("local", {
  successRedirect: "/profile",
  failureRedirect: "/login",
  failureFlash: true,
}), function(req, res){});

router.get('/logout', function(req, res, next){
  req.logout(function(err){
    if(err) {return next(err);}
    res.redirect('/')
  });
})

function isLoggedIn(req, res, next){
  if(req.isAuthenticated()){
    return next();
  }
  res.redirect("/login");
}



module.exports = router;
