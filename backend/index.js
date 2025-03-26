const express=require('express');
const dotenv=require('dotenv');
const cors=require('cors');
const mongoose=require('mongoose');
const userRoute=require('./routes/userRoute');
dotenv.config()

mongoose.connect(process.env.DB_URI);

const app=express();
const port=process.env.PORT;

app.use(express.json());
app.use(cors());
// app.use("/",uploadRoute)
app.use("/user",userRoute);

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
  });