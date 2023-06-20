# StoryExtendedWebApp
This is a web app companion for the StoryExtended WoW addon.

Get the Addon here:
https://github.com/Magusbear/StoryExtendedAddon

With this web app writers can add their own stories to the World Of Warcraft through the Story Extended Addon. It lets you write dialogue for any character in the game and saves it into a data addon that just needs to be added to the AddOn folder in WoW alongside the core addon.

If you just want to create dialogue you can use the web app here:
https://mnauditt.de/storyextended

## How does the web app and WoW addon work?
The WoW Addon can show a dialogue UI for every character or subzone in the game. This works through a new "Start Dialogue" button. After hitting the button a Lua dialogue database is searched for the targeted character. If dialogue is found and all conditions are met a dialogue window opens which works pretty much like the dialogue window in any other game.
The web app is for creating these lua databases.

You can create as many databases as you want. Every database is wrapped in a WoW addon. On game start these dialogue addons are searched for by the core addon and added to its internal dialogue addon list. This is done so that users can add multiple dialogue addons to their game without the dialogue writers having to merge their addons.

### But how do I write dialogue?
Just head over to the website above or download the GitHub project. Every element of the web app has a tooltip description that should describe everything in detail. But as a tl;dr do the following to create dialogue:

1. Click the "Addon Settings" button and give your dialogue addon a name and a priority (if two dialogue addons add dialogue for the same NPC the one with a higher priority is chosen ingame)
2. Add the name of the NPC (or subzone) you want to add dialogue for into the Name field
3. Tick the "Greeting" checkbox (this marks this as the entrypoint to the dialogue)
4. Add a condition if you want (eg. "Level" "60" make it so that only level 60 characters can start this dialogue)
5. Write the text the NPC is saying
6. Add up to four player choices
7. For every added player choice click the "Create ID" button to create a new NPC answer for that choice (you can then navigate back to the previous dialogue chunk with the "Previous Dialogue" button
8. If you want the dialogue to end with a player choice put in "-1" as ID
9. When you are done click "Download Addon" to download the addon as a .zip file
10. Unpack the .zip file into your WoW AddOn folder alongside the StoryExtended core addon for it to work ingame

### What are the AI buttons for?
I added OpenAI text generation and ElevenLabs voice generation to the web app to help in generating dialogue. The OpenAI implementation can generate NPC dialogue for a given player choice and will take into account what the player has said and some characteristics that can be added for each NPC.

The ElevenLabs voice generation can create voice lines from the NPC dialogue which are automatically added to the dialogue addon and played ingame when talking to a character.

**Note: API keys are needed for both API services to work. You will also most likely need a subscription or something along the lines to be able to use these services. I am not liable for any costs that might be incurred through the use of this web app.**


## Who is this GitHub Project for?
This GitHub project is meant for devs who want to make the web app better or for writers who want to have a local copy of the web app, instead of using the website.

As this is my first web app and my first time using TypeScript, CSS and HTML it is extremely hacky. I tried to clean it up but I kind of lost interest along the way. Sorry in advance.

## Dependencies
Install npm.

Install npm dependencies by starting powershell in the web app folder and run the command:
```
npm install
```
This should install dependencies locally.

The web app is using web pack to bundle everything. It is also using TypeScript. So after you installed dependencies and changed code use
```
tsc
npx webpack
```
to compile the TypeScript code and then bundle everything with webpack.

## Contribution and License
This project is licensed through a GPL-3.0 license.

I welcome everyone to contribute or use the code in this project by following the terms of its MIT license.

I might clean up the code at some point, hopefully making it easier to contribute, but that might be a ways off.
