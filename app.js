const cors = require('cors');
const express = require('express');
const mongoose = require('mongoose');
const jwt = require("jsonwebtoken");
require('dotenv').config();


const Keys = require('./models/Keys');
const Users = require('./models/Users');
const Specifiers = require('./models/Specifiers');

b_username = process.env.SALT;
b_password = process.env.SECRET;
const basicAuth = require('express-basic-auth');
// app.use(basicAuth({
//     users: { b_username : b_password }
// }))
const cron = require('node-cron');

const app = express();

// Socket and Server Configuration
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// MongoDB Configuration
const uri = process.env.CONNECTION_URI || 'mongodb://mongo:27017/rtapi';
mongoose
    .connect(uri, { useNewUrlParser: true, useCreateIndex: true, useUnifiedTopology: true })
    .then()
    .catch(err => console.log('Error:' + err));
const connection = mongoose.connection;
connection.once('open', () => {
    console.log('Database Connection Successful.');
})

// Error Handlers
const errorHandlers = require("./handlers/errorHandlers");
// app.use(errorHandlers.notFound);
app.use(errorHandlers.mongoseErrors);
if (process.env.ENV === "DEVELOPMENT") {
    app.use(errorHandlers.developmentErrors);
} else {
    app.use(errorHandlers.productionErrors);
}

// Disable this part if you don't want to use JWT Token 
// TO DO USER VERIFICATION NOT ADDED
io.use(async (socket, next) => {
    try {
        const token = socket.handshake.query.token;
        const payload = await jwt.verify(token, process.env.SECRET  || "supersecretkeyrembertohide");
        socket.user_id = payload.user_id;
        next();
    } catch (err) { 
        // TO DO ERRORS
    }
});

const main = require('./routes/main');
const api = require('./routes/api');
const device = require('./routes/device');

app.use('/', main);
app.use('/api', api);
app.use('/device', device);

app.listen(port, () => {
    console.log(`Listening to requests on ${port}`);
});
