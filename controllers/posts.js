import PostMessage from '../models/postMessage.js';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import User from '../models/user.js';

export const getPosts = async (req, res) => {
  try {
    const postMessages = await PostMessage.find().populate('User');
    res.status(200).json(postMessages);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
};

export const createPost = async (req, res) => {
  const { title, message, selectedFile, creator, tags } = req.body;
  const token = req.header('x-auth-token');

  const newPostMessage = new PostMessage({
    title,
    message,
    selectedFile,
    creator,
    tags
  });

  if (!token) {
    return res.status(401).json({ message: 'Token missing.' });
  }
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!decodedToken.id) {
    return res.status(401).json({ message: 'Token invalid.' });
  }

  if (!newPostMessage.title || !newPostMessage.message) {
    return res.status(400).send({ error: 'Title or message missing.' });
  }

  const user = await User.findById(decodedToken.id);
  newPostMessage.user = user;
  user.posts = user.posts.concat(newPostMessage.id);

  await user.save();

  try {
    await newPostMessage.save();
    res.status(201).json(newPostMessage);
  } catch (error) {
    res.status(409).json({ message: error.message });
  }
};

export const deletePost = async (req, res) => {
  const { id } = req.params;

  const token = req.header('x-auth-token');

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!token || !decodedToken.id) {
    return res.status(401).json({ message: 'Token missing or invalid.' });
  }
  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  const user = await User.findById(decodedToken.id);
  const post = await PostMessage.findById(id);

  if (post.user.toString() !== user.id.toString()) {
    return response
      .status(401)
      .json({ message: 'Only the creator can delete his post.' });
  }

  await post.remove();
  user.posts = user.posts.filter((post) => post.toString() !== id.toString());

  await user.save();

  res.json({ message: 'Post deleted successfully.' });
};

export const updatePost = async (req, res) => {
  const { id } = req.params;
  const { title, message, selectedFile, tags } = req.body;

  const token = req.header('x-auth-token');
  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

  if (!token || !decodedToken.id) {
    return res.status(401).json({ message: 'Token missing or invalid.' });
  }

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  const user = await User.findById(decodedToken.id);
  const post = await PostMessage.findById(id);

  if (post.user.toString() !== user.id.toString()) {
    return response
      .status(401)
      .json({ message: 'Only the creator can update his post.' });
  }

  const updatedPost = {
    title,
    message,
    selectedFile,
    tags
  };

  const returnedUpdatedPost = await PostMessage.findByIdAndUpdate(
    id,
    updatedPost,
    {
      new: true
    }
  );

  res.status(200).json(returnedUpdatedPost);
};

export const likePost = async (req, res) => {
  //change name to toggleLikePost
  const { id } = req.params;

  const token = req.header('x-auth-token');

  const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
  if (!token || !decodedToken.id) {
    return res.status(401).json({ message: 'Token missing or invalid.' });
  }

  if (!mongoose.Types.ObjectId.isValid(id))
    return res.status(404).send(`No post with id: ${id}`);

  const post = await PostMessage.findById(id);
  let updatedPost;

  if (post.likedFrom.includes(decodedToken.id.toString())) {
    updatedPost = await PostMessage.findByIdAndUpdate(
      id,
      {
        likeCount: post.likeCount - 1,
        likedFrom: post.likedFrom.filter(
          (likeFrom) => likeFrom.toString() != decodedToken.id.toString()
        )
      },
      {
        new: true
      }
    );
  } else {
    updatedPost = await PostMessage.findByIdAndUpdate(
      id,
      {
        likeCount: post.likeCount + 1,
        likedFrom: post.likedFrom.concat(decodedToken.id)
      },
      {
        new: true
      }
    );
  }

  res.status(200).json(updatedPost);
};
