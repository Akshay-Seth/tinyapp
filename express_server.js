const express = require("express");
const app = express();
const PORT = 8080; // default port 8080

const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({extended: true}));

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




app.set("view engine", "ejs");

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
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
    const templateVars = { urls: urlDatabase}
    res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  console.log(req.body);  // Log the POST request body to the console
  const newUrl = generateRandomString();
  urlDatabase[newUrl] = req.body.longURL;
  console.log(urlDatabase)
  console.log(200)
  res.send(`New url made for ${req.body.longURL}`);  // Respond with whatever is in ''
});

app.get("/urls/new", (req, res) => {
  res.render("urls_news");
});

app.post("/urls/:shortURL/delete",(req, res) =>{
  const Idtodelete = req.params.shortURL;
  delete urlDatabase[Idtodelete];
  res.redirect("/urls");
})

app.get("/urls/:shortURL",(req, res) =>{
    let shortURL = req.params.shortURL;
    const templateVars = { shortURL: shortURL, longURL: urlDatabase[shortURL]};
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

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});
