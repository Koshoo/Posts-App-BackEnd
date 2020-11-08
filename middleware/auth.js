import jwt from 'jsonwebtoken';

export const auth = (req, res, next) => {
  try {
    const token = req.headers('x-auth-token');
    if (!token)
      return res
        .status(401)
        .json({ message: 'No authentication token given, access denied.' });
    const verified = jwt.verify(token, process.env.JWT_SECRET);

    if (!verified) {
      return res
        .status(401)
        .json({ message: 'Token verification failed, access denied.' });
    }
    req.user = verified.id;
  } catch (err) {
    res.status(500).json({ error: err.message });
  }

  next();
};
