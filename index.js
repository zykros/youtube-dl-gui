const addBtn = document.getElementById("addBtn");
const updateBtn = document.getElementById("updateBtn");
const url = document.getElementById("videoUrl");
const downloadQueue = document.getElementById("downloadQueue");
const downloadBtn = document.getElementById("downloadBtn");
const browseBtn = document.getElementById("browseBtn");
const browseValue = document.getElementById("browseValue");
const modalUpdate = document.getElementById("modalUpdate");
const clearQueue = document.getElementById("clearBtn");
const formatMp4 = document.getElementById("mp4");
const formatWebm = document.getElementById("webm");
const formatMp3 = document.getElementById("mp3");
const formatM4a = document.getElementById("m4a");
const formatVorbis = document.getElementById("vorbis");
const formatBtn = document.getElementById("formatBtn");

const { dialog } = require("electron").remote;
const nrc = require("node-run-cmd");

var downloadQueueArray = [];

var queueDownload = false;

var mediaFormats = "-f best[ext=mp4]";

$(document).ready(() => {
  //remove test
  $(document).on("click", `.removeBtn`, e => {
    let num = e.target.id.slice(6);
    const queueItem = document.getElementById(`queueItem${num}`);
    queueItem.remove();

    let idInArray = downloadQueueArray.findIndex(x => x.id == num);

    downloadQueueArray.splice(idInArray, 1);

    console.log(downloadQueueArray);
  });
  //stop downloads
  $(document).on("click", "#stop", () => {
    downloadQueueArray.forEach(item => {
      item.inProgress = false;
    });
    console.log(downloadQueueArray);
    nrc.run("taskkill /f /im youtube-dl.exe");
  });
  // start download
  $(document).on("click", `#downloadBtn`, async e => {
    if (downloadQueueArray.length < 1) {
      alert("Please add something to queue first");
    } else if (browseValue.value == "") {
      alert("Please set a download location!");
    } else {
      for (let i = 0; i < downloadQueueArray.length; i++) {
        const statusId = document.getElementById(
          `status${downloadQueueArray[i].id}`
        );
        const percentId = document.getElementById(
          `percent${downloadQueueArray[i].id}`
        );
        const speedId = document.getElementById(
          `downSpeed${downloadQueueArray[i].id}`
        );
        const options = {
          onData: data => {
            //regular expressions for matching data string
            let percent = /[0-9].*[0-9]%/g;
            let speed = /(?:at+) ([0-9].*[0-9](MiB\/s|KiB\/s))/g;

            if (statusId.innerHTML == null) {
              statusId.innerHTML == "queue";
            }
            if (/ffmpeg/g.test(data.toString()) || /Merging/g.test(data)) {
              console.log(/container/g.test(data.toString()));
              return (statusId.innerHTML = "Converting");
            } else if (/Deleting/g.test(data) || /Post-process/g.test(data)) {
              return (statusId.innerHTML = "Complete");
            } else if (data.indexOf("[download]") == -1) {
              return (statusId.innerHTML = "Starting...");
            } else if (/100%/.test(data)) {
              return (statusId.innerHTML = "Complete");
            } else {
              console.log(data);
              statusId.innerHTML = data.match(percent);
              percentId.classList.remove("bg-danger");
              percentId.classList.add("bg-success");
              percentId.style.width = data.match(percent);
              speedId.innerHTML = data
                .match(speed)
                .toString()
                .split(" ")[1];
            }
          },
          onError: error => {
            statusId.innerHTML = "Error";
            statusId.setAttribute("data-toggle", "tooltip");
            statusId.setAttribute("title", error);
            percentId.classList.remove("bg-success");
            percentId.classList.add("bg-danger");
            percentId.style.width = "100%";
          }
        };
        if (statusId.innerHTML != "Complete" || statusId.innerHTML == "Error") {
          if (downloadQueueArray[i].inProgress == false) {
            if (queueDownload) {
              downloadQueueArray[i].inProgress = true;
              await nrc.run(downloadQueueArray[i].command, options);
            } else {
              downloadQueueArray[i].inProgress = true;
              nrc.run(downloadQueueArray[i].command, options);
            }
          }
        }
      }
    }
  });
});

