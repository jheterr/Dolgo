module.exports = {
    isAuthenticated: (req, res, next) => {
        if (req.session.user) {
            return next();
        }
        res.redirect('/login');
    },

    isAdmin: (req, res, next) => {
        if (req.session.user && (req.session.user.role === 'admin' || req.session.user.role === 'super_admin')) {
            return next();
        }
        res.status(403).render('error', { message: 'Unauthorized: Admin access required', error: {} });
    },

    isStaff: (req, res, next) => {
        if (req.session.user && (req.session.user.role === 'staff' || req.session.user.role === 'admin')) {
            return next();
        }
        res.status(403).render('error', { message: 'Unauthorized: Staff access required', error: {} });
    },

    isCustomer: (req, res, next) => {
        if (req.session.user && req.session.user.role === 'customer') {
            return next();
        }
        res.redirect('/login');
    }
};
