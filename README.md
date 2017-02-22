HUIS UI CREATOR (Engineering Preview)
====

HUIS UI CREATOR は、HUIS のリモコン UI を作成するための PC アプリケーションです。

## 説明

HUIS UI CREATOR は、複数の機器のボタンからあなたがよく使う機能のボタンをピックアップして、あなた好みの HUIS のリモコン UIを作ることができます。ボタンの位置やサイズを変えたり、ラベルや画像を変えたりできます。

## 使用方法

#### 注意

このレポジトリーでは、アプリケーションのバイナリーを配布しておりません。このレポジトリーのソースコードを、後述の「ビルド方法」をご確認の上ビルドし、パッケージングする必要があります。

また、HUIS UI CREATOR を使用する際は、HUIS 本体を PC に接続する必要があります。

#### アップデートファイル

HUIS UI CREATOR で作成したリモコンを反映するには HUIS のアップデートを実行する必要があります。
[こちら (HUIS REMOTE CONTROLLERのアップデート方法)](firmware/readme.md) を参照してください。

HUIS UI CREATORを使用するには、HUISリモコンのソフトウェアをバージョン4.1.0以上にアップデートしてください。 

====

#### アプリケーションを起動する
1. HUIS を PC と接続します。
2. HUIS UI CREATOR を起動します。起動時に、HUIS 本体のリモコン情報が PC と同期されます。同期が完了するまで1分以上かかることがあります。
3. 同期が完了したら、ホーム画面に遷移します。既にオリジナルリモコンを作成したことがある場合は、ホーム画面に作成したリモコンの一覧が表示されます。

#### リモコンを新規作成する
1. ホーム画面に表示されたリモコンの一覧の左にある「+」と書かれているリモコンをクリックします。
2. リモコン編集画面に遷移します。

###### リモコン編集画面の操作説明
- リモコン編集画面の右半分にあるリモコン部分を「パレットリモコン」、左半分にあるリモコン部分を「キャンバスリモコン」と呼びます。パレットリモコンに置かれているボタンをキャンバスリモコンに配置することで、リモコンを作成します。
- パレットリモコンの上にあるリストから機器を選ぶと、パレットリモコンの中身が切り替わります。
- パレットリモコンに置かれているボタンをダブルクリックすると、キャンバスリモコンにボタンが配置されます。
- パレットリモコンの上にあるリストから「Common」を選択すると、ラベルや画像などのアイテムが格納されたリモコンが表示されます。ラベルや画像のアイテムをダブルクリックすると、キャンバスリモコンにアイテムが配置されます。
- キャンバスに配置されたアイテムを選択すると、マウス操作で位置を変更できます。選択したアイテムの四隅に表示される□を操作することで、アイテムのサイズを変更することができます。
- キャンバスに配置されたアイテムをクリックすると、キャンバスリモコンの左にアイテムのプロパティ編集ボックスが表示されます。
- キャンバス内のアイテムが置かれていない部分をクリックすると、プロパティ編集ボックスで背景画像を設定できます。
- キャンバスリモコンにある [新規ページ] をクリックすると、リモコンにページを追加します。ひとつのリモコンの最大ページ数は 5 です。
- キャンバスリモコン上部のテキストボックスで、リモコンの名前を設定できます。リモコンの名前は必ず設定する必要があります。

###### リモコンの保存
1. リモコン編集画面の左上にある [Save] ボタンを押します。
2. [保存して Home に戻る] を選択すると、編集内容を HUIS 本体に反映させます。このとき、HUIS 本体を PC と接続させる必要があります。
3. 保存が完了したら、Home 画面に戻ります。

#### 既存のリモコンを編集する
1. ホーム画面に表示されたリモコンの一覧から編集したいリモコンをクリックします。
2. リモコン編集画面に遷移します。

リモコン編集画面は、リモコンの新規作成時と同様です。

#### 作成したリモコンを削除する
1. Home 画面のリモコン一覧から削除したいリモコンに対して、右クリックメニューの「リモコンを削除」を選択します。

#### アプリケーションを終了する
アプリケーションの閉じるボタンを押すと、アプリケーションを終了させることができます。このとき、編集中のリモコンは失われますので、必ず HUIS と同期させてから終了させてください。

#### 作成したリモコンを使用する

