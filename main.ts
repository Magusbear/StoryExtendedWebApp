import { queryAI } from './index.js';
import jsonNameData from './EasternKingdomsNPC.json';
import { setUpOpenAi } from './index.js';
import { openDB, deleteDB, wrap, unwrap } from 'idb';
import JSZip from 'jszip';
import { StringMappingType } from 'typescript';
declare const indexedDB: IDBFactory;

//HTML elements WRAP THIS IN AN OBJECT {} LATER
const submitAllFormsBtn = document.getElementById('save-all-btn');
const inputFields = document.querySelectorAll('input, textarea, select');
const downloadJsonBtn = document.getElementById('downloadJsonBtn')!;
const localStorageList = document.getElementById('localStorageList');
const AIGenerate1Btn = document.getElementById('AIGenerate1Btn');
const DeleteEntryBtn = document.getElementById('deleteEntry')!;
const changeApiKeys = document.getElementById("changeApiKeys")!;
const newDialogueBtn = document.getElementById("newDialogueBtn")!;
const saveElevenLabsApiKey = document.getElementById("saveElevenLabsApiKey")!;
const saveOpenAiApiKey = document.getElementById("saveOpenAiApiKey")!;
const selectElement = document.querySelector('select')!;
const toggleAiVoices = document.getElementById("toggleAiVoices")!;
const toggleTextGenSettings = document.getElementById("changeTextGenSettings")!;
const aiOptionsElement = document.querySelector('.AiOptions')!;
const autoCompleteNamesList = jsonNameData[0];
const dlAiVoice = document.getElementById("dlAiVoice")!;
const playAiVoice = document.getElementById("playAiVoice")!;
const AIGenerate1 = document.getElementById("AIGenerate1")!;
const AIGenerate2 = document.getElementById("AIGenerate2")!;
const AIGenerate3 = document.getElementById("AIGenerate3")!;
const AIGenerate4 = document.getElementById("AIGenerate4")!;
const saveAiSettings = document.getElementById("saveAiSettings")!;
const aivoice = document.getElementById("aivoice")!;
const downloadDbBtn = document.getElementById("downloadDbBtn")!;
const uploadDbBtn = document.getElementById("uploadDbBtn")!;
const toggleuploadDbBtn = document.getElementById("toggleuploadDbBtn")!;
const changeAddonSettings = document.getElementById("changeAddonSettings")!;
const saveAddonSettings = document.getElementById("saveAddonSettings")!;
const dataAddonName = document.getElementById("dataAddonName")!;
const addonPriority = document.getElementById("addonPriority")!;
const deleteDbBtn = document.getElementById("deleteDbBtn")!;
const dbDelModal = document.querySelector('.dbDelModal') as HTMLElement;
const yesButton = document.querySelector('#yes-button') as HTMLElement;
const noButton = document.querySelector('#no-button') as HTMLElement;
const OpenToId1 = document.getElementById("OpenToId1")!;
const OpenToId2 = document.getElementById("OpenToId2")!;
const OpenToId3 = document.getElementById("OpenToId3")!;
const OpenToId4 = document.getElementById("OpenToId4")!;
const dropdownBtn = document.querySelector('.dropdown-btn')!;

const currentAppVersion:string =  "0.1";
let dbVersion = 1;                // Current Database DB. Needs to be incremented when any keys in the database change
const currentAddonVersion = 0.1;    // Current WoW Addon version


//OpenAI prompt modifiers
const initialAiCharDescription = "An orc. Recruiter and trainer for adventurers and warriors already belonging to the Horde. Is a veteran. A bit grumpy. Not impressed by you. He will give you some tasks later on to test you.";
const initialAiCharQuote = " ";
const initialAiStaticPrompt = "You roleplay as a character in the warcraft universe. The time is that of World of Warcraft Classic, no further. Never break character. Never talk for anyone but yourself. Write up to 200 characters.";

//Addon settings
let inputFolderName:string;
let inputPriority:number;

//Helper variables for storing data in LocalStorage mostly or holding data for <a session
let aiCharDescription = "";
let aiCharQuote = "";
let aiStaticPrompt = "";
let generatedAudioUrl = "";
let generatedAudio: HTMLAudioElement | null = document.createElement('audio');
let newInput; // declare the variable outside the event listener
let newDialogueArray = [];
let idField = Document;
let openAiApiKey = "";
let elevenLabsApiKey = "";

interface DialogueObject {
    [key: string]: string | number | boolean | Blob;
    id: string;
    Name: string;
    ConditionValue:string;
    ConditionType: string;
    Greeting:boolean;
    UseAudio:boolean;
    FirstAnswer:string;
    SecondAnswer:string;
    ThirdAnswer:string;
    FourthAnswer:string;
    GoToID1:string;
    GoToID2:string;
    GoToID3:string;
    GoToID4:string;
    DoOnce1:boolean;
    DoOnce2:boolean;
    DoOnce3:boolean;
    DoOnce4:boolean;
    Text:string;
    audio:Blob;
    audioName:string;
};

interface apiKeyObject {
    name: string;
    value:string;
};
interface webAppObject {
    id: string;
    aiCharDescription: string;
    aiCharQuote: string;
    name_id: string;
    value: string;
};

