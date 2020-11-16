const vid = document.querySelector("#recorded");
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
const volToggle = document.querySelector('#toggleVolume');
let alertPermissionCount = 0;
let recorder, stream, recordedVideo;
let isRecording = false;

if(!navigator.mediaDevices){
    showErrorOnMobileDevices();
    thisFunctionDoesntExistHenceWillCauseErrorAndStopExecutionOfFurtherJS(":)");
}

function getFormattedTime(downloadable = false){
    let date = new Date();
    if(downloadable)
        return `on ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()} at ${date.getHours()}_${date.getMinutes()}_${date.getSeconds()}`;
    return `on ${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()} at ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
}
function stopRecord(){
    console.log("Stopped recording at ",getFormattedTime());
    if(isRecording){
        stop.setAttribute("disabled", true);
        start.removeAttribute("disabled");
        isRecording = false;
    }
    
    start.setAttribute("class", "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded");
    stop.setAttribute("class","bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed");
    vid.setAttribute("controls","");
}
async function startRecord(audioEnabled){
    try{
        start.setAttribute("class","bg-blue-500 text-white font-bold py-2 px-4 rounded opacity-50 cursor-not-allowed");
        stop.setAttribute("class", "bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded");

        vid.removeAttribute("controls");
        stream = await navigator.mediaDevices.getDisplayMedia({ video:{cursor: 'always'}, audio: audioEnabled });
        vid.srcObject = stream;
        console.log("Started recording at ",getFormattedTime());
        recorder = new MediaRecorder(stream);
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = e => {
            stopRecord();
            const completeBlob = new Blob(chunks, { type: chunks[0].type });
            vid.srcObject = null;
            vid.src = URL.createObjectURL(completeBlob);
            let a = document.getElementById('downloadVideo');
            a.style.visibility = "visible";
            a.href        = vid.getAttribute("src");
            a.download    = `Recorded_Video_${getFormattedTime(true)}.mp4`;
        };
        recorder.start();
    }catch(err){
        stopRecord();
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
                                "Couldn't find audio source on your device !",
                                "Check if your mic is working properly !");
            toggleModal("mainModal",
                        "Something wrong happened !",
                        "Your device doesn't seem to be compatible with this feature "
                        );
        console.log("Error: "+err);
    }
}

start.addEventListener("click", function(event){
    start.setAttribute("disabled", true);
    stop.removeAttribute("disabled");
    isRecording = true;
    startRecord(document.getElementById("toggleVolume").checked);
});
stop.addEventListener("click", function(event){
    stop.setAttribute("disabled", true);
    start.removeAttribute("disabled");
    isRecording = false;
    recorder.stop();
    stream.getVideoTracks()[0].stop();
});
function toggleAudio(){
    let isEnabled = volToggle.checked;
    if(isEnabled)
        document.getElementById("volumeStatus").innerHTML = '<i class="fas fa-microphone-alt text-xl" style="color:blue;"></i>';
    else
        document.getElementById("volumeStatus").innerHTML = '<i class="fas fa-microphone-alt-slash text-xl" style="color: black;"></i>';
}
volToggle.addEventListener("change", toggleAudio);



function showErrorOnMobileDevices(){
    document.body.innerHTML = `<div style="font-size: 80px; font-style: oblique;">
                                    <center>
                                    Your device <br> is not compatible. <br><br> This works only on computers/Laptops.
                                    <br><br>
                                    Required JS APIs for this page are not available in mobile browsers,<br><br> so try on your desktop devices :)
                                    </center>
                                </div>`

    document.body.style = "height: 100vh; max-height: 90vh; background-image:url('bg.svg');"

}

// Under work
// function toggleLoader(start=false){
//     if(start)
//         document.getElementById("loader").classList.toggle("hidden");
//     else
//         document.getElementById("loader").classList.toggle("hidden");
// }

function toggleModal(modalID, title, message=""){
    let modal = temp = document.getElementById(modalID);

    modal.children[0].children[0].children[0].children[0].innerHTML = title;
    modal.children[0].children[0].children[1].children[0].innerHTML = message;

    modal.classList.toggle("hidden");
    document.getElementById(modalID + "-backdrop").classList.toggle("hidden");

    modal.classList.toggle("flex");
    document.getElementById(modalID + "-backdrop").classList.toggle("flex");
    return true;
}

