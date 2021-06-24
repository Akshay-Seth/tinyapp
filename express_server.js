const express = require('express');
const bodyParser = require('body-parser');
const cookieSession = require('cookie-session');
const quickEncrypt = require('quick-encrypt');
const {
  validateURL, genRandomString, dateParser, hashPass,
} = require('./helperFuntions');

const keys = quickEncrypt.generate(1024);
const publicKey = keys.public;
const privateKey = keys.private;

const app = express();
const PORT = 8080;

// use ejs engine
app.set('view engine', 'ejs');
// setup body parser, get all tags
app.use(bodyParser.urlencoded({ extended: true }));
// public mapping of /img for images
app.use('/img', express.static(`${__dirname}/public/img`));
// public mapping of /public
app.use(express.static('public'));
// set keys for sessions
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));


// user class initiates uid, email, hash, and date created
class User {
  constructor(uid, email, passHash) {
    this.uid = uid;
    this.email = email;
    this.passHash = passHash;
    this.created = Date.now();
    this.sites = {};
  }
}

// H A R D C O D E D   U S E R   D A T A //////////////////
// two sample user accounts for debugging
const usersDB = {
  u1ou: {
    uid: 'u1ou',
    email: 'clint.pearce@rocketmail.com',
    passHash: hashPass('test', publicKey),
    created: Date.now(),
    sites: {
      lhL: {
        urlShort: 'lhL',
        urlLong: 'https://www.lighthouselabs.ca',
        visits: 0,
        created: dateParser(Date.now()),
      },
      goo: {
        urlShort: 'goo',
        urlLong: 'https://www.google.ca',
        visits: 0,
        created: dateParser(Date.now()),
      },
    },
  },
  test: {
    uid: 'test',
    email: 'admin@ironmantle.ca',
    passHash: hashPass('password', publicKey),
    created: Date.now(),
    sites: {
      omb: {
        urlShort: 'omb',
        urlLong: 'https://ombi.ironmantle.ca',
        visits: 0,
        unique: 0,
        created: dateParser(Date.now()),
      },
      go0: {
        urlShort: 'go0',
        urlLong: 'https://www.google.ca',
        visits: 0,
        unique: 0,
        created: dateParser(Date.now()),
      },
    },
  },
};
// a map to map user accounts and sites, to easy to read objects
const emails = [...Object.keys(usersDB).map((user) => usersDB[user].email)];
const linkBook = {};
const linkBookBuilder = () => {
  Object.keys(usersDB).map((user) => {
    Object.keys(usersDB[user].sites).forEach((site) => {
      linkBook[site] = usersDB[user].sites[site];
      linkBook[site].user = user;
    });
  });
};
// run linkBookBuilder to initialize the linkBook Object
linkBookBuilder();

app.get('/', (req, res) => {
  if (!req.session.uid) {
    res.redirect('/login');
  } else {
    res.redirect('/urls');
  }
});


// login to tinyApp
app.get('/login', (req, res) => {
  if (req.session.uid) res.redirect('urls');
  res.render('login');
});

// R E G I S T E R   G E T
// register a new account
app.get('/register', (req, res) => {
  res.render('register');
});

app.get('/urls', (req, res) => {
  linkBookBuilder();
  if (!req.session.uid) {
    res.render('errorPage', { status: 400, error: 'Not Logged In!' });
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
    };
    res.render('urlsIndex', templateVars);
  }
});
// create a new url route
app.get('/urls/new', (req, res) => {
  if (!req.session.uid) {
    res.render('login');
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
    };
    res.render('urls_news', templateVars);
  }
});
// examine details of url
app.get('/urls/:shortURL', (req, res) => {
  if (!req.session.uid) {
    res.render('errorPage', { status: 400, error: 'You need to be logged in to do that!' });
  } else if (!Object.keys(linkBook).includes(req.params.shortURL)) {
    res.render('errorPage', { status: 404, error: 'Sorry that link doesn\'t exist!' });
  } else if (req.session.uid !== linkBook[req.params.shortURL].user) {
    res.render('errorPage', { status: 401, error: 'Sorry you don\'t own this link!' });
  } else {
    const templateVars = {
      user: usersDB[req.session.uid],
      site: linkBook[req.params.shortURL],
      shortURL: req.params.shortURL,
    };
    if (req.session.uid === usersDB[shortURL].uid) {
      res.redirect(`/urls/${shortURL}`);
    }
    res.render('urlExamine', templateVars);
  }
});

