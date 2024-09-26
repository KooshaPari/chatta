# Building a Real-Time Chat Application with SvelteKit and Go/Fiber: A Beginner's Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Understanding the Tech Stack](#understanding-the-tech-stack)
4. [Setting Up the Development Environment](#setting-up-the-development-environment)
5. [Building the Backend with Go/Fiber](#building-the-backend-with-go-fiber)
   - [Initializing the Go Project](#initializing-the-go-project)
   - [Setting Up the Fiber Server](#setting-up-the-fiber-server)
   - [Implementing WebSocket Support](#implementing-websocket-support)
   - [Broadcasting Messages to Connected Clients](#broadcasting-messages-to-connected-clients)
   - [Adding Basic User Authentication](#adding-basic-user-authentication)
6. [Building the Frontend with SvelteKit](#building-the-frontend-with-sveltekit)
   - [Initializing the SvelteKit Project](#initializing-the-sveltekit-project)
   - [Creating the Chat Interface](#creating-the-chat-interface)
   - [Establishing WebSocket Connections](#establishing-websocket-connections)
   - [Handling Real-Time Messages](#handling-real-time-messages)
   - [Implementing User Authentication on the Frontend](#implementing-user-authentication-on-the-frontend)
7. [Connecting Frontend and Backend](#connecting-frontend-and-backend)
8. [Testing the Application](#testing-the-application)
9. [Conclusion](#conclusion)

---

## Introduction

Welcome! In this guide, we'll build a real-time chat application using **SvelteKit** for the frontend and **Go/Fiber** for the backend. This tutorial is designed for beginners new to Go, Fiber, web development, and SvelteKit. We'll walk through each step, explaining the concepts to help you understand how everything fits together.

By the end of this guide, you'll have:

- A functional real-time chat application.
- A better understanding of how WebSockets work.
- Experience with Go/Fiber and SvelteKit.
- A foundation to build more complex applications in the future.

---

## Prerequisites

Before we dive in, make sure you have the following installed on your machine:

- **Go (Golang)**: Version 1.16 or higher.
- **Node.js**: Version 14 or higher.
- **npm**: Comes bundled with Node.js.
- **Git**: For version control.
- A code editor, such as **Visual Studio Code**.

If you don't have these installed, please install them first.

---

## Understanding the Tech Stack

### Go and Fiber

- **Go** is a statically typed, compiled programming language designed for simplicity and performance.
- **Fiber** is a web framework built on top of [Fasthttp](https://github.com/valyala/fasthttp), the fastest HTTP engine for Go. Fiber is inspired by Express.js and is known for its simplicity and performance.
- **WebSockets** allow for real-time, full-duplex communication between a client and a server.

### SvelteKit

- **SvelteKit** is a framework for building web applications using Svelte. It provides routing, server-side rendering, and other features out of the box.
- **Svelte** is a frontend framework that compiles your code to efficient JavaScript, resulting in faster and smaller applications.

---

## Setting Up the Development Environment

Before we start coding, let's set up our environment.

### Install Go and Fiber

1. **Install Go**

   - Download and install Go from the [official website](https://golang.org/dl/).
   - Verify the installation:

     ```bash
     go version
     ```

2. **Install Fiber**

   - We'll install Fiber as a dependency in our Go project.

### Install Node.js and SvelteKit

1. **Install Node.js**

   - Download and install Node.js from the [official website](https://nodejs.org/).
   - Verify the installation:

     ```bash
     node -v
     npm -v
     ```

2. **Install SvelteKit**

   - We'll set up SvelteKit using `npm` in our project directory.

---

## Building the Backend with Go/Fiber

Let's start by building the backend of our chat application using Go and Fiber.

### Initializing the Go Project

1. **Create a New Directory for the Backend**

   Open your terminal and run:

   ```bash
   mkdir go-fiber-chat-backend
   cd go-fiber-chat-backend
   ```

2. **Initialize the Go Module**

   Initialize a new Go module, which will manage your project's dependencies:

   ```bash
   go mod init github.com/yourusername/go-fiber-chat-backend
   ```

   Replace `yourusername` with your GitHub username or any module path you prefer.

### Setting Up the Fiber Server

1. **Create the Main File**

   In your project directory, create a file named `main.go`:

   ```bash
   touch main.go
   ```

2. **Install Fiber**

   In `main.go`, we'll import Fiber, so let's install it first:

   ```bash
   go get github.com/gofiber/fiber/v2
   ```

3. **Write the Basic Fiber Server**

   Open `main.go` in your code editor and add the following code:

   ```go
   package main

   import (
       "github.com/gofiber/fiber/v2"
   )

   func main() {
       app := fiber.New()

       app.Get("/", func(c *fiber.Ctx) error {
           return c.SendString("Hello, World!")
       })

       app.Listen(":8080")
   }
   ```

   **Explanation:**

   - We import the `fiber` package.
   - We create a new Fiber app.
   - We define a route for the root path (`"/"`) that sends a "Hello, World!" message.
   - We start the server on port `8080`.

4. **Run the Server**

   In your terminal, run:

   ```bash
   go run main.go
   ```

   You should see output indicating the server is running:

   ```
   Fiber v2.0.0 listening on :8080
   ```

5. **Test the Server**

   Open your web browser and navigate to `http://localhost:8080`. You should see "Hello, World!".

### Implementing WebSocket Support

Now, let's add WebSocket support to our server.

1. **Install the Fiber WebSocket Middleware**

   Fiber provides a WebSocket middleware that makes it easy to handle WebSocket connections:

   ```bash
   go get github.com/gofiber/websocket/v2
   ```

2. **Update `main.go` to Include WebSocket Handling**

   Modify your `main.go` file:

   ```go
   package main

   import (
       "github.com/gofiber/fiber/v2"
       "github.com/gofiber/websocket/v2"
   )

   func main() {
       app := fiber.New()

       // Serve the WebSocket route
       app.Get("/ws", websocket.New(func(c *websocket.Conn) {
           // WebSocket connection established
           var (
               mt  int
               msg []byte
               err error
           )
           for {
               if mt, msg, err = c.ReadMessage(); err != nil {
                   break
               }
               // Echo the received message back to the client
               if err = c.WriteMessage(mt, msg); err != nil {
                   break
               }
           }
       }))

       app.Listen(":8080")
   }
   ```

   **Explanation:**

   - We import the `websocket` middleware.
   - We define a route `/ws` that upgrades HTTP connections to WebSocket connections.
   - In the WebSocket handler, we continuously read messages from the client and write them back (echo).

3. **Test the WebSocket Server**

   - Restart your Go server (`Ctrl+C` to stop, then `go run main.go`).
   - We'll test the WebSocket connection later when we set up the frontend.

### Broadcasting Messages to Connected Clients

We want our chat application to send messages from one client to all connected clients. To achieve this, we'll maintain a list of connected clients and broadcast messages to them.

1. **Define a Client Manager**

   We'll create a simple hub to manage connected clients and broadcast messages.

   ```go
   package main

   import (
       "fmt"
       "sync"

       "github.com/gofiber/fiber/v2"
       "github.com/gofiber/websocket/v2"
   )

   type Client struct {
       Conn *websocket.Conn
   }

   var clients = make(map[*Client]bool) // Connected clients
   var broadcast = make(chan []byte)    // Broadcast channel
   var mutex = &sync.Mutex{}            // To synchronize access to the clients map

   func main() {
       app := fiber.New()

       // WebSocket route
       app.Get("/ws", websocket.New(func(c *websocket.Conn) {
           client := &Client{Conn: c}
           // Register the client
           mutex.Lock()
           clients[client] = true
           mutex.Unlock()

           defer func() {
               // Unregister the client
               mutex.Lock()
               delete(clients, client)
               mutex.Unlock()
               c.Close()
           }()

           for {
               // Read message from client
               _, msg, err := c.ReadMessage()
               if err != nil {
                   fmt.Println("Error reading message:", err)
                   break
               }
               // Send the message to the broadcast channel
               broadcast <- msg
           }
       }))

       // Start a goroutine to handle messages
       go handleMessages()

       app.Listen(":8080")
   }

   func handleMessages() {
       for {
           // Grab the next message from the broadcast channel
           msg := <-broadcast

           // Send it to every connected client
           mutex.Lock()
           for client := range clients {
               if err := client.Conn.WriteMessage(websocket.TextMessage, msg); err != nil {
                   fmt.Println("Error writing message:", err)
                   client.Conn.Close()
                   delete(clients, client)
               }
           }
           mutex.Unlock()
       }
   }
   ```

   **Explanation:**

   - We define a `Client` struct to represent a connected client.
   - We maintain a `clients` map to keep track of all connected clients.
   - The `broadcast` channel is used to pass messages received from clients to the `handleMessages` function.
   - In the WebSocket handler, we read messages from the client and send them to the `broadcast` channel.
   - The `handleMessages` function reads from the `broadcast` channel and sends the message to all connected clients.

2. **Test the Broadcasting**

   - Restart your Go server.
   - We'll test the broadcasting functionality once we set up the frontend and have multiple clients connected.

### Adding Basic User Authentication

For our chat application, we'll implement a simple authentication mechanism using JSON Web Tokens (JWT).

1. **Install the JWT Package**

   ```bash
   go get github.com/golang-jwt/jwt/v4
   ```

2. **Implement User Authentication**

   Update `main.go` to include authentication endpoints.

   ```go
   import (
       // ... previous imports ...
       "github.com/golang-jwt/jwt/v4"
       "time"
   )

   var jwtKey = []byte("my_secret_key")

   // User credentials (in-memory for simplicity)
   var users = map[string]string{
       "user1": "password1",
       "user2": "password2",
   }

   func main() {
       app := fiber.New()

       app.Post("/login", login)

       // WebSocket route with authentication
       app.Use(func(c *fiber.Ctx) error {
           // Bypass authentication for login route
           if c.Path() == "/login" {
               return c.Next()
           }

           // Get token from query params (for WebSocket upgrade)
           tokenString := c.Query("token")
           if tokenString == "" {
               return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Missing token"})
           }

           claims := &jwt.RegisteredClaims{}
           token, err := jwt.ParseWithClaims(tokenString, claims, func(token *jwt.Token) (interface{}, error) {
               return jwtKey, nil
           })
           if err != nil || !token.Valid {
               return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid token"})
           }

           // Store username in locals for use in handlers
           c.Locals("username", claims.Subject)

           return c.Next()
       })

       // WebSocket route
       app.Get("/ws", websocket.New(func(c *websocket.Conn) {
           // ... previous WebSocket handler code ...
       }))

       go handleMessages()

       app.Listen(":8080")
   }

   func login(c *fiber.Ctx) error {
       type Credentials struct {
           Username string `json:"username"`
           Password string `json:"password"`
       }

       var creds Credentials
       if err := c.BodyParser(&creds); err != nil {
           return c.Status(fiber.StatusBadRequest).JSON(fiber.Map{"error": "Invalid request"})
       }

       // Validate credentials
       expectedPassword, ok := users[creds.Username]
       if !ok || expectedPassword != creds.Password {
           return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{"error": "Invalid credentials"})
       }

       // Create JWT token
       expirationTime := time.Now().Add(5 * time.Minute)
       claims := &jwt.RegisteredClaims{
           Subject:   creds.Username,
           ExpiresAt: jwt.NewNumericDate(expirationTime),
       }

       token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
       tokenString, err := token.SignedString(jwtKey)
       if err != nil {
           return c.Status(fiber.StatusInternalServerError).JSON(fiber.Map{"error": "Could not create token"})
       }

       return c.JSON(fiber.Map{"token": tokenString})
   }
   ```

   **Explanation:**

   - We define a `/login` endpoint that accepts username and password, validates them against the `users` map, and returns a JWT if valid.
   - We use Fiber's middleware to check for the token on routes other than `/login`.
   - For WebSocket connections, since headers are not accessible in the same way, we pass the token as a query parameter.
   - We store the username in `c.Locals` for potential use in handlers (e.g., attaching usernames to messages).

3. **Update the WebSocket Handler to Use Username**

   Modify the message handling to include the username.

   ```go
   app.Get("/ws", websocket.New(func(c *websocket.Conn) {
       username := c.Locals("username").(string)
       client := &Client{Conn: c}

       // ... rest of the code ...

       for {
           // Read message from client
           _, msg, err := c.ReadMessage()
           if err != nil {
               fmt.Println("Error reading message:", err)
               break
           }
           // Prepend username to the message
           fullMsg := fmt.Sprintf("%s: %s", username, string(msg))

           // Send the message to the broadcast channel
           broadcast <- []byte(fullMsg)
       }
   }))
   ```

   **Explanation:**

   - We retrieve the username from `c.Locals` and include it with each message.
   - This way, when a message is broadcast, it includes the sender's username.

4. **Handle CORS**

   To allow requests from our frontend to the backend, we need to enable CORS (Cross-Origin Resource Sharing).

   - Install the Fiber CORS middleware:

     ```bash
     go get github.com/gofiber/fiber/v2/middleware/cors
     ```

   - Use the CORS middleware in `main.go`:

     ```go
     import (
         // ... previous imports ...
         "github.com/gofiber/fiber/v2/middleware/cors"
     )

     func main() {
         app := fiber.New()

         app.Use(cors.New())

         // ... rest of the code ...
     }
     ```

   **Explanation:**

   - This middleware allows all origins by default. In a production environment, you should configure it to allow only specific origins.

---

## Building the Frontend with SvelteKit

Now, let's build the frontend of our chat application using SvelteKit.

### Initializing the SvelteKit Project

1. **Create a New Directory for the Frontend**

   In your terminal:

   ```bash
   cd ..
   mkdir sveltekit-chat-frontend
   cd sveltekit-chat-frontend
   ```

2. **Initialize the SvelteKit Project**

   We'll use the `create-svelte` command to set up the project:

   ```bash
   npm create svelte@latest
   ```

   Follow the prompts:

   - Project name: Press Enter to accept the default.
   - Skeleton project: Choose the default.
   - Add TypeScript: No (or Yes if you prefer).
   - Add ESLint: Yes.
   - Add Prettier: Yes.
   - Add Playwright: No.
   - Add Vitest: No.

3. **Install Dependencies**

   Change into the project directory and install the dependencies:

   ```bash
   cd sveltekit-chat-frontend
   npm install
   ```

4. **Run the Development Server**

   Start the development server:

   ```bash
   npm run dev
   ```

   Open your browser and navigate to the URL provided (usually `http://localhost:5173`).

### Creating the Chat Interface

1. **Set Up the Layout**

   We'll create a simple navigation and layout for our app.

   Open `src/routes/+layout.svelte` and modify it to include a navigation bar:

   ```svelte
   <script>
       export let data;
   </script>

   <nav>
       <a href="/">Home</a>
       <a href="/chat">Chat</a>
       <a href="/login">Login</a>
   </nav>

   <slot />
   ```

   **Explanation:**

   - We define a simple navigation with links to Home, Chat, and Login pages.
   - The `<slot />` element is where the content of each page will be rendered.

2. **Create the Chat Page**

   Create a new file `src/routes/chat/+page.svelte`:

   ```svelte
   <script>
       import { onMount } from 'svelte';
       import { goto } from '$app/navigation';

       let messages = [];
       let message = '';
       let ws;

       onMount(() => {
           const token = localStorage.getItem('token');
           if (!token) {
               goto('/login');
               return;
           }

           // Establish WebSocket connection
           ws = new WebSocket(`ws://localhost:8080/ws?token=${token}`);

           ws.onopen = () => {
               console.log('Connected to WebSocket server');
           };

           ws.onmessage = (event) => {
               messages = [...messages, event.data];
           };

           ws.onclose = () => {
               console.log('WebSocket connection closed');
           };
       });

       function sendMessage() {
           if (ws && message.trim() !== '') {
               ws.send(message);
               message = '';
           }
       }
   </script>

   <style>
       .chat-window {
           border: 1px solid #ccc;
           height: 300px;
           overflow-y: scroll;
           padding: 10px;
       }

       .message {
           margin-bottom: 10px;
       }
   </style>

   <h1>Chat Room</h1>

   <div class="chat-window">
       {#each messages as msg}
           <div class="message">{msg}</div>
       {/each}
   </div>

   <input bind:value={message} placeholder="Type a message..." />
   <button on:click={sendMessage}>Send</button>
   ```

   **Explanation:**

   - We import `onMount` from Svelte to perform actions when the component is mounted.
   - We check for a token in `localStorage`. If not present, we redirect the user to the login page.
   - We establish a WebSocket connection to our backend, including the token in the query parameters.
   - We handle `onmessage` events by appending incoming messages to the `messages` array.
   - The chat window displays all messages.
   - The user can type a message and click "Send" to send it.

### Establishing WebSocket Connections

We've already established the WebSocket connection in the previous step, but let's delve deeper.

1. **Understanding the WebSocket Connection**

   - We create a new `WebSocket` instance, connecting to `ws://localhost:8080/ws` and passing the token.
   - The `onopen` event is triggered when the connection is established.
   - The `onmessage` event is triggered when a message is received from the server.
   - The `onclose` event is triggered when the connection is closed.

2. **Handling Messages**

   - We update the `messages` array whenever a new message is received.
   - Since `messages` is reactive (thanks to Svelte's reactivity), the UI updates automatically.

### Handling Real-Time Messages

1. **Sending Messages**

   - The `sendMessage` function sends the user's message to the server via the WebSocket connection.
   - We check if `ws` is defined and the message is not empty before sending.

2. **Displaying Messages**

   - We use an `{#each}` block to iterate over the `messages` array and display each message in the chat window.

### Implementing User Authentication on the Frontend

Now, let's implement the login functionality.

1. **Create the Login Page**

   Create a new file `src/routes/login/+page.svelte`:

   ```svelte
   <script>
       let username = '';
       let password = '';
       let error = '';

       async function login() {
           const response = await fetch('http://localhost:8080/login', {
               method: 'POST',
               headers: {
                   'Content-Type': 'application/json',
               },
               body: JSON.stringify({ username, password }),
           });

           const data = await response.json();

           if (response.ok) {
               // Save the token and redirect to chat
               localStorage.setItem('token', data.token);
               window.location.href = '/chat';
           } else {
               error = data.error;
           }
       }
   </script>

   <h1>Login</h1>

   {#if error}
       <p style="color: red;">{error}</p>
   {/if}

   <input bind:value={username} placeholder="Username" />
   <input type="password" bind:value={password} placeholder="Password" />
   <button on:click={login}>Login</button>
   ```

   **Explanation:**

   - We define `username`, `password`, and `error` variables.
   - The `login` function sends a POST request to the backend `/login` endpoint with the username and password.
   - If the response is successful, we store the token in `localStorage` and redirect the user to the `/chat` page.
   - If there's an error, we display it.

2. **Handling Logout**

   We can add a logout option in our navigation.

   - Modify `src/routes/+layout.svelte`:

     ```svelte
     <script>
         let isLoggedIn = false;

         if (typeof window !== 'undefined') {
             isLoggedIn = localStorage.getItem('token') !== null;
         }

         function logout() {
             localStorage.removeItem('token');
             isLoggedIn = false;
             window.location.href = '/';
         }
     </script>

     <nav>
         <a href="/">Home</a>
         <a href="/chat">Chat</a>
         {#if isLoggedIn}
             <button on:click={logout}>Logout</button>
         {:else}
             <a href="/login">Login</a>
         {/if}
     </nav>

     <slot />
     ```

   **Explanation:**

   - We check if the user is logged in by looking for the token in `localStorage`.
   - If logged in, we show a "Logout" button; otherwise, we show a "Login" link.
   - The `logout` function removes the token and redirects to the home page.

3. **Protecting Routes**

   Ensure that users cannot access the `/chat` page without being logged in.

   - We already redirect users to `/login` in the `onMount` function in `chat/+page.svelte` if there's no token.
   - Alternatively, we can create a hook to protect routes, but that's more advanced and can be explored later.

---

## Connecting Frontend and Backend

At this point, our frontend and backend should be connected:

- The frontend sends login requests to the backend.
- Upon successful login, the frontend stores the token and uses it to connect to the WebSocket server.
- The backend authenticates the WebSocket connection using the token.
- Messages sent by clients are broadcast to all connected clients, displaying the username and message.

---

## Testing the Application

1. **Start the Backend Server**

   In the `go-fiber-chat-backend` directory:

   ```bash
   go run main.go
   ```

2. **Start the Frontend Development Server**

   In the `sveltekit-chat-frontend` directory:

   ```bash
   npm run dev
   ```

3. **Test the Login Functionality**

   - Open your browser and navigate to `http://localhost:5173/login`.
   - Enter one of the predefined usernames and passwords from the `users` map in the backend:

     - Username: `user1`, Password: `password1`
     - Username: `user2`, Password: `password2`

   - Click "Login". You should be redirected to the chat page.

4. **Test the Chat Functionality**

   - Open another browser window or tab and repeat the login with a different user.
   - In both windows, send messages.
   - You should see messages appearing in real-time in both windows, prefixed with the username.

5. **Test Logout**

   - Click the "Logout" button in one of the windows.
   - Attempt to send a message; you should be redirected to the login page.

---

## Conclusion

Congratulations! You've built a functional real-time chat application using SvelteKit and Go/Fiber. Throughout this process, you've learned:

- How to set up a Fiber server in Go.
- How to implement WebSocket support in Fiber.
- How to manage connected clients and broadcast messages.
- How to implement basic authentication using JWTs.
- How to set up a SvelteKit frontend.
- How to establish WebSocket connections from the frontend.
- How to handle real-time messaging and UI updates.

### Next Steps and Learning Opportunities

- **Improve Authentication Security**

  - Store user data in a database instead of in-memory.
  - Hash passwords using bcrypt or a similar library.
  - Implement token refresh mechanisms.

- **Enhance the Chat Features**

  - Add support for chat rooms or channels.
  - Implement typing indicators.
  - Allow users to send images or files.
  - Add message timestamps.

- **Deploy the Application**

  - Learn how to build and deploy the Go server to a cloud service.
  - Deploy the SvelteKit frontend as a static site or as a server-rendered application.
  - Use HTTPS and secure WebSocket connections (wss://).

- **Explore Advanced Topics**

  - Use a state management library on the frontend for better state handling.
  - Implement unit and integration tests for both frontend and backend.
  - Optimize performance and scalability.

---

## Additional Resources

- **Go**

  - [Go Official Documentation](https://golang.org/doc/)
  - [Fiber Documentation](https://docs.gofiber.io/)

- **SvelteKit**

  - [SvelteKit Documentation](https://kit.svelte.dev/docs)
  - [Svelte Tutorial](https://svelte.dev/tutorial)

- **WebSockets**

  - [MDN WebSockets Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebSockets_API)
  - [Understanding WebSockets](https://www.pubnub.com/blog/what-is-websockets/)

---

By building this application, you've taken significant steps in learning modern web development with Go and SvelteKit. Keep experimenting and building projects to solidify your understanding. Happy coding!
