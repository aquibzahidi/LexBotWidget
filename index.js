document.addEventListener("DOMContentLoaded", async function () {
    const script = document.createElement("script");
    script.src = "https://sdk.amazonaws.com/js/aws-sdk-2.1297.0.min.js";
    document.head.appendChild(script);
  
    class LexChatBot extends HTMLElement {
      constructor() {
        super();
        this.attachShadow({
          mode: "open",
        });
      }
      connectedCallback() {
        getChatHtmlDoc().then((doc) => {
          const template = doc.querySelector("#chatbotUI").content;
          this.shadowRoot.appendChild(template);
        });
      }
    }
  
    window.customElements.define("lex-chat-bot", LexChatBot);
  
    const checkDocInterval = setInterval((x) => {
      if (document.querySelector("lex-chat-bot") && !!AWS) {
        clearInterval(checkDocInterval);
        initializeChatBot();
      }
    }, 500);
  });
  
  function initializeChatBot() {
    AWS.config.region = "us-east-1"; // Region
    AWS.config.credentials = new AWS.CognitoIdentityCredentials({
      IdentityPoolId: "us-east-1:3203c02b-3978-4585-86ba-2329ed25d258",
    });
  
    var lexruntime = new AWS.LexRuntime();
    var lexUserId = "test-chatbot" + Date.now();
    var sessionAttributes = {};
  
    const loaderLex = `<span class='loader'><span class='loader__dot'></span><span class='loader__dot'></span><span class='loader__dot'></span></span>`;
  
    const urlPattern =
      /(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim;
    const $document = document.querySelector("lex-chat-bot").shadowRoot;
    const $chatbot = $document.querySelector(".chatbot");
    const $chatbotMessageWindow = $document.querySelector(
      ".chatbot__message-window"
    );
  
    const $chatbotHeader = $document.querySelector(".chatbot__header");
    const $chatbotWidget = $document.querySelector(".chatbot__widget");
    const $chatbotMessages = $document.querySelector(".chatbot__messages");
    const $chatbotInput = $document.querySelector(".chatbot__input");
    const $chatbotSubmit = $document.querySelector(".chatbot__submit");
  
    const botLoadingDelay = 500;
    const botReplyDelay = 500;
  
    document.addEventListener(
      "keypress",
      (event) => {
        if (event.which == 13) validateMessage();
      },
      false
    );
  
    $chatbotHeader.addEventListener(
      "click",
      () => {
        toggle($chatbot, "chatbot--closed");
        toggle($chatbotHeader, "chatbot--closed");
        $chatbotInput.focus();
      },
      false
    );
  
    $chatbotWidget.addEventListener(
      "click",
      () => {
        toggle($chatbot, "chatbot--closed");
        toggle($chatbotHeader, "chatbot--closed");
        $chatbotInput.focus();
      },
      false
    );
  
    $chatbotSubmit.addEventListener(
      "click",
      () => {
        validateMessage();
      },
      false
    );
    
    const toggle = (element, klass) => {
      const classes = element.className.match(/\S+/g) || [],
        index = classes.indexOf(klass);
      index >= 0 ? classes.splice(index, 1) : classes.push(klass);
      element.className = classes.join(" ");
    };
    
    const userMessage = (content) => {
      $chatbotMessages.innerHTML += `<li class='is-user animation'>
              <p class='chatbot__message'>
                  ${content}
              </p>
              <span class='chatbot__arrow chatbot__arrow--right'></span>
              </li>`;
    };
    
    const aiMessage = (content, isLoading = false, delay = 0) => {
      setTimeout(() => {
        removeLoader();
        $chatbotMessages.innerHTML += `<li 
              class='is-ai animation' 
              id='${isLoading ? "is-loading" : ""}'>
                  <div class="is-ai__profile-picture">
                    <img src="Technical Training Logo PNG.png" width="39px" height="40px">
                  </div>
                  <span class='chatbot__arrow chatbot__arrow--left'></span>
                  <div class='chatbot__message'>${content}</div>
              </li>`;
        scrollDown();
      }, delay);
    };
    
    const removeLoader = () => {
      let loadingElem = $document.getElementById("is-loading");
      if (loadingElem) $chatbotMessages.removeChild(loadingElem);
    };
    
    const escapeScript = (unsafe) => {
      const safeString = unsafe
        .replace(/</g, " ")
        .replace(/>/g, " ")
        .replace(/&/g, " ")
        .replace(/"/g, " ")
        .replace(/\\/, " ")
        .replace(/\s+/g, " ");
      return safeString.trim();
    };
    
    const linkify = (inputText) => {
      return inputText.replace(urlPattern, `<a href='$1' target='_blank'>$1</a>`);
    };
    
    const validateMessage = () => {
      const text = $chatbotInput.value;
      const safeText = text ? escapeScript(text) : "";
      if (safeText.length && safeText !== " ") {
        resetInputField();
        userMessage(safeText);
        send(safeText);
      }
      scrollDown();
      return;
    };
    
    const multiChoiceAnswer = (text) => {
      const decodedText = text.replace(/zzz/g, "'");
      userMessage(decodedText);
      send(decodedText);
      scrollDown();
      return;
    };
    
    const processResponse = (val) => {
      let output = "";
      let message = val.message;
      let type = val.messageFormat;
      if (val && val.dialogState === "Fulfilled") {
        switch (type) {
          // 0 fulfillment is text
          case "PlainText":
            // let parsedText = linkify(message.speech);
            output += `<p>${message}</p>`;
            break;
          // 1 fulfillment is card
          case 1:
            let imageUrl = message.imageUrl;
            let imageTitle = message.title;
            let imageSubtitle = message.subtitle;
            let button = message.buttons[0];
    
            if (!imageUrl && !button && !imageTitle && !imageSubtitle) break;
    
            output += `
                      <a class='card' href='${button.postback}' target='_blank'>
                      <img src='${imageUrl}' alt='${imageTitle}' />
                      <div class='card-content'>
                      <h4 class='card-title'>${imageTitle}</h4>
                      <p class='card-title'>${imageSubtitle}</p>
                      <span class='card-button'>${button.text}</span>
                      </div>
                      </a>
                  `;
            break;
    
          // 2 fulfillment is a quick reply with multi-choice buttons
          case 2:
            let title = message.title;
            let replies = message.replies;
            let repliesLength = replies.length;
            output += `<p>${title}</p>`;
    
            for (let i = 0; i < repliesLength; i++) {
              let reply = replies[i];
              let encodedText = reply.replace(/'/g, "zzz");
              output += `<button onclick='multiChoiceAnswer("${encodedText}")'>${reply}</button>`;
            }
            break;
          case "CustomPayload":
            output += `${message}`;
            //let parsedText = linkify(message.speech);
            //console.log(parsedText);
            break;
        }
        removeLoader();
        return output;
      }
    
      removeLoader();
      return `<p>${message}</p>`;
    };
    
    const setResponse = (val, delay = 0) => {
      setTimeout(() => {
        aiMessage(processResponse(val));
      }, delay);
    };
    
    const resetInputField = () => {
      $chatbotInput.value = "";
    };
    
    const scrollDown = () => {
      const distanceToScroll =
        $chatbotMessageWindow.scrollHeight -
        ($chatbotMessages.lastChild.offsetHeight + 60);
      $chatbotMessageWindow.scrollTop = distanceToScroll;
      return false;
    };
    
    const send = (text = "") => {
      var params = {
        botAlias: "TestAlias",
        botName: "BookTrip",
        inputText: text,
        userId: lexUserId,
        sessionAttributes: sessionAttributes,
      };
    
      lexruntime.postText(params, function (err, data) {
        if (err) {
          console.log(err, err.stack);
          let error = new Error(err.stack);
          throw error;
        }
    
        if (data) {
          // Capture the sessionAttributes for the next cycle
          sessionAttributes = data.sessionAttributes;
          setResponse(data, botLoadingDelay + botReplyDelay);
        }
      });
      aiMessage(loaderLex, true, botLoadingDelay);
    };
  }
  
  async function getChatHtmlDoc() {
    const htmlString = await fetch("./index.html").then(async (data) => {
      const text = await data.text();
      return text;
    });
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlString, "text/html");
    return doc;
  }