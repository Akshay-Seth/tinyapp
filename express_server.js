const express = require("express");
const app = express();
const PORT = 8080; // default port 8080
const cookieParser = require("cookie-parser");

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(cookieParser());
function generateRandomString() {
  const characters ='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  length = 6;
  let result = ' ';
    const charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
}

const usersDatabase = { 
  "user1RandomID": {
    id: "user1RandomID", 
    email: "user@example.com", 
    password: "1"
  },
 "user2RandomID": {
    id: "user2RandomID", 
    email: "user2@example.com", 
    password: "funk"
  }
}
let i =2
const generateid =() =>{
  i++
  return `user${i}RandomID`
}

const urlDatabase = {
  b6UTxQ: { longURL: "https://www.tsn.ca", userID: "user1RandomID" },
  i3BoGr: { longURL: "https://www.google.ca", userID: "user1RandomID" }
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
    res.json(urlDatabase);
  });

app.get("/hello", (req, res) => {
    res.send("<html><body>Hello <b>World</b></body></html>\n");
  });

app.get("/urls", (req, res) =>{
  const templateVars = {
    username:req.cookies['userId'],
    urls: urlDatabase
  };
    res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const newUrl = generateRandomString();
  const long = req.body.longURL;
  const id =req.cookies['userId'];
  urlDatabase[newUrl] = {LongURL: long, userID: id};
  console.log(urlDatabase)
  console.log(200)
  res.send(`New url made for ${req.body.longURL}`);  // Respond with whatever is in ''
});

app.get("/urls/new", (req, res) => {
   const templateVars = {
    username: req.cookies['userId'],
 };
  res.render("urls_news",templateVars);
});

app.post("/urls/:shortURL/delete",(req, res) =>{
  const Idtodelete = req.params.shortURL;
  delete urlDatabase[Idtodelete];
  res.redirect("/urls");
})
app.get("/login",(req,res)=>{
  const templateVars = {
    username: req.cookies['userId'],
    urls: urlDatabase
  };
  res.render("urls_login",templateVars);
});

app.post("/login",(req,res) =>{
  const email = req.body.email;
  const password = req.body.password;
  // const templateVars = {
  //   username: req.cookies["user"],
  //   urls: urlDatabase
  // };
  // res.render("urls_index", templateVars);
  let foundUser;
  for (const userId in usersDatabase) {
    const user = usersDatabase[userId];
    if (user.email === email) {
      foundUser = user;
    }
  }
  if (!foundUser) {
    res.status(401).send('could not find user with that email');
  }

  // compare the user's password
  if (foundUser.password !== password) {
    // if the passwords don't match, send back an error response
    res.status(401).send('password is not correct');
  }

  // set the cookie and redirect to the main page
  res.cookie('userId', foundUser.id);
  res.redirect("/urls");
})
app.post("/logout",(req,res)=>{
  res.clearCookie('userId');
  res.redirect("/urls");
})

app.get("/urls/:shortURL",(req, res) =>{
    let shortURL = req.params.shortURL;
    const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL],
      username: req.cookies['userId']};
    res.render("urls_shows", templateVars);
});

app.post("/urls/:shortURL",(req, res) =>{
  const longURL = req.body.longURL;
  const shortURL = req.params.shortURL;
  urlDatabase[shortURL] = longURL;
  res.redirect("/urls");
});

app.get("/u/:shortURL", (req, res) => {
  let shortURL = req.params.shortURL;
  const longURL = urlDatabase[shortURL];
  console.log(urlDatabase);
  console.log('shortURL', shortURL);
  res.redirect(longURL);
});
app.get("/register",(req,res)=>{
  const templateVars = {
    username: req.cookies['userId'],
    urls: urlDatabase
  };
  res.render("urls_register",templateVars);
});
app.post("/register",(req,res)=>{
  const email = req.body.userID;
  const password = req.body.password;
  const newID = generateid()
  const newUsers ={
    id:newID,
    email,
    password,
  }
  for (const userId in usersDatabase) {
    const user = usersDatabase[userId];
    if (user.email === email) {
      return res.status(400).send('email already in use');
    }
  }

  if (!email || !password) {
    return res.status(401).send('you must enter an email AND a password');
  } else {
    usersDatabase[newID] = email
    console.log(usersDatabase);
    res.redirect("/urls");
  }
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
