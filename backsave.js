let color = '#333333';
const youtube = {};
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color, youtube });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

var test = {};
 
chrome.tabs.onActivated.addListener(async function (changeInfo){
  
  chrome.storage.sync.get("youtube", ({ youtube }) => {
    test = youtube;
  }); 
  console.log(test);
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if(tab.url.match(/https:\/\/www\.youtube\.com\//)){

      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: setChannel,
        args: [test],
      });

      update(test);  
  };
});

function update(test){
chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab){
  console.log(changeInfo);
  var channel = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
  if(test[channel]){
    if(changeInfo){
      chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: setChannel,
        args: [test],
      });
    };
  };
  });

};

function setChannel(test){
  console.log(test);
  var channel = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
  if(test[channel]){
    console.log('already set');
  }else{
    test[channel] = {};
    chrome.storage.sync.set({ youtube: test });
    console.log("new");
  };
};
