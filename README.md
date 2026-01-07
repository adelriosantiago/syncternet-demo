# Syncternet - Demo Page

This repository is a demo page that uses the *syncternet* package. If you want to test the package, make changes to the package or create and test your own plugins, do so using the project found at "./dev_modules/syncternet" at this same level. The demo page will reflect all your changes inside the "dev_modules" folder.

Syncternet allows you to interact with other users on the same page. It is a real-time chat and interaction platform that allows you to share your browsing experience with others.

## Test the demo

1. Go to www.syncternet.com.
2. Open the page in your phone and/or or in another browser (use a Private Mode to allow creating a new session).
3. See other people around the page and interact with them.

## Add Syncternet to your own project

1. Install the package with `npm install syncternet`.
2. Load the script in the front-end with `<script src="/syncternet/client"></script>`, this route is injected to the Express app when the module is loaded.
3. Initialize the server with `const syncternet = require('syncternet')` and `syncternet.init(app)`, where `app` is your Express app.


## Develop your own plugins

- `npm install`
- `npm run dev`

The dev command should build the front-end automatically, otherwise you may need to run a `build*` command

## How it works

### Server

Users are stored in the `users` global variable. This variable maps UUIDs to usernames. Clients are never expected to know other UUID's than themselves. Example structure:

```json
const users = {
  "jumping-dog-123": "johnDoe789",
	"sleeping-cat-321": "janeDoe987",
    // ... and so on for other users
}
```

A matching UUID and username is what makes an user an authenticated one. For this reason UUIDs should never be shared to the client. Public information about the each user for each plugin is stored in `public`. For example:

```js
const public = {
  party: {
    "jumping-dog-123": {
      pos: {
        x: 13,
        y: 24,
      },
    },
    "sleeping-cat-321": {
      pos: {
        x: 88,
        y: 75,
      },
    },
    // ... and so on for other users
  },
  emoticons: {
    // ... plugin data
  },
  // ... and so on for other plugins
}
```

In the example above there are two users at two different locations on the page. _Note: Actual Party plugin positions are not stored in X, Y coordinates since each user has a different screen size._

Private information about each user is stored in `private`. Not necessarily for secret data. It generally contains information to make the plugin work correctly. Private data is never shared to other users. Example:

```js
const public = {
  party: {
    "jumping-dog-123": {
      secondsIdle: 30,
    },
    "sleeping-cat-321": {
      secondsIdle: 5,
    },
    // ... and so on for other users
  },
  emoticons: {
    // ... plugin data
  },
  // ... and so on for other plugins
}
```

---

Plugin definition is found inside the plugins folder. Each folder is a plugin. Three files are defined:

- template.html: Defines the plugin's HTML.
- backend.js: Defines `init` and `middleware` functions that are executed on the server-side.
- frontend.js: Defines `init` and `middleware` functions that are executed on the client-side.

The `init` function is executed once when the plugin is loaded.

The `middleware` function is executed each time a message is sent/received.

---

When a new server is started the server begins listening to `msg` event. Each case is described below:

- - `"_new"` is received: This is a new user. Follow the steps,

    1. Add a new, randomly-generated UUID and username pair to `users`.
    2. Server sends `"_keys|<UUID>|<username>"` to the client.
    3. Send initial plugin information like `"_plugins|<plugins>"`.

  - `"_continue|<UUID>|<username>"` is received: This is supposedly an existing user. Test if `users[<UUID>] === <username>`. There are 2 possibilities:

- It does not match: Don't continue and treat the user as a completely new user as described in previous steps.
- It matches: Plugin information is sent as described in previous steps.
- In all other cases, plugin information about another user is received and the following steps are taken:

  1. Server receives `"party|<UUID>|{<plugin data>}"`.
  2. `public.party[<UUID>]` is updated with plugin data.
  3. Get username from `users`.
  4. Server broadcasts `"party|<username>|{<plugin data>}"` to all clients <u>including</u> the sender.

### Client

Users spin a VUE instance that looks like:

```js
new Vue({
  data: {
    public: {
      // Realtime data, every user has a copy of this
      party: {
        johnDoe123: {
          xpath: "",
          pos: { x: 3, y: 5 },
        },
        janeDoe987: {
          xpath: "",
          pos: { x: 6, y: 8 },
        },
        // ... and so on for other users
      },
      emoticons: {
        // ... plugin data
      },
      // ... and so on for other plugins
    },
    private: {
      // Local data, every user has it own data
      UUID: "jumping-dog-123", // What server sent us
      username: "johnDoe789", // What we chose
    },
  },
  created() {},
  mounted() {},
  methods: {},
})
```

When a new user loads a crowwwd page we do:

1. Check if auth is present in `localStorage.getItem('crowwwd:auth')`. There are two possibilities with different responses:
   - There is no auth data: `"_new"` is sent to the server as it a completely new user.
   - This is a returning user: `"_continue|<UUID>|<username>"` is sent.
2. Begin listening to the `msg` event. This is when a WS message is received. This may serve to update plugin data or for auth purposes. Each case is described below:

   - `"_keys|<UUID>|<username>"` is received: Update the UUID and username in `data.private`.
   - `"_plugins|<plugins>"` is received: Add all missing HTMLs. Some of them may be already added manually by the developer.
   - In all other cases, plugin information about another user is received and the following steps are taken:
     1. `"party|<username>|{<plugin data>}"` is received. Note how the UUID is not present.
     2. Update `data.public[<username>]` with the new information.

In the steps above we checked for `localStorage["crowwwd:auth"]`. This variable has the structure `"<UUID>:<username>"`. For example: `"jumping-dog-123:johnDoe789"`.

## FAQ

### ...

...

## SO resources:

- https://stackoverflow.com/questions/5100376/how-to-watch-for-array-changes
