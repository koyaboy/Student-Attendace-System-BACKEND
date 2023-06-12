const restrictToRole = (role) => {
    return (req, res, next) => {
        const { user } = req;
        if (user && user.role === role) {
            next(); // User has the required role, proceed to the next middleware/route handler
        } else {
            return res.status(403).json({ error: "Forbidden" }); // User does not have the required role
        }
    };
};
