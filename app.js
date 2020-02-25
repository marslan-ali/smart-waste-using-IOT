const express = require('express');
const path = require('path');
const cookieSession = require('cookie-session');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const createError = require('http-errors');

const auth = require('./lib/auth');
require('dotenv').config();

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME,
});

db.connect(err => {
  if (err) throw err;
  console.log('Connected!');
});

const EmployeeService = require('./services/EmployeeService');
const AvatarService = require('./services/AvatarService');

const employeeService = new EmployeeService(db);
const avatars = new AvatarService(path.join(__dirname, './data/avatars'));
const routes = require('./routes');

const app = express();

const port = 3000;

app.set('trust proxy', 1);

app.use(
  cookieSession({
    name: 'session',
    keys: ['asadqwqwgfdgf', 'qewr213552345dsf'],
  })
);
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(session({
  secret: 'very secret',
  resave: true,
  saveUninitialized: false
}));

const passportConf = auth.passportConfig({employeeService});

app.use(passportConf.initialize);
app.use(passportConf.session);
app.use(passportConf.setUser);

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes({ employeeService, avatars }));

app.use((req, res, next) => {
  return next(createError(404, 'Sorry but we couldn\'t find this page'));
});

app.use((err, req, res, next) => {
  res.locals.message = err.message;
  const status = err.status || 500;
  res.locals.status = status;
  res.status(status);
  res.render('error');
});

app.listen(port, () => {
  console.log(`Express server listening port on ${port}!`);
});
