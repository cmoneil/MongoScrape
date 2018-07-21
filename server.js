var express = require("express");
var bodyParser = require("body-parser");
var logger = require("morgan");
var mongoose = require("mongoose");

// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Require all models
var db = require("./models");

var PORT = process.env.PORTY || 3000;
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/mongoScrape";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);



// Initialize Express
var app = express();

var exphbs = require("express-handlebars");



// Configure middleware

// Use morgan logger for logging requests
app.use(logger("dev"));
// Use body-parser for handling form submissions
app.use(bodyParser.urlencoded({ extended: true }));
// Use express.static to serve the public folder as a static directory
app.use(express.static(__dirname + '/public'));

app.engine("handlebars", exphbs({
  defaultLayout: "main",
  partialsDir: [__dirname + '/views/partials'],
  helpers: {
    json: function (context) {
      return JSON.stringify(context);
    }
  }
}));

app.set("view engine", "handlebars");

var resultArray=[]

// Routes

// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
  // First, we grab the body of the html with request
  axios.get("http://www.theringer.com/").then(function (response) {
    // Then, we load that into cheerio and save it to $ for a shorthand selector
    var $ = cheerio.load(response.data);
    //console.log(response.data)
    // Now, we grab every h2 within an article tag, and do the following:
    $("h2.c-entry-box--compact__title").each(function (i, element) {
      // Save an empty result object
      var result = {};
     
      // console.log(i)
      // console.log(element)
      // Add the text and href of every link, and save them as properties of the result object
      result.title = $(this)
        .children("a")
        .text();
      result.link = $(this)
        .children("a")
        .attr("href");
      result.summary = $(this)
        .parent()
        .children("p")
        .text();
      var imgHTML = $(this)
        .parent()
        .parent()
        .find("noscript")
        .html()
      if (imgHTML) {
        var $img = cheerio.load(imgHTML);
        result.image = $img("img").attr('src');
      }
        

        
        //resultArray.push(result);
        //console.log(resultArray)

      //console.log(result.image)

    
      // Create a new Article using the `result` object built from scraping


      db.Article.update({ title: result.title },
        {
          title: result.title,
          link: result.link,
          summary: result.summary,
          image: result.image
        },
        { upsert: true }
      )
        .then(function (dbArticle) {
          // View the added result in the console
          //console.log(dbArticle);
          console.log(dbArticle.upserted)
        })
        .catch(function (err) {
          //     // If an error occurred, send it to the client
          return res.json(err);
        });



      })


      // If we were able to successfully scrape and save an Article, send a message to the client
      // res.send("Scrape Complete");
      res.redirect("/")

    });
    
  
  
});

// Route for getting all Articles from the db

app.get("/", function (req, res) {
  db.Article.find({})
    .then(function (dbArticle) {
      
      res.render("index", { articles: dbArticle })

    });
});
app.get("/articles", function (req, res) {
  // Grab every document in the Articles collection
  db.Article.find({})
    .then(function (dbArticle) {
      // If we were able to successfully find Articles, send them back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for grabbing a specific Article by id, populate it with it's note
app.get("/articles/:id", function (req, res) {
  // Using the id passed in the id parameter, prepare a query that finds the matching one in our db...
  db.Article.findOne({ _id: req.params.id })
    // ..and populate all of the notes associated with it
    .populate("comments")
    .then(function (dbArticle) {
      // If we were able to successfully find an Article with the given id, send it back to the client
      res.json(dbArticle);
      
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
  // Create a new note and pass the req.body to the entry
  console.log(req.body)
  db.Comments.create(req.body)
    .then(function (dbComments) {
     
      return db.Article.findOneAndUpdate({ _id: req.params.id }, { comments: dbComments._id }, { new: true });
    })
    .then(function (dbArticle) {
      // If we were able to successfully update an Article, send it back to the client
      res.json(dbArticle);
    })
    .catch(function (err) {
      // If an error occurred, send it to the client
      res.json(err);
    });
});

// Start the server
app.listen(PORT, function () {
  console.log("App running on port " + PORT + "!");
});
