# LexBotWidget
Introducing the Lex Bot Widget repository, the ultimate solution for integrating Amazon Lex chatbots into your website. With just a few simple steps, you can have a fully functional chatbot up and running in no time. All you need to do is pass your Lex credentials and the widget will take care of the rest.

## Implementation
1. Download the repository
2. Put the LexBotWidget folder in your project
3. In `index.html` file of your application, Add script with scr which points to `index.js` file of LexBotWidget.
    
    ```
    <script src="path to LexBotWidget/index.js"></script>
    ```
4. Now you will be able to use custom html element `<lex-chat-bot>`. Add `<lex-chat-bot>` to anywhere in the file where you want to show it.
    ```
    <body>  
      <lex-chat-bot></lex-chat-bot>
    </body>
    ```
5. Change value of identityPool, botId and botAliasId in `LexBotWidget/index.js` file.
6. NOTE: Go to [test.html](/test.html) for checking whole implementation.
