const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/charity', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Organization Schema
const organizationSchema = new mongoose.Schema({
    org_name: String,
    fund_amount: Number,
});

const Organization = mongoose.model('charityuser', organizationSchema);

// Route to get organizations sorted by funding amount
app.get('/api/organizations', async (req, res) => {
    try {
        const organizations = await Organization.find().sort({ fund_amount: 1 });
        res.json(organizations);
    } catch (err) {
        res.status(500).send(err);
    }
});


// Start the server
app.listen(3000, () => {
    console.log('Server started on port 3000...');
});
