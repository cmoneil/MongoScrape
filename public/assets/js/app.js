// Grab the articles as a json
$.getJSON("/articles", function(data) {
  // For each one
  for (var i = 0; i < data.length; i++) {
    // Display the apropos information on the page
    $("#articles").append(`<p data-id=${data[i]._id}>${data[i].title}<br></p>
    <a href=${data[i].link}>Link</a>
    <p>${data[i].summary}</p>`);
  }
});


// Whenever someone clicks a p tag
$(document).on("click", "#saveBtn", function() {
  // Empty the notes from the note section
  console.log("click")
  $("#comments").empty();
  // Save the id from the p tag
  var thisId = $(this).attr("data-id");
  console.log(thisId)
  // Now make an ajax call for the Article
  $.ajax({
    method: "GET",
    url: "/articles/" + thisId
  })
    // With that done, add the note information to the page
    .then(function(data) {
      console.log(data.title);
      console.log(data.comments)

      $(".modal-title").html(`<h2>${data.title}</h2>`)
      $(".modal-body").html(`<div class="col-12"><label for="titleInput">Title:</label><input id="titleInput" name="title"><label for="bodyInput">Comment:</label>
      <textarea id="bodyInput" name="body"></textarea></div><button class="btn btn-primary modalButton" data-id=${thisId} id="saveComment">Save Comment</button><button id="deleteBtn" class="btn btn-danger">Delete</button>`)
      

      // If there's a comment in the article
      if (data.comments) {
        // Place the title of the note in the title input
        $("#titleInput").val(data.comments.title);
        // Place the body of the note in the body textarea
        $("#bodyInput").val(data.comments.body);
      }
    });
});

// When you click the savenote button
$(document).on("click", "#saveComment", function() {
  // Grab the id associated with the article from the submit button
  var thisId = $(this).attr("data-id");
  

  // Run a POST request to change the note, using what's entered in the inputs
  console.log($("#titleInput").val());
  console.log($("#bodyInput").val())
  $.ajax({
    method: "POST",
    url: "/articles/" + thisId,
    data: {
      // Value taken from title input
      title: $("#titleInput").val(),
      // Value taken from note textarea
      body: $("#bodyInput").val()
    }
  })
    // With that done
    .then(function(data) {
      // Log the response
      console.log(data);
      // Empty the notes section
      $("#comments").empty();
    });

  // Also, remove the values entered in the input and textarea for note entry
  $("#titleInput").val("");
  $("#bodyInput").val("");
  $(".modal-body").html(`<p>Comment Saved</p>`)
});
