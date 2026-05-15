var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var expressLayouts = require('express-ejs-layouts');
var session = require('express-session');
var MySQLStore = require('express-mysql-session')(session);
var pool = require('./db');

var indexRouter    = require('./routes/index');
var adminRouter    = require('./routes/admin');
var staffRouter    = require('./routes/staff');
var customerRouter = require('./routes/customer');
var loginRouter    = require('./routes/login');
var apiRouter      = require('./routes/api');
var { isAuthenticated, isAdmin, isStaff } = require('./middleware/auth');

var app = express();

// Session store setup
const sessionStore = new MySQLStore({}, pool);

app.use(session({
  key: 'dolgo_session',
  secret: 'cramstation_secret_key_123',
  store: sessionStore,
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Global user context
app.use((req, res, next) => {
    res.locals.user = req.session.user || null;
    next();
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use(logger('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/',         indexRouter);
app.use('/login',    loginRouter);
app.use('/admin',    isAuthenticated, isAdmin, adminRouter);
app.use('/staff',    isAuthenticated, isStaff, staffRouter);
app.use('/customer', isAuthenticated, customerRouter);
app.use('/api',      apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

// Start server if run directly
if (require.main === module) {
  const http = require('http');
  const port = process.env.PORT || 3000;
  app.set('port', port);

  const server = http.createServer(app);
  server.listen(port, () => {
    console.log('\x1b[36m%s\x1b[0m', '---------------------------------------');
    console.log('\x1b[36m%s\x1b[0m', '🛡️  Dolgo Management System');
    console.log('\x1b[36m%s\x1b[0m', `🌐 Server: http://localhost:${port}`);
    console.log('\x1b[36m%s\x1b[0m', '---------------------------------------');
  });
}