//add urls to queue for download
addBtn.addEventListener("click", () => {
  let youtubeUrl = "";
  let mediaExt = "";
  let status = "";
  let downSpeed = "";
  let fileSize = "";
  let remove = "";

  let matchUrl = /(www|http:|https:)+[^\s]+[\w]/g;

  //random unique generator
  var ID = () => {
    return (
      "_" +
      Math.random()
        .toString(36)
        .substr(2, 9)
    );
  };

  url.value == ""
    ? alert("The heck, trying to add nothing?!")
    : browseValue.value == ""
    ? alert("Please choose a download location!")
    : matchUrl.test(url.value) == false
    ? alert("Not a valid URL!")
    : downloadQueueArray.push({
        id: ID(),
        command: `youtube-dl.exe -i -o "${
          browseValue.value
        }\\%(title)s.%(ext)s" ${mediaFormats} ${url.value}`,
        inProgress: false
      });

  console.log(downloadQueueArray);

  downloadQueueArray.forEach((item, index) => {
    let truncateUrl =
      item.command.match(matchUrl).toString().length > 35
        ? item.command
            .match(matchUrl)
            .toString()
            .substring(0, 35) + " ..."
        : item.command.match(matchUrl).toString();
    youtubeUrl = `<tr style="text-align: center" id="queueItem${
      item.id
    }"><td data-toggle="tooltip"
    title="${item.command.match(matchUrl)}">${truncateUrl}</td>`;

    mediaExt = `<td><div class="badge badge-info">${
      formatBtn.innerHTML.indexOf("Media") > 0 ? "mp4" : formatBtn.innerHTML
    }</div></td>`;

    status = `<td>
    <div class="progress" style="position: relative">
    <div id='percent${
      item.id
    }' class="progress-bar progress-bar-striped bg-success" role="progressbar" style="width: 0%" aria-valuenow="10" aria-valuemin="0" aria-valuemax="100"></div>
    <div id='status${
      item.id
    }' style="position: absolute; margin: auto; display: block; width: 100%; text-align: center; color: white; font-weight: bold" >Queued</div>
    </div>
    </td>`;

    downSpeed = `<td id='downSpeed${item.id}'>-</td>`;

    fileSize = `<td id='fileSize${item.id}'></td>`;

    remove = `<td style="text-align: center" ><button class="badge badge-danger removeBtn" id='remove${
      item.id
    }'>X</button></td></tr>`;
  });
  downloadQueue.innerHTML +=
    youtubeUrl + mediaExt + status + downSpeed + fileSize + remove;
});

//clear queue area
clearQueue.addEventListener("click", () => {
  downloadQueue.innerHTML = `<tr style="text-align: center">
            <th style="width: 30%">Media Url</th>
            <th style="width: 10%">Ext.</th>
            <th style="width: 25%">Status</th>
            <th style="width: 15%">Download Speed</th>
            <th style="width: 10%">File Size</th>
            <th style="width: 10%">Remove</th>
        </tr>`;
  downloadQueueArray = [];
  console.log(downloadQueueArray);
});

//run youtube-dl updates
updateBtn.addEventListener("click", () => {
  const dataCallback = data => {
    alert([data]);
  };
  const options = { onData: dataCallback };
  nrc.run(`youtube-dl.exe -U`, options);
});

//browse save location for downloaded files
browseBtn.addEventListener("click", () => {
  browseValue.value = dialog.showOpenDialog({
    properties: ["openFile", "openDirectory"]
  });
});

//toggle queue or no queue
document.getElementById("toggleQueue").onclick = () => {
  queueDownload = !queueDownload;
  console.log(queueDownload);
};

//format button selections, MUST BE A BETTER WAY TO DO THIS

formatMp4.addEventListener("click", () => {
  mediaFormats = "-f best[ext=mp4]";
  formatBtn.innerHTML = `mp4`;
});

formatWebm.addEventListener("click", () => {
  mediaFormats = `-f best[ext=webm]`;
  formatBtn.innerHTML = `webm`;
});

formatMp3.addEventListener("click", () => {
  mediaFormats = `-x -f bestaudio --audio-format mp3`;
  formatBtn.innerHTML = `mp3`;
});

formatM4a.addEventListener("click", () => {
  mediaFormats = `-x -f bestaudio --audio-format m4a`;
  formatBtn.innerHTML = `m4a`;
});

formatVorbis.addEventListener("click", () => {
  mediaFormats = "-x -f bestaudio --audio-format vorbis";
  formatBtn.innerHTML = `vorbis`;
});

//end format selection functions
