const express = require("express");
const cors = require("cors");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
//middleware
app.use(cors()); //fetch request won't work if middleware cors is not used
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cardoctor.e9ybvtn.mongodb.net/?retryWrites=true&w=majority&appName=carDoctor`;

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
    const serviceCollection = client.db("carDoctor").collection("services");
    const bookingCollection = client.db("carDoctor").collection("bookings");
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 1, servie_id: 1 },
        //by using options , we can only collect data whatever we needed
        //if value is 1, the info will be fetched
        //if we put value 0, the specific data will be ignored
      };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });
    //fetching data from booking
    app.get("/bookings",async(req,res)=>{
      console.log(req.query);
      let query = {};
      if(req.query?.email)
      query = {email : req.query.email}
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    })
    app.post("/bookings", async(req,res)=>{
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    })
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
    //client connection should be open
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Car doctor server is running");
});
app.listen(port, () => {
  console.log(`Car Doctor server is running on port ${port}`);
});
