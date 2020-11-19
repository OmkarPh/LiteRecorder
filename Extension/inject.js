console.log("HI");

// Preliminary checks for API support
function showErrorMessage(){
    
    document.getElementById("mainBody").innerHTML = `<div style="font-size: 15px; font-style: oblique;">
                                    <center>
                                    Your device <br> is not compatible. <br><br> This works only on computers/Laptops.
                                    <br><br>
                                    Required JS APIs for this page are not available in some browsers,<br><br> so try on updated browsers with support for these APIs:)
                                    </center><br>
                                </div>`
    document.getElementById("mainBody").style = "background-image:url('images/bg.svg'); height: fit-content;";

}
if(navigator.mediaDevices.ondevicechange !== null){
    showErrorMessage();
    thisFunctionDoesntExistHenceWillCauseErrorAndStopExecutionOfFurtherJS(":-)");
}



let alertPermissionCount = 0;
let recorder, stream, recordedVideo, micStream;


// Utility functions
function toggleMic(){
    let isEnabled = micToggle.checked;
    if(isEnabled)
        document.getElementById("micStatus").innerHTML = '<i class="fas fa-microphone-alt text-xl" style="color:blue;"></i>';
    else
        document.getElementById("micStatus").innerHTML = '<i class="fas fa-microphone-alt-slash text-xl" style="color: black;"></i>';
}
function toggleVolume(){
    let isEnabled = volToggle.checked;
    if(isEnabled)
        document.getElementById("volumeStatus").innerHTML = '<i class="fas fa-volume text-xl" style="color:blue;"></i>';
    else
        document.getElementById("volumeStatus").innerHTML = '<i class="fas fa-volume-mute text-xl" style="color: black;"></i>';
}
function getFormattedTime(downloadable = false){
    let date = new Date();
    if(downloadable)
        return `on ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()} at ${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
    return `on ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()} at ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
function downloadURI(uri, name) {
    var link = document.createElement("a");
    link.download = name;
    link.href = uri;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    delete link;
  }

const mergeAudioStreams = (desktopStream, voiceStream) => {
    const context = new AudioContext();
    if(desktopStream.getAudioTracks().length == 0){
        // User didn't share desktop audio so, output is directly returned as voicStream i.e. mic audio
        return voiceStream.getAudioTracks();
    }
    if(voiceStream.getAudioTracks().length == 0){
        // User didn't share mic audio so, output is directly returned as desktopStream i.e. system audio
        return voiceStream.getAudioTracks();
    }

    // Create a couple of sources
    const source1 = context.createMediaStreamSource(desktopStream);
    const source2 = context.createMediaStreamSource(voiceStream);
    const destination = context.createMediaStreamDestination();
    
    const desktopGain = context.createGain();
    const voiceGain = context.createGain();
      
    desktopGain.gain.value = 0.7;
    voiceGain.gain.value = 0.7;
     
    source1.connect(desktopGain).connect(destination);
    // Connect source2
    source2.connect(voiceGain).connect(destination);
      
    return destination.stream.getAudioTracks();
  };

async function startRecord(audioEnabled, micEnabled, preStopCallback){
    try{
    
        start.setAttribute("class","bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed");
        stop.setAttribute("class", "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded");
    
        document.body.style 
        = "width: 650px; height: 500px;";
        stream = await navigator.mediaDevices.getDisplayMedia({ video:{cursor: 'always'}, audio: audioEnabled });
        document.body.style = "width: 400px; height: 266px;";
        
        if(micEnabled){
            micStream = null;
            micStream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
            const tracks = [
                ...stream.getVideoTracks(), 
                ...mergeAudioStreams(stream, micStream)
            ];              
            stream = new MediaStream(tracks);
        }
        
        recorder = new MediaRecorder(stream, {mimeType: 'video/webm; codecs=vp8,opus'});
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        stream.getTracks().forEach((track) =>
            track.addEventListener("ended", () => {
                stream.getAudioTracks().forEach((audio) => audio.stop());
                if (recorder) recorder.stop();
                recorder = null;
            })
        ); 
        recorder.onstop = e => {
            preStopCallback();
            const completeBlob = new Blob(chunks, { type: 'video/mp4' });
            let sourceURL = URL.createObjectURL(completeBlob);
            downloadURI(sourceURL, `Recorded_Video_${getFormattedTime(true)}.mp4`);
        };
        recorder.start();
    }catch(err){
        preStopCallback();
        if(err.name == "NotAllowedError"){
            if(alertPermissionCount == 0){
                alert(
                    `Please provide permission to record ! \n Jvascript of page cannot process without your permission to share screen, <br> Select Entire Screen or Particular window/browser tab and click Share in browser dialog \n Tick checkbox saying 'Share Audio' if Mic turned on !`
                );
                alertPermissionCount=1;
            }
            return;
        }
        if(err.message == "Could not start audio source")
            return alert(                                "Couldn't find audio output on your device ! \n Check if your speaker/headset is working properly !");
        alert(          "Something wrong happened ! \n Your device doesn't seem to be compatible with this feature "
                        );
        console.log("Error: ");
        console.log(err);
    }
}

function preStopRecord(){
    
    // stop.setAttribute("disabled", true);
    // start.removeAttribute("disabled");
    
    // start.setAttribute("class", "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded");
    // stop.setAttribute("class","bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed");
}


    // startRecord(
    //     document.getElementById("toggleAudio").checked,
    //     document.getElementById("toggleMic").checked, 
    //     preStopRecord
    // );

    // recorder.stop();
    // stream.getVideoTracks()[0].stop();

