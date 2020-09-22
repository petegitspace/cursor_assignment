"use strict";

const serverPort = 5000,
    http = require("http"),
    express = require("express"),
    app = express(),
    server = http.createServer(app),
    WebSocket = require("ws"),
    bodyParser = require("body-parser"),
    cors = require('cors'),
    websocketServer = new WebSocket.Server({ server });

app.use(cors());

app.use("/public", express.static(__dirname + '/public'));


app.use(bodyParser.urlencoded({extended:false}));

// parse application/json
app.use(bodyParser.json());

//DB

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

// const pool = new Pool({
//   user: "postgres",
//   password: "postgres",
//   database: "todo_database",
//   host: "localhost",
//   port: 5432
// });



//when a websocket connection is established
websocketServer.on('connection', (webSocketClient) => {

    //when a message is received
    webSocketClient.on('message', (message) => {

        //for each websocket client
        websocketServer
        .clients
        .forEach( client => {
            //send the client the current message
            client.send(`{ "message" : ${message} }`);
        });
    });

    //send feedback to the incoming connection
    webSocketClient.send('{ "connection" : "ok"}');
});

app.get('/', function(req, res){
    res.sendFile('/public/views/index.html', { root: __dirname })
 });

 app.get('/input', function(req, res){
    res.sendFile('/public/views/input.html', { root: __dirname })
 });

 app.get('/output', function(req, res){
    res.sendFile('/public/views/output.html', { root: __dirname })
 });



  app.post('/sendDBData', async(req, res) => {
    try {
      const client = await pool.connect();
      const result = await client.query('SELECT * FROM cursor_coordinates');
      const results = { 'results': (result) ? result.rows : null};
      res.send(results);
      client.release();
    } catch (err) {
      console.error(err);
      res.send("Error " + err);
    }
  });

  app.post('/recordLocation', async(req, res) => {  
      //var bodyData = JSON.parse(req.body);
      var obj = JSON.stringify(req.body);
      var jsonObj = req.body;

      const client = await pool.connect();
      const truncTable = await client.query('TRUNCATE TABLE cursor_coordinates');
      for (let key in jsonObj) {
        //console.log(jsonObj[key].x + " " + jsonObj[key].y);
        const insertTable = await client.query('INSERT INTO cursor_coordinates (x,y) VALUES ($1,$2) RETURNING *', [jsonObj[key].x , jsonObj[key].y]);
        
      }
      client.release();

    });


//start the web server
server.listen(process.env.PORT || 5000, () => {
    console.log(`Websocket server started on port ` + 5000);
});