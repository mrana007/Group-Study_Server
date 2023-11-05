const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

// middleware
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4kezvwg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const assignmentCollection = client.db('groupStudyDB').collection('assignment')

    // receive assignment data server from client
    // read
    app.get("/assignment", async(req, res) =>{
        const cursor = assignmentCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    })

    // create data
    app.post("/assignment", async(req, res) =>{
        const newAssignment = req.body;
        console.log(newAssignment);
        const result = await assignmentCollection.insertOne(newAssignment);
        res.send(result);
    });

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
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
