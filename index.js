const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const bodyParser = require('body-parser');



app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());


mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
  username: {type: String, required: true, unique: true },

},
{versionKey: false});

const exercisesChema = new mongoose.Schema({
  userId : {type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  description: {type: String, required: true},
  duration: {type: Number, required: true},
  date: {type: Date, default: Date.now}
},
{versionKey: false});


const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exercisesChema);


//POST /api/users - Create a new user
app.post('/api/users', async (req, res) => {
  const {username} = req.body;
  try {
    const newUser = new User({username});
    await newUser.save();
    res.json({username: newUser.username, _id: newUser._id});

  } catch (error) {
    res.status(400).json({error: 'Failed to create new user'});
  }
});


//GET /api/users - Retrieve a list of users 
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find({});
    res.json(users);
  } catch (error) {
    res.json({error: 'Failed to retrieve users'});
  }
});

//POST /api/users/:_id/exercises - Add an exercises for a user 
app.post('/api/users/:_id/exercises', async(req, res) => {
  const {_id} = req.params;
  const {description, duration, date} = req.body;

  try {
    const user = await User.findById(_id);
    if (!user) return res.json({error: 'User not found'});

    const newExercise = new Exercise({
      userId: _id,
      description,
      duration,
      date: date ? new Date(date) : new Date(),
    });

    await newExercise.save();
    res.json({
      _id: user._id,
      username: user.username,
      date: newExercise.date.toDateString(),
      duration: newExercise.duration,
      description: newExercise.description,
    })

  } catch (error) {
    res.json({error: 'Failed to add exercise'})
  }
})

//GET user's exercise log 

app.get('/api/users/:_id/logs', async(req, res) => {
  const {_id} = req.params;
  const {from, to, limit} = req.query;

  try {
    const user = await User.findById(_id);
    if (!user) {
      return res.json({error: 'User not found' });
    }

    let filter = {userId: _id};
    if (from || to) {
      filter.date = {};
      if (from) {
        filter.date.$gte = new Date(from);
      }
      if (to) {
        filter.date.$lte = new Date(to);
      }
    }
    let exercises = await Exercise.find(filter).limit(parseInt(limit)).exec();

    exercises = exercises.map((exercise) => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString(),

    }));

    res.json({
      _id: user._id,
      username: user.username,
      count: exercises.length,
      log: exercises
    })


  } catch (error) {
    res.json({error: "Failed to retrieve exercise log"});

  }

}) 





app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});









const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
