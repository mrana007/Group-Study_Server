const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken');
const cookieParser =require('cookie-parser');
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors({
  origin: [
    "https://a11-group-study.web.app",
    "https://a11-group-study.firebaseapp.com"
    
  ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4kezvwg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// middlewares for jwt
const logger =async(req, res, next)=>{
  console.log('log info:', req.method, req.url)
  next();
};
const verifyToken =async(req, res, next)=>{
  const token = req.cookies?.token;
  console.log('value of token in middleware', token);
  if(!token){
    return res.status(401).send({message: " not authorized"})
  }
  next();
};

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const assignmentCollection = client.db("groupStudyDB").collection("assignment");
    const submittedAssignmentsCollection = client.db("groupStudyDB").collection('submittedAssignments');
    const giveMarkCollection = client.db("groupStudyDB").collection('giveMarks');

    // auth related api
    app.post('/jwt', logger, async(req, res) =>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
      res
      .cookie('token', token, {
        httpOnly: true,
        secure: true,
        sameSite: 'none'
      })
      .send({success: true});
    });

    app.post('/logout', async(req, res)=>{
      const user = req.body;
      console.log('logging out', user);
      res.clearCookie('token', {maxAge: 0}).send({success: true})
    });

    // read data
    app.get("/assignment", logger, async (req, res) => {
      const cursor = assignmentCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    // create data
    app.post("/assignment", async (req, res) => {
        const newAssignment = req.body;
        console.log(newAssignment);
        const result = await assignmentCollection.insertOne(newAssignment);
      res.send(result);
    });
    
    // update assignment
    app.get('/assignment/:id', async(req, res)=>{
        const id = req.params.id;
        const query = {_id: new ObjectId(id)};
        const result = await assignmentCollection.findOne(query);
        res.send(result);
    });

    app.put("/assignment/:id", async(req, res) =>{
        const id = req.params.id;
        const filter = {_id: new ObjectId(id)};
        const options = { upsert: true };
        const updatedAssignment = req.body;
        const assignment = {
            $set: {
                title:updatedAssignment.title,
                marks:updatedAssignment.marks,
                image:updatedAssignment.image,
                category:updatedAssignment.category,
                creator:updatedAssignment.creator,
                date:updatedAssignment.date,
                description:updatedAssignment.description
            }
        }
        const result = await assignmentCollection.updateOne(filter, assignment, options);
        res.send(result);
    });

     // submittedAssignments Collection add and get
    //  get
    app.get("/submittedAssignments", async (req, res) => {
      const cursor = submittedAssignmentsCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });

    //  add
     app.post('/submittedAssignments', async (req, res) => {
      const submittedAssignments = req.body;
      const result = await submittedAssignmentsCollection.insertOne(submittedAssignments)
      res.send(result)
    });
        // get all complete assignments
        app.get('/giveMarks',  async (req, res) => {
          let query = {};
          console.log("query", req.query);
          if (req.query?.creator) {
              query = { creator: req.query?.creator }
          }
          const result = await giveMarkCollection.find(query).toArray();
          res.send(result);
      })
    // Give marks
    // get give marks
    app.get('/submittedAssignments/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) }
      const result = await submittedAssignmentsCollection.findOne(query);
      res.send(result);
  });
  // update status pending to confirm
  app.put('/submittedAssignments/:id', async (req, res) => {
    const id = req.params.id;
    const data = req.body; // You should get the count from the request body
    const options = { upsert: true };
    const filter = { _id: new ObjectId(id) };
    const update = {
        $set: {
            status: data.status // Update the applied count with the provided value
        }
    };
    const result = await submittedAssignmentsCollection.updateOne(filter, update, options);
    res.send(result);
});

// get my assignments

app.get('/submittedAssignments/:creator', async (req, res) => {
  const id = req.params.creator;
  const query = { creator: new ObjectId(creator) }
  const result = await submittedAssignmentsCollection.find(query).toArray();
  res.send(result);
});

  // delete
app.delete('/assignment/:id', async (req, res) => {
  const id = req.params.id;
  const query = { _id: new ObjectId(id) }
  const result = await assignmentCollection.deleteOne(query);
  res.send(result);
});

    // add give marks
    app.post('/giveMarks', async (req, res) => {
      const giveMarks = req.body;
      const result = await giveMarkCollection.insertOne(giveMarks)
      res.send(result)
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Study server is running");
});

app.listen(port, () => {
  console.log(`Study server is running on port: ${port}`);
});
