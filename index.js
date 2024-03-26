const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
//middleware
//fetch request won't work if middleware cors is not used
app.use(
  cors({
    origin: ["http://localhost:5173"],
    credentials: true,
  })
);
app.use(express.json());
app.use(cookieParser());

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
    //auth related api
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      //to generate secret, use the below  code to generate a random number
      //write node in your terminal, it will open the node environment
      //write the below code
      //require('crypto').randomBytes(64).toString('hex')
      //the above code will generate an random number
      //the secret number is stored in .env file
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1h",
      });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
      });
      res.send({ success: true });
    });
    //seervice related api
    app.get("/services", async (req, res) => {
      const cursor = serviceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });
    app.get("/services/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const options = {
        projection: { title: 1, price: 1, servie_id: 1, img: 1 },
        //by using options , we can only collect data whatever we needed
        //if value is 1, the info will be fetched
        //if we put value 0, the specific data will be ignored
      };
      const result = await serviceCollection.findOne(query, options);
      res.send(result);
    });
    //fetching data from booking
    app.get("/bookings", async (req, res) => {
      console.log(req.query.email);
      console.log("token is : ", req.cookies.token);
      let query = {};
      if (req.query?.email) query = { email: req.query.email };
      const result = await bookingCollection.find(query).toArray();
      res.send(result);
    });
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      const result = await bookingCollection.insertOne(booking);
      res.send(result);
    });
    app.patch("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const updatedBooking = req.body;
      console.log(updatedBooking);
      const updatedDoc = {
        $set: {
          status: updatedBooking.status,
        },
      };
      const result = await bookingCollection.updateOne(filter, updatedDoc);
      res.send(result);
    });
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await bookingCollection.deleteOne(query);
      res.send(result);
    });
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