//Initializes the database, creates the object stores and writes api key placeholders
async function initializeDatabase() {
    const dbName = 'seDatabase';
    const db = await openDB(dbName, dbVersion, {
      upgrade(db, oldVersion, newVersion, transaction) {
        // This is called when the database is created or upgraded
        console.log(`Upgrading database from version ${oldVersion} to ${newVersion}`);
        if (!db.objectStoreNames.contains('dialogue-store')) {
          db.createObjectStore('dialogue-store', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('api-key-store')) {
            db.createObjectStore('api-key-store', { keyPath: 'name' });
        }
        if (!db.objectStoreNames.contains('web-app-store')) {
            db.createObjectStore('web-app-store', { keyPath: 'id' });
        }
      }
    });
    // Write API key placeholders
    const apistore = await db.transaction('api-key-store', 'readwrite').objectStore('api-key-store');
    apistore.get("openAiApiKey").then(existingData => {
        if(!existingData){
            apistore.put({ name: "openAiApiKey", value: 'none' });
            };
        });
    apistore.get("elevenLabsApiKey").then(existingData => {
        if(!existingData){
            apistore.put({ name: "elevenLabsApiKey", value: 'none' });
        };
    });
    //write static AI prompt into DB
    const webAppStore = await db.transaction('web-app-store', 'readwrite').objectStore('web-app-store');
    webAppStore.get("openAiStaticSettings").then((existingData: Record<string, string>) => {
        if(!existingData){
            webAppStore.put({ id: "openAiStaticSettings", aiStaticPrompt: initialAiStaticPrompt });
            (document.getElementById("aiStaticPrompt") as HTMLTextAreaElement).value = initialAiStaticPrompt;
            console.log("Loading initial prompt");
            }
        else{
            const savedAiStaticPrompt: string = existingData.aiStaticPrompt;
            (document.getElementById("aiStaticPrompt") as HTMLTextAreaElement).value = savedAiStaticPrompt;
            console.log("Loading saved prompt");
        };
        });
  }

// write into database
async function saveDataToDB(data:DialogueObject | apiKeyObject | webAppObject| Partial<DialogueObject>, ObjectStore = "") {
    const dbName = 'seDatabase';
    const dbVersion = 1;
    const db = await openDB(dbName, dbVersion);
    const tx = db.transaction(ObjectStore, 'readwrite');
    const store = tx.objectStore(ObjectStore);
    await store.put(data);

    return new Promise<void>((resolve, reject) => {
        tx.addEventListener('complete', () => {
          db.close();
          resolve();
        });
    
        tx.addEventListener('error', () => {
          reject(tx.error);
        });
      });
    }

// Read Data from DB
async function readFromDB(readKey = "", ObjectStore = "") {
    const dbName = 'seDatabase';
    const dbVersion = 1;

    try {
        const db = await openDB(dbName, dbVersion);
        const tx = db.transaction(ObjectStore, 'readonly');
        const store = tx.objectStore(ObjectStore);
        const data = await store.get(readKey);

        if (data) {
            return data;
        } else {
            return null;
        };
    } catch (error) {
        console.error(error);
        return null;
    }
}

//deletes an item from an object store in the DB
async function deleteFromDB(id = "", objectStore ="", idName = 'id') {

    const dbName = 'seDatabase';
    const dbVersion = 1;

    try{
        const db = await openDB(dbName, dbVersion);
        const tx = db.transaction(objectStore, 'readwrite');
        const store = tx.objectStore(objectStore);
        const data = await store.get(id);
        if (data) {
            await store.delete(id);
            console.log(`Item with ${idName}: ${id} deleted from object store: ${objectStore}`);
          } else {
            console.log(`Item with ${idName}: ${id} not found in object store: ${objectStore}`);
        }

    } catch (error) {
        console.error(error);
        return null;
    }
};
  
//Returns all the key/value pairs of an object store as an array
async function getAllFromObjectStore(ObjectStore: string): Promise<DialogueObject[]> {
    const dbName = 'seDatabase';
    const dbVersion = 1;
    const db = await openDB(dbName, dbVersion);

    // Check if object store exists
    if (!db.objectStoreNames.contains(ObjectStore)) {
        console.error(`Object store "${ObjectStore}" does not exist.`);
        return [];
    }

    const tx = db.transaction(ObjectStore, 'readonly');
    const store = tx.objectStore(ObjectStore);

    // Check if object store is empty
    const count = await store.count();
    if (count === 0) {
        console.warn(`Object store "${ObjectStore}" is empty.`);
        return [];
    }

    const data = await store.getAll();
    return data;
}

//Sort the keys of the dialogue store by ID (so 10 does not come after 1)
function sortKeys(dialogueStore: DialogueObject[]) {
    return dialogueStore.sort((a, b) => {return Number(a.id) - Number(b.id)});
};

//retreive the stored API keys from IndexedDB on page load
async function writeApiKeysToForms() {
    const openAiApiKeyForm = document.getElementById("openAiApiKey") as HTMLInputElement;
    const elevenLabsApiKeyForm = document.getElementById("elevenLabsApiKey") as HTMLInputElement;
    let openAiApiKeyData = await readFromDB("openAiApiKey", 'api-key-store');
    let storedOpenAiApiKey = openAiApiKeyData.value
    let elvenLabsApiKeyData = await readFromDB("elevenLabsApiKey", 'api-key-store');
    let storedElvenLabsApiKey = elvenLabsApiKeyData.value
    openAiApiKey = storedOpenAiApiKey;
    if (openAiApiKey != "none") {
        setUpOpenAi(openAiApiKey);
    }
    elevenLabsApiKey = storedElvenLabsApiKey;
    openAiApiKeyForm?.setAttribute('value', openAiApiKey ?? '');
    elevenLabsApiKeyForm?.setAttribute('value', elevenLabsApiKey ?? ''); 
};

async function initializeOpenAiSettings() {
    const npcNameElem = document.getElementById("Name") as HTMLInputElement;
    const npcName = npcNameElem.value ?? "";
    if(npcName != ""){
        let openAiStatic = await readFromDB("openAiStaticSettings", "web-app-store")
        let savedCharacter = await readFromDB(npcName, "web-app-store")
        if (savedCharacter && savedCharacter.aiCharDescription){
            (document.getElementById("aiCharDescription") as HTMLInputElement).value = savedCharacter.aiCharDescription;
        }
        else{
            (document.getElementById("aiCharDescription") as HTMLInputElement).value = " ";
        };
        if (savedCharacter && savedCharacter.aiCharQuote){
            (document.getElementById("aiCharQuote") as HTMLInputElement).value = savedCharacter.aiCharQuote;
        }
        else{
            (document.getElementById("aiCharQuote") as HTMLInputElement).value = " ";
        };
        if (openAiStatic && openAiStatic.aiStaticPrompt){
            (document.getElementById("aiStaticPrompt") as HTMLTextAreaElement).value = openAiStatic.aiStaticPrompt;
        }
        else{
            (document.getElementById("aiStaticPrompt") as HTMLTextAreaElement).value = initialAiStaticPrompt ?? "";
            console.log("Test2");
        };
        aiCharDescription = (document.getElementById("aiCharDescription") as HTMLInputElement)?.value ?? "";
        aiCharQuote = (document.getElementById("aiCharQuote") as HTMLInputElement)?.value ?? "";
        aiStaticPrompt = (document.getElementById("aiStaticPrompt") as HTMLInputElement)?.value ?? "";
    }
    else{
        console.warn("Need to input a name before calling initializeOpenAiSettings");
        
    };

};

async function initializeAddonSettings() {
    let savedAddonSettings = await readFromDB("addonSettings", "web-app-store")
    
    // Get a random NPC name from the JSON data if none was given yet
    const npcNamesArray = jsonNameData[0]; // Get the first array
    const randomIndex = Math.floor(Math.random() * npcNamesArray.length);
    const randomName = npcNamesArray[randomIndex];
    let addonPriorityInitial = false;
    let addonNameInititial = false;
    // Remove spaces from the name
    const nameWithoutSpaces = randomName.replace(/\s/g, '');

    if (savedAddonSettings && savedAddonSettings.addonPriority){
        (document.getElementById("addonPriority") as HTMLInputElement).value = savedAddonSettings.addonPriority;
    }else{
        (document.getElementById("addonPriority") as HTMLInputElement).value = "100";
        addonPriorityInitial = true
    };
    if (savedAddonSettings && savedAddonSettings.dataAddonName != ""){
        (document.getElementById("dataAddonName") as HTMLInputElement).value = savedAddonSettings.dataAddonName;
    }else{
        (document.getElementById("dataAddonName") as HTMLInputElement).value = nameWithoutSpaces;
        addonNameInititial = true;

    };
    inputPriority = parseInt((document.getElementById("addonPriority") as HTMLInputElement)?.value ?? 100);
    inputFolderName = (document.getElementById("dataAddonName") as HTMLInputElement)?.value ?? nameWithoutSpaces;
    if (addonPriorityInitial === true && addonNameInititial === true){
        const newSettings = {id: "addonSettings",  addonPriority: inputPriority, dataAddonName: inputFolderName }
        await saveDataToDB(newSettings, "web-app-store");
    };
};


// runs database init and co  
async function main() {
    await initializeDatabase();
    await writeApiKeysToForms();
    await initializeAddonSettings();
}
// runs database init and co  
main();


//Writes the input of the forms into localStorage every time an input is changed
async function writeIntoLocalStorage(){

    //write input fields into indexedDB
    const currentIdField = document.getElementById("ID") as HTMLInputElement;
    const currentId = currentIdField?.value;
    if (currentId === ""){
        let allObjects = await getAllFromObjectStore('dialogue-store') as DialogueObject[];
        if (allObjects){
            allObjects = sortKeys(allObjects);
            const lastIndex:number = allObjects?.length - 1 ?? -1;
            if (lastIndex != -1){
                const lastIdString: string = allObjects[lastIndex].id;
                const lastId = parseInt(lastIdString);
                const newID = lastId + 1;
                currentIdField.value = newID.toString();
                console.log(`Created at ID ${newID}`)
            }
            else{
                console.log("Nothing in IndexedDB, creating at ID 1")
                currentIdField.value = "1";
            };

        }
        else{
            console.log("Nothing in IndexedDB, creating at ID 1")
            currentIdField.value = "1";
        };
    };

    let inputsList: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [
        ...document.getElementsByTagName('input'),
        ...document.getElementsByTagName('textarea'),
        ...document.getElementsByTagName('select')
      ]
      .filter(element => element.id !== "openAiApiKey")
      .filter(element => element.id !== "elevenLabsApiKey")
      .filter(element => element.id !== "AIGenerate1")
      .filter(element => element.id !== "AIGenerate2")
      .filter(element => element.id !== "AIGenerate3")
      .filter(element => element.id !== "AIGenerate4")
      .filter(element => element.id !== "aiCharDescription")
      .filter(element => element.id !== "aiCharQuote")
      .filter(element => element.id !== "aiStaticPrompt")
      .filter(element => element.id !== "addonPriority")
      .filter(element => element.id !== "dataAddonName")
      .filter(element => element.type !== "file");

    let writeData = [];
    //let entryData!: DialogueObject;
    let entryData: DialogueObject = {} as DialogueObject;
    inputsList.forEach(element  => {
        const  elementValue = element.value;
        const  elementId = element.id;
        const elementType = element.type;
        const elementChecked = (element as HTMLInputElement).checked;

        if(elementId === "ID"){                     //absolutely stupid band-aid fix because 
            entryData["id"] = elementValue;         //I sometimes wrote ID and sometimes id smh
        }
        else if(elementType === "checkbox"){
            entryData[elementId] = elementChecked;
        }
        else{
            entryData[elementId] = elementValue;
        };
    });
 
    // Write new generated text and input fields that are relevant into database under new id
    let savedData = await readFromDB(currentId, 'dialogue-store')         //read from DB for merging
    //we construct our data array with the variables we want to save
    //Checking if data already exists
    if(savedData){
        const mergedData = { ...savedData, ...entryData };                   //we merge our new data array with whatever is already in the DB
        await saveDataToDB(mergedData, 'dialogue-store')                      //Saving merged data to DB
    }
    else{
        await saveDataToDB(entryData, 'dialogue-store')                      //Saving merged data to DB
    };
    populateDBList("");
};

inputFields.forEach(inputField => {
    if(inputField.id != "openAiApiKey" && inputField.id != "elevenLabsApiKey" && inputField.id != "aiCharDescription" && inputField.id != "aiCharQuote" && inputField.id != "aiStaticPrompt" && inputField.id != "importFileInput" && inputField.id != "dataAddonName" && inputField.id != "addonPriority"){
        inputField.addEventListener('input', () => {
            writeIntoLocalStorage()
            const nameInput = document.getElementById("Name")!;
            if(inputField === nameInput){
                const nameList = document.getElementById("Namelist")!;
                nameList.innerHTML = "";                                                                //clear the nameList(datalist)
                const inputText = (nameInput as HTMLInputElement).value.toLowerCase();
                let nameArray:HTMLOptionElement [] = [];
                let maxCount = 0;
                for (let i = 0; i < autoCompleteNamesList.length; i++) {                                //autocompleteNamesList is a json holding all of our possible NPC names
                    //Keep the maximum length of the list to X
                    if (maxCount >= 100){
                        break;
                    }
                    const autoCompleteName = autoCompleteNamesList[i];
                    const autoCompleteNameLC = autoCompleteName.toLowerCase();
                    //Check our input against the current ListItem and if it is in the first index(or in other words in the beginning of the word)
                    if (autoCompleteNameLC.indexOf(inputText) === 0) {
                        //Just double checking for duplicates incase I ever introduce some to the list
                        if(!nameArray.find(option => option.value === autoCompleteName)){
                            let listItem = document.createElement('option');                            //Create the option element
                            listItem.value = autoCompleteName;                                          //Add our current ListItem as value to the option
                            nameList.appendChild(listItem);                                             //Append them to the nameList (datalist)
                            nameArray.push(listItem);                                                   //Add them to the nameArray as well so we can check for duplicates
                            maxCount++;                                                                 //increase the max count of the list
                        }
                    }
                }
            };
        });
    }
});

//Add an event listener for the selector element
selectElement.addEventListener('change', (event) => {
    //save into localStorage on changing the selector input
    writeIntoLocalStorage()
});
  
newDialogueBtn.addEventListener('click', () => {
    ClearLists()
    populateDBList("")
})

function ClearLists(){
    hideVoiceAiButtons()
    let inputsList: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [
        ...document.getElementsByTagName('input'),
        ...document.getElementsByTagName('textarea'),
        ...document.getElementsByTagName('select')
      ]
      .filter(element => element.id !== "openAiApiKey")
      .filter(element => element.id !== "elevenLabsApiKey")
      .filter(element => element.id !== "AIGenerate1")
      .filter(element => element.id !== "AIGenerate2")
      .filter(element => element.id !== "AIGenerate3")
      .filter(element => element.id !== "AIGenerate4")
      .filter(element => element.id !== "aiCharDescription")
      .filter(element => element.id !== "aiCharQuote")
      .filter(element => element.id !== "aiStaticPrompt")
      .filter(element => element.type !== "file");
      

    for (let i = 0; i < inputsList.length; i++) {
        if(inputsList[i].type === 'checkbox'){
            (inputsList[i] as HTMLInputElement).checked = false;
        }
        else{
            inputsList[i].value = '';
        }
    }
}

DeleteEntryBtn.addEventListener('click', async () => {
    let currentEntryString:string;
    let currentEntry: HTMLElement = document.getElementById('ID')!;
    if ((currentEntry as HTMLInputElement).value){
        currentEntryString = (currentEntry as HTMLInputElement).value;
    }
    else{
        return
    };
    try {
        await deleteFromDB(currentEntryString, "dialogue-store")
        ClearLists();
        populateDBList("");
    } catch (error) {
        console.log(error);
    }
})

downloadJsonBtn.addEventListener('click', () => {
    downloadLocalStorageAsLua()
});

function convertToLuaTable(arr:DialogueObject[]) {
    let luaString = '';
    for (let obj of arr) {
      let keyValuePairs = [];
      for (let [key, value] of Object.entries(obj)) {
        if(key != "audioName" && key != "audio"){
            keyValuePairs.push(`${key}="${value}"`);
        };
      }
      luaString += `{\n${keyValuePairs.join(',\n')}\n},\n`;
    }
    return luaString;
}

async function downloadLocalStorageAsLua() {
    const randomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const dbDump = await getAllFromObjectStore('dialogue-store');
    let luaTable = `setfenv(1, StoryExtendedEnv)\nSEDialogues${randomNumber} = {\n`;
    const convertedLuaTable = convertToLuaTable(dbDump);
    luaTable += `${convertedLuaTable}`;
    luaTable += "}";
    const mainLuaTable: string = `setfenv(1, StoryExtendedEnv)\nlocal addonName = "StoryExtendedData_${inputFolderName}"\nlocal function GetDialogueData()\n    return SEDialogues${randomNumber} \nend\n\nlocal StoryExtendedData${randomNumber} = {\n    name = addonName,\n    GetDialogue = GetDialogueData(),\n    addonPriority = GetAddOnMetadata(addonName, "X-StoryExtendedData-Priority")\n}\n\nStoryExtended:Register(addonName, StoryExtendedData${randomNumber})`;
    const tocFile: string = `## Interface: 100000\n## Title: StoryExtendedData_${inputFolderName}\n## Version: ${currentAddonVersion}\n## LoadOnDemand: 1\n## Dependencies: StoryExtended\n## X-StoryExtendedData-Parent: StoryExtended\n## X-StoryExtendedData-Data-Version: ${dbVersion}\n## X-StoryExtendedData-Priority: ${inputPriority}\n## X-StoryExtendedData-WebApp-Version: ${currentAppVersion}\ndb\\dialogue.lua\nmain.lua`

    const tocBlob = new Blob([tocFile], {type: 'text/plain'});
    const mainLuaBlob = new Blob([mainLuaTable], {type: 'text/plain'});
    const DialogueLuaBlob = new Blob([luaTable], {type: 'text/plain'});

    const zip = new JSZip();
    const mainFolder = zip.folder(`StoryExtendedData_${inputFolderName}`);
    const dbFolder = mainFolder!.folder("db");
    const audioFolder = mainFolder!.folder("audio");
    dbFolder!.file("dialogue.lua", DialogueLuaBlob);
    mainFolder!.file("main.lua", mainLuaBlob);
    mainFolder!.file(`StoryExtendedData_${inputFolderName}.toc`, tocBlob);

    for(let key in dbDump){
        let audioBlob = dbDump[key].audio
        let audioName = dbDump[key].audioName as string
        audioFolder!.file(audioName, audioBlob);
    };
    const content = await zip.generateAsync({ type: 'blob' });





    const luaUrl = URL.createObjectURL(content);
    const link = document.createElement('a');
    link.href = luaUrl;
    link.download = `StoryExtendedData_${inputFolderName}.zip`;
    document.body.appendChild(link);
    link.click();
}

async function AI_GenerateAnswer(QuestionField:number, textAIspinner:HTMLElement) {
    if(openAiApiKey === "none"){
        loadSpinnerHide(textAIspinner)
        alert("You need to input a valid OpenAI api key to use AI text generation.");
        return;
    };
    const AIGenerateBtnNumbers: Record<number, string> = {1:"FirstAnswer", 2:"SecondAnswer", 3:"ThirdAnswer", 4:"FourthAnswer"};
    const AIGenerateBtnNumber = AIGenerateBtnNumbers[QuestionField]
    const nameFieldID = document.getElementById('Name');                    //Get the current Name Element
    const nameField = (nameFieldID as HTMLInputElement).value;                                    //Extract the current Name
    const ConditionTypeFieldID = document.getElementById('ConditionType');                    //Get the current Name Element
    const ConditionTypeField = (ConditionTypeFieldID as HTMLInputElement).value;                                    //Extract the current Name
    const textFieldID = document.getElementById('Text');                    //Get the current Text Element  <- Used for AI generation
    const textField = (textFieldID as HTMLInputElement).value;                                    //Extract the current Text      <- Used for AI generation
    //const greetingFieldID = document.getElementById('Greeting');                    //Get the current Text Element  <- Used for AI generation
    //const greetingField = greetingFieldID.checked;                                    //Extract the current Text      <- Used for AI generation

    const AnswerFieldID = document.getElementById(AIGenerateBtnNumber);     //The Dialogue Choice element for which an anser is being generated
    const AnswerField = (AnswerFieldID as HTMLInputElement).value;                                //The Dialogue Choice value for which an anser is being generated

    //Create data array for sending over to queryAI function
    const data = {name: nameField, last_text: textField, user_input: AnswerField, aiCharDescription: aiCharDescription, aiCharQuote: aiCharQuote, aiStaticPrompt: aiStaticPrompt};
    //Query OpenAI for text generation
    queryAI(data).then(async (output:string) => {                                                         // wait for the output to be finished before continuing 
        newInput = {};
        //GPT output is sometimes formatted weird. with some newline markers and such. Here we remove everything along those lines
        output = output.replace(/\r?\n|\r/g, '');                       //double
        output = output.replace(/\n/g, "");                             //checked
        let outputFormatted = JSON.stringify(output).replace(/"/g, "");;//GPT also likes to put double quotes around stuff it writes. We remove that

        //write the id for the new dialogue into the GoToId field and into the database
        const currentIdElement = document.getElementById('ID');                  //Get the current ID Element
        let currentId = (currentIdElement as HTMLInputElement).value;                                 //Extract the current ID value
        

        let allObjects = await getAllFromObjectStore('dialogue-store');
        allObjects = sortKeys(allObjects);
        const lastIndex = allObjects.length - 1
        const lastIdString = allObjects[lastIndex].id;
        const lastId = parseInt(lastIdString);
        const nextID = lastId + 1;
        const nextIdString = nextID.toString();

        
        let GoToField = 'GoToID' + QuestionField;                       //the Question (GoToID field field) from which we generated the AI answer
        let GoToIdField = document.getElementById(GoToField);    //the html element of our GoToID input field
        (GoToIdField as HTMLInputElement).valueAsNumber = nextID;                               // writing the dialogue ID of the text we generated into the GoToID field
        //DB read/write:
        let savedDataCurrentForm = await readFromDB(currentId, 'dialogue-store')         //read from DB for merging
        //we construct our data array with the variables we want to save
        const dataCurrentForm: Partial<DialogueObject> = {};
        dataCurrentForm[GoToField] = nextID;
        //Checking if data already exists --- should always exist -- I mean we are pretty much in it right now?
        if(savedDataCurrentForm){
            const mergedData = { ...savedDataCurrentForm, ...dataCurrentForm };                   //we merge our new data array with whatever is already in the DB
            await saveDataToDB(mergedData, 'dialogue-store')                      //Saving merged data to DB
        }
        else{
            await saveDataToDB(dataCurrentForm, 'dialogue-store')                      //Saving merged data to DB
        };
            

        // Write new generated text and input fields that are relevant into database under new id
        let savedData = await readFromDB(nextIdString, 'dialogue-store')         //read from DB for merging
        //we construct our data array with the variables we want to save
        const emptyBlob = new Blob([]);
        const data: DialogueObject = { id: nextIdString, Name: nameField, ConditionType: ConditionTypeField, 
        Text: outputFormatted, ConditionValue: "", FirstAnswer: "",
        GoToID1: "", SecondAnswer: "", GoToID2: "", ThirdAnswer: "", GoToID3: "",
        FourthAnswer: "", GoToID4: "", UseAudio: false, Greeting: false, DoOnce1: false, 
        DoOnce2: false, DoOnce3:false, DoOnce4: false, audio: emptyBlob, audioName: "" }
        //Checking if data already exists --- it shouldn't because the next ID is always one bigger than the max index
        if(savedData){
            const mergedData = { ...savedData, ...data };                   //we merge our new data array with whatever is already in the DB
            await saveDataToDB(mergedData, 'dialogue-store')                      //Saving merged data to DB
        }
        else{
            await saveDataToDB(data, 'dialogue-store')                      //Saving merged data to DB
        };

    loadSpinnerHide(textAIspinner)
    populateDBList("");
  })
  .catch((err:string) => {
    console.error(err);
  });

}

dlAiVoice.addEventListener('click', async () => {
    const name: string = (document.getElementById("Name") as HTMLInputElement)?.value || "unknown";
    const id = (document.getElementById("ID") as HTMLInputElement)?.value || "0";
    const audioName = name + id + '.mp3';

    const xhr = new XMLHttpRequest();
    xhr.open('GET', generatedAudioUrl, true);
    xhr.responseType = 'blob';
    xhr.onload = async () => {
        if (xhr.status === 200) {
            const audioBlob = xhr.response;
            let savedData = await readFromDB(id, "dialogue-store");
            const data = { id: id, audioName: audioName, audio: audioBlob };
            const mergedData = { ...savedData, ...data };
            await saveDataToDB(mergedData, "dialogue-store");
            generatedAudio = null;
        }
    };

    xhr.send();
});

playAiVoice.addEventListener('click', async () => {
    if (generatedAudio && generatedAudio.src){
        generatedAudio.play();
    }else{
        const id = (document.getElementById("ID") as HTMLInputElement)?.value || "0";
        let dialogueDB = await (readFromDB(id, "dialogue-store") as unknown);
        let confirmedDialogueDB = dialogueDB as DialogueObject;
        const audioObj = new Audio();
        audioObj.src = URL.createObjectURL(confirmedDialogueDB.audio);
        audioObj.play()
    };
});

function showVoiceAiButtons() {
    const dlButton = document.getElementById("dlAiVoice")!;
    const playButton = document.getElementById("playAiVoice")!;
    playButton.style.visibility = "visible";
    playButton.style.display = "Flex";
    dlButton.style.visibility = "visible";
    dlButton.style.display = "Flex";
};

function hideVoiceAiButtons() {
    const dlButton = document.getElementById("dlAiVoice")!;
    const playButton = document.getElementById("playAiVoice")!;
    playButton.style.visibility = "hidden";
    playButton.style.display = "None";
    dlButton.style.visibility = "hidden";
    dlButton.style.display = "None";
};

// Hide and Show API Key Inputs
function showChangeApiKeyBtn() {
    const changeApiKeyBtn = document.getElementsByClassName("APIKeys").item(0);
    const APIKeysParent = document.querySelector('.APIKeys')!;
    const APIKeysChildren = APIKeysParent.querySelectorAll('*');
    APIKeysChildren.forEach(APIKeysChild => {
        (APIKeysChild as HTMLElement).style.visibility = "visible";
        (APIKeysChild as HTMLElement).style.display = "flex";
    });
    (changeApiKeyBtn as HTMLElement).style.visibility = "visible";
    (changeApiKeyBtn as HTMLElement).style.display = "flex";
};

function hideChangeApiKeyBtn() {
    const changeApiKeyBtn = document.getElementsByClassName("APIKeys").item(0);
    const APIKeysParent = document.querySelector('.APIKeys')!;
    const APIKeysChildren = APIKeysParent.querySelectorAll('*')!;
    APIKeysChildren.forEach(APIKeysChild => {
        (APIKeysChild as HTMLElement).style.visibility = "hidden";
        (APIKeysChild as HTMLElement).style.display = "None";
    });
    (changeApiKeyBtn as HTMLElement).style.visibility = "hidden";
    (changeApiKeyBtn as HTMLElement).style.display = "None";
};

function checkChangeApiKeyBtn() {
    const changeApiKeyBtn = document.getElementsByClassName("APIKeys").item(0)!;
    const btnVisibility = getComputedStyle(changeApiKeyBtn).getPropertyValue("visibility");
    return btnVisibility;
};

changeApiKeys.addEventListener('click', () => {
    if (checkChangeApiKeyBtn() === "visible") {
        hideChangeApiKeyBtn();
    } else {
        showChangeApiKeyBtn();
    }
});
//END - Hide and Show API Key Inputs

// Hide and Show Addon Settings Inputs
function showAddonSettings() {
    const addonSettingsCapsule = document.getElementsByClassName("addonSettings").item(0);
    const addonSettingsParent = document.querySelector('.addonSettings')!;
    const addonSettingsChildren = addonSettingsParent.querySelectorAll('*')!;
    addonSettingsChildren.forEach(addonSettingsChild => {
        (addonSettingsChild as HTMLElement).style.visibility = "visible";
        (addonSettingsChild as HTMLElement).style.display = "flex";
    });
    (addonSettingsCapsule as HTMLElement).style.visibility = "visible";
    (addonSettingsCapsule as HTMLElement).style.display = "flex";
};

function hideAddonSettings() {
    const addonSettingsCapsule = document.getElementsByClassName("addonSettings").item(0);
    const addonSettingsParent = document.querySelector('.addonSettings')!;
    const addonSettingsChildren = addonSettingsParent.querySelectorAll('*')!;
    addonSettingsChildren.forEach(addonSettingsChild => {
        (addonSettingsChild as HTMLElement).style.visibility = "hidden";
        (addonSettingsChild as HTMLElement).style.display = "None";
    });
    (addonSettingsCapsule as HTMLElement).style.visibility = "hidden";
    (addonSettingsCapsule as HTMLElement).style.display = "None";
};

function checkAddonSettingsVisibility() {
    const addonSettingsCapsule = document.getElementsByClassName("addonSettings").item(0)!;
    const adnStnsVisibility = getComputedStyle(addonSettingsCapsule).getPropertyValue("visibility");
    return adnStnsVisibility;
};

changeAddonSettings.addEventListener('click', (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    if (checkAddonSettingsVisibility() === "visible") {
        hideAddonSettings();
    } else {
        showAddonSettings();
    }
});

saveAddonSettings.addEventListener('click',async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    if ((addonPriority as HTMLInputElement).value && (dataAddonName as HTMLInputElement).value){
            const newAddonName = ((dataAddonName as HTMLInputElement).value as string);
            const newAddonPriority:number = (Number((addonPriority as HTMLInputElement).value));
            const newSettings = {id: "addonSettings",  addonPriority: newAddonPriority, dataAddonName: newAddonName }
            await saveDataToDB(newSettings, "web-app-store");
    } else {
        alert("Please input both Addon Name and Addon Priority");
    };
});



function showDbDelModal() {
    dbDelModal.style.display = 'block';
    yesButton.addEventListener('click', handleYesClickDbDel);
    noButton.addEventListener('click', handleNoClickDbDel);
  }
  
  function hideDbDelModal() {
    dbDelModal.style.display = 'none';
  }
  
async function handleYesClickDbDel() {
// Code to delete the indexedDB
const tempOpenAiKey: string = openAiApiKey
const tempElevenAiKey: string = elevenLabsApiKey
const dbName = 'seDatabase';
const deleteRequest = indexedDB.deleteDatabase(dbName);
deleteRequest.onsuccess = async () => {
    console.log(`Deleted ${dbName} database`);
    await initializeDatabase()
    const elevenLabsAiKeydata = { name: "elevenLabsApiKey", value: tempElevenAiKey };
    await saveDataToDB(elevenLabsAiKeydata, 'api-key-store');
    const openAiKeydata = { name: "openAiApiKey", value: tempOpenAiKey };
    await saveDataToDB(openAiKeydata, 'api-key-store');
    if (openAiApiKey != "none") {
        setUpOpenAi(openAiApiKey);
    };
    location.reload();
};
deleteRequest.onerror = () => {
    console.error(`Error deleting ${dbName} database`);
};
hideDbDelModal();
};
  
function handleNoClickDbDel() {
    hideDbDelModal();
};


deleteDbBtn.addEventListener('click',async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    const computedStyle = window.getComputedStyle(dbDelModal);
    if (computedStyle.display === "none") {
        console.log("Show")
        showDbDelModal();
    } else {
        hideDbDelModal();
        console.log("Hide")
    }
});

