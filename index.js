const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose');
const { Schema } = mongoose;

mongoose.connect(process.env.DB_URL)


const UserSchema = new Schema({
  username: String
});

const ExerciseSchema = new Schema({
  user_id: {type: String, required: true},
  description : String,
  duration : Number,
  date : Date
});
const User= mongoose.model("User", UserSchema)
const Excercise = mongoose.model("Exercise", ExerciseSchema)

app.use(cors())
app.use(express.static('public'))
app.use(express.urlencoded({extended: true}))


app.get("/api/users", async(req, res)=>{
  const users = await User.find({}).select("_id username");
  if(!users){
    res.send("No users")
  }else{
    res.json(users)
  }

})

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.post('/api/users',async (req, res) =>{
  const userObj = new User({
    username: req.body.username
  })
  try{
    const user = await userObj.save()
    console.log(user)
    res.json(userObj)
  }catch(error){
    console.error(error)
  }
});
app.post("/api/users/:_id/exercises", async(req, res) => {
  const id = req.params._id;
  const {description, duration, date} = req.body

  try {
    const user = await User.findById(id)
    if(!user){
      res.send("User could not be found")
    }else{
      const objExercise = new Excercise({
        user_id: user._id,
        description,
        duration,
        date: date ? new Date(date) : new Date()
      })
      const exercise = await objExercise.save()
      res.json({
        _id: user._id,
        username: exercise.username,
        duration: exercise.duration,
        description: exercise.description,
        date: new Date(exercise.date).toDateString()
      })
    }
  } catch (error) {
      console.error(error)
      res.send("Error ahead")
  }
});

app.get("/api/users/:_id/logs", async(req, res)=> {
  const {from, to, limit} = req.query;
  const id = req.params._id;
  const user = await User.findById(id);

  if(!user){
    res.send("Could not find user");
    return;}
  let datObj = {}
  if(from){
    datObj["$gte"] = new Date(from);
  }
  if(to){
    datObj["$lte"] = new Date(to);
  }

  let filter = {
    user_id: id 
  }

  if(from || to){
    filter.date = datObj;
  }

  const exercises = await Excercise.find(filter).limit(+limit ?? 500);

  const log = exercises.map(e =>(
    {
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
    }
  ))

  res.json({
    username: user.username,
    count: exercises.length,
    _id: user._id,
    log
  })

});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
