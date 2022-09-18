
chrome.runtime.onInstalled.addListener(() => {
const youtube = {};
var volumeInStore = 0.25;
var playbackRateInStore = 1;
  chrome.storage.local.set({ youtube, volumeInStore, playbackRateInStore });
});

var teste = {};

chrome.storage.local.get(['youtube'], ({ youtube }) => {
	teste = youtube;
});

chrome.runtime.onMessage.addListener(
	function(request, sender, sendResponse) {
  
    if(request.setChannel){
       if(!teste[request.setChannel.channel] && request.setChannel.channel != null){
      setChannel(teste, request.setChannel.channel);
      } else {
        console.log('already set or null');
      }
    }
    
    if(request.getVolume){
      sendResponse(teste[request.getVolume.channel].volume);
    }

    if(request.setVolume){
       var channel = request.setVolume.channel
      teste[channel].volume = request.setVolume.volume;
      chrome.storage.local.set({ youtube: teste });
      console.log('SetVolume message receive',teste, teste[channel]);
    }

    if(request.getPlaybackRate){
      sendResponse(teste[request.getPlaybackRate.channel].playbackRate);
    }

    if(request.setPlaybackRate){
      var channel = request.setPlaybackRate.channel
      teste[channel].playbackRate = request.setPlaybackRate.playbackRate;
      chrome.storage.local.set({ youtube: teste });
    }

    if(request.chanIsSet){
      var channel = request.channel
      var isSet = false;
      if(teste[channel]){
        isSet = true;
      }
      sendResponse(isSet);
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
  console.log('update tab');
	  if(tab.url.match(/https:\/\/www\.youtube\.com\/.+/)){
      var complete = await changeInfo.status ==='complete';
      if(complete === true){
        
        base(tab);
        chrome.storage.local.get(["volumeInStore","playbackRateInStore"], ({ volumeInStore, playbackRateInStore }) => {
          console.log(volumeInStore);
          console.log(playbackRateInStore);
          chrome.scripting.executeScript({
            target: { tabId : tab.id },
            function: setVolume,
            args: [volumeInStore],
          });
          chrome.scripting.executeScript({
            target: { tabId : tab.id },
            function: setPlaybackRate,
            args: [playbackRateInStore],
          });
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
            });
          }
        }
    })
  }           
};