//END - Hide and Show Addon Settings Inputs

OpenToId1.addEventListener('click',async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    const GoToID1 = document.getElementById("GoToID1")!;
    const GoToID1Value = (GoToID1 as HTMLInputElement).value;
    if (GoToID1Value === "" || GoToID1Value === "-1"){

    }else{
        // ClearLists()
        // populateDBList(GoToID1Value);
        populateInputFields(GoToID1Value);
        populateDBList("");
    };
});

OpenToId2.addEventListener('click',async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    const GoToID2 = document.getElementById("GoToID2")!;
    const GoToID2Value = (GoToID2 as HTMLInputElement).value;
    if (GoToID2Value === "" || GoToID2Value === "-1"){

    }else{
        // ClearLists()
        // populateDBList(GoToID1Value);
        populateInputFields(GoToID2Value);
        populateDBList("");
    };
});

OpenToId3.addEventListener('click',async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    const GoToID3 = document.getElementById("GoToID3")!;
    const GoToID3Value = (GoToID3 as HTMLInputElement).value;
    if (GoToID3Value === "" || GoToID3Value === "-1"){

    }else{
        // ClearLists()
        // populateDBList(GoToID1Value);
        populateInputFields(GoToID3Value);
        populateDBList("");
    };
});

OpenToId4.addEventListener('click',async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    const GoToID4 = document.getElementById("GoToID4")!;
    const GoToID4Value = (GoToID4 as HTMLInputElement).value;
    if (GoToID4Value === "" || GoToID4Value === "-1"){

    }else{
        // ClearLists()
        // populateDBList(GoToID1Value);
        populateInputFields(GoToID4Value);
        populateDBList("");
    };
});