1. PC と HUIS の同期後、PC と HUIS の接続を切断します。HUIS が PC から切断されると、HUIS 本体で編集内容の反映が処理が行われます。この処理をしている間、HUIS は一時的に操作を受け付けなくなります。
2. 再び HUIS 本体の操作が可能になったら、HOME 画面のリモコンの一覧に、HUIS UI CREATOR で作成したリモコンが追加されていることをご確認ください。作成したリモコンが追加されていない場合は、一度別の画面に遷移した後に、再度 HOME 画面を表示させてください。



## ビルド方法

このレポジトリーのソースコードをビルドして使用する場合の手順について記述します。

ここでは Windows 用のパッケージの作成方法について記述します。ビルド環境は Windows OS を想定しています。

#### 準備

ビルドの前に、以下の開発環境の準備を行ってください。

| Requirement                                                                 | Remarks                                       |
|:----------------------------------------------------------------------------|:----------------------------------------------|
| [Python 2.6 or 2.7](https://www.python.org/downloads/)                      |                                               |
| [Ruby](http://rubyinstaller.org/)                                           |                                               |
| [Node.js](http://nodejs.org/download/ )                                     |                                               |
| [Compass](http://compass-style.org/)                                        |                                               |
| [Grunt CLI](https://github.com/gruntjs/grunt-cli)                           |                                               |
| [compiler for node-gyp](https://github.com/TooTallNate/node-gyp/)           | Required for compiling native Node.js modules |
| [electron-packager](https://github.com/electron-userland/electron-packager) |                                               |

#### ビルド手順

1. ソースコードを入手します。

        $ git clone https://github.com/sony/huis-ui-creator.git

2. clone したディレクトリーに移動します。

        $ cd huis-ui-creator

3. 以下のコマンドを実行します。

        $ npm install

4. 以下のコマンドでネイティブ モジュールのビルドを行います。(Windows 32bit 向けの場合, Mac向けの場合 不要)

        $ cd node_modules
        $ cd usb_dev
        $ set HOME=~/.electron-gyp
        $ node-gyp rebuild --target=1.4.10 --arch=ia32 --dist-url=https://atom.io/download/atom-shell

  Electron のバージョン`--target`は、適宜変更してください。また、Windows 64bit 向けにビルドを行う場合は、`--arch=x64` に変更してください。

5. 再び、`huis-ui-creator` のルートディレクトリーに移動します。

6. 以下のコマンドで TypeScript と SCSS のビルドを行います。

        $ grunt build

Mac 向けの場合は、　　以下のように"--platform=darwin"をつけてください。

        $ grunt build --platform=darwin

7. grunt によるビルドが完了したら、`www/app`以下に TypeScript と SCSS がコンパイルされたものが出力されます。Electron のパッケージングを行うために、`www` ディレクトリーに以下のファイルとディレクトリーをコピーします。

  - package.json
  - main.js
  - node_modules ディレクトリー

  `node_modules` ディレクトリーのコピー中に「パスが長すぎる」という内容のエラーや警告が出た場合は、無視して進めてください。

#### パッケージ化
前述の grunt によるビルドのあとのファイルコピーが終わったら、以下のコマンドを実行すると、パッケージングができます。(Windows 32bit 向けの場合)

    $ cd <huis-ui-creator dir>\www
    $ electron-packager . <アプリ名> --platform=win32 --arch=ia32 --version=1.4.10 --ignore="node_modules/(grunt*|electron-rebuild)" --ignore=".git" --ignore="Service References" --ignore="docs" --ignore="obj" --ignore="tests/*" --ignore="www" --ignore="platforms" --ignore="-x64$" --ignore="-ia32$"

Electron のバージョン`--target`は、適宜変更してください。また、Windows 64bit 向けにビルドを行う場合は、`--arch=x64` に変更してください。ただし、前述のネイティブ モジュールのビルド時の `--target`, `--arch` オプションと同じものを指定してください。
Mac 64bit 向けにビルドを行う場合は、`--platform=darwin`,　`--arch=x64`に変更してください。

`<アプリ名>`はパッケージングしたファイルが格納されるディレクトリーや、実行ファイル名等に使用されます。任意のアプリ名を指定してください。

パッケージングが完了したら、`<アプリ名>-win32-ia32` ディレクトリーにパッケージングされたものが生成されます (Windows 32bit 向けの場合。Mac 64bit 向けの場合　`<アプリ名>-darwin-x64`)。

`<アプリ名>.exe` (Mac向けの場合`<アプリ名>.app`)を起動して動作することを確認してください。
## 免責事項
本ソースコードは開発用のものであり、製品版はデザイン等が異なります。


## ライセンス

Copyright 2016 Sony Corporation

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
