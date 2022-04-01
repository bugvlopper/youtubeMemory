let color = '#333333';
const youtube = {};
chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.set({ color, youtube });
  console.log('Default background color set to %cgreen', `color: ${color}`);
});

var teste = {};

chrome.storage.sync.get("youtube", ({ youtube }) => {
	teste = youtube;
}); 
/* 

j'ai reussi a obtenir le titre des chaine youtube grace au mutation observer 
il me faut encore dev le partis pour modifier le volume en "BDD" 
j'ai une reponse pour l'ajout de nouvelle chaine (toutjour a verfier)
j'ai une reponse pour obtenir le volume en BDD pour les volumes modifier
il me faudra faire les communication pour les playBackRate(vitesse de lecture)

URGENT !!!! je dois crée un git et réorganiser mon code pour location 

*/
chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
    if(request.getVolume){
      var volumeToRespond =  teste[request.getVolume.channel].volume;
      sendResponse(volumeToRespond);
    }

    if(request.setChannel){
       if(!teste[request.setChannel.channel] && request.setChannel.channel != null){
      setChannel(teste, request.setChannel.channel);
      } else {
        console.log('already set or null');
      }
    }

    if(request.setVolume){
       var channel = request.setVolume.channel
      teste[channel].volume = request.setVolume.volume;
      chrome.storage.sync.set({ youtube: teste });
      console.log(teste, teste[channel]);
    }
	}
  );
  
chrome.storage.onChanged.addListener(function(result){
  console.log("storage change", result)
})

chrome.tabs.onActivated.addListener(async function (changeInfo){
  
  
  
  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  if(tab.url.match(/https:\/\/www\.youtube\.com\/.+/)){

   base(tab);
    
  }

  
});

chrome.tabs.onUpdated.addListener(async function (tabId, changeInfo, tab){
	  if(tab.url.match(/https:\/\/www\.youtube\.com\/.+/)){
      var complete = await changeInfo.status ==='complete';
      console.log(complete)
      if(complete === true){
        
        base(tab);
        
        chrome.scripting.executeScript({
          target: { tabId : tab.id },
          function: setVolume,
        });

      }
	  }
    
    
});


function base(tab){
	chrome.scripting.executeScript({
	  target: { tabId: tab.id },
	  func: getChannelName,
	  });
}

function getChannelName(){
  var channel;
  var set = false;
  var target = document.body;
  var observer = new MutationObserver(onMutate);
  observer.observe(target , { childList: true, subtree: true});
  function onMutate(mutationsList) {
    mutationsList.forEach(mutation => {
        if(document.getElementById("channel-name").getElementsByTagName('a')[0].innerText) {
          observer.disconnect();
          channel = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
          if(set == false){
            set = true;
            newSettings = {"setChannel":{"channel": channel}}
            chrome.runtime.sendMessage(newSettings,function(response){
              console.log(response);
            });
          }
        }
    })
  }           
};

function setVolume() {
  var volume = '0.25';
	var video = document.getElementsByTagName('video')[0];
  if(video.volume != volume){
    document.getElementsByTagName('video')[0].volume = '0.25';
    document.getElementsByClassName('ytp-volume-slider-handle')[0].style.left = '10px';
  }
  var volumeArea = document.getElementsByClassName('ytp-volume-area')[0];
  volumeArea.addEventListener('mouseover', remove);
  video.addEventListener('volumechange', setVol);
  volumeArea.addEventListener('mouseup', messageSetVolume);

  getChannelVolume(); 


  function remove() {
	  video.removeEventListener('volumechange', setVol,false); 
	  volumeArea.removeEventListener('mouseover', remove,false);
  }

  function setVol(){
    var slideSize = volume * 100 * 0.4;
    document.getElementsByTagName('video')[0].volume = volume;
    document.getElementsByClassName('ytp-volume-slider-handle')[0].style.left = slideSize+'px';
  }

  //a finir
  function messageSetVolume(){
    var channelName = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
    volume = video.volume;
    var newSettings = {"setVolume":{"channel": channelName
      ,"volume": volume}}
    chrome.runtime.sendMessage(newSettings);  
  }

  function getChannelVolume(){
    var channelName;
    var set = false;
    var target = document.body;
    var observer = new MutationObserver(onMutate);
    observer.observe(target , { childList: true, subtree: true});
    function onMutate(mutationsList) {
      mutationsList.forEach(mutation => {
          if(set == false){
            if(document.getElementById("channel-name").getElementsByTagName('a')[0].innerText) {
              observer.disconnect();
              channelName = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
              set = true;
              var chanToGet = {"getVolume": {"channel": channelName}}
              chrome.runtime.sendMessage(chanToGet,function(response){
                volume = response;
              });
            } 
          }
      })
    }
  }
};

function setChannel(teste, channel){
  console.log("before persist",teste);
  teste[channel] = {"volume": '0.25',
					"playbackRate": '1'};
  chrome.storage.sync.set({ youtube: teste });
};


