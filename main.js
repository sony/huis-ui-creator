var {app, BrowserWindow, crashReporter} = require('electron');
// アプリの生存期間をコントロールするモジュール
// ネイティブのブラウザウィンドウを作るためのモジュール           
// 及びクラッシュレポーターをrequireする

// クラッシュレポートを送るための設定
crashReporter.start({
    productName: 'YourName',
    companyName: 'YourCompany',
    submitURL: 'https://your-domain.com/url-to-submit',
    autoSubmit: true
});


// ウィンドウオブジェクトをグローバル宣言する
// JavaScript のオブジェクトが GC されたときにウィンドウが閉じてしまうため
var mainWindow = null;

// すべてのウィンドウが閉じられたら終了
app.on('window-all-closed', function() {
  // OSX だと、ユーザーが Cmd + Q で明示的に終了するまで
  // アプリケーションとメニューバーがアクティブになっているのが一般的
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Electron の初期化が終わってブラウザウィンドウを作る準備ができたら呼ばれる
app.on('ready', function() {
  // ブラウザウィンドウを作る
  mainWindow = new BrowserWindow({width: 1280, height: 800});

  // アプリの index.html をロードする
  mainWindow.loadURL('file://' + __dirname + '/app/index.html');

  // garage.exe と同じディレクトリーに "debug" があれば devtools を開く
  var fs = require("fs");
  if (fs.existsSync("debug")) {
  	mainWindow.openDevTools();
  }

  // ウィンドウが閉じられたら実行
  mainWindow.on('closed', function() {
    mainWindow = null;
  });
});