dropdownBtn.addEventListener('mouseenter',async function() {
    const idField = document.getElementById("ID")!;
    let idFieldValue = (idField as HTMLInputElement).value || "";
    if (idFieldValue != ""){
        // Handle mouseenter event
        let fullDialogueStore = await getAllFromObjectStore('dialogue-store');       //read all from DB
        fullDialogueStore = sortKeys(fullDialogueStore);                            //sort the list
        // Get the reference to the list
        let dropdownList = document.getElementById('dropdown-content')!;

        // Clear the list before populating it again
        dropdownList.innerHTML = '';
    for (let key in fullDialogueStore){
            let GoToID1Nb = parseInt(fullDialogueStore[key].GoToID1);
            let GoToID2Nb = parseInt(fullDialogueStore[key].GoToID2);
            let GoToID3Nb = parseInt(fullDialogueStore[key].GoToID3);
            let GoToID4Nb = parseInt(fullDialogueStore[key].GoToID4);
            let idFieldValueNb = parseInt(idFieldValue);
            if(GoToID1Nb === idFieldValueNb || GoToID2Nb === idFieldValueNb || GoToID3Nb === idFieldValueNb || GoToID4Nb === idFieldValueNb){
                let listItem = document.createElement('a');                                        // Create a list(a) item for our dialogue database
                const value = fullDialogueStore[key];                                                 // Get the value at index (key)
                const textValue = value.Text;                                                       //Extract the value of Text
                const shortText = textValue.substring(0, 20);                                       //shorten Text
                const idValue = value.id;                                                           //Extract the value of id
                listItem.textContent = `ID: ${idValue}: "${shortText}..."`;    //Create a readable text string of id, name and text for the list item
                dropdownList.appendChild(listItem);
                // Color the currently selected dialogue list item
                //Add an event listener for every list item so that they are clickable
                listItem.addEventListener('click', async () => {
                    populateInputFields(idValue);
                    populateDBList("");
                });
            }
        };
    };
  });


