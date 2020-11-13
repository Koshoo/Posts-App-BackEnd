import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import postRoutes from './routes/posts.js';
import userRouter from './routes/users.js';

const app = express();

app.use(express.json({ limit: '30mb', extended: true }));
app.use(express.urlencoded({ limit: '30mb', extended: true }));
app.use(cors());

app.use('/posts', postRoutes);
app.use('/users', userRouter);

app.get('/', (req, res) => {
  res.send('Hello from Posts API');
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true
  })
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((error) => console.log(error.message));

mongoose.set('useFindAndModify', false);
