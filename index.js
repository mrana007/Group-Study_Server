const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
require("dotenv").config();
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
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const assignmentCollection = client.db("groupStudyDB").collection("assignment");
    const submittedAssignmentsCollection = client.db("groupStudyDB").collection('submittedAssignments');

    // receive assignment data to server from client
    // read data
    app.get("/assignment", async (req, res) => {
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

     // submittedAssignments Collection add
     app.post('/submittedAssignments', async (req, res) => {
      const submittedAssignments = req.body;
      const result = await submittedAssignmentsCollection.insertOne(submittedAssignments)
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
