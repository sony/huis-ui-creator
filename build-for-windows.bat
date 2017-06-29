cd /d %~dp0

call npm install

cd node_modules/usb_dev

set HOME=~/.electron-gyp

call node-gyp rebuild --target=1.4.10 --arch=ia32 --dist-url=https://atom.io/download/atom-shell

rem move to root directory
cd ../../

call grunt build

rem copy files for packaging
copy /Y package.json www\
copy /Y main.js www\
xcopy /S /Y node_modules www\node_modules\

cd www
rd /s /q "HUIS UI CREATOR-win32-ia32"
rem electron-packager . "HUIS UI CREATOR" --platform=win32 --arch=ia32 --electron-version=1.4.10 --ignore="node_modules/(grunt*|electron-rebuild)" --ignore=".git" --ignore="Service References" --ignore="docs" --ignore="obj" --ignore="tests/*" --ignore="www" --ignore="platforms" --ignore="-x64$" --ignore="-ia32$"
set APP_NAME="HUIS UI CREATOR"
call electron-packager . %APP_NAME% --platform=win32 --arch=ia32 --electron-version=1.4.10 --ignore="node_modules/(grunt*|electron-rebuild)" --ignore=".git" --ignore="Service References" --ignore="docs" --ignore="obj" --ignore="tests/*" --ignore="www" --ignore="platforms" --ignore="-x64$" --ignore="-ia32$"
cd ../
pause
