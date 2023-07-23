var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();

var UserCount = 10;
var DemoConstants = {
    ChannelsToUnsubscribe: ["a", "b", "c", "z"],
    FriendList: function () {
        var res = [];
        for (var i = 0; i < UserCount; i++)
            res.push("user" + i);
        return res;
    }(),
    LogLevel: Exitgames.Common.Logger.Level.INFO
};

var ChatDemo = /** @class */ (function (_super) {
    __extends(ChatDemo, _super);
    function ChatDemo() {
        var _this = _super.call(this, Photon.ConnectionProtocol.Ws, photonId, chatVersion) || this;
        _this.logger = new Exitgames.Common.Logger("Demo:", DemoConstants.LogLevel);
        _this.prevChannelsIds = {};
        Output.log("[i]", "Init", _this.getNameServerAddress(), photonId, chatVersion);
        _this.logger.info("Init", _this.getNameServerAddress(), photonId, chatVersion);
        _this.setLogLevel(DemoConstants.LogLevel);
        return _this;
    }
    // overrides
    ChatDemo.prototype.onError = function (errorCode, errorMsg) {
        if (errorCode == Photon.Chat.ChatClient.ChatPeerErrorCode.FrontEndAuthenticationFailed) {
            errorMsg = errorMsg + " with appId = " + photonId;
        }
        this.logger.error(errorCode, errorMsg);
        Output.log("[i]", "Error", errorCode, errorMsg);
				app.state = errorMsg;
				app.error = true;
    };
    ChatDemo.prototype.onStateChange = function (state) {
        this.logger.info("State: ", state);
        Output.log("State: " + Photon.Chat.ChatClient.StateToName(state));
        var ChatClientState = Photon.Chat.ChatClient.ChatState;
        if (state == ChatClientState.ConnectedToFrontEnd) {
						app.state = "Connected!";
            Output.log("[i]", "---- connected to Front End\n", "[Subscribe] for public channels or type in 'userid@message' and press 'Send' for private");
						chatClient.demoSubscribe()
						app.error = false;
        }
        var disconnected = state == ChatClientState.Uninitialized || state == ChatClientState.Disconnected;
        if (disconnected) {
            Output.log("[i]", "type in user id and press [Connect]");
						app.error = true;
						app.state = "Disconnected";
						chatClient.demoConnect();
        }
    };
    ChatDemo.prototype.onChatMessages = function (channelName, messages) {
        for (var i in messages) {
            var m = messages[i];
            var sender = m.getSender();
            if (sender == this.getUserId()) {
                sender = "me";
            }
            //Output.log('[' + channelName + ':' + sender + ']', m.getContent());
						onReceivedMessage(channelName, m);
        }
        var ch = chatClient.getPublicChannels()[channelName];
        this.prevChannelsIds[channelName] = ch.getLastId();
    };
    ChatDemo.prototype.onPrivateMessage = function (channelName, m) {
        var sender = m.getSender();
        if (sender == this.getUserId()) {
            sender = "me";
        }
        Output.log('[' + channelName + '@' + sender + ']', m.getContent());
    };
    ChatDemo.prototype.onUserStatusUpdate = function (userId, status, gotMessage, statusMessage) {
        var msg = statusMessage;
        if (!gotMessage) {
            msg = "[message skipped]";
        }
        Output.log("[i]", userId + ": " + Photon.Chat.Constants.UserStatusToName(status) + "(" + status + ") / " + msg);
    };
    ChatDemo.prototype.onSubscribeResult = function (results) {
        this.logger.info("onSubscribeResult", results);
        var m = "---- subscribed to ";
        for (var ch in results) {
            this.logger.info("    ", ch, results[ch]);
            if (results[ch]) {
                m = m + "'" + ch + "', ";
            }
        }
        Output.log("[i]", m, "\ntype in 'channel:message' and press 'Send' to publish");
    };
    ChatDemo.prototype.onUnsubscribeResult = function (results) {
        this.logger.info("onUnsubscribeResult", results);
        var m = "unsubscribed from ";
        for (var ch in results) {
            this.logger.info("    ", ch, results[ch]);
            m = m + "'" + ch + "', ";
        }
        Output.log("[i]", m);
    };
    ChatDemo.prototype.onUserSubscribe = function (channelName, userId) {
        Output.log("User " + userId + " subscribed to " + channelName);
    };
    ChatDemo.prototype.onUserUnsubscribe = function (channelName, userId) {
        Output.log("User " + userId + " unsubscribed from " + channelName);
    };
    ChatDemo.prototype.onOperationResponse = function (errorCode, errorMsg, code, content) {
        if (errorCode != 0) {
            Output.log('[i]', "error: " + errorMsg + '(op ' + code + ')');
        }
    };
    ChatDemo.prototype.demoConnect = function () {
				app.error = false;
				app.state = "Connecting...";
				console.log("Setting auth token to: " + photonToken);
        this.setCustomAuthentication("username=" + accountId + "&token=" + photonToken);
        this.connectToRegionFrontEnd('US');
    };
    ChatDemo.prototype.demoSubscribe = function () {
        var pc = this.prevChannelsIds;
        var ids = channels.map(function (x) { return pc[x] || 0; });
        if (chatClient.subscribe(channels, { historyLength: 100, /*lastIds: ids */ /*, createOptions: { publishSubscribers: true, maxSubscribers: 3} */ })) {
            Output.log("[i]", "subscribing...");
        }
        else {
            Output.log("[i]", "error: subscribe send failed. [Connect] first?");
        }
    };
    ChatDemo.prototype.demoUnsubscribe = function () {
        if (chatClient.unsubscribe(DemoConstants.ChannelsToUnsubscribe)) {
            Output.log("[i]", "unsubscribing...");
            if (this.removeFriends(DemoConstants.FriendList)) {
                Output.log("[i]", "clearing friends:" + DemoConstants.FriendList.join(","));
            }
        }
    };
    ChatDemo.prototype.demoSendMessage = function () {
			return;
        var input = document.getElementById("input");
        var text = input.value;
        var chDelim = text.indexOf(":");
        var userDelim = text.indexOf("@");
        if (chDelim != -1) {
            var ch = text.substring(0, chDelim);
            var t = text.substring(chDelim + 1);
            this.publishMessage(ch, t);
            this.logger.info("publish: ", ch, t);
        }
        else if (userDelim != -1) {
            var u = text.substring(0, userDelim);
            var t = text.substring(userDelim + 1);
            this.sendPrivateMessage(u, t);
            this.logger.info("send private: ", u, t);
        }
        else {
            var exists = false;
            for (var chName in this.getPublicChannels()) {
                this.publishMessage(chName, text);
                this.logger.info("publish: ", chName, text);
                exists = true;
                break;
            }
            if (!exists) {
                Output.log("[i]", "error: no subscribed channels");
            }
        }
    };
    return ChatDemo;
}(Photon.Chat.ChatClient));
var Output = /** @class */ (function () {
    function Output() {
    }
    Output.log = function (str) {
        var op = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            op[_i - 1] = arguments[_i];
        }
        var formatted = this.logger.formatArr(str, op);
				console.log(formatted);
    };
    Output.logger = new Exitgames.Common.Logger();
    return Output;
}());
var chatClient;

function startChat(){
  chatClient = new ChatDemo();
  chatClient.onStateChange(Photon.Chat.ChatClient.ChatState.Uninitialized);
  var s = Photon.Chat.Constants.UserStatus.Offline;
  var setuserstatus = document.getElementById("setuserstatus");
  while (true) {
      var n = Photon.Chat.Constants.UserStatusToName(s);
      if (n === undefined)
          break;
      s = s + 1;
  }
};