// error page if not directed automatically
app.get('/error', (req, res) => {
  res.render('errorPage');
});

// Routes for all webpages 

// post login credentials
app.post('/login', (req, res) => {
  // if the info isn't filled in
  if (!req.body.email || !req.body.password) {
    res.render('errorPage', { status: 400, error: 'All Data Fields Must Be Filled Out!' });
  } else {
    // match the email and plaintext password to the
    // unencrypted password matching this email
    try {
      const emailMatch = Object.keys(usersDB)
        .filter((user) => usersDB[user].email === req.body.email);
      const passwordHash = hashPass(req.body.password, publicKey);
      if (
        quickEncrypt.decrypt(passwordHash, privateKey)
        === quickEncrypt.decrypt(usersDB[emailMatch].passHash, privateKey)) {
        req.session.uid = usersDB[emailMatch].uid;
        res.redirect('/urls');
      } else {
        res.render('errorPage', { status: 401, error: 'Wrong Credentials!' });
      }
    } catch (err) {
      res.render('errorPage', { status: 401, error: 'Wrong Credentials!' });
    }
  }
});

// logout and clear cookie session
app.post('/logout', (req, res) => {
  req.session = null;
  res.redirect('/login');
});

// register new user post route
app.post('/register', (req, res) => {
  const uid = genRandomString();
  const matchingemail =Object.keys(usersDB);
  // if the req fields are filled, error
  if (!req.body.email || !req.body.password) {
    res.render('errorPage', { status: 400, error: 'Missing Required Information!' });
    // if the known emails include this email, error
  } else if (!req.body.email === matchingemail) {
    res.render('errorPage', { status: 403, error: 'Email already in Database!' });
    // add the new user by class
  } else {
    usersDB[uid] = new User(
      uid,
      req.body.email,
      hashPass(req.body.password, publicKey),
    );
    req.session.uid = uid;
    res.redirect('/urls');
  }
});

// post a new url to the current logged in account
app.post('/urls', (req, res) => {
  if (!req.session.uid) res.render({ status: 400, error: 'You need to be logged in to do that!' });
  const shortCode = genRandomString();
  usersDB[req.session.uid].sites[shortCode] = {
    urlShort: shortCode,
    urlLong: validateURL(req.body.longURL),
    visits: 0,
    created: dateParser(Date.now()),
  };
  // rebuild the link database
  linkBookBuilder();
  res.redirect(`/urls/${shortCode}`);
});
// delete url, not DELETE method but same results
// manually delete via object deletion
app.post('/:shortURL/delete', (req, res) => {
  if (req.session.uid === linkBook[req.params.shortURL].user) {
    delete usersDB[req.session.uid].sites[req.params.shortURL];
    res.redirect('/urls');
  } else {
    res.render({ status: 401, error: 'All Your Links do NOT Belong To Us!' });
  }
});
// update url, not PUT method but same results
// manually reassign the target full url
app.post('/:shortURL/update', (req, res) => {
  if (!req.session.uid) {
    res.render({ status: 400, error: 'You need to be logged in!' });
    // if current user matches the shortURL owner, update it
  } else if (req.session.uid === linkBook[req.params.shortURL].user) {
    usersDB[req.session.uid].sites[req.params.shortURL].urlLong = req.body.newURL;
    res.redirect('/urls');
    // if the current user and shortURL owner don't match, error
  } else {
    res.render({ status: 401, error: 'All Your Links do NOT Belong To Us!' });
  }
});

// go to target longURL of short link
app.get('/u/:shortURL', (req, res) => {
  linkBookBuilder();
  // if the shortened url doesn't exist, error
  if (!Object.keys(linkBook).includes(req.params.shortURL)) {
    res.render('errorPage', { status: 404, error: 'That URL Does Not Exist Here Friend!' });
  } else {
    usersDB[linkBook[req.params.shortURL].user].sites[req.params.shortURL].visits += 1;
    res.redirect(usersDB[linkBook[req.params.shortURL].user].sites[req.params.shortURL].urlLong);
  }
});

// Starts the listening
app.listen(PORT, () => {
  console.log(`TinyApps listening on port ${PORT}!`);
});