async function saveOpenAiSettings() {
    const npcName = (document.getElementById("Name") as HTMLInputElement).value || "";
    if (npcName === ""){
        alert("Put in a character name first.")
        return;
    };
    let openAiStaticSettings = await readFromDB("openAiStaticSettings", "web-app-store");
    let savedData = await readFromDB(npcName, "web-app-store");
    aiCharDescription = (document.getElementById("aiCharDescription") as HTMLInputElement).value;
    aiCharQuote = (document.getElementById("aiCharQuote") as HTMLInputElement).value;
    aiStaticPrompt = (document.getElementById("aiStaticPrompt") as HTMLTextAreaElement).value;
    const data = { id: npcName, aiCharDescription: aiCharDescription , aiCharQuote: aiCharQuote};
    const staticData = {id: "openAiStaticSettings",  aiStaticPrompt: aiStaticPrompt }
    if (openAiStaticSettings){
        const mergedData = { ...openAiStaticSettings, ...staticData };
        await saveDataToDB(mergedData, "web-app-store");
    }
    else{
        await saveDataToDB(staticData, "web-app-store");
    };
    if (savedData){
        const mergedData = { ...savedData, ...data };
        await saveDataToDB(mergedData, "web-app-store");
    }
    else{
        await saveDataToDB(data, "web-app-store");
    };
    
};

