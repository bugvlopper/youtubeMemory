var vol;
var playback;
chrome.storage.local.get(["volumeInStore","playbackRateInStore"],({ volumeInStore, playbackRateInStore })=>{
    vol = volumeInStore;
    playback = playbackRateInStore;
    console.log(volumeInStore);
    console.log(vol);
    inputLimiteur()
    noName()
})

function inputLimiteur(){
    document.getElementById('inputVolume').addEventListener("keyup",(l)=>{
        var value = l.target.value;
        if (value != "") {
            if (value < 1) {
            document.getElementById('inputVolume').value = 1;
            }
            if (value > 100) {
                document.getElementById('inputVolume').value = 100;
            }
        }
        console.log("teste");
        console.log(l.target.value);
    })
    document.getElementById('inputVolume').addEventListener("blur",(l)=>{
        var value = l.target.value;
        if (value == "") {
            document.getElementById('inputVolume').value = vol * 100;   
        }
        console.log("blur");
        console.log(l.target.value);
    })
    document.getElementById('inputSpeed').value
}

function noName(){
   document.getElementById('inputVolume').value = vol *  100;
   document.getElementById('inputSpeed').value = playback;

document.getElementById('button').addEventListener('click',()=>{
    
    inputVolume = document.getElementById('inputVolume').value / 100;
    inputSpeed = parseFloat(document.getElementById('inputSpeed').value);
    console.log(inputVolume);
    console.log(inputSpeed);
    var container = document.getElementById("container");
    container.setAttribute('style', "display: none")
    var body = document.body ;
    var saveMessage = document.createElement('p');
    saveMessage.setAttribute('id', 'saveMessage');
    saveMessage.setAttribute('class', 'saveMessage');
    saveMessage.innerHTML = "New settings save.";
    body.appendChild(saveMessage);
    setTimeout(()=>{
        document.getElementById('saveMessage').remove();
        container.removeAttribute('style', 'display: none')

    }, 2000)
    chrome.storage.local.set({ volumeInStore: inputVolume, playbackRateInStore: inputSpeed});
}) 
}

