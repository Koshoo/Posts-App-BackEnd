import User from '../models/user.js';

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function validateEmail(email) {
  const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
  return re.test(String(email).toLowerCase());
}

export const createUser = async (req, res) => {
  try {
    const { email, password, passwordCheck } = req.body;
    let { displayName } = req.body;
    if (!email || !password || !passwordCheck) {
      return res
        .status(400)
        .json({ message: 'Not all fields have been entered.' });
    }

    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Email is not valid' });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: 'Password needs to be at least 6 characters long.' });
    }

    if (password !== passwordCheck) {
      return res.status(400).json({ message: 'Passwords do not match.' });
    }

    if (displayName.length < 3) {
      return res
        .status(400)
        .json({ message: 'Display name must be at least 3 characters long.' });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({ message: 'Email already exists.' });
    }

    const salt = await bcrypt.genSalt(10);

    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = new User({
      email,
      password: passwordHash,
      displayName
    });

    const savedUser = await newUser.save();
    res.status(201).json(savedUser);
  } catch (err) {
    if (err.name === 'MongoError' && err.code === 11000) {
      return res.status(422).send({ message: 'Display name already exists.' });
    }

    res.status(500).json({ message: err.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ message: 'Not all fields have been entered.' });
    }

    const user = await User.findOne({ email }).populate('PostMessage');
    if (!user) {
      return res
        .status(400)
        .json({ message: 'No account with this email has been registered.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials.' });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
    res.json({
      token,
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      posts: user.posts
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user);
    res.json(deletedUser);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const getUpdatedUser = async (req, res) => {
  const token = req.header('x-auth-token');

  try {
    if (!token) {
      return res.status(500).json({ message: 'Token missing.' });
    }
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken.id) {
      return res.status(500).json({ message: 'Token invalid.' });
    }
    const user = await User.findById(decodedToken.id);
    res.json({
      token,
      id: user._id,
      displayName: user.displayName,
      email: user.email,
      posts: user.posts
    });
  } catch (err) {
    console.log(err);
  }
};

export const tokenIsValid = async (req, res) => {
  try {
    const token = req.header('x-auth-token');
    if (!token) return res.json(false);
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    if (!verified) return res.json(false);
    const user = await User.findById(verified.id);
    if (!user) return res.json(false);

    res.json(true);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
