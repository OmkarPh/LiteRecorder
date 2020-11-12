const vid = document.querySelector("#recorded");
const start = document.querySelector('#start');
const stop = document.querySelector('#stop');
stop.setAttribute("disabled",true);

let recorder, stream, recordedVideo;
let isRecording = false;



let displayMediaOptions = {
    video:{
        cursor: 'always'
    },
    audio: false
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
    vid.setAttribute("controls","");
}
async function startRecord(audioEnabled){
    try{
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
        if(err.name == "NotAllowedError")
            return alert("Please provide permission to record !");
        
        if(err.message == "Could not start audio source")
            return alert("Couldn't find audio source on your device !");
        
            alert("Something wrong happened !\nYour device doesn't seem to be compatible with this feature ");
        console.log("Error: "+err);
    }
}

start.addEventListener("click", function(event){
    start.setAttribute("disabled", true);
    stop.removeAttribute("disabled");
    isRecording = true;
    startRecord(document.getElementById("audioToggle").checked);
})
stop.addEventListener("click", function(event){
    stop.setAttribute("disabled", true);
    start.removeAttribute("disabled");
    isRecording = false;
    recorder.stop();
    stream.getVideoTracks()[0].stop();
})