saveAiSettings.addEventListener('click', async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    await saveOpenAiSettings();
});

async function queryAiVoiceList() {
    if(elevenLabsApiKey === "none"){
        alert("You need to input a valid ElevenLabs api key to use AI speech generation.");
        return;
    };
    let savedVoiceData: Record<string, string> = {};
    let savedVoiceName = "";
    const npcName = (document.getElementById("Name") as HTMLInputElement).value;
    if(npcName){
        savedVoiceData = await readFromDB(npcName, "web-app-store");
        if(savedVoiceData){
            savedVoiceName = savedVoiceData.value;
        };
    }
    else{
        alert("You need to enter a Name before using the voice list.");
        return;
    };
    //Fetches the available AI voices
    fetch('https://api.elevenlabs.io/v1/voices', {
        method: 'GET',
        headers: {
        'accept': 'application/json',
        'xi-api-key': elevenLabsApiKey
        }
    })
        .then(response => response.json())
        .then(data => {
            console.log(data);
            if (data.length != 0){
                let voices = data.voices;
                let localStorageList = document.getElementById('AiVoiceList')!;
                localStorageList.innerHTML = '';
                showAiVoicesFunc()
                // Populate the list with the sorted keys and values
                for (let key of voices) {
                    if (key.category != "premade"){
                        let voiceListItem = document.createElement('li');
                        let voice_id = key.voice_id;
                        let value = key.name;
                        voiceListItem.textContent = `Voice: ${value}`;
                        localStorageList.appendChild(voiceListItem);
                        if(savedVoiceName && savedVoiceName === value){
                            voiceListItem.style.backgroundColor = "lightgrey";
                        }
                        //Add an event listener for when the list item is clicked
                        voiceListItem.addEventListener('click', async () => {
                            let savedData = await readFromDB(npcName, "web-app-store");
                            Array.from(localStorageList.children).forEach((item: Element) => {
                                (item as HTMLUListElement).style.backgroundColor = "white";
                            });
                            if(npcName && savedData){
                                voiceListItem.style.backgroundColor = "lightgrey";
                                const data = { id: npcName, value: value , name_id: voice_id};
                                const mergedData = { ...savedData, ...data };
                                await saveDataToDB(mergedData, "web-app-store");
                            }
                            else if (npcName){
                                voiceListItem.style.backgroundColor = "lightgrey";
                                const data = { id: npcName, value: value , name_id: voice_id};
                                await saveDataToDB(data, "web-app-store");
                            };
                        });
                    };   
                }
            }
            else{
                console.warn("Your API key may be wrong or you may have used a voice you aren't allowed to use anymore.")
            };
        })
        .catch(error => console.error(error));
};

function showAiVoicesFunc() {
    const AiVoiceList = document.getElementById("AiVoiceList")!;
    AiVoiceList.style.display = "flex";
};

function hideAiVoicesFunc() {
    const AiVoiceList = document.getElementById("AiVoiceList")!;
    AiVoiceList.style.display = "none";
};

toggleAiVoices.addEventListener('click', async () => {
    const AiVoiceList = document.getElementById("AiVoiceList")!;
    const computedStyle = window.getComputedStyle(AiVoiceList);
    if (computedStyle.display === "none") {
        await queryAiVoiceList()
    } else {
        hideAiVoicesFunc ()
    }
  });

saveElevenLabsApiKey.addEventListener('click', async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    const currentElevenLabsApiKey = document.getElementById("elevenLabsApiKey")!;
    elevenLabsApiKey = (currentElevenLabsApiKey as HTMLInputElement).value;
    const data = { name: "elevenLabsApiKey", value: elevenLabsApiKey };
    await saveDataToDB(data, 'api-key-store')
});


saveOpenAiApiKey.addEventListener('click', async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    const currentOpenAiApiKey = document.getElementById("openAiApiKey")!;
    openAiApiKey = (currentOpenAiApiKey as HTMLInputElement).value;
    const data = { name: "openAiApiKey", value: openAiApiKey };
    //localStorage.setItem("openAiApiKey", openAiApiKey);
    await saveDataToDB(data, 'api-key-store')
    if (openAiApiKey != "none") {
        setUpOpenAi(openAiApiKey);
    }
});

function showUploadButtons() {
    const uploadDbBtn = document.getElementById("uploadDbBtn")!;
    const importFileInput = document.getElementById("importFileInput")!;
    uploadDbBtn.style.display = "Flex";
    importFileInput.style.display = "Flex";
};

function hideUploadButtons() {
    const uploadDbBtn = document.getElementById("uploadDbBtn")!;
    const importFileInput = document.getElementById("importFileInput")!;
    uploadDbBtn.style.display = "none";
    importFileInput.style.display = "none";
};

toggleuploadDbBtn.addEventListener('click', async () => {
    const uploadDbBtn = document.getElementById("uploadDbBtn")!;
    const computedStyle = window.getComputedStyle(uploadDbBtn);
    if (computedStyle.display === "none") {
        showUploadButtons();
    } else {
        hideUploadButtons();
    }
});

