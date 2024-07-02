FROM electronuserland/builder:14 AS build

RUN ["apt", "update", "-y"]
RUN ["apt", "upgrade", "-y"]
RUN ["apt", "install", "-y", "python2", "ruby"]

RUN ["npm", "i", "-g", "grunt-cli", "node-gyp"]

WORKDIR /app
COPY . .

RUN ["mv", "./package.json", "./package.json.orig"]
RUN ["cp", "./package_darwin.json", "./package.json"]
RUN ["npm", "i"]

RUN ["grunt", "build", "--platform=darwin", "--force"]

WORKDIR /app/www/
RUN ["cp", "../package_darwin.json", "./package.json"]
RUN ["cp", "../main.js", "./main.js"]
RUN ["cp", "-r", "../node_modules", "./node_modules"]

FROM electronuserland/builder:16 AS pack

COPY --from=build /app /app

WORKDIR /app/www
RUN ["npm", "i", "-g", "electron-packager"]
RUN ["npm", "i"]
RUN electron-packager . huis-ui-creator --platform=darwin --arch=x64 --electron-version=1.4.10 \
  --ignore="node_modules/(grunt*|electron-rebuild)" --ignore=".git" --ignore="Service References" \
  --ignore="docs" --ignore="obj" --ignore="tests/*" --ignore="www" --ignore="platforms" \
  --ignore="-x64$" --ignore="-ia32$" --overwrite
