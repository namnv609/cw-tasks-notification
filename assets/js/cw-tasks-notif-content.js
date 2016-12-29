$(function() {
  $("<li />", {
    id: "nnvsvc-cw-tasks-notif",
    css: {
      color: "#FFF",
      fontWeight: "bold"
    }
  }).html("You have <span>0</span> task(s) to finish within today").prependTo("#_adminNavi");

  chrome.extension.onMessage.addListener(function(message, sender, sendResponse) {
    $("#nnvsvc-cw-tasks-notif span").text(message.count);
  });
});
