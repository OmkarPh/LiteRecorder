// Preliminary checks for API support
function showErrorMessage(type){
    
    document.body.innerHTML = `<div style="font-size: 25px; font-style: oblique;">
                                    <center>
                                    Your device <br> is not compatible. <br><br> This works only on computers/Laptops.
                                    <br><br>
                                    Required JS APIs for this page are not available in mobile browsers,<br><br> so try on your desktop devices with support for these APIs:)
                                    </center><br>
                                    <a href="https://github.com/OmkarPh/LiteRecorder"
                                    class="inline-block text-blue-800 no-underline hover:text-indigo-500 hover:underline h-10 p-2 md:h-auto md:p-4 text-xl absolute">
                                    View project on Github <i class="fab fa-github "></i>
                                    </a>
                                </div>`
    if(type == "https"){
        document.body.innerHTML = `<div style="font-size: 30px; font-style: oblique;">
                                    <center>
                                    HTTPS connection necessary for this webpage 
                                    <br><br>
                                    This works only on secured connections since browsers wouldn't allow insecure pages to access your screen recording
                                    </center><br>
                                    <a href="https://github.com/OmkarPh/LiteRecorder" 
                                    class="inline-block text-blue-800 no-underline hover:text-indigo-500 hover:underline h-10 p-2 md:h-auto md:p-4 text-xl absolute">
                                    View project on Github <i class="fab fa-github "></i></a>
                                </div>`
    }
    
    document.body.style = "height: 100vh; max-height: 90vh; background-image:url('images/bg.svg');"

}
if(!navigator.mediaDevices){
    showErrorMessage("https");
    thisFunctionDoesntExistHenceWillCauseErrorAndStopExecutionOfFurtherJS(":-)");
}
if(navigator.mediaDevices.ondevicechange !== null){
    showErrorMessage();
    thisFunctionDoesntExistHenceWillCauseErrorAndStopExecutionOfFurtherJS(":-)");
}


const vid = $("#recorded")[0];
const start = $('#start')[0];
const stop = $('#stop')[0];
const micToggle = $('#toggleMic')[0];
const volToggle = $('#toggleAudio')[0];


let alertPermissionCount = 0;
let recorder, stream, recordedVideo, micStream;

// Utility functions
function getFormattedTime(downloadable = false){
    let date = new Date();
    if(downloadable)
        return `on ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()} at ${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
    return `on ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()} at ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
function toggleModal(modalID, title, message=""){
    let modal = temp = $("#"+modalID)[0];

    modal.children[0].children[0].children[0].children[0].innerHTML = title;
    modal.children[0].children[0].children[1].children[0].innerHTML = message;

    modal.classList.toggle("hidden");
    $("#"+modalID + "-backdrop")[0].classList.toggle("hidden");

    modal.classList.toggle("flex");
    $("#"+modalID + "-backdrop")[0].classList.toggle("flex");
    return true;
}
function toggleMic(){
    let isEnabled = micToggle.checked;
    if(isEnabled)
        $("#micStatus")[0].innerHTML = '<i class="fas fa-microphone-alt text-xl" style="color:blue;"></i>';
    else
        $("#micStatus")[0].innerHTML = '<i class="fas fa-microphone-alt-slash text-xl" style="color: black;"></i>';
}
function toggleVolume(){
    let isEnabled = volToggle.checked;
    if(isEnabled)
        $("#volumeStatus")[0].innerHTML = '<i class="fas fa-volume text-xl" style="color:blue;"></i>';
    else
        $("#volumeStatus")[0].innerHTML = '<i class="fas fa-volume-mute text-xl" style="color: black;"></i>';
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

async function startRecord(audioEnabled, micEnabled, videoObj, linkObj, preStopCallback){
    try{
        start.setAttribute("class","bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed");
        stop.setAttribute("class", "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded");
        videoObj.removeAttribute("controls");
        stream = await navigator.mediaDevices.getDisplayMedia({ video:{cursor: 'always'}, audio: audioEnabled });
        
        if(micEnabled){
            micStream = null;
            micStream = await navigator.mediaDevices.getUserMedia({video: false, audio: true});
            const tracks = [
                ...stream.getVideoTracks(), 
                ...mergeAudioStreams(stream, micStream)
            ];              
            stream = new MediaStream(tracks);
        }
        
        videoObj.srcObject = stream;
        videoObj.muted = true;
        
        console.log("Started recording at ",getFormattedTime());
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
            const completeBlob = new Blob(chunks, { type: 'video/webm' });
            let sourceURL = URL.createObjectURL(completeBlob);

            videoObj.srcObject = null;
            videoObj.src = sourceURL;
            videoObj.muted = false;

            videoObj.onloadedmetadata = function() {
                // console.log('Default duration: ' + videoObj.duration);

                // handle chrome's bug 
                if (videoObj.duration === Infinity) {
                  // set it to bigger than the actual duration
                  videoObj.currentTime = 1e101;

                  videoObj.ontimeupdate = function() {
                    // Set an empty function to prevent recursion here ;)
                    this.ontimeupdate = () => {
                      return;
                    }

                    // console.log('After workaround: ' + videoObj.duration);
                    videoObj.currentTime = 0;
                    videoObj.play();
                  }
                }
            }
            videoObj.setAttribute("controls","");
            
            linkObj.style.visibility = "visible";
            linkObj.href        = sourceURL;
            linkObj.download    = `Recorded_Video_${getFormattedTime(true)}.mp4`;
        };
        recorder.start();
    }catch(err){
        preStopCallback();
        if(err.name == "NotAllowedError"){
            if(alertPermissionCount == 0){
                toggleModal("mainModal",
                            "Please provide permission to record !",
                            `Javascript of page cannot process without your permission to share screen, <br> Select Entire Screen or Particular window/browser tab and click Share in browser dialog <br> Tick checkbox saying 'Share Audio' if Mic turned on !`
                            );
                alertPermissionCount=1;
            }
            return;
        }
        if(err.message == "Could not start audio source")
            return toggleModal("mainModal",
                                "Couldn't find audio output on your device !",
                                "Check if your speaker/headset is working properly !");
        toggleModal("mainModal",
                        "Something wrong happened !",
                        "Your device doesn't seem to be compatible with this feature "
                        );
        console.log("Error: ");
        console.log(err);
    }
}

function preStopRecord(){
    console.log("Stopped recording at ",getFormattedTime());
    
    stop.setAttribute("disabled", true);
    start.removeAttribute("disabled");
    
    start.setAttribute("class", "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded");
    stop.setAttribute("class","bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed");
}

start.addEventListener("click", function(event){
    start.setAttribute("disabled", true);
    stop.removeAttribute("disabled");
    startRecord(
        $("#toggleAudio")[0].checked,
        $("#toggleMic")[0].checked, 
        vid, 
        $("#downloadVideo")[0],
        preStopRecord
    );
});

stop.addEventListener("click", function(event){
    stop.setAttribute("disabled", true);
    start.removeAttribute("disabled");
    recorder.stop();
    stream.getVideoTracks()[0].stop();
});

micToggle.addEventListener("change", toggleMic);
volToggle.addEventListener("change", toggleVolume);

