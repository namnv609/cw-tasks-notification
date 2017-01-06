$(function() {
  var chromeStorage = chrome.storage.local;
  var today = new Date();

  $("span#current-year").text(today.getFullYear());

  chromeStorage.get('CW_TASKS_NOTIFICATION_SETTINGS', function(extensionSettings) {
    extensionSettings = extensionSettings.CW_TASKS_NOTIFICATION_SETTINGS;
    $("#alarm-interval").val(extensionSettings.alarmInterval);
  });


  $("#btn-save-settings").on("click", function(e) {
    e.preventDefault();
    var alarmInterval = $("#alarm-interval option:selected").val();

    chrome.storage.local.set({
      CW_TASKS_NOTIFICATION_SETTINGS: {
        alarmInterval: alarmInterval
      }
    }, function() {
      $("p.msg-box").show(0, function() {
        setTimeout(function() {
          $(this).fadeOut();
        }.bind(this), 3000);
      });
    });
  });
});