function setVolume(vol) {
  var volume = vol;
	var video = document.getElementsByTagName('video')[0];
  getChannelVolume();
  if(video.volume != volume){
    document.getElementsByTagName('video')[0].volume = volume;
    document.getElementsByClassName('ytp-volume-slider-handle')[0].style.left = '10px';
  }
  var volumeArea = document.getElementsByClassName('ytp-volume-area')[0];
  volumeArea.addEventListener('mouseover', remove);
  video.addEventListener('volumechange', setVol);
  volumeArea.addEventListener('mouseup', messageSetVolume);
  newVideoSelectVolume()

   

  function remove() {
	  video.removeEventListener('volumechange', setVol,false); 
	  volumeArea.removeEventListener('mouseover', remove,false);
  }

  function setVol(){
    var slideSize = volume * 100 * 0.4;
      if(volume !== undefined){
        document.getElementsByTagName('video')[0].volume = volume;
      }
    
    document.getElementsByClassName('ytp-volume-slider-handle')[0].style.left = slideSize+'px';
  }

  function messageSetVolume(){
    var channelName = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
    var newVolume = video.volume;
    var newSettings = {"setVolume":{"channel": channelName
      ,"volume": newVolume.toFixed(2)}}
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


  function newVideoSelectVolume(){
    var target2 = document.getElementById("channel-name");
    var observerNewSelect = new MutationObserver(onMutate);
    observerNewSelect.observe(target2 , { childList: true, subtree: true});
    function onMutate(mutationsList) {
      mutationsList.forEach(mutation => {
        if(document.getElementById("channel-name").getElementsByTagName('a')[0].innerText) {
          let channelName = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
          var chanIsSet = {"chanIsSet": {"channel": channelName}}
          chrome.runtime.sendMessage(chanIsSet,function(response){
            if (response === false) {
              var chanToSet = {"setChannel": {"channel": channelName}}
              chrome.runtime.sendMessage(chanToSet);
            }
          })
            var chanToGet = {"getVolume": {"channel": channelName}}
          chrome.runtime.sendMessage(chanToGet,function(response){
            volume = response;
            setVol()
          });
        }
      })
    }
  }



};


function setChannel(teste, channel){
  chrome.storage.local.get(['volumeInStore', 'playbackRateInStore'] ,(tab)=>{
    console.log("before persist",teste);
    teste[channel] = {"volume": tab.volumeInStore.toFixed(2),
            "playbackRate": tab.playbackRateInStore.toFixed(2)};
    chrome.storage.local.set({ youtube: teste });
  });
};

function setPlaybackRate(pbr) {
  console.log('setPlaybackRate pbr',pbr);
  var video = document.getElementsByTagName('video')[0];
  var playbackRate = pbr;
  console.log('setPlaybackRate playbackrate',playbackRate);
  if (playbackRate != undefined) {
    console.log('setPlaybackRate playbackrate 2',playbackRate);

    video.playbackRate = playbackRate;
  }
  let eventlistener = document.getElementsByClassName('ytp-popup ytp-settings-menu')[0].addEventListener('click',eventListener)
  getChannelPlaybackRate();
/*   newVideoSelectPlaybakeRate();
 */

  function eventListener(){
     video.addEventListener('ratechange',messageSetPlaybackRate); 
     removeEventListener("click", eventListener);  
  }



  function messageSetPlaybackRate(){
    var channelName = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
    playbackRate = video.playbackRate;
    var newSettings = {"setPlaybackRate":{"channel": channelName
      ,"playbackRate": playbackRate}}
    chrome.runtime.sendMessage(newSettings);  
    video.removeEventListener('ratechange',messageSetPlaybackRate, false)
  }

  function getChannelPlaybackRate(){
    var channelName;
    var set = false;
    var target = document.getElementById("channel-name");
    var observer = new MutationObserver(onMutate);
    observer.observe(target , { childList: true, subtree: true});
    function onMutate(mutationsList) {
      mutationsList.forEach(mutation => {
          if(set == false){
            if(document.getElementById("channel-name").getElementsByTagName('a')[0].innerText) {
              /* observer.disconnect(); */
              channelName = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
              set = true;
              var chanToGet = {"getPlaybackRate": {"channel": channelName}}
              setTimeout(() => {
                chrome.runtime.sendMessage(chanToGet,function(response){
                  video.playbackRate = response;
                 /*  switch (response){
                    case 0.25:
                      setPlaybackRateHtml(0);
                    break;
                    case 0.5:
                      setPlaybackRateHtml(1);
                    break;
                    case 0.75:
                      setPlaybackRateHtml(2);
                    break;
                    case 1:
                      setPlaybackRateHtml(3);
                    break;
                    case 1.25:
                      setPlaybackRateHtml(4);
                    break;
                    case 1.5:
                      setPlaybackRateHtml(5);
                    break;
                    case 1.75:
                      setPlaybackRateHtml(6);
                    break;
                    case 2:
                      setPlaybackRateHtml(7);
                    break;
                    default:
                      setPlaybackRateHtml(3);
                  } */
                });
              }, 100);
              
            } 
          }
      })
    }
  }
  
  function setPlaybackRateHtml(childNumber){
    console.log("child number before everything" ,childNumber);
    document.getElementsByClassName('ytp-settings-button')[0].click();
    var panel = document.getElementsByClassName('ytp-popup ytp-settings-menu')[0].getElementsByClassName('ytp-menuitem-label')
    for(var i = 0 ; i < panel.length; i++){
      if(panel[i].innerHTML == "Vitesse de lecture"){
        setTimeout(() => {
          panel[i].click();
          setTimeout(() => {
            console.log("child number" ,childNumber);
            let child = document.getElementsByClassName('ytp-panel-menu')[0].children[childNumber];
            child.click()
            
            setTimeout(() => {
              document.getElementsByClassName('ytp-settings-button')[0].click();
            }, 1000);
          }, 1000);
        }, 1000);  
        break;
      }
    }
    
    
    
     
  }

  function newVideoSelectPlaybakeRate(){
    var targetPbr = document.getElementById("channel-name");
    var observerNewSelectPbr = new MutationObserver(onMutate);
    observerNewSelectPbr.observe(targetPbr , { childList: true, subtree: true});
    function onMutate(mutationsList) {
      mutationsList.forEach(mutation => {

        if(document.getElementById("channel-name").getElementsByTagName('a')[0].innerText) {
          let channelName = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
          var chanIsSet = {"chanIsSet": {"channel": channelName}}
          chrome.runtime.sendMessage(chanIsSet,function(response){
            if (response === false) {
              var chanToSet = {"setChannel": {"channel": channelName}}
              chrome.runtime.sendMessage(chanToSet);
            }
          })
            var chanToGet = {"getPlaybackRate": {"channel": channelName}}
          chrome.runtime.sendMessage(chanToGet,(response)=>{
            document.getElementsByTagName('video')[0].playbackRate = response;
            console.log("response Pbr", response);
            /* switch (response){
                case 0.25:
                  setPlaybackRateHtml(0);
                break;
                case 0.5:
                  setPlaybackRateHtml(1);
                break;
                case 0.75:
                  setPlaybackRateHtml(2);
                break;
                case 1:
                  setPlaybackRateHtml(3);
                break;
                case 1.25:
                  setPlaybackRateHtml(4);
                break;
                case 1.5:
                  setPlaybackRateHtml(5);
                break;
                case 1.75:
                  setPlaybackRateHtml(6);
                break;
                case 2:
                  setPlaybackRateHtml(7);
                break;
                default:
                  setPlaybackRateHtml(3);
              } */
          });
        }
      })
    }
  }
}

function videoChangingOnSamePage(){
  var videoTarget = document.getElementsByTagName("video");
  var videoObserver = new MutationObserver(videoMutate);
  videoObserver.observe(videoTarget , { childList: true, subtree: true});
  function videoMutate(){
    console.log("video mutate");
    setPlaybackRate();
  }
}