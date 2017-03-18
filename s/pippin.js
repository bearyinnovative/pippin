(function() {
  const PIPPIN_CHAT_BUTTON_KEY = 'PP_BTN';

  function ChatButton() {
    this.el = document.querySelector('#pippin-chat-button');

    this.el.onchange = (e) => {
      localStorage[PIPPIN_CHAT_BUTTON_KEY] = this.el.checked;
    };

    this.el.checked = localStorage.getItem(PIPPIN_CHAT_BUTTON_KEY) === 'true';
  }

  new ChatButton();

  // --------------------------------------------------------------------

  function makeInboxMessage(text) {
    return {
      created: new Date,
      is_me: true,
      key: 'local-message-key',
      text,
    };
  }

  function parseInboxMessage(message) {
    return {
      created: new Date(message.created),
      is_me: message.is_me,
      key: message.key,
      text: message.text,
    };
  }

  function renderMessageUser(message) {
    const username = message.is_me ? '我' : '@BearyBot';
    const avatarClass = message.is_me ? 'me' : 'bearybot';
    return [
      `<div class="pippin-avatar pippin-avatar--${avatarClass}"></div>`,
      `<p class="pippin-username">${username}</p>`,
    ].join('');
  }

  function renderMessageContent(message) {
    return [
      '<div class="pippin-content">',
      message.text,
      '</div>',
    ].join('');
  }

  function renderMessageBoundaryStart(message) {
    return '<div class="pippin-window-message pippin-cf">';
  }

  function renderMessageBoundaryEnd(message) {
    return '</div>'
  }

  function Inbox() {
    this.containerEl = document.querySelector('.pippin-window-messages');
    this.messages = [];
  }

  Inbox.prototype.latestKey = function() {
    if (this.messages.length === 0) {
      return `${(new Date).getTime()}.0000`;
    }
    return this.messages[this.messages.length - 1].key;
  };

  Inbox.prototype.setMessages = function(messages) {
    this.messages = messages.slice().map(parseInboxMessage);
    return this.render();
  };

  Inbox.prototype.appendMessage = function(message) {
    this.messages.push(parseInboxMessage(message));
    return this.render();
  };

  Inbox.prototype.mergeMessages = function(newMessages) {
    const messagesKeySet = {};

    const oldMessages = this.messages;
    this.messages = [];
    oldMessages.forEach((message) => {
      if (messagesKeySet[message.key]) return;
      messagesKeySet[message.key] = 1;
      this.messages.push(message);
    });
    newMessages.map(parseInboxMessage).forEach((message) => {
      if (messagesKeySet[message.key]) return;
      // should have this message
      if (message.is_me) return;
      messagesKeySet[message.key] = 1;
      this.messages.push(message);
    });

    this.messages = this.messages.sort((a, b) => {
      return a.created - b.created;
    });

    return this.render();
  };

  Inbox.prototype.render = function() {
    return new Promise((resolve) => {
      const rendered = [];

      let lastMessage;
      this.messages.forEach((message) => {
        if (!lastMessage) {
          rendered.push(renderMessageBoundaryStart(message));
          rendered.push(renderMessageUser(message));
        } else if (message.is_me !== lastMessage.is_me) {
          rendered.push(renderMessageBoundaryEnd());
          rendered.push(renderMessageBoundaryStart());
          rendered.push(renderMessageUser(message));
        }

        rendered.push(renderMessageContent(message));
        lastMessage = message;
      });

      this.containerEl.innerHTML = rendered.join('');

      resolve();
    });
  };

  Inbox.prototype.scrollToLatest = function() {
    this.containerEl.scrollTop = this.containerEl.scrollHeight;
  };

  const inbox = new Inbox();

  // -----------------------------------------------------------------------

  const PIPPIN_SESSION_TOKEN_KEY = 'PP_TOKEN';

  function Pippin() {
    this.apiBase = '';
    this.sessionToken = null;
  }

  Pippin.prototype.url = function(path) {
    return `${this.apiBase}/api/v1/${path}`;
  };

  Pippin.prototype.checkResponse = function(resp) {
    if (!resp.ok) throw Error('request failed');

    return resp;
  }

  Pippin.prototype.fetchWithSession = function(url, settings) {
    if (!settings) {
      settings = {};
    }
    if (!settings.headers) {
      settings.headers = {};
    }
    settings.headers['authorization'] = this.sessionToken;

    return fetch(url, settings);
  };

  Pippin.prototype.sendMessage = function(messageContext) {
    return this.fetchWithSession(this.url('message'), {
      method: 'POST',
      body: JSON.stringify({text: messageContext}),
      headers: {
        'content-type': 'application/json',
      },
    }).then(this.checkResponse.bind(this));
  };

  Pippin.prototype.queryLatestMessages = function() {
    return this.fetchWithSession(this.url('message'))
      .then(this.checkResponse.bind(this))
      .then((resp) => {
        return resp.json();
      });
  };

  Pippin.prototype.startSession = function() {
    return fetch(this.url('session'), {
      method: 'POST',
    }).then(this.checkResponse.bind(this))
      .then((resp) => {
        return resp.json();
      })
      .then(({token}) => {
        console.log(`start new session ${token}`);

        return this.setSession(token);
      });
  }

  Pippin.prototype.setSession = function(token) {
    this.sessionToken = token;
    localStorage[PIPPIN_SESSION_TOKEN_KEY] = token;

    return this.sessionToken;
  };

  Pippin.prototype.ensureSession = function() {
    return new Promise((resolve) => {
      if (this.sessionToken) return resolve(this.sessionToken);

      this.sessionToken = localStorage[PIPPIN_SESSION_TOKEN_KEY];
      if (this.sessionToken) return resolve(this.sessionToken);

      return this.startSession();
    });
  };

  const pippin = new Pippin();
  pippin.ensureSession()
    .then(() => {
      return pippin.queryLatestMessages();
    })
    .then((messages) => {
      return inbox.setMessages(messages);
    })
    .then(() => {
      inbox.scrollToLatest();

      window.setInterval(() => {
        pippin.queryLatestMessages()
          .then((messages) => {
            inbox.mergeMessages(messages);
          });
      }, 1500);
    });

  // -------------------------------------------------------------------------

  function setupInput() {
    const inputEl = document.querySelector('#pippin-input');

    inputEl.onkeydown = (e) => {
      if (e.keyCode !== 13) return true;
      if (e.shiftKey) return true;

      const content = inputEl.value.trim();
      if (!content) return true;

      console.log('to send', content);

      inputEl.disabled = true;
      pippin.sendMessage(content)
        .then(() => {
          inputEl.value = '';
          inputEl.disabled = false;

          return inbox.appendMessage(makeInboxMessage(content));
        })
        .then(() => {
          inbox.scrollToLatest();
          inputEl.focus();
        });

      return false;
    };
  }

  setupInput();
})();
