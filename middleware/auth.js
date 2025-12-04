import jwt from "jsonwebtoken";

function requireAuth(req, res, next) {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
    if(!token) return res.status(401).json({message: 'Unauthorized'});
    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
        req.user = payload;
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid token' });
    }
}

function requireRole(roles) {
    return (req, res, next) => {
        if(!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({message: 'Forbidden'});
        }
        next();
    };
}

export default {requireAuth, requireRole};