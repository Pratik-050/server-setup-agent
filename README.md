# Server-setup-agent

A rc-app for server management via slash commands. Do all server related stuff right from your message window as an admin, no need to skim through the GUI everytime.

### Current features:

-   Parse and execute single-line scripts via /setup run.

-   Create users dynamically.

-   Create channels and add members.

-   Add all active users to a channel.

-   Uses Rocket.Chat's REST API for seamless integration.

### Current commands

-   /setup alive --> to see if the agent is up.
-   /setup run
    -   CREATE_USER name username email --> to create a new user.
    -   CREATE_CHANNEL channelName [names to be added separated by space without brackets] --> to create a new channel with specified users.
    -   ADD_ALL_USERS channelName --> to add all active users to a specific channel.

### To setup locally:

-   Run a local instance of Rocket.Chat.
-   Make sure you have the rc-apps-cli installed.
-   Clone the repository

```bash
git clone https://github.com/your-user-name/server-setup-agent.git
```

-   Set the X-User-Token and X-User-Id as ADMIN_AUTH_TOKEN and ADMIN_USER_ID respectively.

-   Go inside the directory and run

```bash
rc-apps deploy --url <localhost:port> -u <username> -p <password>
```

### Demo

Here's a short YouTube video that shows the current features that are implemented
![Video link](https://youtu.be/cj8hBhxJPX0)

### Upcoming features

-   Multi line command support.
-   Multiple user creation via UI modal or pop-over.
-   More server related operations using slash commands.