downloadDbBtn.addEventListener('click', async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
        let request = indexedDB.open('seDatabase');

        request.onerror = (event) => {
        console.log('Error opening database');
        };

        request.onsuccess = (event:any) => {
        let db = event.target.result;

        // Call the exportObjectStore function
        exportObjectStore(db, 'dialogue-store');
        exportObjectStore(db, 'api-key-store');
        exportObjectStore(db, 'web-app-store');
        };

        let exportObjectStore = (database: IDBDatabase , storeName: string) => {
        let exportRequest = database.transaction(storeName)
                                 .objectStore(storeName)
                                 .getAll();
      
        exportRequest.onsuccess = (event: any) => {
            if(event.length != 0){
            let data = event.target.result;
            let blob = new Blob([JSON.stringify(data)], {type: "application/json"});
            let url = URL.createObjectURL(blob);
            let link = document.createElement('a');
            link.href = url;
            link.download = storeName + '.json';
            link.click();
            }
            else{
                console.warn("Database or ObjectStore not found.")
            };
        };
      }
    
});

async function importObjectStore(database: IDBDatabase, storeName: string, file: File): Promise<void> {
    let reader = new FileReader();
    reader.readAsText(file);
    console.log(file.name)
    reader.onerror = () => {
        console.warn("Error reading file.");
      };    
    reader.onload = async () => {
        if (reader.result !== null) {
            if ((file.name).includes("dialogue-store")) {
                let savedDb = await getAllFromObjectStore("dialogue-store");
                console.log(savedDb);
                let data = JSON.parse(reader.result as string);
                let importTransaction = database.transaction(storeName, 'readwrite');
                let objectStore = importTransaction.objectStore(storeName);
                let lastID = 0;
                if (savedDb.length >= 1){
                    let sortedData:DialogueObject[] = sortKeys(savedDb);
                    console.log(sortedData);
                    let lastIndex: number = sortedData.length - 1;
                    let lastIDString: string = sortedData[lastIndex].id;
                    lastID = Number(lastIDString);
                };
                data.forEach((item:DialogueObject) => {
                    //want to shorten this when I find the time
                    if(lastID > 0){
                        let newId: number = lastID + Number(item.id);
                        let newIdString:string = newId.toString();
                        item.id = newIdString;
                        if (item.GoToID1 != "" && item.GoToID1 != "-1"){
                            let newGoToId1: number = lastID + Number(item.GoToID1);
                            let newGoToId1String:string = newGoToId1.toString();
                            item.GoToID1 = newGoToId1String;
                        };
                        if (item.GoToID2 != "" && item.GoToID2 != "-1"){
                            let newGoToId2: number = lastID + Number(item.GoToID2);
                            let newGoToId2String:string = newGoToId2.toString();
                            item.GoToID2 = newGoToId2String;
                        };
                        if (item.GoToID3 != "" && item.GoToID3 != "-1"){
                            let newGoToId3: number = lastID + Number(item.GoToID3);
                            let newGoToId3String:string = newGoToId3.toString();
                            item.GoToID3 = newGoToId3String;
                        };
                        if (item.GoToID4 != "" && item.GoToID4 != "-1"){
                            let newGoToId4: number = lastID + Number(item.GoToID4);
                            let newGoToId4String:string = newGoToId4.toString();
                            item.GoToID4 = newGoToId4String;
                        };
                    };
                    // want to shorten this when I find the time ^^^^
                    objectStore.add(item);
                });
                
                importTransaction.oncomplete = () => {
                    alert('Data imported successfully');
                };
            } else if((file.name).includes("api-key-store")) {
                let savedDb = await getAllFromObjectStore("api-key-store");
                console.log(savedDb);
                let data = JSON.parse(reader.result as string);
                let importTransaction = database.transaction(storeName, 'readwrite');
                let objectStore = importTransaction.objectStore(storeName);
                data.forEach((item:apiKeyObject) => {
                    objectStore.put(item);
                });
                importTransaction.oncomplete = () => {
                    alert('Data imported successfully');
                };
            } else if((file.name).includes("web-app-store")) {
                let savedDb = await getAllFromObjectStore("web-app-store");
                console.log(savedDb);
                let data = JSON.parse(reader.result as string);
                let importTransaction = database.transaction(storeName, 'readwrite');
                let objectStore = importTransaction.objectStore(storeName);
                data = data.filter((item: webAppObject) => {
                    return item.id !== "addonSettings" && item.id !== "openAiStaticSettings";
                  });
                data.forEach((item:webAppObject) => {
                    objectStore.put(item);
                });
                importTransaction.oncomplete = () => {
                    alert('Data imported successfully');
                };
            };
        } else {
            console.warn("Cant read file.")
        };
    };
};


uploadDbBtn.addEventListener('click', async (event) => {
    event.preventDefault(); // prevent form submission and page refresh
    //Query database
    let request = indexedDB.open('seDatabase');
    request.onerror = (event) => {
    console.log('Error opening database');
    };
    request.onsuccess = (event:any) => {
        let db = event.target.result;
        let importFileInput = document.getElementById('importFileInput')!;
        if (event.target && (importFileInput as HTMLInputElement).files){
            let file = (importFileInput as HTMLInputElement).files![0];
            if ((file.name).includes("dialogue-store")) {
                importObjectStore(db, "dialogue-store", file);
            }else if((file.name).includes("web-app-store")) {
                importObjectStore(db, "web-app-store", file);
            }else if((file.name).includes("api-key-store")) {
                importObjectStore(db, "api-key-store", file);
            };
        }
        else{
            alert("Please choose a valid database .json file.")
        };
    }
});

function loadSpinnerShow(loadSpinner:HTMLElement) {
    loadSpinner.classList.add('animate');
    loadSpinner.style.display = "inline-block";
};

function loadSpinnerHide(loadSpinner:HTMLElement) {
    loadSpinner.classList.remove('animate');
    loadSpinner.style.display = "none";
};


aivoice.addEventListener('click', async () => {
    if(elevenLabsApiKey === "none"){
        alert("You need to input a valid ElevenLabs api key to use AI speech generation.");
        return;
    };
    const npcName = (document.getElementById("Name") as HTMLInputElement).value || "";
    let apiUrl:string;
    let payload = {"text":"", "voice_settings": {"stability":0, "similarity_boost": 0}};
    const voiceAIspinner = document.getElementById('voiceAiSpinner')!;
    if (npcName != ""){
        let savedVoiceData = await readFromDB(npcName, "web-app-store");
        let savedVoiceId = savedVoiceData.name_id;
        loadSpinnerShow(voiceAIspinner)
        hideVoiceAiButtons()
        const textInput = (document.getElementById("Text") as HTMLInputElement).value || "";
        if (textInput == ""){
            alert("You have to enter a Dialogue Text for the NPC if you want to generate voice.");
            return;
        }
        else{       
        apiUrl = 'https://api.elevenlabs.io/v1/text-to-speech/' + savedVoiceId;
        // Plays text as AI voice
        payload = {
            "text": textInput,
            "voice_settings": {
            "stability": 0,
            "similarity_boost": 0
            }
        };
        };
    }
    else{
        alert("Please enter a Name before you generate Voice.");
        return;
    };
    fetch(apiUrl, {
    method: 'POST',
    headers: {
        'accept': 'audio/mpeg',
        'xi-api-key': elevenLabsApiKey,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
    })
    .then(response => response.blob())
    .then(blob => {
        generatedAudioUrl = URL.createObjectURL(blob);
        generatedAudio = new Audio(generatedAudioUrl);
        loadSpinnerHide(voiceAIspinner)
        showVoiceAiButtons()
        
    })
    .catch(error => console.error(error));
});

AIGenerate1.addEventListener('click', () => {
    const textAIspinner = document.getElementById('textAiSpinner1')!;
    loadSpinnerShow(textAIspinner)
    const QuestionField = 1;
    AI_GenerateAnswer(QuestionField, textAIspinner)
});

AIGenerate2.addEventListener('click', () => {
    const textAIspinner = document.getElementById('textAiSpinner2')!;
    loadSpinnerShow(textAIspinner)
    const QuestionField = 2;
    AI_GenerateAnswer(QuestionField, textAIspinner)
});

AIGenerate3.addEventListener('click', () => {
    const textAIspinner = document.getElementById('textAiSpinner3')!;
    loadSpinnerShow(textAIspinner)
    const QuestionField = 3;
    AI_GenerateAnswer(QuestionField, textAIspinner)
});

AIGenerate4.addEventListener('click', () => {
    const textAIspinner = document.getElementById('textAiSpinner4')!;
    loadSpinnerShow(textAIspinner)
    const QuestionField = 4;
    AI_GenerateAnswer(QuestionField, textAIspinner)
});

function showTextGenSettings() {
    (aiOptionsElement as HTMLElement).style.display = "flex";
};

function hideTextGenSettings() {
    (aiOptionsElement as HTMLElement).style.display = "none";
};

toggleTextGenSettings.addEventListener('click', async () => {
    const computedStyle = window.getComputedStyle(aiOptionsElement);
    if (computedStyle.display === "none") {
        showTextGenSettings()
    } else {
        hideTextGenSettings ()
    }
});

function doesObjectStoreExist(dbName: string, objectStoreName:string) {
return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName);
    request.onerror = () => reject(Error("Failed to open database"));
    request.onsuccess = () => {
    const db = request.result;
    const objectStoreNames = db.objectStoreNames;
    const exists = objectStoreNames.contains(objectStoreName);
    db.close();
    resolve(exists);
    };
});
};

