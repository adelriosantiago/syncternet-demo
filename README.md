# crowwwd-noot

The crowwwd-noot variant does not use operational transform by default. It merely shares incoming messages which is the core of crowwwd.

### Server

Users is stored in `users`  global variable. This variable maps UUID to usernames. Clients are never expected to know other UUID's then themselves. Example structure:

``` json
const users = {
    "jumping-dog-123": "johnDoe789",
	"sleeping-cat-321": "janeDoe987",
    // ... and so on for other users
}
```

A matching UUID and username is what makes an user an authenticated one. For this reason UUIDs should never be shared to the client.

Public information about the each user for each plugin is stored in `public`. For example:

```js
const public = {
	party: {
    	"jumping-dog-123": {
            pos: {
            	x: 13,
                y: 24,
            }
        },
    	"sleeping-cat-321": {
            pos: {
            	x: 88,
                y: 75,
            }
        },
	    // ... and so on for other users
    },
    emoticons: {
    	// ... plugin data
    },
    // ... and so on for other plugins
}
```

In the example above there are two users at two different locations on the page. *Note: Plugin data is not real. Actual positions are not stored in X, Y coordinates.*

Plugin definition is found in `plugins` variable:

```js
const plugins = {
	party: {
        html: "<div>plugin html</div>",
		created: "",
        mounted: "",
	},
    emoticons: {
    	// ... plugin data
    },
    // ... and so on for other plugins
}
```

When a new server is started we begin listening to the `msg` event. This is when a WS message is received. This may serve to update plugin data or for auth purposes. Each case is described below:

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
        public: { // Realtime data, every user has a copy of this
        	party: {
                johnDoe123: {
                	xpath: "", pos: { x: 3, y: 5 },
                },
                janeDoe987: {
                    xpath: "", pos: { x: 6, y: 8 },
                },
                // ... and so on for other users
            },
            emoticons: {
               	// ... plugin data
            },
       	    // ... and so on for other plugins
        },
        private: { // Local data, every user has it own data
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
		1.  `"party|<username>|{<plugin data>}"` is received. Note how the UUID is not present.
		2. Update `data.public[<username>]` with the new information.



In the steps above we checked for `localStorage["crowwwd:auth"]`. This variable has the structure `"<UUID>:<username>"`. For example: `"jumping-dog-123:johnDoe789"`.



## FAQ

### Why client-server messages are not JSON?

Because not using JSON is a little bit faster.

### ...

...

## SO resources:

 - https://stackoverflow.com/questions/5100376/how-to-watch-for-array-changes