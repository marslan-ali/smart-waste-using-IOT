const express = require('express');
const { check, validationResult } = require('express-validator');
const createError = require('http-errors');
const middlewares = require('./middlewares');

const router = express.Router();

const validations = [
  check('full_name')
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage('A name is required'),
  check('cnic')
    .trim()
    .isLength({ min: 15, max: 15 })
    .escape()
    .withMessage('A valid CNIC is required'),
  check('email')
    .trim()
    .isEmail()
    .normalizeEmail()
    .withMessage('A valid email is required'),
  check('contact')
    .isLength({ min: 12, max: 12 })
    .escape()
    .withMessage('A valid contact is required'),
  check('dob')
    .not()
    .isEmpty()
    .withMessage('Date of birth is required'),
  check('gender')
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage('Gender is required'),
  check('home_address')
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage('An address is required'),
  check('employee_type')
    .not()
    .isEmpty()
    .withMessage('Employee type is required'),
  check('shift')
    .not()
    .isEmpty()
    .withMessage('Shift type is required'),
  check('account_no')
    .not()
    .isEmpty()
    .trim()
    .escape()
    .withMessage('A valid account number is required'),
  check('passwrd')
    .trim()
    .isLength({ min: 6 })
    .escape()
    .withMessage('A valid password is required'),
];

module.exports = params => {
  const { employeeService, avatars } = params;

  router.get('/', async (req, res, next) => {
    try {
      const employees = await employeeService.getEmployees();

      return res.render('layout', {
        title: 'Employees',
        template: 'employee/index',
        employees,
      });
    } catch (e) {
      return next(e);
    }
  });

  router.get('/profile/:employeeId', async (req, res, next) => {
    try {
      const result = await employeeService.getEmployeeById(req.params.employeeId);
      return result
        ? res.render('layout', {
            title: result.full_name,
            template: 'employee/detail',
            employee: result,
          })
        : next(createError(404, "That user doesn't exist"));
    } catch (e) {
      return next(e);
    }
  });

  router.get('/new', (req, res) => {
    const errors = req.session.employee ? req.session.employee.errors : false;
    const employeeId = req.session.employee ? req.session.employee.employeeId : false;
    req.session.employee = {};

    res.render('layout', {
      title: 'Add Employee',
      template: 'employee/new',
      errors,
      employeeId,
    });
  });

  router.post(
    '/new',
    middlewares.upload.single('avatar'),
    middlewares.handleAvatar(avatars),
    validations,
    async (req, res, next) => {
      const errors = validationResult(req);

      if (!errors.isEmpty()) {
        req.session.employee = { errors: errors.array() };
        return res.redirect('/employee/new');
      }

      try {
        if (req.file && req.file.storedFilename) {
          req.body.avatar = req.file.storedFilename;
        }

        const insertId = await employeeService.addEmployee(req.body);
        req.session.employee = { employeeId: insertId };
        return res.redirect('/employee/new');
      } catch (error) {
        if (req.file && req.file.storedFilename) {
          await avatars.delete(req.file.storedFilename);
        }

        return next(error);
      }
    }
  );

  router.get('/avatar/:filename', (req, res) => {
    res.type('png');
    return res.sendFile(avatars.filepath(req.params.filename));
  });

  return router;
};
