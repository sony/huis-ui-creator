@echo off
cd /d %~dp0

if "%1"=="" (
    echo Usage: build-for-windows.bat {ia32 or x64}
    exit /B
)
if not "%1"=="ia32" (
    if not "%1"=="x64" (
        echo Invalid argument. set ia32 or x64
        exit /B
    )
)

set APP_NAME=HUIS UI CREATOR
echo %TAG% set APP_NAME=%APP_NAME%
set APP_VERSION=7.0.0
echo %TAG% set APP_VERSION=%APP_VERSION%

set MODE=""
if "%2"=="skip" (
    set MODE="skip"
)

set TAG=[cmd]
set ARCH=%1

rem environment build
if not %MODE%=="skip" (
    echo %TAG% call npm install
    call npm install

    echo %TAG% cd node_modules/usb_dev
    cd node_modules/usb_dev

    echo %TAG% set HOME=~/.electron-gyp
    set HOME=~/.electron-gyp

    echo %TAG% call node-gyp rebuild --target=1.4.10 --arch=%ARCH% --dist-url=https://atom.io/download/atom-shell
    call node-gyp rebuild --target=1.4.10 --arch=%ARCH% --dist-url=https://atom.io/download/atom-shell

    echo %TAG% cd ../../
    cd ../../
) else (
    echo skip environment build
)

echo %TAG% call grunt build
call grunt build

echo %TAG% copy /Y package.json www\
copy /Y package.json www\
echo %TAG% copy /Y main.js www\
copy /Y main.js www\
echo %TAG% xcopy /S /Y node_modules www\node_modules\
xcopy /S /Y node_modules www\node_modules\

echo %TAG% cd www
cd www
echo %TAG% rd /s /q "%APP_NAME%-win32-%ARCH%"
rd /s /q "%APP_NAME%-win32-%ARCH%"


echo %TAG% electron-packager . "%APP_NAME%" --platform=win32 --arch=%ARCH% --electron-version=1.4.10 --ignore="node_modules/(grunt*|electron-rebuild)" --ignore=".git" --ignore="Service References" --ignore="docs" --ignore="obj" --ignore="tests/*" --ignore="www" --ignore="platforms" --ignore="-x64$" --ignore="-ia32$" --no-tmpdir
call electron-packager . "%APP_NAME%" --platform=win32 --arch=%ARCH% --electron-version=1.4.10 --ignore="node_modules/(grunt*|electron-rebuild)" --ignore=".git" --ignore="Service References" --ignore="docs" --ignore="obj" --ignore="tests/*" --ignore="www" --ignore="platforms" --ignore="-x64$" --ignore="-ia32$" --no-tmpdir

echo %TAG% cd ../
cd ../
pause
