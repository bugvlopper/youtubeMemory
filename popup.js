var youtubeDataBase = {};
pop();

async function pop() {

  let [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if(tab.url.match(/https:\/\/www\.youtube\.com\/.+/)){
    
    chrome.storage.sync.get("youtube", ( you ) => {
      youtubeDataBase = you
    });

    chrome.scripting.executeScript({
        target: { tabId : tab.id },
        function: getChannelName,
      },setChannelField);

    
    function getChannelName(){
        var channel = document.getElementById("channel-name").getElementsByTagName('a')[0].innerText;
        var avatar = document.getElementById('avatar').getElementsByTagName('img')[0].getAttribute("src");
        var info = {'channel': channel,
                      'avatar': avatar}
        return info
    }
    function setChannelField(name){
        var avatar = name[0].result.avatar;
        var img = document.createElement('img');
        img.setAttribute('src', avatar);
        document.getElementById('img').append(img);
        var chanName = name[0].result.channel
        document.getElementById("channelName").getElementsByTagName('p')[0].innerHTML = chanName;
        console.log(youtubeDataBase);
        var nodevolume = document.createElement('p')
        nodevolume.innerHTML = youtubeDataBase.youtube[chanName].volume;
        document.getElementById("channelVolume").appendChild(nodevolume);
        var nodePlayback = document.createElement('p')
        nodePlayback.innerHTML = youtubeDataBase.youtube[chanName].playbackRate;
        document.getElementById("channelPlaybackRate").appendChild(nodePlayback);
    }
  }else if(tab.url.match(/https:\/\/www\.youtube\.com\//)){
    document.body.innerHTML = "Merci de choisir une video."
  }else{
    document.body.innerHTML = "Merci d'ouvrir une page youtube."
  }
}