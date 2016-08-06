(function () {
  // initialize hangman state
  window.hangman = window.hangman || {};
  window.hangman.email = null;
  window.hangman.game = null;
  window.hangman.letters = {};

  // DOM ready
  $(function () {
    // attach email_prompt handlers
    $("#set_email_form").on("submit", function (event) {
      event.preventDefault();
      let email = $(event.target).find("input").first().val();
      setEmail(email);
      $("#email_prompt").modal("hide");
      promptUser();
    });
    $("#set_email_submit").on("click", function (event) {
      $(event.target).closest("form").submit();
    });

    // attach play_prompt handlers
    $("#start_game").on("click", startGame);

    // attach interactive triggers
    $(".modal").on("hidden.bs.modal", enableTriggers);
    $(".modal").on("shown.bs.modal", disableTriggers);

    // start user interaction
    renderGame();
    promptUser();
  });
}());

/***** Helper Functions: begin *****/
function enableTriggers(type) {
  let screen = $("body");
  if (window.hangman.game !== null &&
      window.hangman.game.state === "alive") {
    screen.on("keypress", guessLetter);
  } else {
    screen.on("keypress", promptUser);
    screen.on("click", promptUser);
  }
}

function disableTriggers() {
  let screen = $("body");
  screen.off("keypress");
  screen.off("click");
}

function promptUser() {
  if (window.hangman.email === null) {
    promptEmail();
  } else {
    promptGame();
  }
}

function promptEmail() {
  $("#email_prompt").modal("show");
}

function promptGame(state) {
  let prompt = $("#play_prompt");
  if (state === "won") {
    prompt.find(".modal-header").text("You Win!");
    prompt.find(".modal-body").text("Would you like to play again?");
  } else if (state === "lost") {
    prompt.find(".modal-header").text("You Lose");
    prompt.find(".modal-body").text("Would you like to play again?");
  } else {
    prompt.find(".modal-header").text("W O P R");
    prompt.find(".modal-body").text("Shall we play a game?");
  }
  prompt.modal("show");
}

function setEmail(email) {
  // use a dummy email if none given
  if (email === "") {
    email = "anon@example.com";
  }
  window.hangman.email = email;
}

function initGame() {
  window.hangman.game = null;
  window.hangman.letters = {};

  // prepopulate letters for display
  for (let i = 97; i <= 122; i++) {
    window.hangman.letters[String.fromCharCode(i)] = false;
  }
}

function startGame() {
  initGame();
  updateGame({ email: window.hangman.email }, function() {
    $("#play_prompt").modal("hide");
  });
}

function endGame() {
  promptGame(window.hangman.game.state);
}

function updateGame(data, next) {
  let url = "http://hangman.coursera.org/hangman/game";
  if (window.hangman.game !== null) {
    url += "/" + window.hangman.game.game_key;
  }

  $.ajax({
    url: url,
    method: "POST",
    data: JSON.stringify(data),
    success: function (data, status, response) {
      window.hangman.game = JSON.parse(data);
      renderGame();

      if (window.hangman.game.state === "won" ||
          window.hangman.game.state === "lost") {
        endGame();
      }

      if (typeof next === "function") {
        next();
      }
    },
    error: function (response, status, error) {
      console.log("error detected:", error);
    },
  });
}

function enableGuessing() {
  $(window).on("keypress", guessLetter);
}

function disableGuessing() {
  $(window).off("keypress", guessLetter);
}

function guessLetter(event) {
  // verify letter is alpha
  if ((event.which >= 65 && event.which <= 90) ||
      (event.which >= 97 && event.which <= 122)) {
    let letter = String.fromCharCode(event.which).toLowerCase();

    // disable repeats
    if (!window.hangman.letters[letter]) {
      window.hangman.letters[letter] = true;
      $("#guesses").text($("#guesses").text() + letter);
      updateGame({ guess: letter });
    }
  }
}

function renderGame() {
  // render phrase
  let phrase = window.hangman.game
               ? window.hangman.game.phrase
               : "all your base are belong to us";
  let parts = phrase.split("");
  let phraseNode = $("#phrase").empty();
  parts.forEach(function (elem) {
    let letter = $("<span></span>");
    letter.addClass("letter");
    letter.text(elem);
    phraseNode.append(letter);
  });

  // render tries left
  let tries_wrapper = $("#tries").empty();
  let max_tries = 5;
  for (let i = 0; i < 5; i++) {
    let icon = $("<span></span>");
    icon.addClass("try-icon");
    icon.addClass("glyphicon");
    if (window.hangman.game &&
        i < max_tries - window.hangman.game.num_tries_left) {
      icon.addClass("fail");
      icon.addClass("glyphicon-remove-sign");
    } else {
      icon.addClass("glyphicon-question-sign");
    }
    tries_wrapper.append(icon);
  }

  // render used letters
  let letters = $("#letters").empty();
  for (let i = 97; i <= 122; i++) {
    if (window.hangman.letters[String.fromCharCode(i)]) {
      let letter = $("<span></span>");
      letter.text(String.fromCharCode(i));
      letter.addClass("letter");
      letters.append(letter);
      letters.append(" ");
    }
  }
}