document.addEventListener("DOMContentLoaded", async function() {
    if (await doesObjectStoreExist("seDatabase", "web-app-store")){
        ClearLists()
        populateDBList("")
    };
});


async function populateInputFields(inputID:string) {
    ClearLists()        
    let savedDbValues = await readFromDB(inputID, "dialogue-store")

    //Input field list for every dialogue relevant item -- filtered out everything else
    let inputsList: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [
        ...document.getElementsByTagName('input'),
        ...document.getElementsByTagName('textarea'),
        ...document.getElementsByTagName('select')
      ]
      .filter(element => element.id !== "openAiApiKey")
      .filter(element => element.id !== "elevenLabsApiKey")
      .filter(element => element.id !== "AIGenerate1")
      .filter(element => element.id !== "AIGenerate2")
      .filter(element => element.id !== "AIGenerate3")
      .filter(element => element.id !== "AIGenerate4")
      .filter(element => element.id !== "aiCharDescription")
      .filter(element => element.id !== "aiCharQuote")
      .filter(element => element.id !== "aiStaticPrompt")
      .filter(element => element.type !== "file");
    
    //Go over every input field list item and input stored values
    for (let i = 0; i < inputsList.length; i++) {
        const inputField = inputsList[i];
        let inputFieldName = inputField.name;
        let valueInput;
        // extremely stupid workaround to fix my mistake of writing ID in one place and id in another
        if (inputFieldName === "ID"){
            inputFieldName = "id";
            valueInput = savedDbValues[inputFieldName];
            inputFieldName === "id"
        }
        else{
            valueInput = savedDbValues[inputFieldName];
        };
        //^end of workaround
        //Show Play Audio Btn if audio is saved
        let audioField = document.getElementById("playAiVoice")!;
        let audioDBCheck = savedDbValues as DialogueObject;
        if (audioDBCheck.audioName != ""){
            audioField.style.visibility = "visible";
            audioField.style.display = "Flex";
        };

        if (inputField.type === 'checkbox'){        //checkboxes need values put into "checked" not "value"
            (inputField as HTMLInputElement).checked = valueInput as boolean;        // Set the value of the element to the value in the array
        }
        else if (inputField.type === 'number' && valueInput != ""){
            (inputField as HTMLInputElement).valueAsNumber = valueInput as number; 
        }
        else {
            if (inputField instanceof HTMLInputElement){
                inputField.value = valueInput as string;          // Set the value of the element to the value in the array
            }
            else if(inputField instanceof HTMLTextAreaElement){
                inputField.value = valueInput as string;
            }
            else if(inputField instanceof HTMLSelectElement){
                inputField.value = valueInput as string;
            };
        }

    }

    await initializeOpenAiSettings()
    await initializeAddonSettings()
};

async function populateDBList(idInput:string) {  
    console.log("PopulateList")
    let fullDialogueStore = await getAllFromObjectStore('dialogue-store');       //read all from DB
    fullDialogueStore = sortKeys(fullDialogueStore);                            //sort the list
    // Get the reference to the list
    let localStorageList = document.getElementById('localStorageList')!;

    // Clear the list before populating it again
    localStorageList.innerHTML = '';

   for (let key in fullDialogueStore){
        const idField = document.getElementById("ID")!;
        let idFieldValue = (idField as HTMLInputElement).value || "";
        let listItem = document.createElement('li');                                        // Create a list(li) item for our dialogue database
        const value = fullDialogueStore[key];                                                 // Get the value at index (key)
        const nameValue = value.Name;                                                       //Extract the value of Name
        const textValue = value.Text;                                                       //Extract the value of Text
        const idValue = value.id;                                                           //Extract the value of id
        listItem.textContent = `Dialogue: ${idValue} | Name: ${nameValue} | Text: ${textValue}`;    //Create a readable text string of id, name and text for the list item
        localStorageList.appendChild(listItem);
        // Color the currently selected dialogue list item
        if (idInput === ""){
            if(value.id === idFieldValue){
                listItem.style.backgroundColor = "lightgrey";
            }
        }else{
            if(value.id === idInput){
                listItem.style.backgroundColor = "lightgrey";
            }
        };
        //Add an event listener for every list item so that they are clickable
        listItem.addEventListener('click', async () => {
            ClearLists()                                                                    //Clear all input fields
            Array.from(localStorageList.children).forEach((item) => {                       //Remove color from every list item
                (item as HTMLElement).style.backgroundColor = "white";                                       //
            });                                                                             //
            listItem.style.backgroundColor = "lightgrey";                                   //Color in selected/clicked item

            //Input field list for every dialogue relevant item -- filtered out everything else
            let inputsList: (HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement)[] = [
                ...document.getElementsByTagName('input'),
                ...document.getElementsByTagName('textarea'),
                ...document.getElementsByTagName('select')
              ]
              .filter(element => element.id !== "openAiApiKey")
              .filter(element => element.id !== "elevenLabsApiKey")
              .filter(element => element.id !== "AIGenerate1")
              .filter(element => element.id !== "AIGenerate2")
              .filter(element => element.id !== "AIGenerate3")
              .filter(element => element.id !== "AIGenerate4")
              .filter(element => element.id !== "aiCharDescription")
              .filter(element => element.id !== "aiCharQuote")
              .filter(element => element.id !== "aiStaticPrompt")
              .filter(element => element.type !== "file");
            
            //Go over every input field list item and input stored values
            for (let i = 0; i < inputsList.length; i++) {
                const inputField = inputsList[i];
                let inputFieldName = inputField.name;
                let valueInput;

                // extremely stupid workaround to fix my mistake of writing ID in one place and id in another
                if (inputFieldName === "ID"){
                    inputFieldName = "id";
                    valueInput = value[inputFieldName];
                    inputFieldName === "id"
                }
                else{
                    valueInput = value[inputFieldName];
                };
                //^end of workaround

                //Show Play Audio Btn if audio is saved
                let audioField = document.getElementById("playAiVoice")!;
                let audioDBCheck = value as DialogueObject;
                if (audioDBCheck.audioName != ""){
                    audioField.style.visibility = "visible";
                    audioField.style.display = "Flex";
                };

                if (inputField.type === 'checkbox'){        //checkboxes need values put into "checked" not "value"
                    (inputField as HTMLInputElement).checked = valueInput as boolean;        // Set the value of the element to the value in the array
                }
                else if (inputField.type === 'number' && valueInput != ""){
                    (inputField as HTMLInputElement).valueAsNumber = valueInput as number; 
                }
                else {
                    if (inputField instanceof HTMLInputElement){
                        inputField.value = valueInput as string;          // Set the value of the element to the value in the array
                    }
                    else if(inputField instanceof HTMLTextAreaElement){
                        inputField.value = valueInput as string;
                    }
                    else if(inputField instanceof HTMLSelectElement){
                        inputField.value = valueInput as string;
                    };
                }

            }

            await initializeOpenAiSettings()
            await initializeAddonSettings()
        });
   };
};  