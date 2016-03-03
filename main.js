var app = require('app');  // アプリの生存期間をコントロールするモジュール
var BrowserWindow = require('browser-window');  // ネイティブのブラウザウィンドウを作るためのモジュール

// クラッシュレポートを送る
require('crash-reporter').start();



// ウィンドウオブジェクトをグローバル宣言する
// JavaScript のオブジェクトが GC されたときにウィンドウが閉じてしまうため
var mainWindow = null;

// すべてのウィンドウが閉じられたら終了
app.on('window-all-closed', function() {
  // OSX だと、ユーザーが Cmd + Q で明示的に終了するまで
  // アプリケーションとメニューバーがアクティブになっているのが一般的
  if (process.platform != 'darwin') {
    app.quit();
  }
});

// Electron の初期化が終わってブラウザウィンドウを作る準備ができたら呼ばれる
app.on('ready', function() {
  // ブラウザウィンドウを作る
  mainWindow = new BrowserWindow({width: 1280, height: 800});

  // アプリの index.html をロードする
  mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

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